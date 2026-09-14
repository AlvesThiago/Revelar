"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markRepliesReadAction } from "@/app/actions/declarations";
import { formatWhen } from "@/lib/dates";
import type { ReplyNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ReplyInbox({ items }: { items: ReplyNotification[] }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(() => items.filter((item) => !item.readAt).length);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const preview = items.slice(0, 6);

  useEffect(() => {
    setUnread(items.filter((item) => !item.readAt).length);
  }, [items]);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      await markRepliesReadAction();
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        className="relative inline-flex size-10 items-center justify-center rounded-full text-graphite transition hover:bg-blush/70"
        aria-label={unread > 0 ? `${unread} respostas novas` : "Respostas"}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#ead9d0] bg-[#fffdf9] p-3 shadow-xl">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="font-medium text-graphite">Respostas</p>
            <Link
              href="/dashboard/respostas"
              className="text-xs text-rose hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver todas
            </Link>
          </div>

          {preview.length === 0 ? (
            <p className="mt-3 px-1 text-sm text-muted-foreground">
              Ainda não chegou nenhuma mensagem de volta.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {preview.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/dashboard/respostas"
                    onClick={() => setOpen(false)}
                    className="block rounded-xl bg-blush/50 px-3 py-2.5 transition hover:bg-blush"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-graphite">
                        {item.coupleName || "Seu álbum"}
                      </p>
                      <p className="shrink-0 text-[11px] text-muted-foreground">
                        {formatWhen(item.createdAt)}
                      </p>
                    </div>
                    <p className="font-hand mt-1 line-clamp-2 text-lg leading-tight text-graphite">
                      {item.message}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ReplyReader() {
  useEffect(() => {
    void markRepliesReadAction();
  }, []);
  return null;
}

export function ReplyBanner({
  unread,
  className,
}: {
  unread: number;
  className?: string;
}) {
  if (unread <= 0) return null;

  return (
    <Link
      href="/dashboard/respostas"
      className={cn(
        "neu-card flex items-center justify-between gap-3 rounded-3xl px-5 py-4",
        className
      )}
    >
      <div>
        <p className="font-hand text-2xl leading-none text-rose">você tem recados</p>
        <p className="mt-1 text-sm text-graphite">
          {unread === 1
            ? "1 resposta nova esperando por você."
            : `${unread} respostas novas esperando por você.`}
        </p>
      </div>
      <span className="rounded-full bg-rose px-3 py-1 text-sm font-medium text-white">
        Ver
      </span>
    </Link>
  );
}
