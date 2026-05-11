"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ImageIcon } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

interface GenerateImageDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const PROMPT_SUGGESTIONS = [
  "Mulher sorrindo confiante, fundo desfocado roxo e azul",
  "Homem animado apontando para cima, fundo amarelo vibrante",
  "Paisagem épica ao pôr do sol com montanhas",
  "Comida gourmet apetitosa sobre mesa elegante",
  "Smartphone moderno com efeito de luz neon",
];

export function GenerateImageDialog({ open, onClose, fabricCanvas }: GenerateImageDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { template } = useEditorStore();

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Digite uma descrição para gerar a imagem");
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          width: template?.width ?? 1280,
          height: template?.height ?? 720,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro na geração");
      setPreview(data.image);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar imagem");
    } finally {
      setLoading(false);
    }
  }, [prompt, template]);

  const handleAddToCanvas = useCallback(async () => {
    if (!preview || !fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    fabric.Image.fromURL(preview, (img) => {
      const canvasW = fabricCanvas.getWidth();
      const canvasH = fabricCanvas.getHeight();
      const scale = Math.min(canvasW / (img.width || 1), canvasH / (img.height || 1));
      img.set({ left: 0, top: 0, scaleX: scale, scaleY: scale });
      fabricCanvas.add(img);
      fabricCanvas.sendToBack(img);
      fabricCanvas.renderAll();
      toast.success("Imagem adicionada ao canvas!");
      onClose();
    });
  }, [preview, fabricCanvas, onClose]);

  const handleClose = () => {
    setPrompt("");
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Imagem com Gemini IA
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Descreva a imagem que você quer
            </label>
            <textarea
              className="w-full min-h-[80px] resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex: Mulher sorrindo confiante com cabelo ao vento, fundo azul desfocado..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) handleGenerate();
              }}
            />
            <p className="text-xs text-muted-foreground">Dica: Ctrl+Enter para gerar</p>
          </div>

          {/* Sugestões */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Sugestões rápidas:</span>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Preview:</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Imagem gerada"
                className="w-full rounded-lg border border-border object-cover max-h-48"
              />
            </div>
          )}

          {!preview && !loading && (
            <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border bg-muted/10">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="w-8 h-8 opacity-30" />
                <span className="text-xs opacity-50">A imagem aparecerá aqui</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-24 rounded-lg border border-border bg-muted/10">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Gemini está gerando sua imagem...</span>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex-1 gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? "Gerando..." : "Gerar Imagem"}
            </Button>
            {preview && (
              <Button variant="outline" onClick={handleAddToCanvas} className="flex-1 gap-2">
                <ImageIcon className="w-4 h-4" />
                Adicionar ao Canvas
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
