import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { api } from "../../../../../convex/_generated/api";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(request: Request) {
  if (process.env.LOCAL_DEMO_AUTH !== "true") {
    return NextResponse.json({ error: "Demo sign-in is only available locally." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@gmail\.com$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid Gmail address." }, { status: 400 });
  }

  const userId = `demo:${email}`;
  try {
    let profile = await fetchQuery(api.users.getProfile, { workosId: userId });
    if (!profile) {
      profile = await fetchMutation(api.users.createProfile, {
        workosId: userId,
        email,
        name: email.slice(0, email.indexOf("@")),
      });
    }

    const token = await new SignJWT({
      userId,
      email,
      onboarded: Boolean(profile?.onboarded),
      localDemo: true,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ redirectTo: profile?.onboarded ? "/dashboard" : "/onboarding" });
  } catch (error) {
    console.error("Local demo sign-in failed:", error);
    return NextResponse.json(
      { error: "Could not connect to the local database. Make sure Docker Compose is running." },
      { status: 503 },
    );
  }
}
