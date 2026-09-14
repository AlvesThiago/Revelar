"use client";

import { motion } from "framer-motion";

export function CameraMockup() {
  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-[420px] items-start justify-center pt-6 sm:h-[460px]">
      <motion.div
        className="camera-body relative z-20 w-[280px] rounded-[36px] px-5 pb-6 pt-4 sm:w-[310px]"
        initial={{ y: 24, rotateX: 12, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-16 rounded-full bg-[#2b2d42]/20" />
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff8a7a] shadow-[0_0_8px_#ff8a7a]" />
            <span className="size-2.5 rounded-full bg-[#ffe08a]" />
            <span className="size-2.5 rounded-full bg-[#9be7c4]" />
          </div>
        </div>
        <div className="relative mx-auto grid size-[168px] place-items-center rounded-full bg-gradient-to-br from-[#4a4d63] to-[#1d1f2e] shadow-[inset_0_8px_16px_rgba(0,0,0,0.45)] sm:size-[186px]">
          <div className="grid size-[118px] place-items-center rounded-full bg-gradient-to-br from-[#6d7188] to-[#2b2d42] ring-8 ring-[#2b2d42]/30 sm:size-[132px]">
            <div className="size-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#9aa0c4,transparent_28%),radial-gradient(circle_at_60%_70%,#3a3d55,#1a1c28)] sm:size-[72px]" />
          </div>
          <div className="absolute top-5 right-7 size-4 rounded-full bg-[#7fd4ff]/70 blur-[1px]" />
        </div>
        <div className="mt-5 flex items-center justify-between px-2">
          <div className="h-8 w-16 rounded-md bg-[#2b2d42]/15" />
          <div className="grid size-11 place-items-center rounded-full bg-[#fffdf9] shadow-[var(--neu-in)]">
            <div className="size-6 rounded-full border-2 border-[#d98989]" />
          </div>
        </div>
        <p className="font-hand mt-3 text-center text-2xl text-[#2b2d42]/70">revellar</p>
      </motion.div>

      <motion.div
        className="polaroid-frame absolute top-[210px] z-10 w-[190px] rounded-[3px] px-2.5 pb-3 pt-2.5 sm:top-[230px] sm:w-[210px]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 86, opacity: 1 }}
        transition={{ delay: 0.45, type: "spring", stiffness: 70, damping: 14 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80"
          alt="Foto de um casal se abraçando"
          className="filter-vintage aspect-square w-full object-cover"
        />
        <p className="font-hand mt-2 text-center text-xl text-graphite">nós, para sempre</p>
      </motion.div>
    </div>
  );
}
