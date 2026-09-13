"use client";

import { PolaroidCard } from "@/components/polaroid-card";
import type { PublicDeclaration } from "@/lib/types";
import { cn } from "@/lib/utils";

type CollageSlot = {
  left: string;
  top: string;
  width: string;
  rotate: number;
  tape?: boolean;
  z: number;
};

const COLLAGE_SLOTS: CollageSlot[] = [
  { left: "1%", top: "1%", width: "36%", rotate: -11, tape: true, z: 3 },
  { left: "34%", top: "8%", width: "27%", rotate: 7, z: 2 },
  { left: "63%", top: "0%", width: "35%", rotate: -5, tape: true, z: 4 },
  { left: "12%", top: "30%", width: "30%", rotate: 9, z: 5 },
  { left: "46%", top: "28%", width: "26%", rotate: -8, tape: true, z: 6 },
  { left: "70%", top: "32%", width: "28%", rotate: 5, z: 3 },
  { left: "0%", top: "56%", width: "32%", rotate: -6, tape: true, z: 4 },
  { left: "29%", top: "52%", width: "34%", rotate: 4, z: 2 },
  { left: "66%", top: "58%", width: "33%", rotate: -9, tape: true, z: 5 },
  { left: "8%", top: "78%", width: "28%", rotate: 6, z: 3 },
  { left: "40%", top: "76%", width: "31%", rotate: -3, tape: true, z: 4 },
  { left: "71%", top: "80%", width: "27%", rotate: 8, z: 2 },
];

const SPREAD: number[][] = [
  [1],
  [0, 2],
  [0, 2, 7],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8],
  [0, 2, 3, 5, 6, 8, 10],
  [0, 1, 2, 3, 5, 6, 8, 10],
  [0, 1, 2, 3, 5, 6, 7, 8, 10],
  [0, 1, 2, 3, 4, 5, 6, 8, 9, 10],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
];

function collageHeight(count: number) {
  if (count <= 2) return "min(68vw, 520px)";
  if (count <= 4) return "min(92vw, 740px)";
  if (count <= 6) return "min(118vw, 960px)";
  if (count <= 9) return "min(140vw, 1180px)";
  return "min(160vw, 1380px)";
}

export function PhotoBoard({
  declaration,
  className,
}: {
  declaration: PublicDeclaration;
  className?: string;
}) {
  const photos = declaration.photos;
  const picks = SPREAD[Math.min(photos.length, 12) - 1] ?? SPREAD[11];

  return (
    <div
      data-photo-board
      className={cn("photo-board mx-auto w-full max-w-5xl rounded-[32px] p-4 sm:p-6", className)}
    >
      <div className="photo-board-inner rounded-[24px] px-3 py-6 sm:px-8 sm:py-8">
        <p className="font-hand text-center text-3xl leading-none text-rose">
          ♥ {declaration.coupleName || "nós dois"} ♥
        </p>
        <h2 className="mt-2 text-center text-lg font-semibold text-graphite sm:text-xl">
          {declaration.title || "um quadro só de vocês"}
        </h2>
        <div className="photo-collage relative mt-5 w-full" style={{ minHeight: collageHeight(photos.length) }}>
          {photos.map((photo, index) => {
            const slot = COLLAGE_SLOTS[picks[index] ?? index] ?? COLLAGE_SLOTS[index % COLLAGE_SLOTS.length];
            return (
              <div
                key={photo.id}
                className="absolute"
                style={{
                  left: slot.left,
                  top: slot.top,
                  width: slot.width,
                  zIndex: slot.z,
                }}
              >
                {slot.tape ? <span className="photo-tape" /> : null}
                <PolaroidCard
                  imageUrl={photo.imageUrl}
                  caption={photo.caption}
                  filter={photo.filter}
                  rotate={slot.rotate}
                  size="sm"
                  interactive={false}
                  className="shadow-none"
                />
              </div>
            );
          })}
        </div>
        <p className="font-hand mt-4 text-center text-2xl text-rose">nós, para sempre</p>
      </div>
    </div>
  );
}
