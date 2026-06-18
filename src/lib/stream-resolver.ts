export async function getClientSideStreamUrl(videoId: string) {

    const res = await fetch(`https://api.piped.projectsegfau.lt/streams/${videoId}`);
    const data = await res.json();
    return data.audioStreams.find((s: any) => s.audioTrackId)?.url || data.audioStreams[0].url;
}
