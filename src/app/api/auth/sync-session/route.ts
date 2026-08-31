import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { verifyAuth } from "@/lib/auth"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
    const cookieStore = await cookies()

    const token = cookieStore.get("session")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const payload = await verifyAuth(token)

        if (!payload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const newToken = await new SignJWT({
            userId: payload.userId,
            email: payload.email,
            onboarded: true,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("60d")
            .sign(JWT_SECRET);

        cookieStore.set("session", newToken, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 60,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
    }
}