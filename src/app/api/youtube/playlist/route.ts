import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get("playlistId");

  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlist ID" }, { status: 400 });
  }

  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

  try {
    const args = [
      "--flat-playlist",
      "--dump-single-json",
      "--no-warnings",
      "--extractor-args",
      "youtube:player_client=android,web",
      playlistUrl,
    ];

    const { stdout } = await execFileAsync("yt-dlp", args, {
      maxBuffer: 20 * 1024 * 1024,
    });

    if (!stdout || stdout.trim() === "null") {
      throw new Error("Empty output from yt-dlp");
    }

    const data = JSON.parse(stdout);

    const tracks = (data.entries || []).slice(0, 50).map((entry: any) => {
      const videoId = entry.id;

      let thumbnail =
        entry.thumbnails?.[entry.thumbnails.length - 1]?.url || entry.thumbnail;

      if (!thumbnail || !thumbnail.startsWith("http")) {
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

      const rawArtist =
        entry.artist ||
        entry.uploader ||
        entry.channel ||
        entry.uploader_id ||
        "Unknown Artist";

      const artist = rawArtist.replace(" - Topic", "").trim();

      return {
        _id: videoId,
        id: videoId,
        youtubeId: videoId,
        title: entry.title || "Untitled Track",
        artist,
        thumbnail,
        coverUrl: thumbnail,
        duration: formatDuration(entry.duration),
        views: entry.view_count || entry.views || 0,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        type: "stream",
      };
    });

    return NextResponse.json({
      title: data.title || "Playlist",
      uploader: data.uploader || data.channel || "YouTube",
      playlistId,
      tracks,
    });
  } catch (error: any) {
    console.error("yt-dlp extraction error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to parse playlist" },
      { status: 500 },
    );
  }
}
