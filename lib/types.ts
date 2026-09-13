export type PhotoFilter = "natural" | "bw" | "sepia" | "vintage";
export type RevealEffect = "polaroid" | "camera" | "hearts" | "fade" | "letter";
export type Wallpaper =
  | "wood"
  | "crumpled"
  | "dark"
  | "pink"
  | "linen"
  | "night"
  | "garden"
  | "film"
  | "ocean"
  | "gold";
export type ViewMode = "deck" | "album" | "slideshow" | "board";
export type SoundtrackType = "url" | "upload" | "spotify" | "youtube";

export type PhotoRecord = {
  id: string;
  declarationId: string;
  sortOrder: number;
  imageUrl: string;
  caption: string;
  filter: PhotoFilter;
};

export type ReplyRecord = {
  id: string;
  declarationId: string;
  message: string;
  createdAt: string;
};

export type DeclarationRecord = {
  id: string;
  userId: string;
  slug: string;
  coupleName: string;
  title: string;
  startDate: string | null;
  soundtrackUrl: string;
  soundtrackType: SoundtrackType;
  soundtrackName: string;
  revealEffect: RevealEffect;
  wallpaper: Wallpaper;
  viewMode: ViewMode;
  slideshowSeconds: number;
  hasPassword: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  lastViewedAt: string | null;
  viewCount: number;
  photos: PhotoRecord[];
  replies: ReplyRecord[];
};

export type PublicDeclaration = Omit<DeclarationRecord, "userId" | "replies"> & {
  replyToName: string;
};

export const PHOTO_FILTERS: { id: PhotoFilter; label: string }[] = [
  { id: "natural", label: "Cores naturais" },
  { id: "bw", label: "P&B" },
  { id: "sepia", label: "Sépia" },
  { id: "vintage", label: "Vintage" },
];

export const WALLPAPERS: { id: Wallpaper; label: string }[] = [
  { id: "wood", label: "Textura de madeira" },
  { id: "crumpled", label: "Papel amassado" },
  { id: "dark", label: "Minimalista escuro" },
  { id: "pink", label: "Rosa suave" },
  { id: "linen", label: "Linho claro" },
  { id: "night", label: "Céu noturno" },
  { id: "garden", label: "Jardim" },
  { id: "film", label: "Cinema" },
  { id: "ocean", label: "Mar" },
  { id: "gold", label: "Dourado vintage" },
];

export const REVEAL_EFFECTS: { id: RevealEffect; title: string; text: string }[] = [
  {
    id: "polaroid",
    title: "Revelação Polaroid",
    text: "A foto nasce branca e desfocada, como um papel instantâneo.",
  },
  {
    id: "camera",
    title: "Flash da câmera",
    text: "Um flash e o clique do obturador a cada troca de foto.",
  },
  {
    id: "hearts",
    title: "Chuva de corações",
    text: "Corações caem pela tela quando o envelope abre.",
  },
  {
    id: "fade",
    title: "Surgir suave",
    text: "As memórias aparecem devagar, como um suspiro.",
  },
  {
    id: "letter",
    title: "Carta que se abre",
    text: "A polaroid sobe de um papel dobrado, como uma carta.",
  },
];

export const VIEW_MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: "deck", label: "Mesa", hint: "Fotos espalhadas para arrastar" },
  { id: "album", label: "Álbum", hint: "Rolagem com parallax" },
  { id: "slideshow", label: "Apresentação", hint: "Troca automática" },
  { id: "board", label: "Quadro", hint: "Um pôster com todas as fotos para baixar" },
];

export const FILTER_CLASS: Record<PhotoFilter, string> = {
  natural: "filter-natural",
  bw: "filter-bw",
  sepia: "filter-sepia",
  vintage: "filter-vintage",
};
