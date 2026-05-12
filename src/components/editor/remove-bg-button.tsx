"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Cpu, Cloud } from "lucide-react";

interface RemoveBgButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BgRemoveMode = "local" | "api";

export function RemoveBgButton({ fabricCanvas }: RemoveBgButtonProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<BgRemoveMode>("local");
  const [progress, setProgress] = useState("");

  const handleRemoveBgLocal = useCallback(async () => {
    if (!fabricCanvas) return;
    const activeObj = fabricCanvas.getActiveObject();
    if (!activeObj || activeObj.type !== "image") {
      toast.error("Selecione uma imagem no canvas primeiro");
      return;
    }

    setLoading(true);
    setProgress("Carregando modelo IA...");
    try {
      // Dynamic import to avoid SSR issues with WebAssembly
      const { removeBackground } = await import("@imgly/background-removal");

      setProgress("Processando imagem...");
      const dataURL: string = activeObj.toDataURL({ format: "png" });

      // Convert data URL to Blob
      const res = await fetch(dataURL);
      const blob = await res.blob();

      setProgress("Removendo fundo com IA local...");
      const resultBlob = await removeBackground(blob, {
        // Use minimal model for speed
        model: "isnet",
        output: { format: "image/png", quality: 0.9 },
        // Progress callback
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            setProgress(`${key}: ${Math.round((current / total) * 100)}%`);
          }
        },
      });

      const resultURL = URL.createObjectURL(resultBlob);
      const { fabric } = await import("fabric");

      fabric.Image.fromURL(resultURL, (newImg) => {
        newImg.set({
          left: activeObj.left,
          top: activeObj.top,
          scaleX: activeObj.scaleX,
          scaleY: activeObj.scaleY,
          angle: activeObj.angle ?? 0,
        });
        fabricCanvas.remove(activeObj);
        fabricCanvas.add(newImg);
        fabricCanvas.setActiveObject(newImg);
        fabricCanvas.requestRenderAll();
        URL.revokeObjectURL(resultURL);
        toast.success("Fundo removido com IA local!");
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro na remoção local: ${msg}`);
    } finally {
      setLoading(false);
      setProgress("");
    }
  }, [fabricCanvas]);

  const handleRemoveBgApi = useCallback(async () => {
    if (!fabricCanvas) return;
    const activeObj = fabricCanvas.getActiveObject();
    if (!activeObj || activeObj.type !== "image") {
      toast.error("Selecione uma imagem no canvas primeiro");
      return;
    }

    setLoading(true);
    setProgress("Enviando para Remove.bg...");
    try {
      const dataURL = activeObj.toDataURL({ format: "png" });
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataURL }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha na remoção de fundo");
      }

      const data = await res.json();
      const { fabric } = await import("fabric");

      fabric.Image.fromURL(data.result, (newImg) => {
        newImg.set({
          left: activeObj.left,
          top: activeObj.top,
          scaleX: activeObj.scaleX,
          scaleY: activeObj.scaleY,
          angle: activeObj.angle ?? 0,
        });
        fabricCanvas.remove(activeObj);
        fabricCanvas.add(newImg);
        fabricCanvas.setActiveObject(newImg);
        fabricCanvas.renderAll();
        toast.success("Fundo removido com sucesso!");
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro: ${msg}`);
    } finally {
      setLoading(false);
      setProgress("");
    }
  }, [fabricCanvas]);

  const handleRemove = () => {
    if (mode === "local") handleRemoveBgLocal();
    else handleRemoveBgApi();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Mode selector */}
      <div className="flex rounded-md overflow-hidden border border-border text-xs">
        <button
          onClick={() => setMode("local")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${
            mode === "local" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
          }`}
          title="Processamento local — gratuito, sem limite de uso"
        >
          <Cpu className="w-3 h-3" />
          Local (grátis)
        </button>
        <button
          onClick={() => setMode("api")}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${
            mode === "api" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
          }`}
          title="Remove.bg API — requer REMOVE_BG_API_KEY"
        >
          <Cloud className="w-3 h-3" />
          Remove.bg
        </button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleRemove}
        disabled={loading || !fabricCanvas}
        className="w-full gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {loading ? (progress || "Processando...") : "Remover Fundo"}
      </Button>

      {mode === "local" && !loading && (
        <p className="text-[10px] text-muted-foreground text-center">
          Processamento 100% local — sem enviar dados
        </p>
      )}
    </div>
  );
}
