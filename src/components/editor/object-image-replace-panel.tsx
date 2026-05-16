"use client";

import { useEffect, useRef, useState } from "react";
import { Replace } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STOCK_PRESETS: Array<{ label: string; url: string }> = [
  { label: "Natureza 1", url: "https://picsum.photos/seed/n1/800/600" },
  { label: "Natureza 2", url: "https://picsum.photos/seed/n2/800/600" },
  { label: "Cidade", url: "https://picsum.photos/seed/c1/800/600" },
  { label: "Abstrato", url: "https://picsum.photos/seed/abs/800/600" },
  { label: "Pessoa", url: "https://picsum.photos/seed/p1/800/600" },
  { label: "Comida", url: "https://picsum.photos/seed/food/800/600" },
];

type SourceTab = "upload" | "url" | "presets";

interface PreserveOptions {
  position: boolean;
  size: boolean;
  rotation: boolean;
  filters: boolean;
  clipPath: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveImage(canvas: any): any | null {
  if (!canvas) return null;
  const obj = canvas.getActiveObject();
  if (!obj) return null;
  if (obj.type !== "image") return null;
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function snapshotProps(obj: any) {
  return {
    left: obj.left,
    top: obj.top,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
    angle: obj.angle,
    filters: obj.filters,
    clipPath: obj.clipPath,
    width: obj.width,
    height: obj.height,
  };
}

function replaceImageSource(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  url: string,
  preserve: PreserveOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const snapshot = snapshotProps(obj);
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        f.Image.fromURL(
          url,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (img: any) => {
            if (!img || !img.getElement) {
              reject(new Error("Falha ao carregar imagem"));
              return;
            }
            try {
              obj.setElement(img.getElement());

              if (preserve.position) {
                obj.set({ left: snapshot.left, top: snapshot.top });
              }
              if (preserve.size) {
                obj.set({
                  scaleX: snapshot.scaleX,
                  scaleY: snapshot.scaleY,
                });
              }
              if (preserve.rotation) {
                obj.set({ angle: snapshot.angle });
              }
              if (preserve.filters && snapshot.filters) {
                obj.filters = snapshot.filters;
                if (typeof obj.applyFilters === "function") {
                  obj.applyFilters();
                }
              }
              if (preserve.clipPath && snapshot.clipPath) {
                obj.clipPath = snapshot.clipPath;
              }

              obj.setCoords();
              canvas.requestRenderAll();
              resolve();
            } catch (err) {
              reject(err as Error);
            }
          },
          { crossOrigin: "anonymous" },
        );
      })
      .catch((err) => reject(err));
  });
}

interface ObjectImageReplacePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ObjectImageReplacePanel({
  fabricCanvas,
}: ObjectImageReplacePanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [tab, setTab] = useState<SourceTab>("upload");
  const [urlValue, setUrlValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [preserve, setPreserve] = useState<PreserveOptions>({
    position: true,
    size: true,
    rotation: true,
    filters: true,
    clipPath: true,
  });

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const runReplace = (url: string) => {
    const canvas = canvasRef.current;
    const obj = getActiveImage(canvas);
    if (!obj) {
      toast.error("Selecione uma imagem no canvas");
      return;
    }
    queueMicrotask(() => setBusy(true));
    replaceImageSource(canvas, obj, url, preserve)
      .then(() => {
        toast.success("Imagem substituída");
      })
      .catch((err: Error) => {
        toast.error(`Erro ao substituir: ${err.message ?? err}`);
      })
      .finally(() => {
        queueMicrotask(() => setBusy(false));
      });
  };

  const handleUpload = (file: File | null) => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl !== "string") {
        toast.error("Falha ao ler arquivo");
        return;
      }
      runReplace(dataUrl);
    };
    reader.onerror = () => toast.error("Erro ao ler arquivo");
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) {
      toast.error("Informe uma URL válida");
      return;
    }
    runReplace(trimmed);
  };

  const togglePreserve = (key: keyof PreserveOptions) => {
    setPreserve((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Replace className="h-4 w-4" />
        <h3 className="text-sm font-semibold">
          Substituir Imagem (Manter Posição)
        </h3>
      </div>

      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={tab === "upload" ? "default" : "outline"}
          onClick={() => setTab("upload")}
        >
          Upload
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "url" ? "default" : "outline"}
          onClick={() => setTab("url")}
        >
          URL
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "presets" ? "default" : "outline"}
          onClick={() => setTab("presets")}
        >
          Presets
        </Button>
      </div>

      {tab === "upload" && (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            className="block w-full text-xs"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file) handleUpload(file);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Selecione um arquivo para substituir a imagem.
          </p>
        </div>
      )}

      {tab === "url" && (
        <div className="space-y-2">
          <Input
            type="url"
            placeholder="https://..."
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={handleUrlSubmit}
          >
            Substituir por URL
          </Button>
        </div>
      )}

      {tab === "presets" && (
        <div className="grid grid-cols-2 gap-2">
          {STOCK_PRESETS.map((preset) => (
            <Button
              key={preset.url}
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => runReplace(preset.url)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-medium">Preservar</p>
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={preserve.position}
              onChange={() => togglePreserve("position")}
            />
            Manter posição
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={preserve.size}
              onChange={() => togglePreserve("size")}
            />
            Manter tamanho (escala)
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={preserve.rotation}
              onChange={() => togglePreserve("rotation")}
            />
            Manter rotação
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={preserve.filters}
              onChange={() => togglePreserve("filters")}
            />
            Manter filtros
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={preserve.clipPath}
              onChange={() => togglePreserve("clipPath")}
            />
            Manter clipPath
          </label>
        </div>
      </div>

      {tab === "upload" && (
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>(
              'input[type="file"][accept="image/*"]',
            );
            const file = input?.files?.[0] ?? null;
            handleUpload(file);
          }}
        >
          Carregar e Substituir
        </Button>
      )}
    </div>
  );
}
