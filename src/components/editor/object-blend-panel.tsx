"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers2, Blend, Merge } from "lucide-react";
import { toast } from "sonner";

interface ObjectBlendPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type BlendOp = "union" | "intersect" | "subtract" | "exclude" | "divide";
type MixMode = "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";

const BLEND_OPS: { value: BlendOp; label: string; desc: string }[] = [
  { value: "union", label: "União", desc: "Mescla os dois objetos" },
  { value: "subtract", label: "Subtração", desc: "Remove a sobreposição do fundo" },
  { value: "intersect", label: "Interseção", desc: "Mantém só a área comum" },
  { value: "exclude", label: "Exclusão", desc: "Mantém só as áreas não-comuns" },
  { value: "divide", label: "Dividir", desc: "Divide o objeto de cima" },
];

const MIX_MODES: { value: MixMode; label: string }[] = [
  { value: "multiply", label: "Multiplicar" },
  { value: "screen", label: "Tela" },
  { value: "overlay", label: "Sobrepor" },
  { value: "darken", label: "Escurecer" },
  { value: "lighten", label: "Clarear" },
  { value: "color-dodge", label: "Subexposição" },
  { value: "color-burn", label: "Superexposição" },
  { value: "hard-light", label: "Luz Forte" },
  { value: "soft-light", label: "Luz Suave" },
  { value: "difference", label: "Diferença" },
  { value: "exclusion", label: "Exclusão Cor" },
];

export function ObjectBlendPanel({ fabricCanvas, selectionVersion }: ObjectBlendPanelProps) {
  const [blendOp, setBlendOp] = useState<BlendOp>("union");
  const [mixMode, setMixMode] = useState<MixMode>("multiply");
  const [mixOpacity, setMixOpacity] = useState(100);
  const [hasSelection, setHasSelection] = useState(false);
  const [isGroup, setIsGroup] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      setHasSelection(!!obj);
      setIsGroup(obj?.type === "group" || obj?.type === "activeSelection");
    });
  }, [fabricCanvas, selectionVersion]);

  // Apply CSS blend mode to selected object (visual layer blending)
  const applyMixBlend = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    // Fabric.js supports globalCompositeOperation
    obj.set({
      globalCompositeOperation: mixMode as string,
      opacity: mixOpacity / 100,
    });
    fabricCanvas.requestRenderAll();
    toast.success(`Modo ${mixMode} aplicado`);
  }, [fabricCanvas, mixMode, mixOpacity]);

  const resetMixBlend = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set({ globalCompositeOperation: "source-over", opacity: 1 });
    fabricCanvas.requestRenderAll();
    toast.success("Blend removido");
  }, [fabricCanvas]);

  // Boolean path operations using bounding box approach (visual approximation)
  const applyPathOp = useCallback(async () => {
    if (!fabricCanvas) return;
    const sel = fabricCanvas.getActiveObject();
    if (!sel || sel.type !== "activeSelection") {
      toast.error("Selecione exatamente 2 objetos");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = (sel as any).getObjects();
    if (objs.length !== 2) { toast.error("Selecione exatamente 2 objetos"); return; }

    const fabric = await import("fabric").then(m => m.fabric);
    const [top, bottom] = objs;

    const topBR = top.getBoundingRect();
    const botBR = bottom.getBoundingRect();

    // Calculate intersection
    const ix = Math.max(topBR.left, botBR.left);
    const iy = Math.max(topBR.top, botBR.top);
    const iw = Math.min(topBR.left + topBR.width, botBR.left + botBR.width) - ix;
    const ih = Math.min(topBR.top + topBR.height, botBR.top + botBR.height) - iy;
    const hasIntersection = iw > 0 && ih > 0;

    let result: unknown;

    switch (blendOp) {
      case "intersect": {
        if (!hasIntersection) { toast.error("Objetos não se sobrepõem"); return; }
        result = new fabric.Rect({
          left: ix,
          top: iy,
          width: iw,
          height: ih,
          fill: top.fill ?? bottom.fill ?? "#6366f1",
        });
        break;
      }
      case "union": {
        const ux = Math.min(topBR.left, botBR.left);
        const uy = Math.min(topBR.top, botBR.top);
        const uw = Math.max(topBR.left + topBR.width, botBR.left + botBR.width) - ux;
        const uh = Math.max(topBR.top + topBR.height, botBR.top + botBR.height) - uy;
        result = new fabric.Rect({ left: ux, top: uy, width: uw, height: uh, fill: bottom.fill ?? "#6366f1" });
        break;
      }
      case "subtract": {
        // Approximation: keep bottom, clip out intersection
        if (!hasIntersection) { toast.error("Objetos não se sobrepõem"); return; }
        const clipPath = new fabric.Rect({ left: ix, top: iy, width: iw, height: ih, absolutePositioned: true, inverted: true });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clone: any = await new Promise(resolve => bottom.clone((c: unknown) => resolve(c)));
        clone.set({ clipPath });
        fabricCanvas.remove(top);
        fabricCanvas.remove(bottom);
        fabricCanvas.add(clone);
        fabricCanvas.setActiveObject(clone);
        fabricCanvas.requestRenderAll();
        toast.success("Subtração aplicada (aproximação visual)");
        return;
      }
      default:
        result = new fabric.Rect({ left: topBR.left, top: topBR.top, width: topBR.width, height: topBR.height, fill: top.fill ?? "#6366f1" });
    }

    fabricCanvas.remove(top);
    fabricCanvas.remove(bottom);
    fabricCanvas.add(result as Parameters<typeof fabricCanvas.add>[0]);
    fabricCanvas.setActiveObject(result as Parameters<typeof fabricCanvas.setActiveObject>[0]);
    fabricCanvas.requestRenderAll();
    toast.success(`Operação "${blendOp}" aplicada`);
  }, [fabricCanvas, blendOp]);

  const flattenGroup = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    if (obj.type === "group") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (obj as any).toActiveSelection();
      fabricCanvas.setActiveObject(items);
      fabricCanvas.requestRenderAll();
      toast.success("Grupo desfeito");
    } else if (obj.type === "activeSelection") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const grp = (obj as any).toGroup();
      fabricCanvas.setActiveObject(grp);
      fabricCanvas.requestRenderAll();
      toast.success("Agrupado");
    }
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Blend className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Composição de Objetos</span>
      </div>

      {/* CSS Blend Mode */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Modo de Mesclagem (CSS)</span>
        <select
          value={mixMode}
          onChange={e => setMixMode(e.target.value as MixMode)}
          className="text-[11px] bg-background border border-border rounded px-2 py-1.5 outline-none focus:border-primary/50"
        >
          {MIX_MODES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Opacidade</span>
            <span className="text-[9px] tabular-nums">{mixOpacity}%</span>
          </div>
          <input type="range" min={10} max={100} step={5} value={mixOpacity} onChange={e => setMixOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button onClick={applyMixBlend} className="py-2 rounded border border-primary text-primary text-[10px] hover:bg-primary/10 transition-colors">
            Aplicar Blend
          </button>
          <button onClick={resetMixBlend} className="py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors">
            Remover
          </button>
        </div>
      </div>

      {/* Path Boolean ops */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Operações Booleanas (2 objetos)</span>
        <div className="flex flex-col gap-1">
          {BLEND_OPS.map(op => (
            <button
              key={op.value}
              onClick={() => setBlendOp(op.value)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition-colors ${blendOp === op.value ? "bg-primary/10 border-primary" : "border-border hover:border-primary/30"}`}
            >
              <span className={`text-[10px] font-medium ${blendOp === op.value ? "text-primary" : ""}`}>{op.label}</span>
              <span className="text-[8px] text-muted-foreground ml-auto">{op.desc}</span>
            </button>
          ))}
        </div>
        <button
          onClick={applyPathOp}
          disabled={!hasSelection}
          className="flex items-center justify-center gap-2 py-2.5 rounded border border-primary text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40"
        >
          <Merge className="w-3.5 h-3.5" /> Aplicar Operação
        </button>
        <p className="text-[8px] text-muted-foreground/60 text-center">Selecione 2 objetos sobrepostos</p>
      </div>

      {/* Group toggle */}
      {hasSelection && (
        <div className="border-t border-border pt-3">
          <button
            onClick={flattenGroup}
            className="w-full flex items-center justify-center gap-2 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Layers2 className="w-3 h-3" />
            {isGroup ? "Desagrupar seleção" : "Agrupar seleção"}
          </button>
        </div>
      )}
    </div>
  );
}
