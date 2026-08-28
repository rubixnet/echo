import { normalizeTrack, type NormalizableTrack, type QueueItem } from "./trackUtils";

const inFlightRequests = new Map<string, Promise<QueueItem[]>>();

export async function fetchRelatedTracks(
  videoId: string,
  existingQueue: NormalizableTrack[] = [],
): Promise<QueueItem[]> {
  if (!videoId) return [];

  if (inFlightRequests.has(videoId)) {
    return inFlightRequests.get(videoId)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`/api/youtube/related?id=${videoId}`);
      if (!res.ok) return [];

      const data = (await res.json()) as { items?: unknown[] };
      if (!data.items || !Array.isArray(data.items)) return [];

      console.log(data);
      const existingIds = new Set(
        existingQueue.map((t) => t.trackId || t.id).filter(Boolean),
      );

      return data.items
        .filter(
          (item): item is NormalizableTrack =>
            !!item && typeof item === "object",
        )
        .filter((item) => {
          const id = item.trackId || item.id;
          return id && id !== videoId && !existingIds.has(id);
        })
        .map((item) => ({
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
