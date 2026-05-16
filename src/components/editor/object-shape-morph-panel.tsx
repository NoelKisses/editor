"use client";

import { useEffect, useRef, useState } from "react";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ObjectShapeMorphPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type MorphTarget =
  | "square"
  | "rounded"
  | "pill"
  | "squircle"
  | "chamfer"
  | "leaf"
  | "cabaca"
  | "wavy";

const MORPH_LABELS: Record<MorphTarget, string> = {
  square: "Quadrado",
  rounded: "Arredondado",
  pill: "Pill",
  squircle: "Squircle",
  chamfer: "Cantos Recortados",
  leaf: "Folha",
  cabaca: "Cabaça",
  wavy: "Ondulado",
};

const MORPH_DESCRIPTIONS: Record<MorphTarget, string> = {
  square: "Retângulo com cantos retos (sem morph).",
  rounded: "Retângulo arredondado com raio customizável.",
  pill: "Cápsula totalmente arredondada (rx = altura/2).",
  squircle: "Aproximação superelíptica com clipPath circular.",
  chamfer: "Cantos chanfrados formando octógono.",
  leaf: "Forma de folha — um canto arredondado, oposto agudo.",
  cabaca: "Forma de cabaça — arredondada com cintura.",
  wavy: "Bordas onduladas suaves.",
};

function chamferOctagonPath(w: number, h: number, chamfer: number): string {
  const c = Math.max(0, Math.min(chamfer, Math.min(w, h) / 2));
  return [
    `M ${c} 0`,
    `L ${w - c} 0`,
    `L ${w} ${c}`,
    `L ${w} ${h - c}`,
    `L ${w - c} ${h}`,
    `L ${c} ${h}`,
    `L 0 ${h - c}`,
    `L 0 ${c}`,
    `Z`,
  ].join(" ");
}

function leafPath(w: number, h: number): string {
  return [
    `M 0 0`,
    `Q ${w} 0 ${w} ${h / 2}`,
    `Q ${w} ${h} ${w / 2} ${h}`,
    `L 0 ${h}`,
    `Z`,
  ].join(" ");
}

function wavyEdgePath(w: number, h: number, smoothness: number): string {
  const amp = Math.max(2, (1 - smoothness) * 20);
  const segs = 6;
  const segW = w / segs;
  let p = `M 0 ${amp}`;
  for (let i = 0; i < segs; i++) {
    const x1 = i * segW + segW / 2;
    const y1 = i % 2 === 0 ? 0 : amp * 2;
    const x2 = (i + 1) * segW;
    const y2 = amp;
    p += ` Q ${x1} ${y1} ${x2} ${y2}`;
  }
  p += ` L ${w} ${h - amp}`;
  for (let i = 0; i < segs; i++) {
    const x1 = w - (i * segW + segW / 2);
    const y1 = i % 2 === 0 ? h : h - amp * 2;
    const x2 = w - (i + 1) * segW;
    const y2 = h - amp;
    p += ` Q ${x1} ${y1} ${x2} ${y2}`;
  }
  p += ` Z`;
  return p;
}

function cabacaPath(w: number, h: number): string {
  const waist = w * 0.65;
  const offset = (w - waist) / 2;
  return [
    `M ${w * 0.2} 0`,
    `Q ${w} 0 ${w} ${h * 0.3}`,
    `Q ${w - offset} ${h * 0.5} ${w} ${h * 0.7}`,
    `Q ${w} ${h} ${w * 0.5} ${h}`,
    `Q 0 ${h} 0 ${h * 0.7}`,
    `Q ${offset} ${h * 0.5} 0 ${h * 0.3}`,
    `Q 0 0 ${w * 0.2} 0`,
    `Z`,
  ].join(" ");
}

export function ObjectShapeMorphPanel({ fabricCanvas }: ObjectShapeMorphPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [morphTarget, setMorphTarget] = useState<MorphTarget>("rounded");
  const [cornerRadius, setCornerRadius] = useState<number>(20);
  const [smoothness, setSmoothness] = useState<number>(0.6);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const c = fabricCanvas;
    if (!c) return;
    const update = () => {
      const obj = c.getActiveObject();
      const ok = !!obj && (obj.type === "rect" || obj.type === "image");
      queueMicrotask(() => setHasSelection(ok));
    };
    update();
    c.on("selection:created", update);
    c.on("selection:updated", update);
    c.on("selection:cleared", update);
    return () => {
      c.off("selection:created", update);
      c.off("selection:updated", update);
      c.off("selection:cleared", update);
    };
  }, [fabricCanvas]);

  const applyMorph = () => {
    const c = canvasRef.current;
    if (!c) {
      toast.error("Canvas indisponível.");
      return;
    }
    const obj = c.getActiveObject();
    if (!obj || (obj.type !== "rect" && obj.type !== "image")) {
      toast.error("Selecione um retângulo ou imagem.");
      return;
    }

    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    if (w <= 0 || h <= 0) {
      toast.error("Objeto com dimensões inválidas.");
      return;
    }

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric ?? (m as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const localW = (obj.width as any) ?? w;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const localH = (obj.height as any) ?? h;

        const applyClipPath = (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clip: any,
        ) => {
          clip.set({
            originX: "center",
            originY: "center",
            left: 0,
            top: 0,
            absolutePositioned: false,
          });
          obj.set({ clipPath: clip });
        };

        if (obj.type === "rect") {
          obj.set({ clipPath: undefined });
          switch (morphTarget) {
            case "square":
              obj.set({ rx: 0, ry: 0 });
              break;
            case "rounded":
              obj.set({ rx: cornerRadius, ry: cornerRadius });
              break;
            case "pill":
              obj.set({ rx: localH / 2, ry: localH / 2 });
              break;
            case "squircle": {
              obj.set({ rx: 30, ry: 30 });
              const r = Math.min(localW, localH) / 2;
              const circle = new f.Circle({ radius: r });
              applyClipPath(circle);
              break;
            }
            case "chamfer": {
              const path = new f.Path(chamferOctagonPath(localW, localH, cornerRadius), {
                left: -localW / 2,
                top: -localH / 2,
              });
              applyClipPath(path);
              break;
            }
            case "leaf": {
              const path = new f.Path(leafPath(localW, localH), {
                left: -localW / 2,
                top: -localH / 2,
              });
              applyClipPath(path);
              break;
            }
            case "cabaca": {
              const path = new f.Path(cabacaPath(localW, localH), {
                left: -localW / 2,
                top: -localH / 2,
              });
              applyClipPath(path);
              break;
            }
            case "wavy": {
              const path = new f.Path(wavyEdgePath(localW, localH, smoothness), {
                left: -localW / 2,
                top: -localH / 2,
              });
              applyClipPath(path);
              break;
            }
          }
        } else {
          // image: use clipPath strictly
          let pathStr: string | null = null;
          let useCircle = false;
          switch (morphTarget) {
            case "square":
              obj.set({ clipPath: undefined });
              break;
            case "rounded": {
              const rect = new f.Rect({
                width: localW,
                height: localH,
                rx: cornerRadius,
                ry: cornerRadius,
                left: -localW / 2,
                top: -localH / 2,
              });
              applyClipPath(rect);
              break;
            }
            case "pill": {
              const rect = new f.Rect({
                width: localW,
                height: localH,
                rx: localH / 2,
                ry: localH / 2,
                left: -localW / 2,
                top: -localH / 2,
              });
              applyClipPath(rect);
              break;
            }
            case "squircle":
              useCircle = true;
              break;
            case "chamfer":
              pathStr = chamferOctagonPath(localW, localH, cornerRadius);
              break;
            case "leaf":
              pathStr = leafPath(localW, localH);
              break;
            case "cabaca":
              pathStr = cabacaPath(localW, localH);
              break;
            case "wavy":
              pathStr = wavyEdgePath(localW, localH, smoothness);
              break;
          }
          if (useCircle) {
            const r = Math.min(localW, localH) / 2;
            const circle = new f.Circle({ radius: r });
            applyClipPath(circle);
          } else if (pathStr) {
            const path = new f.Path(pathStr, {
              left: -localW / 2,
              top: -localH / 2,
            });
            applyClipPath(path);
          }
        }

        obj.setCoords();
        c.requestRenderAll();
        toast.success(`Morph aplicado: ${MORPH_LABELS[morphTarget]}`);
      })
      .catch(() => {
        toast.error("Falha ao carregar fabric.");
      });
  };

  const resetShape = () => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj || (obj.type !== "rect" && obj.type !== "image")) {
      toast.error("Selecione um retângulo ou imagem.");
      return;
    }
    obj.set({ clipPath: undefined });
    if (obj.type === "rect") {
      obj.set({ rx: 0, ry: 0 });
    }
    obj.setCoords();
    c.requestRenderAll();
    toast.success("Forma resetada.");
  };

  const targets: MorphTarget[] = [
    "square",
    "rounded",
    "pill",
    "squircle",
    "chamfer",
    "leaf",
    "cabaca",
    "wavy",
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Shuffle className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Morph de Forma (Round/Squircle)</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {targets.map((t) => (
          <Button
            key={t}
            type="button"
            variant={morphTarget === t ? "default" : "outline"}
            size="sm"
            onClick={() => setMorphTarget(t)}
          >
            {MORPH_LABELS[t]}
          </Button>
        ))}
      </div>

      <div className="rounded border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
        <span className="font-medium">{MORPH_LABELS[morphTarget]}:</span>{" "}
        {MORPH_DESCRIPTIONS[morphTarget]}
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-xs font-medium">
          <span>Raio do canto</span>
          <span className="text-muted-foreground">{cornerRadius}px</span>
        </label>
        <Input
          type="range"
          min={0}
          max={100}
          step={1}
          value={cornerRadius}
          onChange={(e) => setCornerRadius(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between text-xs font-medium">
          <span>Suavidade</span>
          <span className="text-muted-foreground">{smoothness.toFixed(2)}</span>
        </label>
        <Input
          type="range"
          min={0.3}
          max={1.0}
          step={0.05}
          value={smoothness}
          onChange={(e) => setSmoothness(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={applyMorph} disabled={!hasSelection}>
          Aplicar Morph
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resetShape}
          disabled={!hasSelection}
        >
          Resetar Forma
        </Button>
      </div>

      {!hasSelection && (
        <p className="text-xs text-muted-foreground">
          Selecione um retângulo ou imagem para aplicar morph.
        </p>
      )}
    </div>
  );
}
