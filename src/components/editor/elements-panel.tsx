"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

interface ElementsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// SVG paths for social/media elements
const ELEMENTS = [
  {
    category: "Social Media",
    items: [
      {
        id: "play-btn",
        label: "Play",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#FF0000"/><polygon points="38,28 38,72 76,50" fill="white"/></svg>`,
      },
      {
        id: "subscribe",
        label: "Subscribe",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><rect width="200" height="60" rx="8" fill="#FF0000"/><text x="100" y="38" font-family="Arial" font-size="22" font-weight="bold" fill="white" text-anchor="middle">SUBSCRIBE</text></svg>`,
      },
      {
        id: "like",
        label: "Like",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 85 L15 55 A25 25 0 0 1 50 20 A25 25 0 0 1 85 55 Z" fill="#e53e3e"/></svg>`,
      },
      {
        id: "notification",
        label: "Notif.",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 C30 10 20 25 20 40 L20 65 L10 75 L90 75 L80 65 L80 40 C80 25 70 10 50 10Z" fill="#fbbf24"/><circle cx="50" cy="85" r="8" fill="#fbbf24"/></svg>`,
      },
      {
        id: "camera",
        label: "Camera",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80"><rect x="5" y="20" width="90" height="55" rx="8" fill="#1a1a1a"/><circle cx="50" cy="47" r="18" fill="none" stroke="white" stroke-width="4"/><circle cx="50" cy="47" r="10" fill="white"/><rect x="35" y="10" width="30" height="15" rx="4" fill="#1a1a1a"/></svg>`,
      },
      {
        id: "views",
        label: "Visualiz.",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M10 30 Q50 5 90 30 Q50 55 10 30Z" fill="none" stroke="white" stroke-width="4"/><circle cx="50" cy="30" r="12" fill="white"/><circle cx="50" cy="30" r="6" fill="#333"/></svg>`,
      },
    ],
  },
  {
    category: "Badges",
    items: [
      {
        id: "new-badge",
        label: "NOVO",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50"><rect width="120" height="50" rx="25" fill="#22c55e"/><text x="60" y="33" font-family="Arial" font-size="20" font-weight="900" fill="white" text-anchor="middle">NOVO</text></svg>`,
      },
      {
        id: "hot-badge",
        label: "HOT",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect width="100" height="50" rx="25" fill="#ef4444"/><text x="50" y="33" font-family="Arial" font-size="20" font-weight="900" fill="white" text-anchor="middle">🔥 HOT</text></svg>`,
      },
      {
        id: "top-badge",
        label: "TOP",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><polygon points="50,5 95,45 5,45" fill="#f59e0b"/><text x="50" y="38" font-family="Arial" font-size="16" font-weight="900" fill="white" text-anchor="middle">TOP</text></svg>`,
      },
      {
        id: "live",
        label: "AO VIVO",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 50"><rect width="150" height="50" rx="6" fill="#ef4444"/><circle cx="22" cy="25" r="8" fill="white"/><text x="80" y="33" font-family="Arial" font-size="18" font-weight="900" fill="white" text-anchor="middle">AO VIVO</text></svg>`,
      },
      {
        id: "star-badge",
        label: "★ Destaque",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50"><rect width="160" height="50" rx="6" fill="#7c3aed"/><text x="80" y="33" font-family="Arial" font-size="18" font-weight="900" fill="white" text-anchor="middle">★ DESTAQUE</text></svg>`,
      },
      {
        id: "exclusive",
        label: "Exclusivo",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50"><rect width="160" height="50" rx="0" fill="none" stroke="#f59e0b" stroke-width="3"/><text x="80" y="33" font-family="Arial" font-size="16" font-weight="900" fill="#f59e0b" text-anchor="middle">EXCLUSIVO</text></svg>`,
      },
    ],
  },
  {
    category: "Formas Decorativas",
    items: [
      {
        id: "burst",
        label: "Explosão",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#f59e0b"/></svg>`,
      },
      {
        id: "speech-bubble",
        label: "Balão",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100"><rect x="5" y="5" width="110" height="70" rx="12" fill="#6366f1"/><polygon points="20,75 40,75 25,95" fill="#6366f1"/></svg>`,
      },
      {
        id: "checkmark",
        label: "Check ✓",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#22c55e"/><polyline points="25,50 43,68 75,32" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      },
      {
        id: "warning",
        label: "Atenção",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><polygon points="50,5 95,85 5,85" fill="#f59e0b"/><text x="50" y="72" font-family="Arial" font-size="48" font-weight="900" fill="white" text-anchor="middle">!</text></svg>`,
      },
      {
        id: "number-1",
        label: "#1",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#f59e0b"/><text x="50" y="62" font-family="Arial" font-size="30" font-weight="900" fill="white" text-anchor="middle">#1</text></svg>`,
      },
      {
        id: "ribbon",
        label: "Faixa",
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50"><polygon points="0,0 150,0 160,25 150,50 0,50 10,25" fill="#ef4444"/></svg>`,
      },
    ],
  },
];

export function ElementsPanel({ fabricCanvas }: ElementsPanelProps) {
  const [search, setSearch] = useState("");

  const addElement = useCallback(
    async (svgString: string, label: string) => {
      if (!fabricCanvas) return;
      const { fabric } = await import("fabric");
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      fabric.loadSVGFromURL(url, (objects, options) => {
        const group = fabric.util.groupSVGElements(objects, options);
        const maxSize = 200;
        const scale = Math.min(maxSize / (group.width ?? 1), maxSize / (group.height ?? 1));
        group.set({
          left: fabricCanvas.getWidth() / 2 - (group.width ?? 0) * scale / 2,
          top: fabricCanvas.getHeight() / 2 - (group.height ?? 0) * scale / 2,
          scaleX: scale,
          scaleY: scale,
        });
        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
        fabricCanvas.requestRenderAll();
        URL.revokeObjectURL(url);
        toast.success(`${label} adicionado`);
      });
    },
    [fabricCanvas]
  );

  const filteredCategories = ELEMENTS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        cat.category.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="flex flex-col gap-3 pt-2">
      <h3 className="text-sm font-semibold text-foreground">Elementos</h3>

      <input
        type="text"
        placeholder="Buscar elementos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground w-full"
      />

      {filteredCategories.map((cat) => (
        <div key={cat.category} className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {cat.category}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {cat.items.map((item) => (
              <button
                key={item.id}
                onClick={() => addElement(item.svg, item.label)}
                disabled={!fabricCanvas}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={item.label}
              >
                <div
                  className="w-10 h-8 flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: item.svg }}
                />
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
