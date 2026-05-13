"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  FlipHorizontal2,
  FlipVertical2,
  Crop,
  Layers,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
} from "lucide-react";
import { CropImageDialog } from "./crop-image-dialog";
import { FontPicker } from "./font-picker";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObj = any;

interface PropertiesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  // Force re-render from parent when selection changes
  selectionVersion: number;
}

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96, 120];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {title}
      </span>
      {children}
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0"
      />
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
        placeholder="#ffffff"
      />
    </div>
  );
}

export function PropertiesPanel({ fabricCanvas, selectionVersion }: PropertiesPanelProps) {
  const [active, setActive] = useState<FabricObj>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [lockAspect, setLockAspect] = useState(false);
  // Local UI state (mirrors fabric object properties)
  const [, forceRedraw] = useState(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject() ?? null;
    queueMicrotask(() => setActive(obj));
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(
    (props: Record<string, unknown>) => {
      if (!active) return;
      active.set(props);
      fabricCanvas.requestRenderAll();
      forceRedraw((n) => n + 1);
    },
    [active, fabricCanvas]
  );

  const bringForward = () => { fabricCanvas.bringForward(active); fabricCanvas.requestRenderAll(); };
  const sendBackward = () => { fabricCanvas.sendBackwards(active); fabricCanvas.requestRenderAll(); };

  if (!active) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-muted-foreground px-4">
        <Layers className="w-8 h-8 opacity-20" />
        <p className="text-xs">Selecione um elemento para ver as propriedades</p>
      </div>
    );
  }

  const type: string = active.type;
  const isText = type === "i-text" || type === "text" || type === "textbox";
  const isImage = type === "image";

  return (
    <div className="flex flex-col gap-4 p-3 text-sm">
      {/* --- Posição e Tamanho --- */}
      <Section title="Posição &amp; Tamanho">
        <div className="grid grid-cols-2 gap-1.5">
          {(["left", "top"] as const).map((prop) => (
            <label key={prop} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase">{prop === "left" ? "X" : "Y"}</span>
              <input
                type="number"
                value={Math.round(active[prop] ?? 0)}
                onChange={(e) => set({ [prop]: Number(e.target.value) })}
                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-full"
              />
            </label>
          ))}
        </div>
        <div className="flex items-end gap-1.5">
          <label className="flex flex-col gap-0.5 flex-1">
            <span className="text-[10px] text-muted-foreground uppercase">W</span>
            <input
              type="number"
              value={Math.round(active.getScaledWidth())}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (lockAspect) {
                  const ratio = active.getScaledHeight() / active.getScaledWidth();
                  set({ scaleX: v / (active.width ?? 1), scaleY: (v * ratio) / (active.height ?? 1) });
                } else {
                  set({ scaleX: v / (active.width ?? 1) });
                }
              }}
              className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-full"
            />
          </label>
          <button
            onClick={() => setLockAspect((v) => !v)}
            className={`mb-0.5 p-1.5 rounded border transition-colors flex-shrink-0 ${lockAspect ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            title={lockAspect ? "Proporção travada" : "Travar proporção"}
          >
            {lockAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <label className="flex flex-col gap-0.5 flex-1">
            <span className="text-[10px] text-muted-foreground uppercase">H</span>
            <input
              type="number"
              value={Math.round(active.getScaledHeight())}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (lockAspect) {
                  const ratio = active.getScaledWidth() / active.getScaledHeight();
                  set({ scaleY: v / (active.height ?? 1), scaleX: (v * ratio) / (active.width ?? 1) });
                } else {
                  set({ scaleY: v / (active.height ?? 1) });
                }
              }}
              className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-full"
            />
          </label>
        </div>
        {/* Rotation */}
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase">Rotação</span>
          <input
            type="number"
            value={Math.round(active.angle ?? 0)}
            onChange={(e) => set({ angle: Number(e.target.value) })}
            className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-full"
          />
        </label>
      </Section>

      <Separator />

      {/* --- Opacidade --- */}
      <Section title="Opacidade">
        <div className="flex items-center gap-2">
          <Slider
            value={[Math.round((active.opacity ?? 1) * 100)]}
            min={0} max={100} step={1}
            onValueChange={(vals) => set({ opacity: (vals as number[])[0] / 100 })}
            className="flex-1"
          />
          <span className="text-xs w-8 text-right tabular-nums">{Math.round((active.opacity ?? 1) * 100)}%</span>
        </div>
      </Section>

      <Separator />

      {/* --- Z-order --- */}
      <Section title="Camada">
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7" onClick={bringForward}>
            <ChevronUp className="w-3.5 h-3.5" /> Para frente
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs h-7" onClick={sendBackward}>
            <ChevronDown className="w-3.5 h-3.5" /> Para trás
          </Button>
        </div>
      </Section>

      <Separator />

      {/* --- Espelhar --- */}
      <Section title="Espelhar">
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs h-8"
            onClick={() => { active.set({ flipX: !active.flipX }); fabricCanvas.requestRenderAll(); forceRedraw((n) => n + 1); }}
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
            Horizontal
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs h-8"
            onClick={() => { active.set({ flipY: !active.flipY }); fabricCanvas.requestRenderAll(); forceRedraw((n) => n + 1); }}
          >
            <FlipVertical2 className="w-3.5 h-3.5" />
            Vertical
          </Button>
        </div>
      </Section>

      <Separator />

      {/* ---- TEXT PROPERTIES ---- */}
      {isText && (
        <>
          <Section title="Fonte">
            <FontPicker
              value={active.fontFamily ?? "Arial"}
              onChange={(font) => set({ fontFamily: font })}
            />
            <div className="flex gap-1.5">
              <select
                value={active.fontSize ?? 48}
                onChange={(e) => set({ fontSize: Number(e.target.value) })}
                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground flex-1"
              >
                {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {/* Custom font size input */}
              <input
                type="number"
                value={active.fontSize ?? 48}
                onChange={(e) => set({ fontSize: Number(e.target.value) })}
                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground w-16"
              />
            </div>
          </Section>

          <Section title="Estilo">
            <div className="flex gap-1">
              <Button
                size="icon"
                variant={active.fontWeight === "bold" ? "default" : "outline"}
                className="h-8 w-8"
                onClick={() => set({ fontWeight: active.fontWeight === "bold" ? "normal" : "bold" })}
                title="Negrito"
              >
                <Bold className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant={active.fontStyle === "italic" ? "default" : "outline"}
                className="h-8 w-8"
                onClick={() => set({ fontStyle: active.fontStyle === "italic" ? "normal" : "italic" })}
                title="Itálico"
              >
                <Italic className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant={active.underline ? "default" : "outline"}
                className="h-8 w-8"
                onClick={() => set({ underline: !active.underline })}
                title="Sublinhado"
              >
                <Underline className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Section>

          <Section title="Alinhamento">
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((align) => {
                const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                return (
                  <Button
                    key={align}
                    size="icon"
                    variant={active.textAlign === align ? "default" : "outline"}
                    className="h-8 w-8"
                    onClick={() => set({ textAlign: align })}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </Button>
                );
              })}
            </div>
          </Section>

          <Section title="Cor do Texto">
            <ColorInput
              value={active.fill as string ?? "#ffffff"}
              onChange={(v) => set({ fill: v })}
            />
          </Section>

          <Section title="Sombra">
            <div className="flex items-center justify-between">
              <span className="text-xs">Ativar sombra</span>
              <button
                role="switch"
                aria-checked={!!active.shadow}
                onClick={() => {
                  if (active.shadow) {
                    set({ shadow: null });
                  } else {
                    import("fabric").then(({ fabric }) => {
                      const shadow = new fabric.Shadow({ color: "rgba(0,0,0,0.5)", blur: 8, offsetX: 2, offsetY: 2 });
                      set({ shadow });
                    });
                  }
                }}
                className={`w-9 h-5 rounded-full transition-colors ${active.shadow ? "bg-primary" : "bg-muted"} relative`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${active.shadow ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
          </Section>
        </>
      )}

      {/* ---- SHAPE CORNER RADIUS ---- */}
      {type === "rect" && (
        <>
          <Section title="Bordas Arredondadas">
            <div className="flex items-center gap-2">
              <Slider
                min={0} max={100} step={1}
                value={[active.rx ?? 0]}
                onValueChange={(vals) => set({ rx: (vals as number[])[0], ry: (vals as number[])[0] })}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right tabular-nums">{Math.round(active.rx ?? 0)}px</span>
            </div>
          </Section>
          <Separator />
        </>
      )}

      {/* ---- IMAGE PROPERTIES ---- */}
      {isImage && (
        <>
          <Section title="Imagem">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={() => setCropOpen(true)}
            >
              <Crop className="w-3.5 h-3.5" />
              Recortar imagem
            </Button>
          </Section>

          <Separator />

          <Section title="Filtros">
            {(
              [
                { key: "brightness", label: "Brilho", min: -1, max: 1, step: 0.01 },
                { key: "contrast", label: "Contraste", min: -1, max: 1, step: 0.01 },
                { key: "saturation", label: "Saturação", min: -1, max: 1, step: 0.01 },
              ] as const
            ).map(({ key, label, min, max, step }) => {
              const filterIdx = (active.filters as { type?: string; [k: string]: unknown }[] | undefined)?.findIndex(
                (f) => f?.type?.toLowerCase() === key
              ) ?? -1;
              const filterVal = filterIdx >= 0 ? ((active.filters[filterIdx] as Record<string, unknown>)[key] as number) ?? 0 : 0;

              return (
                <div key={key} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs tabular-nums">{filterVal.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[filterVal]}
                    min={min} max={max} step={step}
                    onValueChange={(vals) => {
                      const v = (vals as number[])[0];
                      import("fabric").then(({ fabric }) => {
                        const filters = [...((active.filters as unknown[]) ?? [])];
                        const idx = (filters as { type?: string }[]).findIndex((f) => f?.type?.toLowerCase() === key);
                        const FilterClass = (fabric.Image.filters as unknown as Record<string, new (opts: Record<string, unknown>) => unknown>)[
                          key.charAt(0).toUpperCase() + key.slice(1)
                        ];
                        const filter = new FilterClass({ [key]: v });
                        if (idx >= 0) filters[idx] = filter;
                        else filters.push(filter);
                        active.filters = filters;
                        active.applyFilters();
                        fabricCanvas.requestRenderAll();
                        forceRedraw((n) => n + 1);
                      });
                    }}
                  />
                </div>
              );
            })}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Escala de cinza</span>
              <button
                role="switch"
                aria-checked={(active.filters as { type?: string }[] | undefined)?.some((f) => f?.type?.toLowerCase() === "grayscale") ? "true" : "false"}
                onClick={() => {
                  import("fabric").then(({ fabric }) => {
                    const filters = [...((active.filters as unknown[]) ?? [])];
                    const idx = (filters as { type?: string }[]).findIndex((f) => f?.type?.toLowerCase() === "grayscale");
                    if (idx >= 0) {
                      filters.splice(idx, 1);
                    } else {
                      filters.push(new fabric.Image.filters.Grayscale());
                    }
                    active.filters = filters;
                    active.applyFilters();
                    fabricCanvas.requestRenderAll();
                    forceRedraw((n) => n + 1);
                  });
                }}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  (active.filters as { type?: string }[] | undefined)?.some((f) => f?.type?.toLowerCase() === "grayscale")
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  (active.filters as { type?: string }[] | undefined)?.some((f) => f?.type?.toLowerCase() === "grayscale")
                    ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </Section>

          {cropOpen && (
            <CropImageDialog
              open={cropOpen}
              onClose={() => setCropOpen(false)}
              fabricCanvas={fabricCanvas}
              imageObject={active}
            />
          )}
        </>
      )}
    </div>
  );
}
