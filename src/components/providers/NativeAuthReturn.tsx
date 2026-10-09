"use client";

import { useCallback, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

export default function NativeAuthReturn() {
  const handledUrls = useRef(new Set<string>());

  const finishSignIn = useCallback(async (incomingUrl: string) => {
    if (!Capacitor.isNativePlatform()) return;

    let callback: URL;
    try {
      callback = new URL(incomingUrl);
    } catch {
      return;
    }
    if (
      callback.origin !== window.location.origin ||
      callback.pathname !== "/mobile-auth" ||
      handledUrls.current.has(incomingUrl)
    ) {
      return;
    }

    handledUrls.current.add(incomingUrl);
    const code = callback.searchParams.get("code");
    const state = callback.searchParams.get("state");
    if (!code || !state) {
      window.location.replace("/login?error=mobile_auth_failed");
      return;
    }

    try {
      await Browser.close().catch(() => undefined);
      const response = await fetch("/api/auth/mobile-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state }),
      });
      const result = (await response.json()) as { redirectTo?: string };
      if (!response.ok || !result.redirectTo) {
        throw new Error("Could not complete app sign-in.");
      }
      const destination = ["/dashboard", "/onboarding"].includes(result.redirectTo)
        ? result.redirectTo
        : "/dashboard";
      window.location.replace(destination);
    } catch (error) {
      console.error("Android sign-in handoff failed:", error);
      window.location.replace("/login?error=mobile_auth_failed");
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void App.addListener("appUrlOpen", ({ url }) => {
      void finishSignIn(url);
    }).then((listener) => {
      if (disposed) void listener.remove();
      else removeListener = () => listener.remove();
    });
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void finishSignIn(launch.url);
    });

    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [finishSignIn]);

  return null;
}
