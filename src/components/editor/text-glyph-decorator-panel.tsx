"use client";

import { useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TextGlyphDecoratorPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type DecorationStyle =
  | "stars"
  | "arrows"
  | "boxes"
  | "heart"
  | "asterisks"
  | "diamonds"
  | "underline"
  | "stylized";

const TEXT_TYPES = ["text", "i-text", "textbox"];

function decorateStars(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `✦ ${word} ✦`)
    .join(" ");
}

function decorateArrows(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `➤ ${word}`)
    .join(" ");
}

function decorateBoxes(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `▣ ${word} ▣`)
    .join(" ");
}

function decorateHeart(text: string): string {
  return `❤ ${text} ❤`;
}

function decorateAsterisks(text: string): string {
  return `✱✱ ${text} ✱✱`;
}

function decorateDiamonds(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `◆ ${word} ◆`)
    .join(" ");
}

function decorateUnderline(text: string): string {
  return `━━━\n${text}\n━━━`;
}

function decorateStylized(text: string): string {
  const upperBase = 0x1d4d0;
  const lowerBase = 0x1d4ea;
  let result = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      result += String.fromCodePoint(upperBase + (code - 65));
    } else if (code >= 97 && code <= 122) {
      result += String.fromCodePoint(lowerBase + (code - 97));
    } else {
      result += char;
    }
  }
  return result;
}

function applyDecoration(text: string, style: DecorationStyle): string {
  switch (style) {
    case "stars":
      return decorateStars(text);
    case "arrows":
      return decorateArrows(text);
    case "boxes":
      return decorateBoxes(text);
    case "heart":
      return decorateHeart(text);
    case "asterisks":
      return decorateAsterisks(text);
    case "diamonds":
      return decorateDiamonds(text);
    case "underline":
      return decorateUnderline(text);
    case "stylized":
      return decorateStylized(text);
    default:
      return text;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectId(obj: any): string {
  if (!obj.__glyphDecoratorId) {
    obj.__glyphDecoratorId = `glyph-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }
  return obj.__glyphDecoratorId as string;
}

const STYLE_OPTIONS: Array<{
  id: DecorationStyle;
  label: string;
  symbol: string;
}> = [
  { id: "stars", label: "Estrelas", symbol: "✦" },
  { id: "arrows", label: "Setas", symbol: "➤" },
  { id: "boxes", label: "Caixas", symbol: "▣" },
  { id: "heart", label: "Coração", symbol: "❤" },
  { id: "asterisks", label: "Asteriscos", symbol: "✱" },
  { id: "diamonds", label: "Diamantes", symbol: "◆" },
  { id: "underline", label: "Sublinhado", symbol: "━" },
  { id: "stylized", label: "Estilizado", symbol: "𝓢𝓽𝔂𝓵𝓮" },
];

export function TextGlyphDecoratorPanel({
  fabricCanvas,
}: TextGlyphDecoratorPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const originalsRef = useRef<Map<string, string>>(new Map());
  const [selectedStyle, setSelectedStyle] =
    useState<DecorationStyle>("stars");
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const canvas = fabricCanvas;
    if (!canvas) return;

    const updateCount = () => {
      const active = canvas.getActiveObjects?.() ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const count = active.filter((o: any) =>
        TEXT_TYPES.includes(o?.type),
      ).length;
      queueMicrotask(() => setSelectedCount(count));
    };

    updateCount();
    canvas.on?.("selection:created", updateCount);
    canvas.on?.("selection:updated", updateCount);
    canvas.on?.("selection:cleared", updateCount);

    return () => {
      canvas.off?.("selection:created", updateCount);
      canvas.off?.("selection:updated", updateCount);
      canvas.off?.("selection:cleared", updateCount);
    };
  }, [fabricCanvas]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getSelectedTextObjects = (): any[] => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    const active = canvas.getActiveObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return active.filter((o: any) => TEXT_TYPES.includes(o?.type));
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const targets = getSelectedTextObjects();
    if (targets.length === 0) {
      toast.error("Selecione ao menos um objeto de texto");
      return;
    }

    for (const obj of targets) {
      const id = getObjectId(obj);
      const currentText: string = obj.text ?? "";
      if (!originalsRef.current.has(id)) {
        originalsRef.current.set(id, currentText);
      }
      const decorated = applyDecoration(currentText, selectedStyle);
      obj.set?.("text", decorated);
    }

    canvas.requestRenderAll?.();
    toast.success(
      `Decoração aplicada a ${targets.length} objeto(s) de texto`,
    );
  };

  const handleRestore = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const targets = getSelectedTextObjects();
    if (targets.length === 0) {
      toast.error("Selecione ao menos um objeto de texto");
      return;
    }

    let restored = 0;
    for (const obj of targets) {
      const id = getObjectId(obj);
      const original = originalsRef.current.get(id);
      if (original !== undefined) {
        obj.set?.("text", original);
        originalsRef.current.delete(id);
        restored += 1;
      }
    }

    canvas.requestRenderAll?.();

    if (restored === 0) {
      toast.message("Nenhum texto original armazenado para restaurar");
    } else {
      toast.success(`Restaurado(s) ${restored} texto(s) original(is)`);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Decorador de Glifos</h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {selectedCount} selecionado(s)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STYLE_OPTIONS.map((opt) => (
          <Button
            key={opt.id}
            type="button"
            variant={selectedStyle === opt.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStyle(opt.id)}
            className="flex flex-col items-center gap-1 py-3 h-auto"
          >
            <span className="text-lg leading-none">{opt.symbol}</span>
            <span className="text-xs">{opt.label}</span>
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleApply} className="w-full">
          Aplicar Decoração
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRestore}
          className="w-full"
        >
          Restaurar Original
        </Button>
      </div>
    </div>
  );
}
