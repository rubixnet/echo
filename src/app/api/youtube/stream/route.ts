import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing ID", { status: 400 });

  try {
    const { stdout } = await execAsync(`yt-dlp -g "https://www.youtube.com/watch?v=${id}"`);
    const streamUrl = stdout.trim();

    return NextResponse.json({ url: streamUrl });
  } catch (e) {
    return new NextResponse("Extraction failed", { status: 500 });
  }
}