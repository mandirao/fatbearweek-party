"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable; the field above still shows the URL to select manually
        }
      }}
      className="self-start bg-forest text-cream border-none rounded-[3px] px-4 py-2 font-sans font-bold text-[12px] tracking-[0.06em] cursor-pointer hover:bg-green-hover"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
