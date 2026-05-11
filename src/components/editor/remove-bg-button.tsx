"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";

interface RemoveBgButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function RemoveBgButton({ fabricCanvas }: RemoveBgButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRemoveBg = useCallback(async () => {
    if (!fabricCanvas) return;
    const activeObj = fabricCanvas.getActiveObject();
    if (!activeObj || activeObj.type !== "image") {
      toast.error("Selecione uma imagem no canvas primeiro");
      return;
    }

    setLoading(true);
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
      const fabric = await import("fabric").then((m) => m.fabric);

      fabric.Image.fromURL(data.result, (newImg) => {
        newImg.set({
          left: activeObj.left,
          top: activeObj.top,
          scaleX: activeObj.scaleX,
          scaleY: activeObj.scaleY,
          angle: activeObj.angle,
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
    }
  }, [fabricCanvas]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRemoveBg}
      disabled={loading}
      className="w-full gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
      {loading ? "Removendo fundo..." : "Remover Fundo"}
    </Button>
  );
}
