import {
  normalizeTrack,
  type NormalizableTrack,
  type QueueItem,
} from "./trackUtils";

const inFlightRequests = new Map<string, Promise<QueueItem[]>>();

interface FetchRelatedOptions {
  existingQueue?: NormalizableTrack[];
  userExclusions?: string[] | Set<string>;
  limit?: number;
}

export async function fetchRelatedTracks(
  videoId: string,
  options: FetchRelatedOptions = {},
): Promise<QueueItem[]> {
  if (!videoId) return [];
  if (inFlightRequests.has(videoId)) return inFlightRequests.get(videoId)!;

  const { existingQueue = [], userExclusions = [], limit = 15 } = options;

  const request = (async () => {
    try {
      const queueIds = existingQueue.map((t) => t.trackId || t.id).filter(Boolean);
      const excludeIds = Array.from(new Set([videoId, ...queueIds, ...userExclusions]));

      const res = await fetch("/api/youtube/related", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, excludeIds, limit }),
      });

      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.items)) return [];

      const excludeSet = new Set(excludeIds);

      return data.items
        .filter((item: NormalizableTrack) => {
          const id = item?.trackId || item?.id;
          return id && !excludeSet.has(id);
        })
        .slice(0, limit)
        .map((item: NormalizableTrack) => ({
          ...normalizeTrack(item),
          queueType: "recommendation" as const,
        }));
    } catch {
      return [];
    } finally {
      inFlightRequests.delete(videoId);
    }
  })();

  inFlightRequests.set(videoId, request);
  return request;
}