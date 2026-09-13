"use client";

import { useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import { ImagePlus, Trash2 } from "lucide-react";
import { PolaroidCard } from "@/components/polaroid-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/image";
import { PHOTO_FILTERS, type PhotoFilter, type PhotoRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type PhotoStudioProps = {
  photos: PhotoRecord[];
  busy: boolean;
  onUpload: (files: FileList | File[]) => Promise<void>;
  onUpdate: (id: string, data: { caption?: string; filter?: PhotoFilter }) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
};

export function PhotoStudio({
  photos,
  busy,
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

  async function handleFiles(list: FileList | File[] | null) {
    if (!list || list.length === 0) return;
    await onUpload(list);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={async (event) => {
            event.preventDefault();
            setDragging(false);
            await handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "neu-inset flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[#d9c4b8] px-6 py-10 text-center transition",
            dragging && "border-rose bg-blush/70"
          )}
        >
          <ImagePlus className="mb-3 size-8 text-rose" />
          <p className="font-medium text-graphite">Arraste até 12 fotos para o estúdio</p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG ou PNG. Compactamos na hora para caber no álbum.
          </p>
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

        {photos.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Nenhuma polaroid ainda. A primeira foto já muda o clima do álbum.
          </p>
        ) : (
          <Reorder.Group
            axis="x"
            values={photos.map((photo) => photo.id)}
            onReorder={onReorder}
            className="mt-6 flex gap-4 overflow-x-auto pb-3"
          >
            {photos.map((photo) => (
              <Reorder.Item key={photo.id} value={photo.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(photo.id)}
                  className={cn(
                    "rounded-sm",
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
                  />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
        {photos.length > 1 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Arraste as miniaturas para reordenar a sequência.
          </p>
        ) : null}
      </div>

      <aside className="neu-card rounded-3xl p-5">
        {selected ? (
          <div className="space-y-4">
            <PolaroidCard
              imageUrl={selected.imageUrl}
              caption={selected.caption}
              filter={selected.filter}
              size="md"
              rotate={-1}
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
                        ? "border-graphite bg-graphite text-cream"
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
