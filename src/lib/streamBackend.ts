import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type StreamBackend = "modal" | "ytdlp";

export function getStreamBackend(): StreamBackend {
  return process.env.STREAM_BACKEND === "ytdlp" ? "ytdlp" : "modal";
}

export function getModalUrl(): string | null {
  return process.env.MODAL_STREAM_URL || null;
}

export function getBackend() {
  const backend = getStreamBackend();
  if (backend === "modal") {
    const modalUrl = getModalUrl();
    if (!modalUrl) {
      throw new Error(
        "STREAM_BACKEND=modal but MODAL_STREAM_URL is not configured"
      );
    }
    return { backend, modalUrl };
  }
  return { backend, modalUrl: null };
}

export async function getStreamUrlViaYtDlp(id: string): Promise<string> {
  const { stdout } = await execAsync(
    `yt-dlp -g -f "ba/b" --extractor-args "youtube:player_client=web_creator,android_creator,android" "https://www.youtube.com/watch?v=${id}"`,
    { maxBuffer: 10 * 1024 * 1024 }
  );
  const directUrl = stdout.trim().split("\n")[0];
  if (!directUrl || !directUrl.startsWith("http")) {
    throw new Error("Failed to extract valid stream URL");
  }
  return directUrl;
}
