import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const urlCache = new Map<string, { url: string; expires: number }>();

async function getStreamUrl(id: string): Promise<string> {
  const { stdout } = await execAsync(
    `yt-dlp -g -f "ba/b" --extractor-args "youtube:player_client=web_creator,android_creator,android" "https://www.youtube.com/watch?v=${id}"`,
  );

  const directUrl = stdout.trim().split("\n")[0];
  if (!directUrl || !directUrl.startsWith("http")) {
    throw new Error("Failed to extract valid stream URL");
  }
  return directUrl;
}

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
      directUrl = await getStreamUrl(id);
      urlCache.set(id, { url: directUrl, expires: now + 45 * 60 * 1000 });
    }

    const rangeHeader = request.headers.get("range");
    const fetchHeaders: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.youtube.com/",
      Origin: "https://www.youtube.com",
    };
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    let googleResponse = await fetch(directUrl, { headers: fetchHeaders });

    if (googleResponse.status === 403) {
      urlCache.delete(id);
      directUrl = await getStreamUrl(id);
      urlCache.set(id, {
        url: directUrl,
        expires: Date.now() + 45 * 60 * 1000,
      });
      googleResponse = await fetch(directUrl, { headers: fetchHeaders });
    }

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
  } catch (e) {
    console.error("Stream Proxy Error:", e);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}
