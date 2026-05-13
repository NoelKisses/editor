"use client";

import { useCallback, useEffect, useState } from "react";
import { AlignCenter } from "lucide-react";
import { toast } from "sonner";

interface SmartAlignDistributePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type AlignRef = "canvas" | "selection" | "anchor";
type AlignDir = "left" | "center-h" | "right" | "top" | "center-v" | "bottom";
type DistributeDir = "equal-h" | "equal-v";

const ALIGN_ACTIONS: { label: string; value: AlignDir; icon: string }[] = [
  { label: "Esq", value: "left", icon: "⇤" },
  { label: "Centro H", value: "center-h", icon: "⇔" },
  { label: "Dir", value: "right", icon: "⇥" },
  { label: "Topo", value: "top", icon: "⇡" },
  { label: "Centro V", value: "center-v", icon: "⇕" },
  { label: "Base", value: "bottom", icon: "⇣" },
];

export function SmartAlignDistributePanel({ fabricCanvas, selectionVersion }: SmartAlignDistributePanelProps) {
  const [ref, setRef] = useState<AlignRef>("canvas");
  const [hasSelection, setHasSelection] = useState(false);
  const [hasMulti, setHasMulti] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      setHasSelection(!!obj);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHasMulti(obj?.type === "activeSelection" && (obj as any)._objects?.length > 1);
    });
  }, [fabricCanvas, selectionVersion]);

  const getRefBounds = useCallback(() => {
    if (!fabricCanvas) return null;
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();

    if (ref === "canvas") {
      return { left: 0, top: 0, width: cw, height: ch };
    }

    const sel = fabricCanvas.getActiveObject();
    if (!sel) return null;

    if (ref === "selection") {
      const br = sel.getBoundingRect();
      return { left: br.left, top: br.top, width: br.width, height: br.height };
    }

    // anchor = first object in selection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = (sel as any)._objects ?? [sel];
    const anchor = objs[0];
    if (!anchor) return null;
    const br = anchor.getBoundingRect();
    return { left: br.left, top: br.top, width: br.width, height: br.height };
  }, [fabricCanvas, ref]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getTargetObjects = useCallback((): any[] => {
    if (!fabricCanvas) return [];
    const sel = fabricCanvas.getActiveObject();
    if (!sel) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (sel.type === "activeSelection") return (sel as any)._objects ?? [];
    return [sel];
  }, [fabricCanvas]);

  const align = useCallback((dir: AlignDir) => {
    const bounds = getRefBounds();
    if (!bounds || !fabricCanvas) return;

    const objs = getTargetObjects();
    if (!objs.length) { toast.error("Selecione um objeto"); return; }

    const sel = fabricCanvas.getActiveObject();
    // Temporarily ungroup for individual positioning
    const isMulti = sel?.type === "activeSelection";
    if (isMulti) fabricCanvas.discardActiveObject();

    objs.forEach(obj => {
      const br = obj.getBoundingRect(true);
      switch (dir) {
        case "left":
          obj.set({ left: bounds.left + (obj.left - br.left) });
          break;
        case "right":
          obj.set({ left: bounds.left + bounds.width - br.width + (obj.left - br.left) });
          break;
        case "center-h":
          obj.set({ left: bounds.left + (bounds.width - br.width) / 2 + (obj.left - br.left) });
          break;
        case "top":
          obj.set({ top: bounds.top + (obj.top - br.top) });
          break;
        case "bottom":
          obj.set({ top: bounds.top + bounds.height - br.height + (obj.top - br.top) });
          break;
        case "center-v":
          obj.set({ top: bounds.top + (bounds.height - br.height) / 2 + (obj.top - br.top) });
          break;
      }
      obj.setCoords();
    });

    if (isMulti) {
      import("fabric").then(m => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newSel = new (m.fabric as any).ActiveSelection(objs, { canvas: fabricCanvas });
        fabricCanvas.setActiveObject(newSel);
        fabricCanvas.requestRenderAll();
      });
    } else {
      fabricCanvas.requestRenderAll();
    }

    toast.success(`Alinhado: ${dir}`);
  }, [fabricCanvas, getRefBounds, getTargetObjects]);

  const distribute = useCallback((dir: DistributeDir) => {
    if (!fabricCanvas) return;
    const objs = getTargetObjects();
    if (objs.length < 3) { toast.error("Selecione 3+ objetos para distribuir"); return; }

    const sel = fabricCanvas.getActiveObject();
    const isMulti = sel?.type === "activeSelection";
    if (isMulti) fabricCanvas.discardActiveObject();

    const sorted = [...objs].sort((a, b) => {
      const ba = a.getBoundingRect(true);
      const bb = b.getBoundingRect(true);
      return dir === "equal-h" ? ba.left - bb.left : ba.top - bb.top;
    });

    const first = sorted[0].getBoundingRect(true);
    const last = sorted[sorted.length - 1].getBoundingRect(true);

    const totalObjSize = sorted.slice(1, -1).reduce((s, o) => {
      const br = o.getBoundingRect(true);
      return s + (dir === "equal-h" ? br.width : br.height);
    }, 0);

    const span = dir === "equal-h"
      ? last.left - (first.left + first.width)
      : last.top - (first.top + first.height);

    const gap = (span - totalObjSize) / (sorted.length - 1);

    let cursor = dir === "equal-h" ? first.left + first.width : first.top + first.height;

    sorted.slice(1, -1).forEach(obj => {
      const br = obj.getBoundingRect(true);
      if (dir === "equal-h") {
        obj.set({ left: cursor + gap + (obj.left - br.left) });
        cursor += gap + br.width;
      } else {
        obj.set({ top: cursor + gap + (obj.top - br.top) });
        cursor += gap + br.height;
      }
      obj.setCoords();
    });

    if (isMulti) {
      import("fabric").then(m => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newSel = new (m.fabric as any).ActiveSelection(objs, { canvas: fabricCanvas });
        fabricCanvas.setActiveObject(newSel);
        fabricCanvas.requestRenderAll();
      });
    } else {
      fabricCanvas.requestRenderAll();
    }

    toast.success(`Distribuído: ${dir === "equal-h" ? "horizontal" : "vertical"}`);
  }, [fabricCanvas, getTargetObjects]);

  const REFS: { value: AlignRef; label: string }[] = [
    { value: "canvas", label: "Canvas" },
    { value: "selection", label: "Seleção" },
    { value: "anchor", label: "Âncora (1º obj)" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <AlignCenter className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Alinhar Inteligente</span>
      </div>

      {/* Reference */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Referência</span>
        <div className="flex flex-col gap-1">
          {REFS.map(r => (
            <button
              key={r.value}
              onClick={() => setRef(r.value)}
              className={`px-2 py-1.5 rounded border text-left text-[10px] transition-colors ${ref === r.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Align */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Alinhar</span>
        <div className="grid grid-cols-3 gap-1">
          {ALIGN_ACTIONS.map(a => (
            <button
              key={a.value}
              onClick={() => align(a.value)}
              disabled={!hasSelection}
              className="flex flex-col items-center gap-0.5 py-2 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
            >
              <span className="text-base leading-none">{a.icon}</span>
              <span className="text-[8px]">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Distribute */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Distribuir (3+ objetos)</span>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => distribute("equal-h")}
            disabled={!hasMulti}
            className="flex flex-col items-center gap-0.5 py-2.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
          >
            <span className="text-base leading-none">⇔</span>
            <span className="text-[8px]">Espaço H igual</span>
          </button>
          <button
            onClick={() => distribute("equal-v")}
            disabled={!hasMulti}
            className="flex flex-col items-center gap-0.5 py-2.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
          >
            <span className="text-base leading-none">⇕</span>
            <span className="text-[8px]">Espaço V igual</span>
          </button>
        </div>
      </div>

      {!hasSelection && (
        <p className="text-[9px] text-muted-foreground text-center">Selecione objetos para alinhar</p>
      )}
      {ref === "anchor" && (
        <p className="text-[8px] text-muted-foreground/60 text-center">O primeiro objeto selecionado é a âncora — os demais se alinham a ele</p>
      )}
    </div>
  );
}
