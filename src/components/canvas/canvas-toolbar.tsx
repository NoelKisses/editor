"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/store/editor-store";
import { GenerateImageDialog } from "@/components/editor/generate-image-dialog";
import { ExportDialog } from "@/components/editor/export-dialog";
import { CropImageDialog } from "@/components/editor/crop-image-dialog";
import { ResizeCanvasDialog } from "@/components/editor/resize-canvas-dialog";
import { PresentationMode } from "@/components/editor/presentation-mode";
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
  Maximize2,
  ChevronDown,
  Presentation,
  FlipHorizontal2,
  FlipVertical2,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  Ruler as RulerIcon,
} from "lucide-react";

interface CanvasToolbarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion?: number;
  showRulers?: boolean;
  onToggleRulers?: () => void;
}

const TEXT_STYLES = [
  { label: "Título", fontSize: 72, fontWeight: "bold", fontFamily: "Arial", fill: "#ffffff", shadow: "rgba(0,0,0,0.6) 3px 3px 10px" },
  { label: "Subtítulo", fontSize: 48, fontWeight: "bold", fontFamily: "Arial", fill: "#eeeeee", shadow: "rgba(0,0,0,0.4) 2px 2px 6px" },
  { label: "Corpo", fontSize: 28, fontWeight: "normal", fontFamily: "Arial", fill: "#dddddd", shadow: "rgba(0,0,0,0.3) 1px 1px 4px" },
  { label: "Legenda", fontSize: 18, fontWeight: "normal", fontFamily: "Arial", fill: "#aaaaaa", shadow: "" },
] as const;

export function CanvasToolbar({ fabricCanvas, selectionVersion, showRulers, onToggleRulers }: CanvasToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);
  const [textStylesOpen, setTextStylesOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
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
    clipboard,
    setClipboard,
  } = useEditorStore();
  // Keep a ref for paste so it can always read latest clipboard without stale closure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clipboardRef = useRef<any>(null);
  useEffect(() => { clipboardRef.current = clipboard; }, [clipboard]);

  const handleCopy = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (!active) return;
    active.clone((cloned: unknown) => {
      clipboardRef.current = cloned;
      setClipboard(cloned);
      toast.success("Copiado");
    });
  }, [fabricCanvas, setClipboard]);

  const handlePaste = useCallback(() => {
    const cb = clipboardRef.current;
    if (!fabricCanvas || !cb) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb.clone((newObj: any) => {
      fabricCanvas.discardActiveObject();
      newObj.set({
        left: (cb.left ?? 0) + 15,
        top: (cb.top ?? 0) + 15,
        evented: true,
      });
      fabricCanvas.add(newObj);
      cb.left += 15;
      cb.top += 15;
      fabricCanvas.setActiveObject(newObj);
      fabricCanvas.requestRenderAll();
      toast.success("Colado");
    });
  }, [fabricCanvas]);

  const handleCut = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (!active) return;
    active.clone((cloned: unknown) => {
      clipboardRef.current = cloned;
      setClipboard(cloned);
    });
    fabricCanvas.remove(active);
    fabricCanvas.requestRenderAll();
    if (selectedElementId) removeElement(selectedElementId);
    toast.success("Recortado");
  }, [fabricCanvas, selectedElementId, removeElement, setClipboard]);

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

  const addTextWithStyle = useCallback(async (style: typeof TEXT_STYLES[number]) => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    const text = new fabric.IText(style.label, {
      left: 100,
      top: 100,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fill: style.fill,
      fontWeight: style.fontWeight,
      shadow: style.shadow || undefined,
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success(`${style.label} adicionado`);
    setTextStylesOpen(false);
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

  useEffect(() => {
    if (!textStylesOpen) return;
    const close = () => setTextStylesOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [textStylesOpen]);

  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);

  const zoomIn = () => setZoom(Math.min(parseFloat((zoom + 0.1).toFixed(2)), 5));
  const zoomOut = () => setZoom(Math.max(parseFloat((zoom - 0.1).toFixed(2)), 0.1));
  const zoomFit = useCallback(() => {
    if (!template || !fabricCanvas) { setZoom(1); return; }
    const containerEl = fabricCanvas.wrapperEl?.parentElement as HTMLElement | null;
    if (!containerEl) { setZoom(1); return; }
    const availW = containerEl.clientWidth - 64;
    const availH = containerEl.clientHeight - 64;
    const fit = Math.min(availW / template.width, availH / template.height, 1);
    setZoom(parseFloat(fit.toFixed(2)));
  }, [template, fabricCanvas, setZoom]);

  useEffect(() => {
    if (!zoomMenuOpen) return;
    const close = () => setZoomMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [zoomMenuOpen]);

  const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];

  // selectionVersion causes re-render so this stays fresh
  void selectionVersion;
  const activeObj = fabricCanvas?.getActiveObject();
  const activeIsImage = activeObj?.type === "image";
  const isLocked = activeObj ? activeObj.lockMovementX === true : false;

  const handleFlipH = useCallback(() => {
    const active = fabricCanvas?.getActiveObject();
    if (!active) return;
    active.set({ flipX: !active.flipX });
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const handleFlipV = useCallback(() => {
    const active = fabricCanvas?.getActiveObject();
    if (!active) return;
    active.set({ flipY: !active.flipY });
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const handleToggleLock = useCallback(() => {
    const active = fabricCanvas?.getActiveObject();
    if (!active) return;
    const lock = !active.lockMovementX;
    active.set({
      lockMovementX: lock,
      lockMovementY: lock,
      lockRotation: lock,
      lockScalingX: lock,
      lockScalingY: lock,
      hasControls: !lock,
      hoverCursor: lock ? "not-allowed" : "move",
    });
    fabricCanvas.requestRenderAll();
    toast.success(lock ? "Objeto bloqueado" : "Objeto desbloqueado");
  }, [fabricCanvas]);

  const handleBringToFront = useCallback(() => {
    const active = fabricCanvas?.getActiveObject();
    if (!active) return;
    fabricCanvas.bringToFront(active);
    fabricCanvas.requestRenderAll();
    toast.success("Movido para frente");
  }, [fabricCanvas]);

  const handleSendToBack = useCallback(() => {
    const active = fabricCanvas?.getActiveObject();
    if (!active) return;
    fabricCanvas.sendToBack(active);
    fabricCanvas.requestRenderAll();
    toast.success("Movido para trás");
  }, [fabricCanvas]);

  const handleBringForward = useCallback(() => {
    const active = fabricCanvas?.getActiveObject();
    if (!active) return;
    fabricCanvas.bringForward(active);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const handleSendBackward = useCallback(() => {
    const active = fabricCanvas?.getActiveObject();
    if (!active) return;
    fabricCanvas.sendBackwards(active);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const handleGroup = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (!active || active.type !== "activeSelection") {
      toast.error("Selecione múltiplos objetos para agrupar");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (active as any).toGroup();
    fabricCanvas.requestRenderAll();
    toast.success("Agrupado");
  }, [fabricCanvas]);

  const handleUngroup = useCallback(() => {
    if (!fabricCanvas) return;
    const active = fabricCanvas.getActiveObject();
    if (!active || active.type !== "group") {
      toast.error("Selecione um grupo para desagrupar");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (active as any).toActiveSelection();
    fabricCanvas.requestRenderAll();
    toast.success("Desagrupado");
  }, [fabricCanvas]);

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-card/50 flex-wrap">
      {/* Texto e Imagem */}
      <div className="relative flex">
        <Button variant="ghost" size="sm" onClick={addText} title="Adicionar texto editável (IText)" className="rounded-r-none pr-2">
          <Type className="w-4 h-4 mr-1.5" />
          Texto
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-l-none pl-1 pr-1.5 border-l border-border/50"
          onClick={() => setTextStylesOpen((v) => !v)}
          title="Estilos de texto"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
        {textStylesOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[180px]" onClick={(e) => e.stopPropagation()}>
            {TEXT_STYLES.map((style) => (
              <button
                key={style.label}
                onClick={() => addTextWithStyle(style)}
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between gap-3"
              >
                <span className="text-foreground" style={{ fontSize: Math.min(style.fontSize * 0.22, 15), fontWeight: style.fontWeight, fontFamily: style.fontFamily }}>
                  {style.label}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{style.fontSize}px</span>
              </button>
            ))}
            <div className="border-t border-border">
              <button
                onClick={addTextbox}
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-xs text-muted-foreground"
              >
                Caixa de texto multi-linha
              </button>
            </div>
          </div>
        )}
      </div>
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
      {activeObj && (
        <>
          <Button variant="ghost" size="icon" onClick={handleFlipH} title="Espelhar horizontalmente">
            <FlipHorizontal2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleFlipV} title="Espelhar verticalmente">
            <FlipVertical2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleLock}
            title={isLocked ? "Desbloquear objeto" : "Bloquear objeto"}
            className={isLocked ? "text-amber-400" : ""}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="ghost" size="icon" onClick={handleBringToFront} title="Trazer para frente (topo)">
            <BringToFront className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleBringForward} title="Avançar uma camada">
            <BringToFront className="w-3.5 h-3.5 opacity-60" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSendBackward} title="Recuar uma camada">
            <SendToBack className="w-3.5 h-3.5 opacity-60" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSendToBack} title="Enviar para trás (fundo)">
            <SendToBack className="w-4 h-4" />
          </Button>
          {activeObj.type === "activeSelection" && (
            <Button variant="ghost" size="icon" onClick={handleGroup} title="Agrupar seleção (Ctrl+G)">
              <Group className="w-4 h-4" />
            </Button>
          )}
          {activeObj.type === "group" && (
            <Button variant="ghost" size="icon" onClick={handleUngroup} title="Desagrupar (Ctrl+Shift+G)">
              <Ungroup className="w-4 h-4" />
            </Button>
          )}
        </>
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
      <Button variant="ghost" size="icon" onClick={zoomOut} title="Reduzir zoom (Ctrl+-)">
        <ZoomOut className="w-4 h-4" />
      </Button>
      <div className="relative">
        <button
          onClick={() => setZoomMenuOpen((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground w-14 text-center tabular-nums hover:bg-accent rounded px-1 py-0.5 transition-colors"
          title="Clique para escolher zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        {zoomMenuOpen && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[110px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { zoomFit(); setZoomMenuOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors text-primary font-medium"
            >
              Ajustar à tela
            </button>
            <div className="border-t border-border" />
            {ZOOM_PRESETS.map((z) => (
              <button
                key={z}
                onClick={() => { setZoom(z); setZoomMenuOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center justify-between ${zoom === z ? "text-primary bg-primary/10" : "text-foreground"}`}
              >
                <span>{Math.round(z * 100)}%</span>
                {zoom === z && <span className="text-[9px]">●</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={zoomIn} title="Aumentar zoom (Ctrl++)">
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

      {/* Rulers toggle */}
      {onToggleRulers && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRulers}
          title={showRulers ? "Ocultar réguas" : "Mostrar réguas"}
          className={showRulers ? "text-primary bg-primary/10" : ""}
        >
          <RulerIcon className="w-4 h-4" />
        </Button>
      )}

      <Separator orientation="vertical" className="h-6" />

      {/* Delete */}
      <Button variant="ghost" size="icon" onClick={handleDelete} title="Deletar elemento">
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Resize canvas */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setResizeOpen(true)}
        title="Redimensionar canvas"
      >
        <Maximize2 className="w-4 h-4 mr-1.5" />
        Formato
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

      <Button
        variant="outline"
        size="sm"
        onClick={() => setPresentationOpen(true)}
        title="Modo apresentação (slideshow)"
        className="gap-1.5 border-border"
      >
        <Presentation className="w-4 h-4" />
        Apresentar
      </Button>

      <Button size="sm" onClick={handleExport} className="gap-1.5">
        <Download className="w-4 h-4" />
        Exportar
      </Button>

      {presentationOpen && fabricCanvas && (
        <PresentationMode
          fabricCanvas={fabricCanvas}
          onClose={() => setPresentationOpen(false)}
        />
      )}

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

      <ResizeCanvasDialog
        open={resizeOpen}
        onClose={() => setResizeOpen(false)}
        fabricCanvas={fabricCanvas}
      />
    </div>
  );
}
