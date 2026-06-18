import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  
  if (!query) return NextResponse.json({ items: [] });
    try {
    const safeQuery = query.replace(/"/g, ''); 
    
    let stdoutString = "";
    
    try {
        const { stdout } = await execAsync(`yt-dlp --no-warnings --ignore-errors -j "ytsearch10:${safeQuery}"`, {
            maxBuffer: 10 * 1024 * 1024 
        });

        stdoutString = stdout;
    } catch (err: any) {
        if (err.stdout) {
            stdoutString = err.stdout;
        } else {
            throw err;  
        }
    }
    
    const results = stdoutString.trim().split('\n').map((line) => {
      try {
        if (!line) return null;
        const data = JSON.parse(line);
        return {
          id: data.id,
          title: data.title,
          uploaderName: data.uploader,
          url: data.webpage_url || `https://www.youtube.com/watch?v=${data.id}`,
          thumbnail: data.thumbnail,
          duration: data.duration,
          type: "stream"
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean); 

    return NextResponse.json({ items: results });
  } catch (e: any) {
    console.error("Pure Search Error:", e.message);
    return NextResponse.json({ error: "Search failed", items: [] }, { status: 500 });
  }
}