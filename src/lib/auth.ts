import { jwtVerify } from "jose";

export type AppJWT = {
  userId: string;
  email: string;
  onboarded: boolean;
};

export async function verifyAuth(token: string | undefined) {
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const verified = await jwtVerify<AppJWT>(token, secret);
    return verified.payload as AppJWT;
  } catch {
    return null;
  }
}