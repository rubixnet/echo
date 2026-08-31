import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

/**
 * Instant room teardown when the HOST closes the site.
 *
 * The RoomProvider fires navigator.sendBeacon() on `pagehide`; beacons are
 * POSTs that carry the session cookie automatically. The expiry cron in
 * convex/crons.ts is the safety net if this never arrives (killed process,
 * crash, etc).
 */
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return new Response(null, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const profile = await fetchQuery(api.users.getProfile, {
      workosId: payload.userId as string,
    });
    if (!profile) return new Response(null, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      roomId?: string;
    } | null;
    if (!body?.roomId) return new Response(null, { status: 400 });

    await fetchMutation(api.rooms.closeRoom, {
      roomId: body.roomId as Id<"rooms">,
      userId: profile._id,
    });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
}
