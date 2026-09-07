"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LiquidDrop } from "@/components/LiquidUI/LiquidDrop";

export function Banner() {
  const banner = useQuery(api.banner.getActiveBanner);

  if (!banner) return null;

  return (
    <div className="items-center justify-center flex mx-auto">
      <LiquidDrop radius="12px" className="p-2">
        <div
          className="flex flex-col space-y-1 items-center text-balance text-center justify-center"
          dangerouslySetInnerHTML={{ __html: banner.contentHtml }}
        />
      </LiquidDrop>
    </div>
  );
}