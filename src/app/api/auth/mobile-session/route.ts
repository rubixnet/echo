import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function POST(req: Request) {
  const apiKey = process.env.WORKOS_API_KEY;
  const clientId = process.env.WORKOS_CLIENT_ID;
  const jwtSecret = process.env.JWT_SECRET;
  if (!apiKey || !clientId || !jwtSecret) {
    return NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 });
  }

  try {
    const body = (await req.json()) as { code?: string; state?: string };
    if (!body.code || !body.state) {
      return NextResponse.json({ error: "Missing sign-in code." }, { status: 400 });
    }

    const { payload } = await jwtVerify(
      body.state,
      new TextEncoder().encode(jwtSecret),
    );
    if (payload.platform !== "android") {
      return NextResponse.json({ error: "Invalid app sign-in state." }, { status: 401 });
    }

    const { WorkOS } = await import("@workos-inc/node");
    const workos = new WorkOS(apiKey);
    const response = await workos.userManagement.authenticateWithCode({
      clientId,
      code: body.code,
    });
    const user = response.user;
    const namedUser = user as typeof user & {
      firstName?: string | null;
      lastName?: string | null;
    };
    const displayName =
      [namedUser.firstName, namedUser.lastName].filter(Boolean).join(" ").trim() ||
      user.email.split("@")[0];

    let profile = await fetchQuery(api.users.getProfile, { workosId: user.id });
    if (!profile) {
      profile = await fetchMutation(api.users.createProfile, {
        workosId: user.id,
        email: user.email,
        name: displayName || undefined,
      });
    }

    const onboarded = Boolean(profile?.onboarded);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      onboarded,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("60d")
      .sign(new TextEncoder().encode(jwtSecret));

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 60,
    });

    return NextResponse.json({ redirectTo: onboarded ? "/dashboard" : "/onboarding" });
  } catch (error) {
    console.error("Android auth handoff failed:", error);
    return NextResponse.json({ error: "Could not finish sign-in. Please try again." }, { status: 401 });
  }
}
