import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
  }

  const modalUrl = process.env.MODAL_STREAM_URL;
  if (!modalUrl) {
    return NextResponse.json(
      { error: "MODAL_STREAM_URL environment variable is not configured" },
      { status: 500 }
    );
  }

  try {
    const range = request.headers.get("range");
    const headers: HeadersInit = {};
    if (range) headers["Range"] = range;

    const modalRes = await fetch(
      `${modalUrl}/stream?id=${encodeURIComponent(id)}`,
      { headers }
    );

    const responseHeaders = new Headers();
    const contentType = modalRes.headers.get("Content-Type");
    const contentLength = modalRes.headers.get("Content-Length");
    const contentRange = modalRes.headers.get("Content-Range");

    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    responseHeaders.set("Accept-Ranges", "bytes");

    return new NextResponse(modalRes.body, {
      status: modalRes.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Stream forward error:", error);
    return NextResponse.json({ error: "Streaming failed" }, { status: 500 });
  }
}