"use client";

import { useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { PolaroidCard } from "@/components/polaroid-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/image";
import { PHOTO_FILTERS, type PhotoFilter, type PhotoRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export type PhotoUploadProgress = {
  done: number;
  total: number;
  phase: "prepare" | "send";
};

type PhotoStudioProps = {
  photos: PhotoRecord[];
  busy: boolean;
  uploading?: PhotoUploadProgress | null;
  onUpload: (files: FileList | File[]) => Promise<void>;
  onUpdate: (id: string, data: { caption?: string; filter?: PhotoFilter }) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
};

export function PhotoStudio({
  photos,
  busy,
  uploading = null,
  onUpload,
  onUpdate,
  onDelete,
  onReorder,
}: PhotoStudioProps) {
  const [selectedId, setSelectedId] = useState<string | null>(photos[0]?.id ?? null);
  const [dragging, setDragging] = useState(false);
  const selected = useMemo(
    () => photos.find((photo) => photo.id === selectedId) ?? photos[0] ?? null,
    [photos, selectedId]
  );
  const pendingCount = uploading ? Math.max(0, uploading.total - uploading.done) : 0;
  const uploadLabel = !uploading
    ? ""
    : uploading.phase === "prepare"
      ? uploading.total === 1
        ? "Preparando sua foto..."
        : `Preparando ${uploading.total} fotos...`
      : uploading.total === 1
        ? "Revelando a polaroid..."
        : `Revelando ${Math.min(uploading.done + 1, uploading.total)} de ${uploading.total}...`;

  async function handleFiles(list: FileList | File[] | null) {
    if (!list || list.length === 0 || busy) return;
    await onUpload(list);
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
      <div className="min-w-0">
        <label
          aria-busy={Boolean(uploading)}
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={async (event) => {
            event.preventDefault();
            setDragging(false);
            await handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "neu-inset relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-[#d9c4b8] px-6 py-10 text-center transition",
            dragging && "border-rose bg-blush/70",
            (busy || photos.length >= 12) && "cursor-wait"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center" role="status" aria-live="polite">
              <Loader2 className="mb-3 size-8 animate-spin text-rose" />
              <p className="font-hand text-2xl text-rose">{uploadLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Isso pode levar alguns segundos. Não feche esta página.
              </p>
              {uploading.total > 1 ? (
                <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-[#ead9d0]">
                  <div
                    className="h-full rounded-full bg-rose transition-all duration-300"
                    style={{
                      width: `${Math.round((uploading.done / uploading.total) * 100)}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <ImagePlus className="mb-3 size-8 text-rose" />
              <p className="font-medium text-graphite">Arraste até 12 fotos para o estúdio</p>
              <p className="mt-1 text-sm text-muted-foreground">
                JPG ou PNG. Compactamos na hora para caber no álbum.
                {photos.length > 0 ? ` ${photos.length}/12 no álbum.` : ""}
              </p>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy || photos.length >= 12}
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        {photos.length === 0 && pendingCount === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nenhuma polaroid ainda. A primeira foto já muda o clima do álbum.
          </p>
        ) : (
          <Reorder.Group
            axis="x"
            values={photos.map((photo) => photo.id)}
            onReorder={onReorder}
            className="mt-6 flex flex-wrap content-start gap-3"
          >
            {photos.map((photo) => (
              <Reorder.Item
                key={photo.id}
                value={photo.id}
                className="w-[calc(50%-0.375rem)] min-w-0 sm:w-[calc(33.333%-0.5rem)] xl:w-[calc(25%-0.5625rem)]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(photo.id)}
                  className={cn(
                    "block w-full rounded-sm",
                    selected?.id === photo.id && "ring-2 ring-rose ring-offset-4 ring-offset-cream"
                  )}
                >
                  <PolaroidCard
                    imageUrl={photo.imageUrl}
                    caption={photo.caption}
                    filter={photo.filter}
                    size="sm"
                    rotate={0}
                    interactive={false}
                    className="mx-auto"
                  />
                </button>
              </Reorder.Item>
            ))}
            {Array.from({ length: pendingCount }).map((_, index) => (
              <div
                key={`pending-${index}`}
                className="w-[calc(50%-0.375rem)] min-w-0 sm:w-[calc(33.333%-0.5rem)] xl:w-[calc(25%-0.5625rem)]"
              >
                <figure className="polaroid-frame mx-auto flex w-full max-w-[230px] flex-col rounded-[4px] px-3 pt-3 pb-4">
                  <div className="relative aspect-square overflow-hidden bg-[#efe6dc]">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-blush via-[#efe6dc] to-peach/50" />
                    <Loader2 className="absolute inset-0 m-auto size-7 animate-spin text-rose" />
                  </div>
                  <figcaption className="font-hand mt-3 min-h-10 text-center text-[1.35rem] leading-snug text-rose">
                    revelando...
                  </figcaption>
                </figure>
              </div>
            ))}
          </Reorder.Group>
        )}
        {photos.length > 1 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Arraste as miniaturas para reordenar a sequência.
          </p>
        ) : null}
      </div>

      <aside className="neu-card min-w-0 self-start rounded-3xl p-5 lg:sticky lg:top-24">
        {selected ? (
          <div className="space-y-4">
            <PolaroidCard
              imageUrl={selected.imageUrl}
              caption={selected.caption}
              filter={selected.filter}
              size="md"
              rotate={0}
              interactive={false}
              className="mx-auto"
            />
            <div className="space-y-1.5">
              <Label htmlFor="caption">Declaração desta foto</Label>
              <Textarea
                id="caption"
                value={selected.caption}
                className="neu-inset min-h-24 font-hand text-xl"
                placeholder="O que esta memória ainda diz?"
                onChange={(event) => onUpdate(selected.id, { caption: event.target.value })}
              />
            </div>
            <div>
              <Label>Filtro retrô</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {PHOTO_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => onUpdate(selected.id, { filter: filter.id })}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      selected.filter === filter.id
                        ? "btn-love border-0"
                        : "border-[#ead9d0] bg-cream"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={busy}
              onClick={() => onDelete(selected.id)}
            >
              <Trash2 />
              Remover esta polaroid
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Selecione uma foto para escrever a carta e escolher o filtro.
          </p>
        )}
      </aside>
    </div>
  );
}

export async function filesToCompressed(list: FileList | File[]) {
  const files = Array.from(list).filter((file) => file.type.startsWith("image/"));
  return Promise.all(files.map((file) => compressImage(file)));
}
