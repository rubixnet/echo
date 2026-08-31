import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { UserProvider } from "@/hooks/useUser";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
        redirect("/login");
    }

    let profile = null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        profile = await fetchQuery(api.users.getProfile, {
            workosId: payload.userId as string,
        });
    } catch {
        redirect("/login");
    }

    if (profile?.onboarded) {
        redirect("/dashboard");
    }

    return <UserProvider user={profile}>{children}</UserProvider>;
}