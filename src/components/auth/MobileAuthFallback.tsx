"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export default function MobileAuthFallback({
  code,
  state,
}: {
  code: string;
  state: string;
}) {
  const [message, setMessage] = useState(
    code && state ? "Returning to Echo…" : "This sign-in link is incomplete. Please start again in Echo.",
  );

  useEffect(() => {
    // On Android, NativeAuthReturn handles the verified app link and installs
    // the session cookie in the app's WebView. This page is a browser fallback.
    if (Capacitor.isNativePlatform()) return;
    if (!code || !state) return;

    let active = true;
    void fetch("/api/auth/mobile-session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
    })
      .then(async (response) => {
        const result = (await response.json()) as { redirectTo?: string };
        if (!response.ok || !result.redirectTo) {
          throw new Error("Could not finish signing in.");
        }
        if (active) {
          const destination = ["/dashboard", "/onboarding"].includes(result.redirectTo)
            ? result.redirectTo
            : "/dashboard";
          window.location.replace(destination);
        }
      })
      .catch(() => {
        if (active) setMessage("Sign-in could not finish. Return to Echo and try again.");
      });

    return () => {
      active = false;
    };
  }, [code, state]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
      <p role="status" className="text-sm font-medium">{message}</p>
    </main>
  );
}
