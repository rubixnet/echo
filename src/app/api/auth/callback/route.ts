import { WorkOS} from "@workos-inc/node";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

const workos = new WorkOS(process.env.WORKOS_API_KEY!);
const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
    
    try {
        const response = await workos.userManagement.

        //reading docs to know what needs to be done here, 

        // the other stuff was written with help of how I wrote code for 
        // the badminton note tracker
    }
}
