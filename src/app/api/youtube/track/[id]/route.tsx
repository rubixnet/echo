import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();
let isInitialized = false;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing track ID" }, { status: 400 });
        }

        if (!isInitialized) {
            await ytmusic.initialize();
            isInitialized = true;
        }

        const track = await ytmusic.getSong(id);

        if (!track) {
            return NextResponse.json({ error: "Track not found" }, { status: 404 });
        }

        const thumbnail =
            track.thumbnails?.[track.thumbnails.length - 1]?.url ||
            `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        const artistName = track.artist?.name || "Unknown Artist";

        const trackPayload = {
            id: track.videoId || id,
            title: track.name || "Untitled Track",
            artist: artistName,
            uploaderName: artistName,
            thumbnail: thumbnail,
            coverUrl: thumbnail,
            duration: track.duration || 0,
        };

        return NextResponse.json(trackPayload);
    } catch (error) {
        console.error("[YouTube Track API Error]:", error);
        return NextResponse.json(
            { error: "Failed to fetch track details" },
            { status: 500 }
        );
    }
}