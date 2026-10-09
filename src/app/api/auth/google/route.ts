import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function GET(req: Request) {
  const apiKey = process.env.WORKOS_API_KEY;
  const requestUrl = new URL(req.url);
  const clientId = process.env.WORKOS_CLIENT_ID;
  const isAndroidApp = requestUrl.searchParams.get("platform") === "android";
  if (!apiKey || !clientId) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 404 });
  }
  if (isAndroidApp && !process.env.JWT_SECRET) {
    return NextResponse.json({ error: "App sign-in is not configured." }, { status: 503 });
  }

  const { WorkOS } = await import("@workos-inc/node");
  const workos = new WorkOS(apiKey);
  const redirectUri = new URL(
    "/api/auth/callback",
    requestUrl.origin,
  ).toString();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing client id or redirect uri" },
      { status: 500 },
    );
  }

  const state = isAndroidApp
    ? await new SignJWT({ platform: "android" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!))
    : undefined;

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    provider: "GoogleOAuth",
    redirectUri,
    ...(state ? { state } : {}),
  });

  return NextResponse.redirect(authorizationUrl);
}
