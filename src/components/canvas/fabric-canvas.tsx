"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";

interface FabricCanvasProps {
  onCanvasReady?: (canvas: unknown) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricInstance = any;

export function FabricCanvas({ onCanvasReady }: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricInstance>(null);
  const { template, zoom } = useEditorStore();

  const initCanvas = useCallback(async () => {
    if (!canvasRef.current || !template) return;

    const fabric = await import("fabric").then((m) => m.fabric);

    if (fabricRef.current) {
      fabricRef.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: template.width,
      height: template.height,
      backgroundColor: template.backgroundColor,
      preserveObjectStacking: true,
      selection: true,
    });

    fabricRef.current = canvas;

    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    return () => {
      canvas.dispose();
    };
  }, [template, onCanvasReady]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  useEffect(() => {
    if (!fabricRef.current) return;
    const scale = zoom;
    fabricRef.current.setZoom(scale);
    fabricRef.current.setWidth(template ? template.width * scale : 0);
    fabricRef.current.setHeight(template ? template.height * scale : 0);
    fabricRef.current.renderAll();
  }, [zoom, template]);

  if (!template) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm">
        Selecione um template para começar
      </div>
    );
  }

  return (
    <div
      className="shadow-2xl"
      style={{
        width: template.width * zoom,
        height: template.height * zoom,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
