import { NextResponse } from "next/server";

const PIPED_INSTANCES = [
  "https://api.piped.projectsegfau.lt",
  "https://pipedapi.smnz.de",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.linustransit.net"
];

const INVIDIOUS_INSTANCES = [
  "https://invidious.perennialte.ch",
  "https://vid.puffyan.us",
  "https://invidious.flokinet.to"
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ items: [] }, { status: 400 });

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
      if (res.ok) {
        const rawItems = await res.json();

        const normalizedItems = rawItems.map((item: any) => ({
          type: "stream",
          url: `/watch?v=${item.videoId}`,
          title: item.title,
          thumbnail: item.videoThumbnails?.find((t: any) => t.quality === "medium")?.url || item.videoThumbnails?.[0]?.url,
          uploaderName: item.author,
          duration: item.lengthSeconds
        }));
        return NextResponse.json({ items: normalizedItems });
      }
    } catch (e) {
      console.warn(`Invidious instance down: ${instance}`);
    }
  }

  console.log("Invidious network exhausted. Dropping back to Piped search matrix...");

  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`, {
        next: { revalidate: 300 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn(`Piped instance down: ${instance}`);
    }
  }

  return NextResponse.json({ error: "All media networks currently busy" }, { status: 502 });
}