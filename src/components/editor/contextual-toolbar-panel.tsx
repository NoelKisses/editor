"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Wand2, Type, ImageIcon, Square, Circle, Layers, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

interface ContextualToolbarPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type ObjType = "text" | "image" | "shape" | "group" | "multi" | "none";

interface ObjInfo {
  kind: ObjType;
  type: string;
  label: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  filters?: number;
  count?: number;
}

function kindFromType(type: string): ObjType {
  if (["i-text", "textbox", "text"].includes(type)) return "text";
  if (type === "image") return "image";
  if (type === "group") return "group";
  if (type === "activeSelection") return "multi";
  return "shape";
}

const KIND_ICON_MAP: Record<ObjType, React.ElementType> = {
  text: Type,
  image: ImageIcon,
  group: Layers,
  multi: Layers,
  shape: Square,
  none: SlidersHorizontal,
};

function kindLabel(kind: ObjType, type: string): string {
  if (kind === "text") return "Texto";
  if (kind === "image") return "Imagem";
  if (kind === "group") return "Grupo";
  if (kind === "multi") return "Múltiplos objetos";
  const shapes: Record<string, string> = {
    rect: "Retângulo", circle: "Círculo", ellipse: "Elipse",
    triangle: "Triângulo", line: "Linha", path: "Caminho",
  };
  return shapes[type] ?? "Forma";
}

function ColorSwatch({ color, label, onChange }: { color: string; label: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] text-muted-foreground">{label}</span>
      <label className="cursor-pointer">
        <div
          className="w-full h-7 rounded border border-border/70 hover:border-primary/40 transition-colors"
          style={{ background: color || "transparent" }}
        />
        <input type="color" value={color || "#000000"} onChange={e => onChange(e.target.value)} className="sr-only" />
      </label>
    </div>
  );
}

export function ContextualToolbarPanel({ fabricCanvas, selectionVersion }: ContextualToolbarPanelProps) {
  const [info, setInfo] = useState<ObjInfo | null>(null);

  const readObj = useCallback(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setInfo(null); return; }
      const type = obj.type ?? "unknown";
      const kind = kindFromType(type);
      setInfo({
        kind,
        type,
        label: kindLabel(kind, type),
        fill: typeof obj.fill === "string" ? obj.fill : "#000000",
        stroke: obj.stroke ?? "",
        strokeWidth: obj.strokeWidth ?? 0,
        opacity: Math.round((obj.opacity ?? 1) * 100),
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        fontWeight: obj.fontWeight,
        fontStyle: obj.fontStyle,
        textAlign: obj.textAlign,
        filters: obj.filters?.length,
        count: kind === "multi" ? obj._objects?.length : undefined,
      });
    });
  }, [fabricCanvas]);

  useEffect(() => {
    readObj();
  }, [fabricCanvas, selectionVersion, readObj]);

  const applyProp = useCallback((props: Record<string, unknown>) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) return;
    obj.set(props);
    fabricCanvas.requestRenderAll();
    setInfo(prev => prev ? { ...prev, ...Object.fromEntries(
      Object.entries(props).map(([k, v]) => [k, k === "opacity" ? Math.round((v as number) * 100) : v])
    ) } : null);
  }, [fabricCanvas]);

  const flatten = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj || obj.type !== "group") { toast.error("Selecione um grupo"); return; }
    obj.toActiveSelection();
    fabricCanvas.requestRenderAll();
    toast.success("Grupo desfeito");
  }, [fabricCanvas]);

  const group = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel: any = fabricCanvas.getActiveObject();
    if (!sel || sel.type !== "activeSelection") { toast.error("Selecione múltiplos objetos"); return; }
    sel.toGroup();
    fabricCanvas.requestRenderAll();
    toast.success("Objetos agrupados");
  }, [fabricCanvas]);

  if (!info) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Propriedades Contextuais</span>
        </div>
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Circle className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para ver suas propriedades</p>
          <p className="text-[9px] text-muted-foreground/60">As opções mudam conforme o tipo do objeto</p>
        </div>
      </div>
    );
  }

  const Icon = KIND_ICON_MAP[info.kind];

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Propriedades Contextuais</span>
      </div>

      {/* Object type badge */}
      <div className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20">
        <Icon className="w-4 h-4 text-primary" />
        <div>
          <p className="text-[11px] font-medium">{info.label}</p>
          {info.count && <p className="text-[8px] text-muted-foreground">{info.count} objetos selecionados</p>}
        </div>
      </div>

      {/* Opacity — always shown */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Opacidade</span>
          <span className="text-[9px] tabular-nums">{info.opacity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={info.opacity}
          onChange={e => applyProp({ opacity: Number(e.target.value) / 100 })}
          className="w-full accent-primary h-1"
        />
      </div>

      {/* TEXT-specific */}
      {info.kind === "text" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <ColorSwatch color={info.fill} label="Cor do texto" onChange={c => applyProp({ fill: c })} />
            <ColorSwatch color={info.stroke} label="Contorno" onChange={c => applyProp({ stroke: c })} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Tamanho da fonte</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={8}
                max={200}
                step={1}
                value={info.fontSize ?? 20}
                onChange={e => applyProp({ fontSize: Number(e.target.value) })}
                className="flex-1 accent-primary h-1"
              />
              <span className="text-[9px] tabular-nums w-8">{info.fontSize ?? 20}px</span>
            </div>
          </div>
          <div className="flex gap-1">
            {[
              { label: "B", prop: { fontWeight: info.fontWeight === "bold" ? "normal" : "bold" }, active: info.fontWeight === "bold", title: "Negrito" },
              { label: "I", prop: { fontStyle: info.fontStyle === "italic" ? "normal" : "italic" }, active: info.fontStyle === "italic", title: "Itálico" },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={() => applyProp(btn.prop)}
                title={btn.title}
                className={`flex-1 py-1.5 rounded border text-[10px] font-medium transition-colors ${btn.active ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {btn.label}
              </button>
            ))}
            {["left", "center", "right"].map(align => (
              <button
                key={align}
                onClick={() => applyProp({ textAlign: align })}
                className={`flex-1 py-1.5 rounded border text-[8px] transition-colors ${info.textAlign === align ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
              >
                {align === "left" ? "⇤" : align === "center" ? "⇔" : "⇥"}
              </button>
            ))}
          </div>
        </>
      )}

      {/* IMAGE-specific */}
      {info.kind === "image" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between p-2 rounded border border-border">
            <span className="text-[9px] text-muted-foreground">Filtros ativos</span>
            <span className="text-[9px] tabular-nums">{info.filters ?? 0}</span>
          </div>
          <button
            onClick={() => {
              if (!fabricCanvas) return;
              const obj = fabricCanvas.getActiveObject();
              if (!obj) return;
              obj.filters = [];
              obj.applyFilters();
              fabricCanvas.requestRenderAll();
              toast.success("Filtros removidos");
            }}
            className="py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
          >
            Remover todos os filtros
          </button>
        </div>
      )}

      {/* SHAPE-specific */}
      {info.kind === "shape" && (
        <div className="grid grid-cols-2 gap-2">
          <ColorSwatch color={info.fill} label="Preenchimento" onChange={c => applyProp({ fill: c })} />
          <ColorSwatch color={info.stroke} label="Borda" onChange={c => applyProp({ stroke: c })} />
        </div>
      )}

      {/* GROUP-specific */}
      {info.kind === "group" && (
        <button
          onClick={flatten}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Layers className="w-3 h-3" /> Desfazer grupo
        </button>
      )}

      {/* MULTI-specific */}
      {info.kind === "multi" && (
        <button
          onClick={group}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          <Layers className="w-3 h-3" /> Agrupar seleção (⌘G)
        </button>
      )}
    </div>
  );
}
