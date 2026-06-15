"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/library/liked");
  }, [router]);

  return (
    <div className="p-10 flex items-center justify-center text-neutral-400">
      Loading your library...
    </div>
  );
}