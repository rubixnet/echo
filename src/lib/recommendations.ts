import { normalizeTrack } from "./trackUtils";

const inFlightRequests = new Map<string, Promise<any[]>>();

export async function fetchRelatedTracks(
  videoId: string,
  existingQueue: any[] = [],
): Promise<any[]> {
  if (!videoId) return [];

  if (inFlightRequests.has(videoId)) {
    return inFlightRequests.get(videoId)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`/api/youtube/related?id=${videoId}`);
      if (!res.ok) return [];

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) return [];

      console.log(data);
      const existingIds = new Set(
        existingQueue.map((t) => t.youtubeId || t.id).filter(Boolean),
      );

      return data.items
        .filter((item: any) => {
          const id = item.youtubeId || item.id;
          return id && id !== videoId && !existingIds.has(id);
        })
        .map((item: any) => ({
          ...normalizeTrack(item),
          queueType: "recommendation" as const,
        }));
    } catch (error) {
      console.error("[fetchRelatedTracks] Error:", error);
      return [];
    } finally {
      inFlightRequests.delete(videoId);
    }
  })();

  inFlightRequests.set(videoId, fetchPromise);
  return fetchPromise;
}
