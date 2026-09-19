import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { getBackend } from "@/lib/streamBackend";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get("playlistId");

  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlist ID" }, { status: 400 });
  }

  let backend: ReturnType<typeof getBackend>;
  try {
    backend = getBackend();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backend not configured" },
      { status: 500 }
    );
  }

  if (backend.backend === "modal") {
    try {
      const res = await fetch(
        `${backend.modalUrl}/playlist?playlistId=${encodeURIComponent(playlistId)}`
      );
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (error) {
      console.error("Playlist proxy error:", error);
      return NextResponse.json(
        { error: "Failed to fetch playlist" },
        { status: 500 }
      );
    }
  }

  try {
    const { stdout } = await execAsync(
      `yt-dlp --no-warnings --ignore-errors --flat-playlist -j "https://www.youtube.com/playlist?list=${playlistId}"`,
      { maxBuffer: 50 * 1024 * 1024 }
    );

    const items = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((data): data is Record<string, unknown> => data !== null)
      .map((data) => {
        const id = String(data.id);
        const uploaderName = String(data.uploader || data.channel || "Unknown Artist");
        const thumbnail =
          (data.thumbnails as { url: string }[] | undefined)?.[
            (data.thumbnails as { url: string }[])?.length - 1
          ]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        return {
          id,
          title: String(data.title || "Untitled Track"),
          uploaderName,
          artist: uploaderName,
          artistId: null,
          url: `https://www.youtube.com/watch?v=${id}`,
          thumbnail,
          coverUrl: thumbnail,
          duration: Number(data.duration) || 0,
          type: "stream",
          isOfficial: false,
        };
      });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Playlist yt-dlp error:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}
