"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { CanvasContextMenu } from "@/components/canvas/canvas-context-menu";
import { TemplatePicker } from "@/components/editor/template-picker";
import { AiSuggestionsPanel } from "@/components/editor/ai-suggestions-panel";
import { AiTemplateGenerator } from "@/components/editor/ai-template-generator";
import { RemoveBgButton } from "@/components/editor/remove-bg-button";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { LayersPanel } from "@/components/editor/layers-panel";
import { ShapesPanel } from "@/components/editor/shapes-panel";
import { ElementsPanel } from "@/components/editor/elements-panel";
import { BackgroundPanel } from "@/components/editor/background-panel";
import { AlignTools } from "@/components/editor/align-tools";
import { TextEffectsPanel } from "@/components/editor/text-effects-panel";
import { HistoryPanel } from "@/components/editor/history-panel";
import { ProjectsPanel } from "@/components/editor/projects-panel";
import { ImageFiltersPanel } from "@/components/editor/image-filters-panel";
import { GradientPanel } from "@/components/editor/gradient-panel";
import { FramesPanel } from "@/components/editor/frames-panel";
import { IconsPanel } from "@/components/editor/icons-panel";
import { ColorPalettePanel } from "@/components/editor/color-palette-panel";
import { EffectsPanel } from "@/components/editor/effects-panel";
import { DrawPanel } from "@/components/editor/draw-panel";
import { PageStrip } from "@/components/editor/page-strip";
import { StockPhotosPanel } from "@/components/editor/stock-photos-panel";
import { KeyboardShortcutsModal } from "@/components/editor/keyboard-shortcuts-modal";
import { ClipMaskPanel } from "@/components/editor/clip-mask-panel";
import { ColorReplacePanel } from "@/components/editor/color-replace-panel";
import { QRCodePanel } from "@/components/editor/qrcode-panel";
import { CustomFontPanel } from "@/components/editor/custom-font-panel";
import { PresentationMode } from "@/components/editor/presentation-mode";
import { ResizeCanvasDialog } from "@/components/editor/resize-canvas-dialog";
import { OpacityBlendPanel } from "@/components/editor/opacity-blend-panel";
import { CurvedTextPanel } from "@/components/editor/curved-text-panel";
import { ColorPickerEyedropper } from "@/components/editor/color-picker-eyedropper";
import { TextTemplatesPanel } from "@/components/editor/text-templates-panel";
import { ImageCropPanel } from "@/components/editor/image-crop-panel";
import { MyImagesPanel } from "@/components/editor/my-images-panel";
import { CanvasStatusBar } from "@/components/editor/canvas-status-bar";
import { CanvasWithRulers } from "@/components/canvas/canvas-with-rulers";
import { GoogleFontsPanel } from "@/components/editor/google-fonts-panel";
import { BrandKitPanel } from "@/components/editor/brand-kit-panel";
import { TextStylesPanel } from "@/components/editor/text-styles-panel";
import { CanvasNotesPanel } from "@/components/editor/canvas-notes-panel";
import { EmojiPanel } from "@/components/editor/emoji-panel";
import { TypographyPanel } from "@/components/editor/typography-panel";
import { ShadowPanel } from "@/components/editor/shadow-panel";
import { BorderPanel } from "@/components/editor/border-panel";
import { FloatingToolbar } from "@/components/canvas/floating-toolbar";
import { PositionSizePanel } from "@/components/editor/position-size-panel";
import { TextFormatBar } from "@/components/editor/text-format-bar";
import { AnimationsPanel } from "@/components/editor/animations-panel";
import { GridSettingsPanel } from "@/components/editor/grid-settings-panel";
import { TablePanel } from "@/components/editor/table-panel";
import { MultiSelectPanel } from "@/components/editor/multi-select-panel";
import { AdvancedExportPanel } from "@/components/editor/advanced-export-panel";
import { VectorElementsPanel } from "@/components/editor/vector-elements-panel";
import { SmartResizePanel } from "@/components/editor/smart-resize-panel";
import { SmartGuidesPanel } from "@/components/editor/smart-guides-panel";
import { TextOnPathPanel } from "@/components/editor/text-on-path-panel";
import { PatternsPanel } from "@/components/editor/patterns-panel";
import { QuickStylesPanel } from "@/components/editor/quick-styles-panel";
import { PhotoFramesPanel } from "@/components/editor/photo-frames-panel";
import { TextEffectsAdvancedPanel } from "@/components/editor/text-effects-advanced-panel";
import { ImageAdjustmentsPanel } from "@/components/editor/image-adjustments-panel";
import { ObjectLockPanel } from "@/components/editor/object-lock-panel";
import { TextSpacingPanel } from "@/components/editor/text-spacing-panel";
import { DropShadowAdvancedPanel } from "@/components/editor/drop-shadow-advanced-panel";
import { ColorHarmonyPanel } from "@/components/editor/color-harmony-panel";
import { TransformPanel } from "@/components/editor/transform-panel";
import { useEditorStore } from "@/store/editor-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  Home,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Shapes,
  Sticker,
  ImageIcon,
  AlignCenter,
  Type,
  Clock,
  FolderOpen,
  Filter,
  Palette,
  Droplets,
  Zap,
  PenLine,
  Frame,
  LayoutGrid,
  Images,
  Keyboard,
  CheckCircle2,
  QrCode,
  Play,
  Maximize2,
  Crop,
  ImagePlus,
  StickyNote,
  Smile,
  Baseline,
  Eclipse,
  Square,
  Table,
  Grid3X3,
  Wind,
  Download,
  Spline,
  Crosshair,
  Wand2,
  SquareStack,
  Sliders,
  Lock,
  MoveHorizontal,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const FabricCanvas = dynamic(
  () => import("@/components/canvas/fabric-canvas").then((m) => m.FabricCanvas),
  { ssr: false }
);

export default function EditorPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fabricCanvas, setFabricCanvas] = useState<any>(null);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [resizeOpen, setResizeOpen] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const { template, lastSavedAt } = useEditorStore();

  const handleCanvasReady = useCallback((canvas: unknown) => {
    fabricRef.current = canvas;
    setFabricCanvas(canvas);
  }, []);

  const handleSelectionChange = useCallback(() => {
    setSelectionVersion((n) => n + 1);
  }, []);

  useKeyboardShortcuts(fabricRef);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "?") setShortcutsOpen((v) => !v);
      if (e.key === "F" && !e.ctrlKey && !e.metaKey) setFocusMode((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
        >
          <Home className="w-4 h-4" />
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-foreground">Editor</h1>
        <div className="ml-auto flex items-center gap-3">
          {lastSavedAt && (
            <span className="flex items-center gap-1 text-[11px] text-green-500/80" title={`Salvo às ${new Date(lastSavedAt).toLocaleTimeString()}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salvo</span>
            </span>
          )}
          {template && (
            <button
              onClick={() => setResizeOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
              title="Redimensionar canvas"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Redimensionar</span>
            </button>
          )}
          {template && (
            <button
              onClick={() => setPresentationOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
              title="Modo Apresentação"
            >
              <Play className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apresentar</span>
            </button>
          )}
          <button
            onClick={() => setFocusMode((v) => !v)}
            className={`flex items-center gap-1.5 text-[11px] transition-colors px-2 py-1 rounded hover:bg-accent ${focusMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="Modo Foco — esconde painéis laterais (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{focusMode ? "Foco" : "Foco"}</span>
          </button>
          {fabricCanvas && (
            <button
              onClick={() => {
                const dataUrl = fabricCanvas.toDataURL({ format: "png", multiplier: 1 });
                const link = document.createElement("a");
                link.download = "design.png";
                link.href = dataUrl;
                link.click();
              }}
              className="flex items-center gap-1.5 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-3 py-1.5 rounded-md font-medium"
              title="Exportar PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
            title="Atalhos de teclado (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atalhos</span>
          </button>
        </div>
        {template && (
          <>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {template.name} — {template.width}×{template.height}px
            </span>
          </>
        )}
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Focus mode toggle */}
        {focusMode && (
          <button
            onClick={() => setFocusMode(false)}
            className="absolute top-2 right-2 z-20 text-[10px] text-white/50 hover:text-white/80 bg-black/40 px-2 py-1 rounded transition-colors"
            title="Sair do modo foco (F)"
          >
            Sair do Foco
          </button>
        )}
        {/* Left sidebar */}
        <aside className={`w-72 flex-shrink-0 border-r border-border bg-card/30 flex flex-col overflow-hidden transition-all duration-300 ${focusMode ? "hidden" : ""}`}>
          <Tabs defaultValue="templates" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid m-2 flex-shrink-0 h-8" style={{ gridTemplateColumns: "repeat(20, minmax(0, 1fr))" }}>
              <TabsTrigger value="templates" className="text-[9px] px-0.5 gap-0.5" title="Templates">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shapes" className="text-[9px] px-0.5 gap-0.5" title="Formas">
                <Shapes className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="elements" className="text-[9px] px-0.5 gap-0.5" title="Elementos">
                <Sticker className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="vector" className="text-[9px] px-0.5 gap-0.5" title="Vetores (Linhas, Polígonos, Estrelas)">
                <Spline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="icons" className="text-[9px] px-0.5 gap-0.5" title="Ícones">
                <LayoutGrid className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="emoji" className="text-[9px] px-0.5 gap-0.5" title="Emojis">
                <Smile className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="frames" className="text-[9px] px-0.5 gap-0.5" title="Molduras">
                <Frame className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-[9px] px-0.5 gap-0.5" title="Fotos Stock">
                <Images className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="myimages" className="text-[9px] px-0.5 gap-0.5" title="Minhas Imagens">
                <ImagePlus className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="table" className="text-[9px] px-0.5 gap-0.5" title="Tabela">
                <Table className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textpath" className="text-[9px] px-0.5 gap-0.5" title="Texto em Caminho">
                <Spline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-[9px] px-0.5 gap-0.5" title="Padrões e Texturas">
                <SquareStack className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="quickstyles" className="text-[9px] px-0.5 gap-0.5" title="Estilos Rápidos">
                <Wand2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="qrcode" className="text-[9px] px-0.5 gap-0.5" title="QR Code">
                <QrCode className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="fonts" className="text-[9px] px-0.5 gap-0.5" title="Fontes">
                <Type className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-[9px] px-0.5 gap-0.5" title="IA">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="draw" className="text-[9px] px-0.5 gap-0.5" title="Desenho Livre">
                <PenLine className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="photoframes" className="text-[9px] px-0.5 gap-0.5" title="Molduras para Fotos">
                <SquareStack className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="projects" className="text-[9px] px-0.5 gap-0.5" title="Projetos">
                <FolderOpen className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <TemplatePicker />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="shapes" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <ShapesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="elements" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <ElementsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="vector" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <VectorElementsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="icons" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <IconsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="frames" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <FramesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="emoji" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <EmojiPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="photos" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <StockPhotosPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="myimages" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <MyImagesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="table" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TablePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textpath" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextOnPathPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="patterns" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PatternsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="quickstyles" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <QuickStylesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="photoframes" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PhotoFramesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="qrcode" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <QRCodePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="fonts" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <GoogleFontsPanel fabricCanvas={fabricCanvas} />
                <div className="border-t border-border">
                  <CustomFontPanel fabricCanvas={fabricCanvas} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4">
                  <AiTemplateGenerator fabricCanvas={fabricCanvas} />
                  <div className="border-t border-border pt-4">
                    <AiSuggestionsPanel />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="draw" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <DrawPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="projects" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ProjectsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <CanvasToolbar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} showRulers={showRulers} onToggleRulers={() => setShowRulers((v) => !v)} />
          <CanvasContextMenu fabricCanvas={fabricCanvas} />
          <div className="flex-1 overflow-hidden bg-[#1a1a1a]">
            <CanvasWithRulers fabricCanvas={fabricCanvas} showRulers={showRulers} onToggleRulers={() => setShowRulers((v) => !v)}>
              <div className="w-full h-full flex items-center justify-center p-8">
                {template ? (
                  <FabricCanvas
                    onCanvasReady={handleCanvasReady}
                    onSelectionChange={handleSelectionChange}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-muted-foreground text-center max-w-sm">
                    <Layers className="w-12 h-12 opacity-20" />
                    <div>
                      <p className="font-medium text-foreground/60 mb-1">Nenhum template selecionado</p>
                      <p className="text-sm opacity-60">
                        Escolha um template no painel esquerdo para começar a criar sua thumbnail
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CanvasWithRulers>
          </div>
          {template && <PageStrip fabricCanvas={fabricCanvas} />}
        </main>

        {/* Right sidebar */}
        <aside className={`w-64 flex-shrink-0 border-l border-border bg-card/30 flex flex-col overflow-hidden transition-all duration-300 ${focusMode ? "hidden" : ""}`}>
          <Tabs defaultValue="properties" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid m-2 flex-shrink-0 h-8" style={{ gridTemplateColumns: "repeat(27, minmax(0, 1fr))" }}>
              <TabsTrigger value="properties" title="Propriedades" className="px-0.5">
                <SlidersHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="text" title="Texto" className="px-0.5">
                <Type className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="gradient" title="Gradiente" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="filters" title="Filtros de Imagem" className="px-0.5">
                <Filter className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="crop" title="Recortar Imagem" className="px-0.5">
                <Crop className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="layers" title="Camadas" className="px-0.5">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="align" title="Alinhar" className="px-0.5">
                <AlignCenter className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="background" title="Fundo" className="px-0.5">
                <ImageIcon className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="history" title="Histórico" className="px-0.5">
                <Clock className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="palette" title="Paletas de Cores" className="px-0.5">
                <Droplets className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="effects" title="Efeitos (Sombra e Borda)" className="px-0.5">
                <Zap className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="typography" title="Tipografia" className="px-0.5">
                <Baseline className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shadow" title="Sombra" className="px-0.5">
                <Eclipse className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="border" title="Contorno" className="px-0.5">
                <Square className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="animations" title="Animações" className="px-0.5">
                <Wind className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="grid" title="Grade e Guias" className="px-0.5">
                <Grid3X3 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="notes" title="Notas do Design" className="px-0.5">
                <StickyNote className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="export" title="Exportar" className="px-0.5">
                <Download className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="smartresize" title="Smart Resize" className="px-0.5">
                <Maximize2 className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="guides" title="Guias e Snap" className="px-0.5">
                <Crosshair className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textfx" title="Efeitos de Texto Avançados" className="px-0.5">
                <Sparkles className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="imgadj" title="Ajustes de Imagem" className="px-0.5">
                <Sliders className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="objlock" title="Bloqueio e Ordenação" className="px-0.5">
                <Lock className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="textspacing" title="Espaçamento de Texto" className="px-0.5">
                <MoveHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="dropshadow" title="Sombra Avançada" className="px-0.5">
                <Eclipse className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="colorharmony" title="Harmonia de Cores" className="px-0.5">
                <Palette className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="transform" title="Transformações" className="px-0.5">
                <RefreshCw className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PositionSizePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border">
                  <PropertiesPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="text" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextFormatBar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border">
                  <TextStylesPanel fabricCanvas={fabricCanvas} />
                </div>
                <div className="border-t border-border">
                  <TextEffectsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
                <div className="border-t border-border mt-2">
                  <TextTemplatesPanel fabricCanvas={fabricCanvas} />
                </div>
                <div className="border-t border-border mt-2">
                  <CurvedTextPanel fabricCanvas={fabricCanvas} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="gradient" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <GradientPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="filters" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageFiltersPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="crop" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageCropPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="layers" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <LayersPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="align" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-3 pb-3">
                  <AlignTools fabricCanvas={fabricCanvas} />
                  <div className="mt-4">
                    <RemoveBgButton fabricCanvas={fabricCanvas} />
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <ImageCropPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                  </div>
                  <div className="mt-4 border-t border-border pt-4">
                    <ClipMaskPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="background" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-3 pb-3">
                  <BackgroundPanel fabricCanvas={fabricCanvas} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <HistoryPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="palette" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <BrandKitPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border">
                  <ColorPalettePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
                <div className="border-t border-border mt-2">
                  <ColorPickerEyedropper fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
                <div className="border-t border-border mt-2">
                  <ColorReplacePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="effects" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <EffectsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                <div className="border-t border-border mt-2">
                  <OpacityBlendPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="typography" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TypographyPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="shadow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ShadowPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="border" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <BorderPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="animations" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <AnimationsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="grid" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <GridSettingsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <CanvasNotesPanel />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="export" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <AdvancedExportPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="smartresize" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <SmartResizePanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="guides" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <SmartGuidesPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textfx" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextEffectsAdvancedPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="imgadj" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ImageAdjustmentsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="objlock" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ObjectLockPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="textspacing" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextSpacingPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dropshadow" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <DropShadowAdvancedPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="colorharmony" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ColorHarmonyPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="transform" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TransformPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
      <FloatingToolbar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
      <MultiSelectPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
      <CanvasStatusBar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      {presentationOpen && fabricCanvas && (
        <PresentationMode fabricCanvas={fabricCanvas} onClose={() => setPresentationOpen(false)} />
      )}
      <ResizeCanvasDialog open={resizeOpen} onClose={() => setResizeOpen(false)} fabricCanvas={fabricCanvas} />
    </div>
  );
}
