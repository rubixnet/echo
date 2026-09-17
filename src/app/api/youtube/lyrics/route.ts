import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const HF_SPACE_URL = "https://rubixnet-fastapi.hf.space";
const HF_TOKEN = process.env.HF_TOKEN;

const CACHE_LONG = {
  "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400",
};
const CACHE_SHORT = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
};

interface LyricLine {
  time: number;
  text: string;
}

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const tags = [...raw.matchAll(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)];
    if (tags.length === 0) continue;
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    if (!text) continue;
    for (const m of tags) {
      const minutes = parseInt(m[1], 10);
      const seconds = parseInt(m[2], 10);
      let fraction = 0;
      if (m[3] !== undefined) {
        fraction = parseInt(m[3].padEnd(3, "0").slice(0, 3), 10) / 1000;
      }
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

function normalize(data: Record<string, unknown>) {
  if (Array.isArray(data.lyrics)) {
    return {
      lyrics: data.lyrics,
      plainLyrics: typeof data.plainLyrics === "string" ? data.plainLyrics : "",
      syncedLyrics:
        typeof data.syncedLyrics === "string" ? data.syncedLyrics : "",
      trackName: data.trackName ?? null,
      artistName: data.artistName ?? null,
      duration: typeof data.duration === "number" ? data.duration : null,
    };
  }
  const synced = typeof data.syncedLyrics === "string" ? data.syncedLyrics : "";
  const plain = typeof data.plainLyrics === "string" ? data.plainLyrics : "";
  return {
    lyrics: synced ? parseLRC(synced) : [],
    plainLyrics: plain,
    syncedLyrics: synced,
    trackName: data.trackName ?? null,
    artistName: data.artistName ?? null,
    duration: typeof data.duration === "number" ? data.duration : null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist")?.trim();
  const title = searchParams.get("title")?.trim();
  const duration = searchParams.get("duration");

  if (!artist || !title) {
    return NextResponse.json({ error: "Missing artist or title" }, { status: 400 });
  }

  if (HF_TOKEN) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const query = new URLSearchParams({ artist, title });
      if (duration) query.set("duration", duration);
      const res = await fetch(`${HF_SPACE_URL}/api/get?${query}`, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const body = normalize(await res.json());
        if (body.lyrics.length > 0 || body.plainLyrics) {
          return NextResponse.json(body, { status: 200, headers: CACHE_LONG });
        }
      }
    } catch { }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const query = new URLSearchParams({ track_name: title, artist_name: artist });
    if (duration) query.set("duration", Math.round(Number(duration)).toString());
    const res = await fetch(`https://lrclib.net/api/get?${query}`, {
      headers: {
        "User-Agent": "echo/1.0 (https://github.com/rubixnet/echo)",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const body = normalize(await res.json());
      if (body.lyrics.length > 0 || body.plainLyrics) {
        return NextResponse.json(body, { status: 200, headers: CACHE_LONG });
      }
    }
  } catch { }

  return NextResponse.json({ error: "Lyrics not found" }, { status: 404, headers: CACHE_SHORT });
}