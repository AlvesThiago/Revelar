"use client";

import { PolaroidCard } from "@/components/polaroid-card";
import type { PublicDeclaration } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROTATIONS = [-7, 5, -3, 6, -5, 4, -2, 7, -6, 3, -4, 2];

export function PhotoBoard({
  declaration,
  className,
}: {
  declaration: PublicDeclaration;
  className?: string;
}) {
  return (
    <div
      data-photo-board
      className={cn("photo-board mx-auto w-full max-w-3xl rounded-[32px] p-4 sm:p-6", className)}
    >
      <div className="photo-board-inner rounded-[24px] px-4 py-6 sm:px-7 sm:py-8">
        <p className="font-hand text-center text-3xl leading-none text-rose">
          ♥ {declaration.coupleName || "nós dois"} ♥
        </p>
        <h2 className="mt-2 text-center text-lg font-semibold text-graphite sm:text-xl">
          {declaration.title || "um quadro só de vocês"}
        </h2>
        <div className="mt-6 flex flex-wrap items-start justify-center gap-3 sm:gap-4">
          {declaration.photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative w-[min(42vw,148px)] sm:w-[158px]"
              style={{ marginTop: index % 2 === 1 ? 18 : 0 }}
            >
              {index % 3 === 0 ? <span className="photo-tape" /> : null}
              <PolaroidCard
                imageUrl={photo.imageUrl}
                caption={photo.caption}
                filter={photo.filter}
                rotate={ROTATIONS[index % ROTATIONS.length]}
                size="sm"
                interactive={false}
                className="shadow-none"
              />
            </div>
          ))}
        </div>
        <p className="font-hand mt-7 text-center text-2xl text-rose">nós, para sempre</p>
      </div>
    </div>
  );
}
