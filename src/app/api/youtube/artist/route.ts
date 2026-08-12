import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();
let initialized = false;

function getBestCoverUrl(thumbnails: any[], videoId?: string): string {
  if (Array.isArray(thumbnails) && thumbnails.length > 0) {
    const validThumb = thumbnails[thumbnails.length - 1]?.url;
    if (validThumb && typeof validThumb === "string" && validThumb.startsWith("http")) {
      return validThumb;
    }
  }
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nameOrId = searchParams.get("name") || searchParams.get("id");

  if (!nameOrId) {
    return NextResponse.json({ error: "Artist name or ID is required" }, { status: 400 });
  }

  try {
    if (!initialized) {
      await ytmusic.initialize().catch(() => {});
      initialized = true;
    }

    let artistId: string | null = null;
    let fallbackName = nameOrId;

    if (nameOrId.startsWith("UC") && nameOrId.length >= 18) {
      artistId = nameOrId;
    } else {
      try {
        const searchResults = await ytmusic.searchArtists(nameOrId);
        if (searchResults && searchResults.length > 0) {
          artistId = searchResults[0].artistId;
          fallbackName = searchResults[0].name || nameOrId;
        } else {
          const generalResults = await ytmusic.search(nameOrId);
          const artistMatch = generalResults.find(
            (item: any) => item.type === "ARTIST" || item.artistId
          );
          if (artistMatch) {
            artistId = (artistMatch as any).artistId;
            fallbackName = (artistMatch as any).name || nameOrId;
          }
        }
      } catch (err) {
        console.warn("[Artist API] Artist search failed:", err);
      }
    }

    if (!artistId) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const [artistProfile, albums, artistSongs] = await Promise.all([
      ytmusic.getArtist(artistId).catch(() => null),
      ytmusic.getArtistAlbums(artistId).catch(() => []),
      ytmusic.getArtistSongs(artistId).catch(() => []),
    ]);

    if (!artistProfile) {
      return NextResponse.json({ error: "Failed to load artist details" }, { status: 404 });
    }

    const profile = artistProfile as any;
    const resolvedName = profile.name || fallbackName;

    const formatTrack = (track: any) => {
      const vId = track.videoId || track.id || "";
      return {
        id: vId,
        youtubeId: vId,
        title: track.name || track.title || "Untitled Track",
        artist: resolvedName,
        coverUrl: getBestCoverUrl(track.thumbnails, vId),
        duration:
          typeof track.duration === "number"
            ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`
            : "0:00",
        audioUrl: `/api/youtube/stream?id=${vId}`,
        source: { type: "artist", name: resolvedName },
      };
    };

    const topSongs = (profile.topSongs || []).map(formatTrack);
    const extraSongs = (artistSongs || []).map(formatTrack);
    const coverImage = getBestCoverUrl(profile.thumbnails);

    const formattedAlbums = (albums || []).map((album: any) => ({
      albumId: album.albumId || album.browseId || "",
      name: album.name || album.title || "Untitled Album",
      year: album.year || "Album",
      coverUrl: getBestCoverUrl(album.thumbnails),
    }));

    return NextResponse.json({
      name: resolvedName,
      artistId: artistId,
      coverUrl: coverImage,
      thumbnails: profile.thumbnails || [],
      topSongs: topSongs.length > 0 ? topSongs : extraSongs,
      albums: formattedAlbums,
      songs: extraSongs,
    });
  } catch (error) {
    console.error("Artist Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 });
  }
}