"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/store/editor-store";

interface CanvasStatusBarProps {
  fabricCanvas: unknown;
  selectionVersion: number;
}

export function CanvasStatusBar({ fabricCanvas, selectionVersion }: CanvasStatusBarProps) {
  const { template, zoom } = useEditorStore();
  const [objectCount, setObjectCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedType, setSelectedType] = useState<string>("");

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fc = fabricCanvas as any;
      const objs = fc.getObjects() as unknown[];
      setObjectCount(objs.length);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const active: any = fc.getActiveObject();
      if (!active) {
        setSelectedCount(0);
        setSelectedType("");
        return;
      }
      if (active.type === "activeSelection") {
        setSelectedCount((active._objects as unknown[])?.length ?? 0);
        setSelectedType("seleção múltipla");
      } else {
        setSelectedCount(1);
        const typeMap: Record<string, string> = {
          "i-text": "texto",
          text: "texto",
          textbox: "texto",
          image: "imagem",
          rect: "retângulo",
          circle: "círculo",
          ellipse: "elipse",
          triangle: "triângulo",
          polygon: "polígono",
          group: "grupo",
          path: "caminho",
          line: "linha",
        };
        setSelectedType(typeMap[active.type] ?? active.type);
      }
    };
    queueMicrotask(sync);
  }, [fabricCanvas, selectionVersion]);

  if (!template) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-1 border-t border-border bg-card/50 text-[10px] text-muted-foreground/70 flex-shrink-0 select-none">
      <span>{template.width} × {template.height}px</span>
      <span className="text-muted-foreground/40">|</span>
      <span>Zoom: {Math.round(zoom * 100)}%</span>
      <span className="text-muted-foreground/40">|</span>
      <span>{objectCount} {objectCount === 1 ? "objeto" : "objetos"}</span>
      {selectedCount > 0 && (
        <>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-primary/80">
            {selectedCount === 1
              ? `1 ${selectedType} selecionado`
              : `${selectedCount} objetos selecionados`}
          </span>
        </>
      )}
      <span className="ml-auto">
        Dica: Ctrl+D duplica • Ctrl+Z desfaz • ? atalhos
      </span>
    </div>
  );
}
