import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    const { stdout, stderr } = await execAsync(`yt-dlp -g -f bestaudio "https://www.youtube.com/watch?v=${id}"`);
    
    const streamUrl = stdout.trim().split('\n')[0];
    if (!streamUrl) {
      return NextResponse.json({ 
        error: "yt-dlp returned no URL", 
        details: stderr 
      }, { status: 500 });
    }

    return NextResponse.json({ url: streamUrl });
  } catch (e: any) {
    console.error("YTDLP Extraction Error:", e);
    return NextResponse.json({ 
      error: "Stream extraction failed on the server.",
      details: e.message || "Unknown system error"
    }, { status: 500 });
  }
}