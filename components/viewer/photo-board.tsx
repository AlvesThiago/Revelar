"use client";

import { useEffect, useState } from "react";
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

const DESKTOP_SLOTS: CollageSlot[] = [
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

const LEFT_ROT = [-8, 5, -6, 7, -4, 6];
const RIGHT_ROT = [7, -5, 8, -7, 5, -6];

function desktopHeight(count: number) {
  if (count <= 2) return "min(68vw, 520px)";
  if (count <= 4) return "min(92vw, 740px)";
  if (count <= 6) return "min(118vw, 960px)";
  if (count <= 9) return "min(140vw, 1180px)";
  return "min(160vw, 1380px)";
}

function mobileSlots(count: number): CollageSlot[] {
  const rows = Math.max(1, Math.ceil(count / 2));
  const band = 100 / rows;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / 2);
    const isLeft = index % 2 === 0;
    return {
      left: isLeft ? "0%" : "41%",
      top: `${row * band + (isLeft ? 1.5 : 7)}%`,
      width: "59%",
      rotate: (isLeft ? LEFT_ROT : RIGHT_ROT)[row % 6],
      tape: index % 2 === 0,
      z: 2 + (index % 3),
    };
  });
}

function mobileHeight(count: number) {
  return `${Math.max(1, Math.ceil(count / 2)) * 88}vw`;
}

function useWideCollage() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  return wide;
}

export function PhotoBoard({
  declaration,
  className,
}: {
  declaration: PublicDeclaration;
  className?: string;
}) {
  const photos = declaration.photos;
  const wide = useWideCollage();
  const picks = SPREAD[Math.min(photos.length, 12) - 1] ?? SPREAD[11];
  const slots = wide
    ? photos.map((_, index) => DESKTOP_SLOTS[picks[index] ?? index] ?? DESKTOP_SLOTS[index % DESKTOP_SLOTS.length])
    : mobileSlots(photos.length);

  return (
    <div
      data-photo-board
      className={cn("photo-board mx-auto w-full max-w-5xl rounded-[28px] p-2.5 sm:rounded-[32px] sm:p-6", className)}
    >
      <div className="photo-board-inner rounded-[20px] px-2 py-5 sm:rounded-[24px] sm:px-8 sm:py-8">
        <p className="font-hand text-center text-2xl leading-none text-rose sm:text-3xl">
          ♥ {declaration.coupleName || "nós dois"} ♥
        </p>
        <h2 className="mt-2 px-2 text-center text-base font-semibold text-graphite sm:text-xl">
          {declaration.title || "um quadro só de vocês"}
        </h2>
        <div
          className="photo-collage relative mt-4 w-full sm:mt-5"
          style={{ minHeight: wide ? desktopHeight(photos.length) : mobileHeight(photos.length) }}
        >
          {photos.map((photo, index) => {
            const slot = slots[index];
            if (!slot) return null;
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
                  compactCaption={!wide}
                  className="shadow-none"
                />
              </div>
            );
          })}
        </div>
        <p className="font-hand mt-3 text-center text-xl text-rose sm:mt-4 sm:text-2xl">nós, para sempre</p>
      </div>
    </div>
  );
}
