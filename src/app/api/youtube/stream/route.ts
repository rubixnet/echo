import { NextResponse } from "next/server";
import ytStream from "yt-stream";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing stream identifier" }, { status: 400 });

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    
    const result = await (ytStream as any).search(videoUrl);
    
    const streamData = Array.isArray(result) ? result[0] : result;

    if (!streamData || !streamData.stream) {
      throw new Error("No stream data returned from resolver");
    }

    return NextResponse.json({
      audioStreams: [{
        url: streamData.stream,
        mimeType: "audio/webm",
        format: "WEBM"
      }]
    });

  } catch (error) {
    console.error("Local yt-stream extraction failed:", error);
    return NextResponse.json({ error: "Local stream resolution failed" }, { status: 500 });
  }
}