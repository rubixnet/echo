import { NextResponse } from "next/server";

export interface TrackItem {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  artistId: string | null;
  coverUrl: string;
  duration: number;
  audioUrl: string;
}

interface StoredCache {
  songs: TrackItem[];
  expiresAt: number;
}

const PUBLIC_INNERTUBE_KEY = "AIzaSyAO_FJ2SlqAE4An4EkweVGNO583fbxD41E";
const musicGraph = new Map<string, StoredCache>();
const GRAPH_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

function parseDuration(durationStr?: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function collectTracksFromPayload(
  obj: any,
  collectedTracks: TrackItem[] = [],
  trackedIds: Set<string> = new Set()
): TrackItem[] {
  if (!obj || typeof obj !== "object") return collectedTracks;

  const rawTrack =
    obj.playlistPanelVideoRenderer ||
    obj.compactVideoRenderer ||
    obj.videoRenderer;

  if (rawTrack && rawTrack.videoId) {
    const id = rawTrack.videoId;

    if (!trackedIds.has(id)) {
      trackedIds.add(id);

      const title =
        rawTrack.title?.runs?.map((r: any) => r.text).join("") ||
        rawTrack.title?.simpleText ||
        "Unknown Title";

      const bylines =
        rawTrack.longBylineText?.runs ||
        rawTrack.shortBylineText?.runs ||
        rawTrack.ownerText?.runs ||
        [];

      const artist = bylines[0]?.text || "Unknown Artist";
      const artistId =
        bylines[0]?.navigationEndpoint?.browseEndpoint?.browseId || null;

      const durationStr =
        rawTrack.lengthText?.runs?.[0]?.text ||
        rawTrack.lengthText?.simpleText ||
        "";
      const duration = parseDuration(durationStr);

      const thumbnails = rawTrack.thumbnail?.thumbnails || [];
      const coverUrl =
        thumbnails[thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      const normalizedTitle = title.toLowerCase();
      const isInvalid =
        duration > 720 ||
        normalizedTitle.includes("full album") ||
        normalizedTitle.includes("podcast") ||
        normalizedTitle.includes("live stream");

      if (!isInvalid) {
        collectedTracks.push({
          id,
          trackId: id,
          title,
          artist,
          artistId,
          coverUrl,
          duration,
          audioUrl: `/api/youtube/stream?id=${id}`,
        });
      }
    }
  }

  for (const key of Object.keys(obj)) {
    collectTracksFromPayload(obj[key], collectedTracks, trackedIds);
  }

  return collectedTracks;
}

async function fetchYouTubeMusicRadio(videoId: string): Promise<TrackItem[]> {
  const url = `https://music.youtube.com/youtubei/v1/next?key=${PUBLIC_INNERTUBE_KEY}`;
  const payload = {
    enablePersistentPlaylistPanel: true,
    isAudioOnly: true,
    videoId: videoId,
    playlistId: `RDAMVM${videoId}`,
    context: {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20240401.01.00",
        hl: "en",
        gl: "US",
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Origin": "https://music.youtube.com",
      "Referer": "https://music.youtube.com/",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  const data = await res.json();
  return collectTracksFromPayload(data);
}

function processRelatedPool(
  targetVideoId: string,
  excludeIds: string[],
  limit: number
): TrackItem[] {
  const blacklistSet = new Set<string>([targetVideoId, ...excludeIds]);
  const cachedNode = musicGraph.get(targetVideoId);

  if (!cachedNode || cachedNode.expiresAt <= Date.now()) {
    return [];
  }

  const filteredResults: TrackItem[] = [];
  const addedIds = new Set<string>();

  for (const song of cachedNode.songs) {
    if (blacklistSet.has(song.id) || addedIds.has(song.id)) {
      continue;
    }

    addedIds.add(song.id);
    filteredResults.push(song);

    if (filteredResults.length >= limit) break;
  }

  return filteredResults;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const targetVideoId = body.videoId;
    const clientExclusions: string[] = Array.isArray(body.excludeIds)
      ? body.excludeIds
      : [];
    const limit = Math.min(Number(body.limit) || 15, 50);

    if (!targetVideoId) {
      return NextResponse.json({ items: [] }, { status: 400 });
    }

    const currentTime = Date.now();
    const cachedNode = musicGraph.get(targetVideoId);

    if (!cachedNode || cachedNode.expiresAt <= currentTime) {
      try {
        const songPool = await fetchYouTubeMusicRadio(targetVideoId);
        if (songPool.length > 0) {
          musicGraph.set(targetVideoId, {
            songs: songPool,
            expiresAt: currentTime + GRAPH_CACHE_TTL,
          });
        }
      } catch {
        return NextResponse.json({ items: [] });
      }
    }

    const results = processRelatedPool(targetVideoId, clientExclusions, limit);
    return NextResponse.json({ items: results });
  } catch {
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetVideoId = searchParams.get("id");
    const excludeParam = searchParams.get("exclude") || "";
    const limit = Math.min(Number(searchParams.get("limit")) || 15, 50);

    if (!targetVideoId) {
      return NextResponse.json({ items: [] }, { status: 400 });
    }

    const clientExclusions = excludeParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const currentTime = Date.now();
    const cachedNode = musicGraph.get(targetVideoId);

    if (!cachedNode || cachedNode.expiresAt <= currentTime) {
      try {
        const songPool = await fetchYouTubeMusicRadio(targetVideoId);
        if (songPool.length > 0) {
          musicGraph.set(targetVideoId, {
            songs: songPool,
            expiresAt: currentTime + GRAPH_CACHE_TTL,
          });
        }
      } catch {
        return NextResponse.json({ items: [] });
      }
    }

    const results = processRelatedPool(targetVideoId, clientExclusions, limit);
    return NextResponse.json({ items: results });
  } catch {
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}