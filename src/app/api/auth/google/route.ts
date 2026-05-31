import {WorkOS} from "@workos-inc/node";
import {NextResponse} from "next/server";

const workos = new WorkOS(process.env.WORKOS_API_KEY!);

export async function GET(req: Request) {
    const requestUrl = new URL(req.url);
    const clientId = process.env.WORKOS_CLIENT_ID!;
    const redirectUri = new URL("/api/auth/callback", requestUrl.origin).toString();

    if (!clientId || !redirectUri) {
        return NextResponse.json({error: "Missing client id or redirect uri"}, {status: 500});
    } 

    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
        clientId,
        provider: "GoogleOAuth", 
        redirectUri,
    })

    return NextResponse.redirect(authorizationUrl);
}