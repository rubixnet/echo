import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const urlCache = new Map<string, { url: string, expires: number }>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    let directUrl = "";
    const now = Date.now();

    if (urlCache.has(id) && urlCache.get(id)!.expires > now) {
      directUrl = urlCache.get(id)!.url;
    } else {
      if (urlCache.size > 200) urlCache.clear();

      const { stdout } = await execAsync(`yt-dlp -g -f 140 "https://www.youtube.com/watch?v=${id}"`);
      directUrl = stdout.trim().split('\n')[0];

      if (!directUrl) throw new Error("Extraction failed");
      
      urlCache.set(id, { url: directUrl, expires: now + 2 * 60 * 60 * 1000 });
    }

    const rangeHeader = request.headers.get("range");
    const fetchHeaders: HeadersInit = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const googleResponse = await fetch(directUrl, { headers: fetchHeaders });

    const responseHeaders = new Headers();
    const contentType = googleResponse.headers.get("Content-Type");
    const contentLength = googleResponse.headers.get("Content-Length");
    const contentRange = googleResponse.headers.get("Content-Range");

    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    
    responseHeaders.set("Accept-Ranges", "bytes");

    return new NextResponse(googleResponse.body, {
      status: googleResponse.status,
      statusText: googleResponse.statusText,
      headers: responseHeaders,
    });

  } catch (e: any) {
    console.error("Stream Proxy Error:", e);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}