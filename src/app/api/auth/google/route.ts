import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const apiKey = process.env.WORKOS_API_KEY;
  const requestUrl = new URL(req.url);
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!apiKey || !clientId) {
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 404 });
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

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    clientId,
    provider: "GoogleOAuth",
    redirectUri,
  });

  return NextResponse.redirect(authorizationUrl);
}
