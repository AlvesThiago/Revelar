"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import {
  deletePhotoAction,
  publishDeclarationAction,
  reorderPhotosAction,
  saveDeclarationAction,
  unpublishDeclarationAction,
  updatePhotoAction,
  uploadPhotoAction,
  uploadSoundtrackAction,
  type DeclarationDraft,
} from "@/app/actions/declarations";
import { DeleteAlbumButton } from "@/components/dashboard/delete-album-button";
import { PhotoStudio, filesToCompressed } from "@/components/dashboard/photo-studio";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { formatLastSeen } from "@/lib/dates";
import { classifySoundtrack } from "@/lib/soundtrack";
import {
  REVEAL_EFFECTS,
  VIEW_MODES,
  WALLPAPERS,
  type DeclarationRecord,
  type PhotoFilter,
  type RevealEffect,
  type SoundtrackType,
  type ViewMode,
  type Wallpaper,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = [
  "Dados do casal",
  "Estúdio de fotos",
  "Revelação e tema",
  "Publicar",
];

type WizardProps = {
  initial: DeclarationRecord;
  initialStep?: number;
};

export function Wizard({ initial, initialStep = 0 }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [record, setRecord] = useState(initial);
  const [password, setPassword] = useState("");
  const [protect, setProtect] = useState(initial.hasPassword);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
    phase: "prepare" | "send";
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");

  const publicPath = `/nos/${record.slug}`;
  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return publicPath;
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);

  useEffect(() => {
    void QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 360,
      color: { dark: "#2B2D42", light: "#FFFDF9" },
    }).then((url) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = 360;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0);
        ctx.fillStyle = "#fffdf9";
        ctx.beginPath();
        ctx.arc(180, 180, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d98989";
        ctx.font = "48px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("♥", 180, 186);
        setQr(canvas.toDataURL("image/png"));
      };
    });
  }, [publicUrl]);

  function draft(): DeclarationDraft {
    return {
      coupleName: record.coupleName,
      title: record.title,
      startDate: record.startDate ? record.startDate.slice(0, 10) : "",
      soundtrackUrl: record.soundtrackUrl,
      soundtrackType: record.soundtrackType,
      soundtrackName: record.soundtrackName,
      revealEffect: record.revealEffect,
      wallpaper: record.wallpaper,
      viewMode: record.viewMode,
      slideshowSeconds: record.slideshowSeconds,
      password: protect ? password : "",
      clearPassword: !protect,
    };
  }

  async function persist() {
    setBusy(true);
    setError("");
    try {
      const result = await saveDeclarationAction(record.id, draft());
      if (result.error) {
        setError(result.error);
        return false;
      }
      if (result.slug) {
        setRecord((current) => ({ ...current, slug: result.slug }));
      }
      setStatus("Rascunho guardado");
      return true;
    } catch {
      setError("Não deu para guardar agora. Você pode seguir e tentar de novo.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function go(next: number) {
    const clamped = Math.min(3, Math.max(0, next));
    setStep(clamped);
    const url = new URL(window.location.href);
    url.searchParams.set("passo", String(clamped + 1));
    window.history.replaceState(null, "", url.pathname + url.search);
    void persist();
  }

  async function handleUpload(list: FileList | File[]) {
    const remaining = 12 - record.photos.length;
    const incoming = Array.from(list)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining);
    if (incoming.length === 0) return;

    setBusy(true);
    setError("");
    setUploadProgress({ done: 0, total: incoming.length, phase: "prepare" });
    try {
      const files = await filesToCompressed(incoming);
      for (const [index, file] of files.entries()) {
        setUploadProgress({ done: index, total: files.length, phase: "send" });
        const form = new FormData();
        form.set("declarationId", record.id);
        form.set("file", file);
        const result = await uploadPhotoAction(form);
        if (result.error) {
          setError(result.error);
          break;
        }
        if (result.id && result.imageUrl) {
          setRecord((current) => ({
            ...current,
            photos: [
              ...current.photos,
              {
                id: result.id!,
                declarationId: current.id,
                sortOrder: current.photos.length,
                imageUrl: result.imageUrl!,
                caption: "",
                filter: "natural",
              },
            ],
          }));
        }
        setUploadProgress({ done: index + 1, total: files.length, phase: "send" });
      }
    } catch {
      setError("Não foi possível enviar a foto agora. Tente de novo.");
    } finally {
      setBusy(false);
      setUploadProgress(null);
      router.refresh();
    }
  }

  async function handlePhotoUpdate(id: string, data: { caption?: string; filter?: PhotoFilter }) {
    setRecord((current) => ({
      ...current,
      photos: current.photos.map((photo) =>
        photo.id === id ? { ...photo, ...data } : photo
      ),
    }));
    await updatePhotoAction(id, data);
  }

  async function handleDelete(id: string) {
    setRecord((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.id !== id),
    }));
    await deletePhotoAction(id);
  }

  async function handleReorder(ids: string[]) {
    setRecord((current) => ({
      ...current,
      photos: ids
        .map((id, index) => {
          const photo = current.photos.find((item) => item.id === id);
          return photo ? { ...photo, sortOrder: index } : null;
        })
        .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo)),
    }));
    await reorderPhotosAction(record.id, ids);
  }

  async function handleSoundtrackFile(file: File) {
    const form = new FormData();
    form.set("declarationId", record.id);
    form.set("file", file);
    setBusy(true);
    const result = await uploadSoundtrackAction(form);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRecord((current) => ({
      ...current,
      soundtrackUrl: result.url ?? current.soundtrackUrl,
      soundtrackType: "upload",
      soundtrackName: result.name ?? file.name,
    }));
  }

  async function publish() {
    const saved = await persist();
    if (!saved) return;
    setBusy(true);
    try {
      const result = await publishDeclarationAction(record.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setRecord((current) => ({
        ...current,
        published: true,
        slug: result.slug ?? current.slug,
      }));
      setStatus("A declaração está no ar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="font-hand text-2xl text-rose">estúdio</p>
        <h1 className="text-3xl font-semibold text-graphite">
          {record.coupleName || "Nova declaração"}
        </h1>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-4" />
        <ol className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {STEPS.map((label, index) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => go(index)}
                className={cn(
                  "w-full rounded-full px-3 py-1.5 text-center",
                  index === step ? "btn-love border-0" : "bg-blush text-graphite"
                )}
              >
                {index + 1}. {label}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {step === 0 ? (
        <section className="neu-card grid gap-5 rounded-3xl p-6 sm:grid-cols-2">
          <Field
            label="Nome do casal"
            value={record.coupleName}
            placeholder="Gabriel & Amanda"
            onChange={(value) => setRecord((current) => ({ ...current, coupleName: value }))}
          />
          <Field
            label="Título principal"
            value={record.title}
            placeholder="Nosso primeiro ano de muitos"
            onChange={(value) => setRecord((current) => ({ ...current, title: value }))}
          />
          <Field
            label="Data de início do relacionamento"
            type="date"
            value={record.startDate ? record.startDate.slice(0, 10) : ""}
            onChange={(value) =>
              setRecord((current) => ({
                ...current,
                startDate: value ? new Date(`${value}T12:00:00`).toISOString() : null,
              }))
            }
          />
          <Field
            label="Nome da trilha"
            value={record.soundtrackName}
            placeholder="A música de vocês"
            onChange={(value) => setRecord((current) => ({ ...current, soundtrackName: value }))}
          />
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="soundtrack">Trilha sonora (Spotify, YouTube ou MP3)</Label>
            <Input
              id="soundtrack"
              className="neu-inset h-11"
              placeholder="https://open.spotify.com/track/... ou um link de MP3"
              value={record.soundtrackUrl}
              onChange={(event) => {
                const soundtrackUrl = event.target.value;
                const classified = classifySoundtrack(soundtrackUrl);
                setRecord((current) => ({
                  ...current,
                  soundtrackUrl,
                  soundtrackType: classified.type as SoundtrackType,
                }));
              }}
            />
            <label className="mt-2 inline-flex cursor-pointer text-sm text-graphite underline">
              {busy ? "Enviando áudio..." : "ou enviar um MP3"}
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/*"
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleSoundtrackFile(file);
                }}
              />
            </label>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <PhotoStudio
          photos={record.photos}
          busy={busy}
          uploading={uploadProgress}
          onUpload={handleUpload}
          onUpdate={handlePhotoUpdate}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      ) : null}

      {step === 2 ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="neu-card space-y-4 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Efeito ao abrir o link</h2>
            {REVEAL_EFFECTS.map((effect) => (
              <Choice
                key={effect.id}
                active={record.revealEffect === effect.id}
                title={effect.title}
                text={effect.text}
                onClick={() =>
                  setRecord((current) => ({ ...current, revealEffect: effect.id as RevealEffect }))
                }
              />
            ))}
            <h2 className="pt-2 text-lg font-semibold">Modo de exibição</h2>
            <div className="grid gap-2">
              {VIEW_MODES.map((mode) => (
                <Choice
                  key={mode.id}
                  active={record.viewMode === mode.id}
                  title={mode.label}
                  text={mode.hint}
                  onClick={() => setRecord((current) => ({ ...current, viewMode: mode.id as ViewMode }))}
                />
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seconds">Tempo do slideshow (segundos)</Label>
              <Input
                id="seconds"
                type="number"
                min={3}
                max={20}
                className="neu-inset h-11"
                value={record.slideshowSeconds}
                onChange={(event) =>
                  setRecord((current) => ({
                    ...current,
                    slideshowSeconds: Number(event.target.value) || 5,
                  }))
                }
              />
            </div>
          </div>
          <div className="neu-card space-y-4 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Papel de parede</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {WALLPAPERS.map((paper) => (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => setRecord((current) => ({ ...current, wallpaper: paper.id as Wallpaper }))}
                  className={cn(
                    "overflow-hidden rounded-2xl border-2 text-left",
                    record.wallpaper === paper.id ? "border-graphite" : "border-transparent"
                  )}
                >
                  <div className={cn("h-20", `wallpaper-${paper.id}`)} />
                  <p className="bg-cream px-3 py-2 text-sm">{paper.label}</p>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-blush/70 px-4 py-3">
              <div>
                <p className="font-medium">Proteger com senha</p>
                <p className="text-xs text-muted-foreground">
                  Use pelo menos 6 caracteres. A data em que se conheceram funciona bem.
                </p>
              </div>
              <Switch checked={protect} onCheckedChange={setProtect} />
            </div>
            {protect ? (
              <Field
                label="Senha do envelope"
                type="password"
                value={password}
                placeholder={record.hasPassword ? "Deixe em branco para manter" : "ex: 14032024"}
                onChange={setPassword}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="neu-card space-y-4 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Link exclusivo</h2>
            <p className="break-all rounded-2xl bg-blush/60 px-4 py-3 text-sm">{publicUrl}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(publicUrl);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copiado" : "Copiar link"}
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Alguém especial te enviou uma surpresa: ${publicUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants(), "btn-love border-0")}
              >
                <Share2 />
                Enviar no WhatsApp
              </a>
              {record.published ? (
                <Link href={publicPath} className={cn(buttonVariants({ variant: "outline" }))}>
                  Abrir como o destinatário
                </Link>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" className="btn-love border-0" disabled={busy} onClick={() => void publish()}>
                {record.published ? "Atualizar publicação" : "Publicar declaração"}
              </Button>
              {record.published ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await unpublishDeclarationAction(record.id);
                    setRecord((current) => ({ ...current, published: false }));
                  }}
                >
                  Despublicar
                </Button>
              ) : null}
              <DeleteAlbumButton id={record.id} name={record.coupleName || record.title} />
            </div>
          </div>
          <div className="neu-card space-y-4 rounded-3xl p-6">
            <h2 className="text-lg font-semibold">QR code com coração</h2>
            {qr ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR code da declaração" className="w-48 rounded-xl bg-cream p-2" />
                <a href={qr} download={`${record.slug}-qr.png`} className={cn(buttonVariants({ variant: "outline" }))}>
                  <QrCode />
                  Baixar QR
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Gerando o QR com o coração no centro...</p>
            )}
            <div className="rounded-2xl bg-blush/50 p-4 text-sm">
              <p className="font-medium">{formatLastSeen(record.lastViewedAt)}</p>
              <p className="mt-1 text-muted-foreground">
                {record.viewCount} {record.viewCount === 1 ? "abertura" : "aberturas"} do link
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Respostas recebidas</h3>
                <Link href="/dashboard/respostas" className="text-xs text-rose hover:underline">
                  Ver todas
                </Link>
              </div>
              {record.replies.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Ainda não chegou nenhuma mensagem de volta.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {record.replies.map((reply) => (
                    <li key={reply.id} className="rounded-xl bg-cream px-3 py-2 text-sm">
                      <p className="font-hand text-xl">{reply.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
        <button
          type="button"
          disabled={step === 0 || busy}
          onClick={() => go(step - 1)}
          className={cn(buttonVariants({ variant: "ghost" }), step === 0 && "opacity-40")}
        >
          Voltar
        </button>
        <div className="flex items-center gap-3">
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {step < 3 ? (
            <button
              type="button"
              className={cn(buttonVariants(), "btn-love border-0")}
              disabled={busy}
              onClick={() => go(step + 1)}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              className={cn(buttonVariants({ variant: "outline" }))}
              disabled={busy}
              onClick={() => void persist()}
            >
              Salvar rascunho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        className="neu-inset h-11"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Choice({
  active,
  title,
  text,
  onClick,
}: {
  active: boolean;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border px-4 py-3 text-left",
        active ? "border-graphite bg-blush/80" : "border-[#ead9d0] bg-cream"
      )}
    >
      <p className="font-medium text-graphite">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </button>
  );
}
