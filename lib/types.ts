export type PhotoFilter = "natural" | "bw" | "sepia" | "vintage";
export type RevealEffect = "polaroid" | "camera";
export type Wallpaper = "wood" | "crumpled" | "dark" | "pink";
export type ViewMode = "deck" | "album" | "slideshow";
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
];

export const VIEW_MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: "deck", label: "Mesa", hint: "Fotos espalhadas para arrastar" },
  { id: "album", label: "Álbum", hint: "Rolagem com parallax" },
  { id: "slideshow", label: "Apresentação", hint: "Troca automática" },
];

export const FILTER_CLASS: Record<PhotoFilter, string> = {
  natural: "filter-natural",
  bw: "filter-bw",
  sepia: "filter-sepia",
  vintage: "filter-vintage",
};
