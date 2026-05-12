"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/store/editor-store";
import { GenerateImageDialog } from "@/components/editor/generate-image-dialog";
import { ExportDialog } from "@/components/editor/export-dialog";
import { CropImageDialog } from "@/components/editor/crop-image-dialog";
import {
  Type,
  ImagePlus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Download,
  Wand2,
  Loader2,
  Sparkles,
  Copy,
  Clipboard,
  Scissors,
  CopyPlus,
  Grid3X3,
  AlignLeft,
  Crop,
} from "lucide-react";

interface CanvasToolbarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion?: number;
}

export function CanvasToolbar({ fabricCanvas, selectionVersion }: CanvasToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clipboardRef = useRef<any>(null);
  const {
    undo,
    redo,
    zoom,
    setZoom,
    selectedElementId,
    removeElement,
    isAnalyzing,
    setIsAnalyzing,
    setAiSuggestions,
    template,
    snapToGrid,
    setSnapToGrid,
  } = useEditorStore();

  const handleCopy = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (!active) return;
    active.clone((cloned: unknown) => {
      clipboardRef.current = cloned;
      toast.success("Copiado");
    });
  }, [fabricCanvas]);

  const handlePaste = useCallback(() => {
    if (!fabricCanvas || !clipboardRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clipboardRef.current.clone((newObj: any) => {
      fabricCanvas.discardActiveObject();
      newObj.set({
        left: (clipboardRef.current.left ?? 0) + 15,
        top: (clipboardRef.current.top ?? 0) + 15,
        evented: true,
      });
      fabricCanvas.add(newObj);
      clipboardRef.current.left += 15;
      clipboardRef.current.top += 15;
      fabricCanvas.setActiveObject(newObj);
      fabricCanvas.requestRenderAll();
      toast.success("Colado");
    });
  }, [fabricCanvas]);

  const handleCut = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (!active) return;
    active.clone((cloned: unknown) => { clipboardRef.current = cloned; });
    fabricCanvas.remove(active);
    fabricCanvas.requestRenderAll();
    if (selectedElementId) removeElement(selectedElementId);
    toast.success("Recortado");
  }, [fabricCanvas, selectedElementId, removeElement]);

  const handleDuplicate = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (!active) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    active.clone((cloned: any) => {
      cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
      fabricCanvas.add(cloned);
      fabricCanvas.setActiveObject(cloned);
      fabricCanvas.requestRenderAll();
      toast.success("Duplicado");
    });
  }, [fabricCanvas]);

  const addText = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    const text = new fabric.IText("Seu texto aqui", {
      left: 100,
      top: 100,
      fontSize: 48,
      fontFamily: "Arial",
      fill: "#ffffff",
      fontWeight: "bold",
      shadow: "rgba(0,0,0,0.5) 2px 2px 8px",
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Texto adicionado");
  }, [fabricCanvas]);

  const addTextbox = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    const textbox = new fabric.Textbox("Texto com\nquebra de linha", {
      left: 80,
      top: 80,
      width: 400,
      fontSize: 36,
      fontFamily: "Arial",
      fill: "#ffffff",
      fontWeight: "bold",
      textAlign: "center",
      shadow: "rgba(0,0,0,0.5) 2px 2px 8px",
    });
    fabricCanvas.add(textbox);
    fabricCanvas.setActiveObject(textbox);
    fabricCanvas.renderAll();
    toast.success("Textbox adicionado");
  }, [fabricCanvas]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length || !fabricCanvas) return;

      const fabric = await import("fabric").then((m) => m.fabric);
      let offset = 0;

      for (const file of files) {
        const src = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });

        fabric.Image.fromURL(src, (img) => {
          const maxW = fabricCanvas.getWidth() * 0.6;
          const maxH = fabricCanvas.getHeight() * 0.6;
          const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1));
          img.set({ left: 50 + offset, top: 50 + offset, scaleX: scale, scaleY: scale });
          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();
          offset += 20;
        });
      }

      toast.success(files.length > 1 ? `${files.length} imagens adicionadas` : "Imagem adicionada");
      e.target.value = "";
    },
    [fabricCanvas]
  );

  const handleExport = useCallback(() => {
    setExportOpen(true);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!fabricCanvas || !template) return;
    setIsAnalyzing(true);
    try {
      const dataURL = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.7 });
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataURL, template: template.name }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
        toast.success("Análise concluída! Veja as sugestões no painel.");
      }
    } catch {
      toast.error("Erro ao analisar imagem. Verifique sua GEMINI_API_KEY no .env.local.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [fabricCanvas, template, setIsAnalyzing, setAiSuggestions]);

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (active) {
      fabricCanvas.remove(active);
      fabricCanvas.renderAll();
      if (selectedElementId) removeElement(selectedElementId);
      toast.success("Elemento removido");
    }
  }, [fabricCanvas, selectedElementId, removeElement]);

  const zoomIn = () => setZoom(Math.min(parseFloat((zoom + 0.1).toFixed(2)), 5));
  const zoomOut = () => setZoom(Math.max(parseFloat((zoom - 0.1).toFixed(2)), 0.1));
  const zoomReset = () => setZoom(1);

  // selectionVersion causes re-render so this stays fresh
  void selectionVersion;
  const activeIsImage = fabricCanvas?.getActiveObject()?.type === "image";

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-card/50 flex-wrap">
      {/* Texto e Imagem */}
      <Button variant="ghost" size="sm" onClick={addText} title="Adicionar texto editável (IText)">
        <Type className="w-4 h-4 mr-1.5" />
        Texto
      </Button>
      <Button variant="ghost" size="sm" onClick={addTextbox} title="Adicionar caixa de texto com quebra de linha">
        <AlignLeft className="w-4 h-4 mr-1.5" />
        Caixa
      </Button>
      <Button variant="ghost" size="sm" onClick={addImage} title="Adicionar imagem">
        <ImagePlus className="w-4 h-4 mr-1.5" />
        Imagem
      </Button>
      {activeIsImage && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCropOpen(true)}
          title="Recortar imagem selecionada"
        >
          <Crop className="w-4 h-4 mr-1.5" />
          Recortar
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Clipboard */}
      <Button variant="ghost" size="icon" onClick={handleCopy} title="Copiar (Ctrl+C)">
        <Copy className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handlePaste} title="Colar (Ctrl+V)">
        <Clipboard className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleCut} title="Recortar (Ctrl+X)">
        <Scissors className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleDuplicate} title="Duplicar (Ctrl+D)">
        <CopyPlus className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <Button variant="ghost" size="icon" onClick={undo} title="Desfazer (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={redo} title="Refazer (Ctrl+Y)">
        <Redo2 className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom */}
      <Button variant="ghost" size="icon" onClick={zoomOut} title="Reduzir zoom">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <button
        onClick={zoomReset}
        className="text-xs text-muted-foreground hover:text-foreground w-12 text-center tabular-nums hover:bg-accent rounded px-1 py-0.5 transition-colors"
        title="Resetar zoom (100%)"
      >
        {Math.round(zoom * 100)}%
      </button>
      <Button variant="ghost" size="icon" onClick={zoomIn} title="Aumentar zoom">
        <ZoomIn className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Snap to grid */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSnapToGrid(!snapToGrid)}
        title={snapToGrid ? "Snap ativado (clique para desativar)" : "Snap desativado (clique para ativar)"}
        className={snapToGrid ? "text-primary bg-primary/10" : ""}
      >
        <Grid3X3 className="w-4 h-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Delete */}
      <Button variant="ghost" size="icon" onClick={handleDelete} title="Deletar elemento">
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>

      <div className="flex-1" />

      {/* Gerar, Analisar e Export */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setGenerateOpen(true)}
        className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 gap-1.5"
      >
        <Sparkles className="w-4 h-4" />
        Gerar com IA
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="border-primary/30 text-primary hover:bg-primary/10"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4 mr-1.5" />
        )}
        Analisar
      </Button>

      <Button size="sm" onClick={handleExport} className="gap-1.5">
        <Download className="w-4 h-4" />
        Exportar
      </Button>

      <GenerateImageDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        fabricCanvas={fabricCanvas}
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        fabricCanvas={fabricCanvas}
      />

      {cropOpen && activeIsImage && (
        <CropImageDialog
          open={cropOpen}
          onClose={() => setCropOpen(false)}
          fabricCanvas={fabricCanvas}
          imageObject={fabricCanvas.getActiveObject()}
        />
      )}
    </div>
  );
}
