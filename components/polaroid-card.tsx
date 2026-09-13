"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FILTER_CLASS, type PhotoFilter } from "@/lib/types";

type PolaroidCardProps = {
  imageUrl: string;
  caption: string;
  filter?: PhotoFilter;
  className?: string;
  rotate?: number;
  reveal?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  interactive?: boolean;
};

const sizes = {
  sm: "w-[180px]",
  md: "w-[230px]",
  lg: "w-[min(86vw,300px)]",
};

export function PolaroidCard({
  imageUrl,
  caption,
  filter = "natural",
  className,
  rotate = 0,
  reveal = false,
  size = "md",
  onClick,
  interactive = true,
}: PolaroidCardProps) {
  return (
    <motion.figure
      data-polaroid
      className={cn(
        "polaroid-frame relative rounded-[4px] px-3 pt-3 pb-4",
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
              reveal && "reveal-photo"
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            A foto ainda vai revelar aqui
          </div>
        )}
      </div>
      <figcaption className="font-hand mt-3 min-h-10 text-center text-[1.35rem] leading-tight text-graphite">
        {caption || "escreva a declaração desta memória"}
      </figcaption>
    </motion.figure>
  );
}
