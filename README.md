# Echo - experimental music player

### Note: this is for educational purposes only
Echo is an experimental music streaming platform which i make to learn live and music streaming along with some stuff, this project is for educational purpose

I got the idea for this project when i play badminton with friend together and play song outside, as sound is low i think if any app which i can use so both play same song together for louder output volume. so this is where the idea come for, the current and from start homepage idea come from tryklack.com/ site which i like and use it here, the login page is same as from the badminton project i have. 

For ui of this project all the credit goes to this creator on youtube - https://www.youtube.com/@juxtopposed who redesigned apple music from this video https://www.youtube.com/watch?v=yT_aFozeDc8 and shared a figma link to file as well https://www.figma.com/community/file/1622299389536274468/apple-music-redesign. after this video i decid it better to make a whole music platform and better than apple music as Juxt design new better apple music, it has lot of stuff. 

this application uses convex, workos, tailwind, yt dlp, nextjs, hugging face (for lyrics), modal (for backend deployment) and vercel (frontend deployment) 

to run this application locally clone the repo first 
```
git clone https://github.com/rubixnet/echo
```
then run 
```
bun install
```

this will install all the related files.
after this you will need the following env variables from workos and convex! 

```
WORKOS_API_KEY=
WORKOS_CLIENT_ID=
WORKOS_COOKIE_PASSWORD=
JWT_SECRET=

# Deployment used by `npx convex dev`
you get this by signing up on convex or you can also choose to run convex locally without this variables! 
CONVEX_DEPLOYMENT=dev: #followed by your project path 

NEXT_PUBLIC_CONVEX_URL=CLOUD_URL_HERE

NEXT_PUBLIC_CONVEX_SITE=SITE_URL_HERE
```

**you can also install yt dlp if you don't want to get the music files from my runner instance or if you get ratelimited on my web application**

```
pip install yt-dlp
```

`src/app/api/youtube/search/route.ts`

```tsx
import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const ytmusic = new YTMusic();
let isInitialized = false;

interface SearchItem {
  id: string;
  title: string;
  uploaderName: string;
  artist: string;
  artistId: string | null;
  url: string;
  thumbnail: string;
  coverUrl: string;
  duration: number | string;
  type: string;
  isOfficial: boolean;
}

const searchCache = new Map<string, { items: SearchItem[]; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ items: [] });

  const cacheKey = query.toLowerCase().trim();
  const now = Date.now();

  if (searchCache.has(cacheKey) && searchCache.get(cacheKey)!.expires > now) {
    return NextResponse.json({
      items: searchCache.get(cacheKey)!.items,
      cached: true,
    });
  }

  try {
    if (!isInitialized) {
      await ytmusic.initialize();
      isInitialized = true;
    }

    const rawSongs = await ytmusic.searchSongs(query);

    if (rawSongs && rawSongs.length > 0) {
      const items: SearchItem[] = rawSongs.map((song) => {
        const videoId = song.videoId;
        const artistName = song.artist?.name || "Unknown Artist";
        const thumbnail =
          song.thumbnails?.[song.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        const uploaderLower = artistName.toLowerCase();
        const isOfficial =
          uploaderLower.endsWith("vevo") ||
          uploaderLower.endsWith(" - topic") ||
          uploaderLower.includes("official");

        return {
          id: videoId,
          title: song.name || "Untitled Track",
          uploaderName: artistName,
          artist: artistName,
          artistId: song.artist?.artistId || null,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: thumbnail,
             coverUrl: thumbnail,
          duration: song.duration || 0,
          type: "stream",
          isOfficial: isOfficial,
        };
      });

      searchCache.set(cacheKey, { items, expires: now + CACHE_TTL });
      return NextResponse.json({ items });
    }
  } catch (err) {
    console.warn(
      "[Search API] Fast path failed, falling back to yt-dlp...",
      err,
    );
     }

  try {
    const safeQuery = query.replace(/"/g, "");
    const FALLBACK_LIMIT = 2;
    let stdoutString = "";

    try {
      const { stdout } = await execAsync(
        `yt-dlp --no-warnings --ignore-errors -j "ytsearch${FALLBACK_LIMIT}:${safeQuery}"`,
        { maxBuffer: 10 * 1024 * 1024 },
      );
      stdoutString = stdout;
    } catch (err) {
      stdoutString = (err as { stdout?: string })?.stdout || "";
    }

    const items = stdoutString
      .trim()
      .split("\n")
      .map((line): SearchItem | null => {
        try {
          if (!line) return null;
          const data = JSON.parse(line);
          if (data.duration && data.duration > 600) return null;

          const uploaderName = data.uploader ? data.uploader.toLowerCase() : "";
          const isOfficial =
            data.channel_is_verified === true ||
            uploaderName.endsWith("vevo") ||
            uploaderName.endsWith(" - topic");

          return {
            id: data.id,
            title: data.title,
            uploaderName: data.uploader,
            artist: data.uploader,
            artistId: null,
            url:
              data.webpage_url || `https://www.youtube.com/watch?v=${data.id}`,
            thumbnail: data.thumbnail,
            coverUrl: data.thumbnail,
            duration: data.duration,
            type: "stream",
            isOfficial: isOfficial,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is SearchItem => item !== null);

    if (items.length > 0) {
      searchCache.set(cacheKey, { items, expires: now + CACHE_TTL });
    }
     return NextResponse.json({ items });
     } catch (e) {
    console.error(
      "Search Fallback Error:",
      e instanceof Error ? e.message : e,
    );
    return NextResponse.json(
      { error: "Search failed", items: [] },
      { status: 500 },
    );
}
```



`src/app/api/youtube/stream/route.ts`

```tsx
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
```

along with the pipeUrl in `/src/hooks/useGlobalPlayback.tsx` 

```
    const pipeUrl = `/api/youtube/stream?id=${videoId}`;
```
