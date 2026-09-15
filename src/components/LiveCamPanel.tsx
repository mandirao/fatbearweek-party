"use client";

import { useState } from "react";
import { CAMS } from "@/lib/party";

export function LiveCamPanel() {
  const [camIdx, setCamIdx] = useState(0);
  const activeCam = CAMS[camIdx];

  return (
    <div className="bg-cam-bg rounded overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2.5">
        <span className="w-[7px] h-[7px] rounded-full bg-salmon flex-none" />
        <span className="font-bold text-[11px] tracking-[0.2em] text-apricot">LIVE FROM KATMAI</span>
        <span className="flex-1 h-px bg-green-rule-2" />
        <span className="font-semibold text-[11px] tracking-[0.14em] text-cam-label">
          {activeCam.badge} · {activeCam.name}
        </span>
      </div>

      {activeCam.src ? (
        <div className="relative w-full pt-[56.25%] bg-cam-stage">
          <iframe
            src={activeCam.src}
            title="Katmai live cam"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      ) : (
        <div
          className="relative w-full pt-[56.25%]"
          style={{
            backgroundImage: "repeating-linear-gradient(135deg, #1C3226 0 8px, #16281E 8px 16px)",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
            <span className="font-bold text-xs tracking-[0.18em] text-tan">
              {activeCam.badge} · {activeCam.name}
            </span>
            <span className="text-sm leading-[1.5] text-green-muted-3 max-w-[260px]">
              This feed doesn&apos;t embed. Watch it on explore.org.
            </span>
            <a
              href={activeCam.link}
              target="_blank"
              className="min-h-11 inline-flex items-center text-[15px] font-semibold text-river-light"
            >
              Open the cam ↗
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-3.5 py-3">
        {CAMS.map((c, i) => {
          const selected = i === camIdx;
          return (
            <button
              key={c.badge}
              type="button"
              onClick={() => setCamIdx(i)}
              className="flex-none w-[118px] flex flex-col gap-1.5 text-left"
            >
              <div
                className="w-full h-14 rounded-[3px] flex items-end p-[5px] box-border bg-cover bg-center"
                style={{
                  border: `2px solid ${selected ? "#C2522E" : "#3A5244"}`,
                  backgroundImage: c.thumb
                    ? `linear-gradient(to top, rgba(10,20,14,0.8), rgba(10,20,14,0.15) 65%), url(${c.thumb})`
                    : "repeating-linear-gradient(135deg, #1C3226 0 6px, #16281E 6px 12px)",
                }}
              >
                <span
                  className="font-bold text-[11px] tracking-[0.12em]"
                  style={{ color: selected ? "#EFE6D2" : "#A9BCAD" }}
                >
                  {c.badge}
                </span>
              </div>
              <span
                className="text-[13px] leading-[1.3] min-h-[34px]"
                style={{ color: selected ? "#EFE6D2" : "#A9BCAD" }}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
