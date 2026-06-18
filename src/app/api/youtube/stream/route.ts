import { NextResponse } from "next/server";
import { spawn } from "child_process";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const ytDlp = spawn('yt-dlp', [
    '-f', '140', 
    '-o', '-',   
    `https://www.youtube.com/watch?v=${id}`
  ]);

  const stream = new ReadableStream({
    start(controller) {
      ytDlp.stdout.on('data', (chunk) => {
        controller.enqueue(chunk); 
      });

      ytDlp.stdout.on('end', () => {
        controller.close(); 
      });

      ytDlp.stderr.on('data', (data) => {
        console.warn(`yt-dlp info: ${data}`);
      });

      ytDlp.on('error', (error) => {
        console.error(`yt-dlp error: ${error.message}`);
        controller.error(error);
      });
    },
    cancel() {
      ytDlp.kill(); 
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'audio/mp4',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}