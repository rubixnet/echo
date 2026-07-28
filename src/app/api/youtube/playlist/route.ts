import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get("playlistId");

  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlist ID" }, { status: 400 });
  }

  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

  try {
    const { stdout } = await execAsync(
      `yt-dlp --flat-playlist -J "${playlistUrl}"`
    );

    const data = JSON.parse(stdout);

    const tracks = (data.entries || []).slice(0, 50).map((entry: any) => {
      const videoId = entry.id;

      let thumbnail =
        entry.thumbnails?.[entry.thumbnails.length - 1]?.url ||
        entry.thumbnail;

      if (!thumbnail || !thumbnail.startsWith("http")) {
        thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }

      const artist =
        entry.artist ||
        entry.uploader ||
        entry.channel ||
        entry.uploader_id ||
        "Unknown Artist";

      return {
        id: videoId,
        youtubeId: videoId,
        title: entry.title || "Untitled Track",
        artist: artist.replace(" - Topic", "").trim(),
        thumbnail,
        duration: entry.duration || 0,
        views: entry.view_count || entry.views || 0,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });

    return NextResponse.json({
      title: data.title || "Playlist",
      uploader: data.uploader || data.channel || "YouTube",
      playlistId,
      tracks,
    });
  } catch (error: any) {
    console.error("yt-dlp playlist parsing error:", error);
    return NextResponse.json(
      { error: "Failed to parse playlist using yt-dlp" },
      { status: 500 }
    );
  }
}