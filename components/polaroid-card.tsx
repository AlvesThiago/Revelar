"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FILTER_CLASS, type PhotoFilter, type RevealEffect } from "@/lib/types";

type PolaroidCardProps = {
  imageUrl: string;
  caption: string;
  filter?: PhotoFilter;
  className?: string;
  rotate?: number;
  reveal?: boolean;
  revealStyle?: RevealEffect;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  interactive?: boolean;
  compactCaption?: boolean;
};

const sizes = {
  sm: "w-full",
  md: "w-full max-w-[230px]",
  lg: "w-[min(86vw,300px)]",
};

export function PolaroidCard({
  imageUrl,
  caption,
  filter = "natural",
  className,
  rotate = 0,
  reveal = false,
  revealStyle = "polaroid",
  size = "md",
  onClick,
  interactive = true,
  compactCaption = false,
}: PolaroidCardProps) {
  return (
    <motion.figure
      data-polaroid
      className={cn(
        "polaroid-frame relative flex w-full flex-col rounded-[4px]",
        compactCaption ? "px-2 pt-2 pb-3" : "px-3 pt-3 pb-4",
        sizes[size],
        className
      )}
      style={{ rotate }}
      initial={interactive ? { y: 16, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1, rotate }}
      whileHover={interactive ? { y: -8, rotate: rotate + 1.4, scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-[#efe6dc]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={caption || "Polaroid do casal"}
            className={cn(
              "h-full w-full object-cover",
              FILTER_CLASS[filter],
              reveal && revealStyle === "polaroid" && "reveal-photo",
              reveal && revealStyle === "fade" && "reveal-fade",
              reveal && revealStyle === "letter" && "reveal-letter"
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            A foto ainda vai revelar aqui
          </div>
        )}
      </div>
      <figcaption
        className={cn(
          "font-hand whitespace-pre-wrap break-words text-center leading-snug text-graphite",
          compactCaption
            ? "mt-2 min-h-8 text-[1.05rem]"
            : "mt-3 min-h-10 text-[1.35rem]"
        )}
      >
        {caption || "escreva a declaração desta memória"}
      </figcaption>
    </motion.figure>
  );
}
