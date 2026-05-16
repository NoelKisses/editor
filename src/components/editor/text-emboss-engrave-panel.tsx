"use client";

import { useEffect, useRef, useState } from "react";
import { Hash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TextEmbossEngravePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type EmbossMode = "emboss" | "engrave";

const TEXT_TYPES = ["text", "i-text", "textbox"];

function isTextObject(obj: { type?: string } | null | undefined): boolean {
  if (!obj || typeof obj.type !== "string") return false;
  return TEXT_TYPES.includes(obj.type);
}

function computeOffsets(
  mode: EmbossMode,
  depth: number,
): { light: { x: number; y: number }; dark: { x: number; y: number } } {
  if (mode === "emboss") {
    return {
      light: { x: -depth, y: -depth },
      dark: { x: depth, y: depth },
    };
  }
  return {
    light: { x: depth, y: depth },
    dark: { x: -depth, y: -depth },
  };
}

function generateParentId(): string {
  return `emboss-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface Preset {
  label: string;
  mode: EmbossMode;
  highlight: string;
  shadow: string;
  depth: number;
  fill?: string;
}

const PRESETS: Preset[] = [
  {
    label: "Metal Polido",
    mode: "emboss",
    highlight: "#ffffff",
    shadow: "#2a2a2a",
    depth: 4,
    fill: "#c0c0c0",
  },
  {
    label: "Pedra",
    mode: "engrave",
    highlight: "#d9d9d9",
    shadow: "#000000",
    depth: 3,
  },
  {
    label: "Madeira",
    mode: "emboss",
    highlight: "#d4b886",
    shadow: "#3a2818",
    depth: 5,
  },
];

export function TextEmbossEngravePanel({ fabricCanvas }: TextEmbossEngravePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [mode, setMode] = useState<EmbossMode>("emboss");
  const [highlight, setHighlight] = useState<string>("#ffffff");
  const [shadow, setShadow] = useState<string>("#000000");
  const [depth, setDepth] = useState<number>(3);
  const [blur, setBlur] = useState<number>(2);
  const [fill, setFill] = useState<string>("#ffffff");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function applyEffect(opts: {
    mode: EmbossMode;
    highlight: string;
    shadow: string;
    depth: number;
    blur: number;
    fill?: string;
  }) {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }

    const active = canvas.getActiveObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targets = active.filter((o: any) => isTextObject(o));
    if (targets.length === 0) {
      toast.error("Selecione ao menos um texto");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const offsets = computeOffsets(opts.mode, opts.depth);

      let processed = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targets.forEach((obj: any) => {
        const parentId = generateParentId();

        if (opts.fill) {
          obj.set({ fill: opts.fill });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        obj.clone((highlightClone: any) => {
          highlightClone.set({
            fill: opts.highlight,
            left: (obj.left ?? 0) + offsets.light.x,
            top: (obj.top ?? 0) + offsets.light.y,
            selectable: false,
            evented: false,
            shadow: new f.Shadow({
              color: opts.highlight,
              blur: opts.blur,
              offsetX: 0,
              offsetY: 0,
            }),
            data: { embossLayer: true, parentId },
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          obj.clone((shadowClone: any) => {
            shadowClone.set({
              fill: opts.shadow,
              left: (obj.left ?? 0) + offsets.dark.x,
              top: (obj.top ?? 0) + offsets.dark.y,
              selectable: false,
              evented: false,
              shadow: new f.Shadow({
                color: opts.shadow,
                blur: opts.blur,
                offsetX: 0,
                offsetY: 0,
              }),
              data: { embossLayer: true, parentId },
            });

            canvas.add(highlightClone);
            canvas.add(shadowClone);
            highlightClone.sendToBack?.();
            shadowClone.sendToBack?.();
            obj.bringToFront?.();

            processed += 1;
            if (processed === targets.length) {
              canvas.requestRenderAll();
              toast.success(
                `Efeito ${opts.mode === "emboss" ? "relevo" : "gravado"} aplicado`,
              );
            }
          });
        });
      });
    });
  }

  function handleApply() {
    applyEffect({ mode, highlight, shadow, depth, blur, fill });
  }

  function handlePreset(preset: Preset) {
    queueMicrotask(() => {
      setMode(preset.mode);
      setHighlight(preset.highlight);
      setShadow(preset.shadow);
      setDepth(preset.depth);
      if (preset.fill) setFill(preset.fill);
    });
    applyEffect({
      mode: preset.mode,
      highlight: preset.highlight,
      shadow: preset.shadow,
      depth: preset.depth,
      blur,
      fill: preset.fill,
    });
  }

  function handleRemove() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const all = canvas.getObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = all.filter((o: any) => o?.data?.embossLayer === true);
    if (toRemove.length === 0) {
      toast.info("Nenhum efeito para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success("Efeito removido");
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Hash className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Relevo / Gravado</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={mode === "emboss" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("emboss")}
        >
          Relevo (Emboss)
        </Button>
        <Button
          variant={mode === "engrave" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("engrave")}
        >
          Gravado (Engrave)
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs">Cor de Realce</span>
          <input
            type="color"
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs">Cor de Sombra</span>
          <input
            type="color"
            value={shadow}
            onChange={(e) => setShadow(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs">Cor de Preenchimento</span>
          <input
            type="color"
            value={fill}
            onChange={(e) => setFill(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Profundidade</span>
            <span className="text-xs text-muted-foreground">{depth}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Desfoque</span>
            <span className="text-xs text-muted-foreground">{blur}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={blur}
            onChange={(e) => setBlur(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Presets</span>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              onClick={() => handlePreset(p)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Button className="w-full" size="sm" onClick={handleApply}>
          Aplicar Relevo/Gravado
        </Button>
        <Button
          className="w-full"
          variant="outline"
          size="sm"
          onClick={handleRemove}
        >
          Remover Efeito
        </Button>
      </div>
    </div>
  );
}
