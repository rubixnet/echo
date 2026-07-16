import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("id");

    if (!videoId) {
        return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    try {
        const mixUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;

        let stdoutString = "";

        try {
            const { stdout } = await execAsync(
                `yt-dlp --no-warnings --ignore-errors -j --flat-playlist --playlist-end 10 "${mixUrl}"`
            );
            stdoutString = stdout;
        } catch (err: any) {
            if (err.stdout) {
                stdoutString = err.stdout;
            } else {
                throw err;
            }
        }

        const results = stdoutString.trim().split('\n').map((line) => {
            try {
                if (!line) return null;
                const data = JSON.parse(line);

                if (data.id === videoId) return null;

                const title = (data.title || "").toLowerCase();
                const duration = data.duration || 0;
                if (duration > 600 || title.includes("podcast") || title.includes("episode")) return null;

                return {
                    youtubeId: data.id,
                    title: data.title,
                    artist: data.uploader || data.channel || "Unknown Artist",
                    coverUrl: data.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${data.id}/hqdefault.jpg`,
                    duration: duration,
                };
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        return NextResponse.json({ items: results.slice(0, 5) });

    } catch (error) {
        console.error("Failed to fetch YouTube Mix:", error);
        return NextResponse.json({ items: [] }, { status: 500 });
    }
}