interface PipedAudioStream {
  url?: string;
  audioTrackId?: string;
}

interface PipedStreamsResponse {
  audioStreams?: PipedAudioStream[];
}

export async function getClientSideStreamUrl(videoId: string) {
  const res = await fetch(
    `https://api.piped.projectsegfau.lt/streams/${videoId}`,
  );
  const data = (await res.json()) as PipedStreamsResponse;
  return (
    data.audioStreams?.find((s) => s.audioTrackId)?.url ||
    data.audioStreams?.[0]?.url ||
    ""
  );
}
