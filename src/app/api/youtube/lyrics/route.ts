import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const title = searchParams.get("title") || "";
  const artist = searchParams.get("artist") || "";

  if (!id)
    return NextResponse.json(
      { error: "No video ID provided" },
      { status: 400 },
    );

  const getYoutubeCaptions = async () => {
    const response = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();

    const captionRegex = /"captionTracks":\s*(\[.*?\])/;
    const match = captionRegex.exec(html);
    if (!match) throw new Error("No YouTube Captions");

    const tracks = JSON.parse(match[1]);
    let track = tracks.find(
      (t: any) =>
        t.vssId === ".en" || t.languageCode === "en" || t.vssId === "a.en",
    );
    if (!track) track = tracks[0];

    const transcriptRes = await fetch(track.baseUrl);
    const transcriptXml = await transcriptRes.text();

    const textRegex = /<text start="([\d.]+)"[^>]*>([^<]+)<\/text>/g;
    const lyrics = [];
    let xmlMatch;

    while ((xmlMatch = textRegex.exec(transcriptXml)) !== null) {
      const time = parseFloat(xmlMatch[1]);
      const text = xmlMatch[2]
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\n/g, " ")
        .replace(/♪/g, "")
        .trim();

      if (text && text !== "[Music]") {
        lyrics.push({ time, text });
      }
    }

    if (lyrics.length === 0) throw new Error("Captions were empty");
    return lyrics;
  };

  const getLrcLib = async () => {
    if (!title) throw new Error("No title provided");

    const cleanTitle = title.replace(/\([^)]*\)|\[[^\]]*\]/g, "").trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(artist)}`,
      {
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("LRCLIB Not found");

    const data = await res.json();
    if (!data.syncedLyrics) throw new Error("No synced lyrics found");

    const lines = data.syncedLyrics.split("\n");
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds =
          match[3].length === 2
            ? parseInt(match[3], 10) * 10
            : parseInt(match[3], 10);
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = line.replace(timeRegex, "").trim();

        if (text) parsed.push({ time, text });
      }
    }

    if (parsed.length === 0) throw new Error("Parsed LRC was empty");
    return parsed;
  };

  try {
    const lyrics = await Promise.any([getLrcLib(), getYoutubeCaptions()]);

    return NextResponse.json({ lyrics });
  } catch (error) {
    return NextResponse.json(
      { error: "No lyrics found anywhere" },
      { status: 404 },
    );
  }
}
