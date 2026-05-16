"use client";

import { useEffect, useRef, useState } from "react";
import { Grid2X2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectPixelatePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removePixelateFilter(obj: any) {
  if (!obj || !Array.isArray(obj.filters)) return;
  obj.filters = obj.filters.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (filter: any) => filter && filter.type !== "Pixelate"
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addPixelateFilter(f: any, obj: any, blocksize: number) {
  if (!obj) return;
  if (!Array.isArray(obj.filters)) {
    obj.filters = [];
  }
  removePixelateFilter(obj);
  const pixelate = new f.Image.filters.Pixelate({ blocksize });
  obj.filters.push(pixelate);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedImages(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObjects?.() ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return active.filter((o: any) => o && o.type === "image");
}

export function ObjectPixelatePanel({ fabricCanvas }: ObjectPixelatePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalsRef = useRef<Map<any, any[]>>(new Map());
  const [blocksize, setBlocksize] = useState<number>(8);
  const [hasImageSelected, setHasImageSelected] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;

    const updateSelection = () => {
      const images = getSelectedImages(fabricCanvas);
      queueMicrotask(() => setHasImageSelected(images.length > 0));
    };

    updateSelection();

    fabricCanvas.on?.("selection:created", updateSelection);
    fabricCanvas.on?.("selection:updated", updateSelection);
    fabricCanvas.on?.("selection:cleared", updateSelection);

    return () => {
      fabricCanvas.off?.("selection:created", updateSelection);
      fabricCanvas.off?.("selection:updated", updateSelection);
      fabricCanvas.off?.("selection:cleared", updateSelection);
    };
  }, [fabricCanvas]);

  const handleApply = async (size?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const images = getSelectedImages(canvas);
    if (images.length === 0) {
      toast.error("Selecione uma imagem para pixelar");
      return;
    }

    const value = typeof size === "number" ? size : blocksize;

    try {
      const fabricModule = await import("fabric");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f: any =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fabricModule as any).fabric ?? fabricModule;

      if (!f?.Image?.filters?.Pixelate) {
        toast.error("Filtro Pixelate indisponível no fabric");
        return;
      }

      for (const obj of images) {
        if (!originalsRef.current.has(obj)) {
          originalsRef.current.set(
            obj,
            Array.isArray(obj.filters) ? [...obj.filters] : []
          );
        }
        addPixelateFilter(f, obj, value);
        obj.applyFilters?.();
      }

      canvas.requestRenderAll?.();
      toast.success(`Pixelar aplicado (${value})`);
    } catch (error) {
      console.error("Erro ao aplicar pixelar:", error);
      toast.error("Falha ao aplicar pixelar");
    }
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const images = getSelectedImages(canvas);
    if (images.length === 0) {
      toast.error("Selecione uma imagem para remover o pixelar");
      return;
    }

    for (const obj of images) {
      removePixelateFilter(obj);
      obj.applyFilters?.();
      originalsRef.current.delete(obj);
    }

    canvas.requestRenderAll?.();
    toast.success("Pixelar removido");
  };

  const handlePreset = (value: number) => {
    setBlocksize(value);
    void handleApply(value);
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Grid2X2 className="h-4 w-4" />
        <h3 className="text-sm font-medium">Pixelar Imagem</h3>
      </div>

      {!hasImageSelected ? (
        <p className="text-xs text-muted-foreground">
          Selecione uma imagem no canvas para aplicar o efeito de pixelar.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Tamanho do bloco
              </span>
              <span className="text-xs font-medium">{blocksize}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={blocksize}
                onChange={(e) => setBlocksize(Number(e.target.value))}
                className="w-full"
              />
              <Input
                type="number"
                min={2}
                max={30}
                value={blocksize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) {
                    setBlocksize(Math.min(30, Math.max(2, v)));
                  }
                }}
                className="w-16 h-8"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset(2)}
            >
              Sutil (2)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset(8)}
            >
              Médio (8)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset(16)}
            >
              Forte (16)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreset(24)}
            >
              8-bit (24)
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={() => handleApply()}>
              Aplicar Pixelar
            </Button>
            <Button size="sm" variant="secondary" onClick={handleRemove}>
              Remover Pixelar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
