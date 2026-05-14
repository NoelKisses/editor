"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFabric = any;

interface ObjectStickerPackPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type CategoryKey = keyof typeof STICKER_CATEGORIES;

const STICKER_CATEGORIES = {
  expressoes: ["😄","😍","🤩","😎","🥳","🤔","😱","🎉","💯","🔥","💥","⚡","🌟","✨","💫"],
  natureza:   ["🌿","🌸","🌺","🍀","🌊","☀️","🌙","⭐","❄️","🌈","🦋","🌻","🍃","🌴","🎋"],
  objetos:    ["🎨","🎭","🎬","📷","🎵","🎮","💎","🏆","🎯","🚀","💡","🔑","📌","🎁","🎪"],
  simbolos:   ["✨","⚡","💥","❤️","💙","💚","💛","💜","🖤","🤍","♾️","✅","❌","⭕","🔆"],
  formas:     ["⭐","💠","🔷","🔶","🔵","🟢","🔴","🟡","🟣","⚫","⬛","🔲","🔳","▪️","▫️"],
  social:     ["🔥","💯","📣","🎤","📱","💻","🌐","📊","📈","🔔","📢","💬","🗨️","📝","✍️"],
} as const;

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  expressoes: "Expressões",
  natureza:   "Natureza",
  objetos:    "Objetos",
  simbolos:   "Símbolos",
  formas:     "Formas",
  social:     "Social",
};

const CATEGORY_ICONS: Record<CategoryKey, string> = {
  expressoes: "😄",
  natureza:   "🌿",
  objetos:    "🎨",
  simbolos:   "✨",
  formas:     "⭐",
  social:     "🔥",
};

const CATEGORY_KEYS = Object.keys(STICKER_CATEGORIES) as CategoryKey[];

function getAllStickers(): string[] {
  return CATEGORY_KEYS.flatMap((key) => [...STICKER_CATEGORIES[key]]);
}

function filterStickers(query: string, category: CategoryKey): string[] {
  const q = query.trim().toLowerCase();
  const source = q
    ? getAllStickers().filter((s) => s.includes(query.trim()))
    : [...STICKER_CATEGORIES[category]];
  return source;
}

function getCanvasCenter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any
): { x: number; y: number } {
  const w: number = canvas.getWidth?.() ?? 800;
  const h: number = canvas.getHeight?.() ?? 600;
  return { x: w / 2, y: h / 2 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertStickerOnCanvas(canvas: any, emoji: string, fontSize: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = await import("fabric").then((mod) => { const f = mod.fabric as any; return f; });
  const { x, y } = getCanvasCenter(canvas);

  const text = new m.IText(emoji, {
    left: x,
    top: y,
    fontSize,
    originX: "center",
    originY: "center",
    selectable: true,
    data: { sticker: true },
  });

  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function removeAllStickers(canvas: any): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = canvas.getObjects() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stickers = objects.filter((obj: any) => obj?.data?.sticker === true);
  stickers.forEach((obj) => canvas.remove(obj));
  if (stickers.length > 0) {
    canvas.discardActiveObject();
    canvas.renderAll();
  }
  return stickers.length;
}

export function ObjectStickerPackPanel({ fabricCanvas }: ObjectStickerPackPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<AnyFabric>(null);

  const [activeCategory, setActiveCategory] = useState<CategoryKey>("expressoes");
  const [search, setSearch] = useState("");
  const [size, setSize] = useState(48);
  const [inserting, setInserting] = useState(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const visibleStickers = filterStickers(search, activeCategory);

  const handleInsert = useCallback(
    async (emoji: string) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error("Nenhum canvas disponível.");
        return;
      }
      setInserting(true);
      try {
        await insertStickerOnCanvas(canvas, emoji, size);
        toast.success(`Sticker ${emoji} inserido!`);
      } catch (err) {
        console.error("Erro ao inserir sticker:", err);
        toast.error("Erro ao inserir sticker.");
      } finally {
        setInserting(false);
      }
    },
    [size]
  );

  const handleRemoveAll = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Nenhum canvas disponível.");
      return;
    }
    try {
      const removed = await removeAllStickers(canvas);
      if (removed > 0) {
        toast.success(`${removed} sticker(s) removido(s).`);
      } else {
        toast.error("Nenhum sticker encontrado no canvas.");
      }
    } catch (err) {
      console.error("Erro ao remover stickers:", err);
      toast.error("Erro ao remover stickers.");
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Smile className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-sm">Pack de Stickers</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Pesquisar sticker..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm pr-3"
        />
      </div>

      {/* Category Tabs — 3 cols × 2 rows */}
      {!search.trim() && (
        <div className="grid grid-cols-3 gap-1">
          {CATEGORY_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-1.5 text-xs transition-colors hover:bg-accent ${
                activeCategory === key
                  ? "border-primary bg-primary/10 font-semibold"
                  : "border-transparent bg-muted"
              }`}
            >
              <span className="text-base leading-none">{CATEGORY_ICONS[key]}</span>
              <span className="truncate leading-none">{CATEGORY_LABELS[key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Size Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tamanho</span>
          <span className="text-xs font-mono">{size}px</span>
        </div>
        <input
          type="range"
          min={20}
          max={120}
          step={2}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="flex-1 h-1 accent-primary"
        />
      </div>

      {/* Sticker Grid */}
      <div className="overflow-y-auto max-h-64 rounded-md border bg-muted/30 p-1">
        {visibleStickers.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nenhum sticker encontrado.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-1">
            {visibleStickers.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                onClick={() => handleInsert(emoji)}
                disabled={inserting}
                title={emoji}
                className="flex items-center justify-center rounded-md p-1.5 text-xl hover:bg-accent transition-colors disabled:opacity-50"
                style={{ lineHeight: 1 }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remove All */}
      <Button
        variant="destructive"
        size="sm"
        onClick={handleRemoveAll}
        className="w-full"
      >
        Remover stickers
      </Button>
    </div>
  );
}
