"use client";

import { useRouter } from "next/navigation";

export function Wordmark() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/")}
      onDoubleClick={() => router.push("/host")}
      className="font-sans font-bold text-[11px] tracking-[0.2em] text-apricot bg-transparent border-none p-0 cursor-pointer"
    >
      FAT BEAR HQ
    </button>
  );
}
