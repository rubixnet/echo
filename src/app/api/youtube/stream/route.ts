import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import { join } from "path";
import {
  getBackend,
  getStreamUrlViaYtDlp,
} from "@/lib/streamBackend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const urlCache = new Map<string, { url: string; expires: number }>();

const DEMO_ID_PREFIX = "demo-";
const DEMO_AUDIO_DIR = join(process.cwd(), "public", "audio", "demo", "tracks");

function getDemoAudioPath(id: string): string | null {
  const slug = id.slice(DEMO_ID_PREFIX.length);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
  return join(DEMO_AUDIO_DIR, `${slug}.mp3`);
}

function serveDemoAudio(filePath: string, range: string | null): NextResponse {
  const size = statSync(filePath).size;

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : size - 1;

      if (start >= size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }

      return new NextResponse(
        createReadStream(filePath, { start, end }) as unknown as ReadableStream,
        {
          status: 206,
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": String(end - start + 1),
            "Content-Range": `bytes ${start}-${end}/${size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
          },
        },
      );
    }
  }

  return new NextResponse(
    createReadStream(filePath) as unknown as ReadableStream,
    {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  if (id.startsWith(DEMO_ID_PREFIX)) {
    const filePath = getDemoAudioPath(id);
    if (!filePath) {
      return NextResponse.json(
        { error: "Unknown demo track" },
        { status: 404 },
      );
    }

    try {
      return serveDemoAudio(filePath, request.headers.get("range"));
    } catch (error) {
      console.error("Demo track read error:", error);
      return NextResponse.json(
        { error: "Demo audio unavailable" },
        { status: 404 },
      );
    }
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

  try {
    const range = request.headers.get("range");

    if (backend.backend === "ytdlp") {
      return await getYtDlpResponse(id, range);
    }

    const headers: HeadersInit = {};
    if (range) headers["Range"] = range;

    const modalRes = await fetch(
      `${backend.modalUrl}/stream?id=${encodeURIComponent(id)}`,
      { headers }
    );

    return forwardUpstream(modalRes);
  } catch (error) {
    console.error("Stream forward error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}

async function getYtDlpResponse(id: string, range: string | null) {
  const now = Date.now();
  const fetchHeaders: HeadersInit = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://www.youtube.com/",
    Origin: "https://www.youtube.com",
  };
  if (range) fetchHeaders["Range"] = range;

  let directUrl = "";
  if (urlCache.has(id) && urlCache.get(id)!.expires > now) {
    directUrl = urlCache.get(id)!.url;
  } else {
    directUrl = await getStreamUrlViaYtDlp(id);
    urlCache.set(id, { url: directUrl, expires: now + 45 * 60 * 1000 });
  }

  let googleResponse = await fetch(directUrl, { headers: fetchHeaders });

  if (googleResponse.status === 403) {
    urlCache.delete(id);
    directUrl = await getStreamUrlViaYtDlp(id);
    urlCache.set(id, {
      url: directUrl,
      expires: Date.now() + 45 * 60 * 1000,
    });
    googleResponse = await fetch(directUrl, { headers: fetchHeaders });
  }

  return forwardUpstream(googleResponse);
}

function forwardUpstream(res: Response) {
  const responseHeaders = new Headers();
  const contentType = res.headers.get("Content-Type");
  const contentLength = res.headers.get("Content-Length");
  const contentRange = res.headers.get("Content-Range");

  if (contentType) responseHeaders.set("Content-Type", contentType);
  if (contentLength) responseHeaders.set("Content-Length", contentLength);
  if (contentRange) responseHeaders.set("Content-Range", contentRange);
  responseHeaders.set("Accept-Ranges", "bytes");

  return new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}
