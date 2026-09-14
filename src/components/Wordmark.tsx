"use client";

import { useRouter } from "next/navigation";

export function Wordmark() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      onDoubleClick={() => router.push("/host")}
      className="min-h-10 inline-flex items-center font-sans font-bold text-xs tracking-[0.2em] text-apricot bg-transparent border-none p-0 cursor-pointer"
    >
      FAT BEAR HQ
    </button>
  );
}
