import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get("playlistId");

  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlist ID" }, { status: 400 });
  }

  const modalUrl = process.env.MODAL_STREAM_URL;
  if (!modalUrl) {
    return NextResponse.json({ error: "MODAL_STREAM_URL not set" }, { status: 500 });
  }

  try {
    const res = await fetch(`${modalUrl}/playlist?playlistId=${encodeURIComponent(playlistId)}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Playlist proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 });
  }
}