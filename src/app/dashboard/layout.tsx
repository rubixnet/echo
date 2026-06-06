import {cookies}  from "next/headers";
import {jwtVerify} from 'jose';
import {redirect} from 'next/navigation';
import {fetchQuery} from "convex/nextjs";
import {api} from "../../../convex/_generated/api"
import ClientLayout from "./ClientLayout";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export default async function DashboardLayout({
    children
}: { 
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
        redirect('/login')
    }
    let profile = null; 

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        profile = await fetchQuery(api.users.getProfile, {workosID: payload.userId as string})
    } catch (err) {
        console.error('Invalid session token')
        redirect('/api/auth/logout?reason=session_invalid');
    }

    return (
        <ClientLayout user={profile}>
            {children}
        </ClientLayout>
    )
}