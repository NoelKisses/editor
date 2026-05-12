"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

interface IconsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const ICONS: { id: string; label: string; path: string; viewBox: string }[] = [
  // Social
  { id: "play", label: "Play", viewBox: "0 0 24 24", path: "M8 5v14l11-7z" },
  { id: "like", label: "Curtir", viewBox: "0 0 24 24", path: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" },
  { id: "comment", label: "Comentário", viewBox: "0 0 24 24", path: "M21 6.5C21 5.12 19.88 4 18.5 4h-13C4.12 4 3 5.12 3 6.5v8C3 15.88 4.12 17 5.5 17H7v3.5l3.5-3.5h8c1.38 0 2.5-1.12 2.5-2.5v-8z" },
  { id: "share", label: "Compartilhar", viewBox: "0 0 24 24", path: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" },
  { id: "bell", label: "Sino", viewBox: "0 0 24 24", path: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" },
  { id: "subscribe", label: "Inscrever", viewBox: "0 0 24 24", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
  // UI
  { id: "home", label: "Home", viewBox: "0 0 24 24", path: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
  { id: "search", label: "Busca", viewBox: "0 0 24 24", path: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" },
  { id: "settings", label: "Config", viewBox: "0 0 24 24", path: "M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" },
  { id: "menu", label: "Menu", viewBox: "0 0 24 24", path: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" },
  { id: "close", label: "Fechar", viewBox: "0 0 24 24", path: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" },
  { id: "check", label: "Check", viewBox: "0 0 24 24", path: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" },
  // Mídia
  { id: "camera", label: "Câmera", viewBox: "0 0 24 24", path: "M12 15.2A3.2 3.2 0 0 1 8.8 12 3.2 3.2 0 0 1 12 8.8 3.2 3.2 0 0 1 15.2 12 3.2 3.2 0 0 1 12 15.2M20 4h-3.17L15 2H9L7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" },
  { id: "video", label: "Vídeo", viewBox: "0 0 24 24", path: "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" },
  { id: "mic", label: "Mic", viewBox: "0 0 24 24", path: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" },
  { id: "headphones", label: "Fone", viewBox: "0 0 24 24", path: "M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" },
  // Negócios
  { id: "star-solid", label: "Estrela", viewBox: "0 0 24 24", path: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" },
  { id: "trophy", label: "Troféu", viewBox: "0 0 24 24", path: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" },
  { id: "fire", label: "Fogo", viewBox: "0 0 24 24", path: "M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" },
  { id: "lightning", label: "Raio", viewBox: "0 0 24 24", path: "M7 2v11h3v9l7-12h-4l4-8z" },
  { id: "crown", label: "Coroa", viewBox: "0 0 24 24", path: "M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" },
  { id: "diamond-solid", label: "Diamante", viewBox: "0 0 24 24", path: "M19 3H5L2 9l10 13L22 9l-3-6zm-9 2h4l2 3H8l2-3z" },
  // Localização
  { id: "location", label: "Local", viewBox: "0 0 24 24", path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" },
  // Pessoas
  { id: "person", label: "Pessoa", viewBox: "0 0 24 24", path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" },
  { id: "group", label: "Grupo", viewBox: "0 0 24 24", path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
];

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "social", label: "Social" },
  { id: "ui", label: "UI" },
  { id: "media", label: "Mídia" },
  { id: "business", label: "Negócios" },
];

const ICON_CATEGORY_MAP: Record<string, string> = {
  play: "social", like: "social", comment: "social", share: "social",
  bell: "social", subscribe: "social",
  home: "ui", search: "ui", settings: "ui", menu: "ui", close: "ui", check: "ui",
  camera: "media", video: "media", mic: "media", headphones: "media",
  "star-solid": "business", trophy: "business", fire: "business",
  lightning: "business", crown: "business", "diamond-solid": "business",
  location: "business", person: "business", group: "business",
};

export function IconsPanel({ fabricCanvas }: IconsPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = ICONS.filter((icon) => {
    const matchesQuery = icon.label.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || ICON_CATEGORY_MAP[icon.id] === category;
    return matchesQuery && matchesCategory;
  });

  const addIcon = useCallback(
    async (icon: (typeof ICONS)[number]) => {
      if (!fabricCanvas) return;
      const { fabric } = await import("fabric");

      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}"><path d="${icon.path}" fill="#6366f1"/></svg>`;

      fabric.loadSVGFromString(svgString, (objects, options) => {
        const group = fabric.util.groupSVGElements(objects, options);
        const cx = fabricCanvas.getWidth() / 2;
        const cy = fabricCanvas.getHeight() / 2;
        group.set({
          left: cx - 40,
          top: cy - 40,
          scaleX: 80 / (group.width || 80),
          scaleY: 80 / (group.height || 80),
        });
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
        fabricCanvas.requestRenderAll();
        toast.success(`Ícone "${icon.label}" adicionado`);
      });
    },
    [fabricCanvas]
  );

  return (
    <div className="flex flex-col gap-3 pt-2 px-3 pb-3">
      <h3 className="text-sm font-semibold text-foreground">Ícones</h3>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ícone..."
          className="w-full pl-7 pr-3 py-1.5 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary/60"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              category === cat.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {filtered.map((icon) => (
          <button
            key={icon.id}
            onClick={() => addIcon(icon)}
            disabled={!fabricCanvas}
            className="flex flex-col items-center gap-1 p-2 rounded border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            title={icon.label}
          >
            <svg viewBox={icon.viewBox} className="w-6 h-6 fill-current">
              <path d={icon.path} />
            </svg>
            <span className="text-[9px] truncate w-full text-center">{icon.label}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-4 text-xs text-muted-foreground text-center py-4">Nenhum ícone encontrado</p>
        )}
      </div>
    </div>
  );
}
