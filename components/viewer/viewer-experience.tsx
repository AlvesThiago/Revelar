"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Download, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { recordViewAction, sendReplyAction } from "@/app/actions/declarations";
import { HeartConfetti } from "@/components/heart-confetti";
import { LiveCounter } from "@/components/live-counter";
import { PolaroidCard } from "@/components/polaroid-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fadeAudio, playShutter } from "@/lib/shutter";
import { classifySoundtrack } from "@/lib/soundtrack";
import { VIEW_MODES, type PublicDeclaration, type ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROTATIONS = [-7, 4, -2, 6, -5, 3, -3, 5, -6, 2, -4, 7];

export function ViewerExperience({
  declaration,
}: {
  declaration: PublicDeclaration;
}) {
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<ViewMode>(declaration.viewMode);
  const [index, setIndex] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reply, setReply] = useState("");
  const [replyState, setReplyState] = useState("");
  const [front, setFront] = useState<string | null>(declaration.photos[0]?.id ?? null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);

  const soundtrack = classifySoundtrack(declaration.soundtrackUrl);
  const canNativeAudio =
    Boolean(declaration.soundtrackUrl) &&
    (declaration.soundtrackType === "url" || declaration.soundtrackType === "upload") &&
    soundtrack.type === "url";

  useEffect(() => {
    if (!opened) return;
    void recordViewAction(declaration.slug);
  }, [opened, declaration.slug]);

  useEffect(() => {
    if (!opened || !canNativeAudio || !audioRef.current) return;
    const audio = audioRef.current;
    audio.muted = muted;
    void audio.play().then(async () => {
      setPlaying(true);
      await fadeAudio(audio, 0, muted ? 0 : 0.72, 1800);
    }).catch(() => setPlaying(false));
  }, [opened, canNativeAudio, muted]);

  useEffect(() => {
    if (!opened || mode !== "slideshow" || declaration.photos.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % declaration.photos.length);
    }, declaration.slideshowSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [opened, mode, declaration.photos.length, declaration.slideshowSeconds]);

  useEffect(() => {
    if (!opened || declaration.revealEffect !== "camera") return;
    const timer = window.setTimeout(() => {
      setFlashKey((value) => value + 1);
      void playShutter();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [index, opened, declaration.revealEffect]);

  const current = declaration.photos[index];

  async function toggleAudio() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    await audio.play();
    setPlaying(true);
  }

  async function downloadAlbum() {
    const cards = document.querySelectorAll<HTMLElement>("[data-polaroid]");
    if (cards.length === 0) return;
    let n = 1;
    for (const card of Array.from(cards)) {
      const url = await toPng(card, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${declaration.slug}-polaroid-${n}.png`;
      link.click();
      n += 1;
    }
  }

  async function submitReply() {
    const result = await sendReplyAction(declaration.slug, reply);
    if (result.error) {
      setReplyState(result.error);
      return;
    }
    setReply("");
    setReplyState("Sua resposta foi enviada. Que lindo.");
  }

  return (
    <div className={cn("relative min-h-full overflow-hidden", `wallpaper-${declaration.wallpaper}`)}>
      {canNativeAudio ? (
        <audio ref={audioRef} src={soundtrack.embedUrl} loop preload="auto" />
      ) : null}

      <AnimatePresence>
        {!opened ? (
          <motion.div
            key="splash"
            className="relative flex min-h-dvh flex-col items-center justify-center px-4 text-center"
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <HeartConfetti />
            <motion.button
              type="button"
              onClick={() => setOpened(true)}
              className="neu-card paper-grain relative w-full max-w-md rounded-[32px] px-8 py-12"
              whileHover={{ scale: 1.02, rotate: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="mx-auto mb-6 h-24 w-40 rounded-t-[80px] border-2 border-[#d9b8a8] bg-gradient-to-b from-[#fde8e8] to-[#f3c4a8] shadow-inner" />
              <p className="font-hand text-3xl text-rose">uma carta para você</p>
              <h1 className="mt-2 text-2xl font-semibold text-graphite">
                Alguém especial te enviou uma surpresa.
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">Clique para abrir.</p>
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {opened ? (
        <div className="relative flex min-h-dvh flex-col">
          {flashKey > 0 ? (
            <div
              key={flashKey}
              className="flash-burst pointer-events-none fixed inset-0 z-50 bg-white"
            />
          ) : null}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-black/25 px-4 py-3 text-white backdrop-blur-md">
            <div className="min-w-0">
              <p className="font-hand truncate text-2xl leading-none">{declaration.coupleName}</p>
              {declaration.startDate ? <LiveCounter startDate={declaration.startDate} /> : null}
            </div>
            <div className="flex items-center gap-1">
              {canNativeAudio ? (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={() => void toggleAudio()}
                  >
                    {playing ? <Pause /> : <Play />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      setMuted((value) => !value);
                      if (audioRef.current) audioRef.current.muted = !muted;
                    }}
                  >
                    {muted ? <VolumeX /> : <Volume2 />}
                  </Button>
                </>
              ) : null}
            </div>
          </header>

          {soundtrack.type !== "url" && declaration.soundtrackUrl ? (
            <div className="sr-only">
              <iframe
                title="Trilha sonora"
                src={soundtrack.embedUrl}
                allow="autoplay; clipboard-write; encrypted-media"
                className="h-0 w-0"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-4">
            {VIEW_MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium backdrop-blur",
                  mode === item.id ? "bg-white text-graphite" : "bg-black/25 text-white"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <main className="relative flex-1 px-4 pb-10">
            {declaration.photos.length === 0 ? (
              <p className="py-20 text-center text-white">Este álbum ainda não tem fotos.</p>
            ) : null}

            {mode === "deck" && declaration.photos.length > 0 ? (
              <div ref={deckRef} className="relative mx-auto min-h-[560px] max-w-3xl">
                {declaration.photos.map((photo, photoIndex) => (
                  <motion.div
                    key={photo.id}
                    drag
                    dragConstraints={deckRef}
                    dragElastic={0.18}
                    onTap={() => {
                      setFront(photo.id);
                      setIndex(photoIndex);
                    }}
                    className="absolute left-1/2 top-10 -translate-x-1/2 cursor-grab active:cursor-grabbing"
                    style={{
                      zIndex: front === photo.id ? 30 : photoIndex + 1,
                      x: ((photoIndex % 5) - 2) * 18,
                      y: (photoIndex % 4) * 16,
                    }}
                    whileDrag={{ zIndex: 40, scale: 1.04 }}
                  >
                    <PolaroidCard
                      imageUrl={photo.imageUrl}
                      caption={photo.caption}
                      filter={photo.filter}
                      rotate={ROTATIONS[photoIndex % ROTATIONS.length]}
                      reveal={declaration.revealEffect === "polaroid" && photoIndex === index}
                      size="lg"
                    />
                  </motion.div>
                ))}
              </div>
            ) : null}

            {mode === "album" ? (
              <div className="mx-auto max-w-xl space-y-16 py-6">
                {declaration.photos.map((photo) => (
                  <motion.article
                    key={photo.id}
                    className="flex flex-col items-center"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                  >
                    <motion.div
                      style={{ y: 0 }}
                      whileInView={{ y: -12 }}
                      transition={{ duration: 0.8 }}
                    >
                      <PolaroidCard
                        imageUrl={photo.imageUrl}
                        caption={photo.caption}
                        filter={photo.filter}
                        rotate={-1.5}
                        reveal={declaration.revealEffect === "polaroid"}
                        size="lg"
                      />
                    </motion.div>
                  </motion.article>
                ))}
              </div>
            ) : null}

            {mode === "slideshow" && current ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 0.94, rotate: -3 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.04, rotate: 3 }}
                  >
                    <PolaroidCard
                      imageUrl={current.imageUrl}
                      caption={current.caption}
                      filter={current.filter}
                      reveal={declaration.revealEffect === "polaroid"}
                      size="lg"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="mt-6 flex gap-2">
                  {declaration.photos.map((photo, photoIndex) => (
                    <button
                      key={photo.id}
                      type="button"
                      aria-label={`Foto ${photoIndex + 1}`}
                      onClick={() => setIndex(photoIndex)}
                      className={cn(
                        "size-2.5 rounded-full",
                        photoIndex === index ? "bg-white" : "bg-white/40"
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </main>

          <footer className="mx-auto w-full max-w-lg px-4 pb-10">
            <div className="rounded-3xl bg-[#fffdf9]/92 p-5 shadow-2xl backdrop-blur">
              <p className="font-hand text-2xl text-rose">{declaration.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Escrever uma resposta para {declaration.replyToName}
              </p>
              <Textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Eu também lembro..."
                className="mt-3 min-h-24 font-hand text-xl"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" className="bg-graphite text-cream" onClick={() => void submitReply()}>
                  Enviar resposta
                </Button>
                <Button type="button" variant="outline" onClick={() => void downloadAlbum()}>
                  <Download />
                  Baixar polaroids
                </Button>
              </div>
              {replyState ? <p className="mt-2 text-sm text-muted-foreground">{replyState}</p> : null}
            </div>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
