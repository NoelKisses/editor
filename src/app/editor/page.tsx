"use client";

import { useCallback, useRef, useState } from "react";
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
  Frame,
  LayoutGrid,
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
  const { template } = useEditorStore();

  const handleCanvasReady = useCallback((canvas: unknown) => {
    fabricRef.current = canvas;
    setFabricCanvas(canvas);
  }, []);

  const handleSelectionChange = useCallback(() => {
    setSelectionVersion((n) => n + 1);
  }, []);

  useKeyboardShortcuts(fabricRef);

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
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — 6 abas */}
        <aside className="w-72 flex-shrink-0 border-r border-border bg-card/30 flex flex-col overflow-hidden">
          <Tabs defaultValue="templates" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid grid-cols-7 m-2 flex-shrink-0 h-8">
              <TabsTrigger value="templates" className="text-[9px] px-0.5 gap-0.5" title="Templates">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="shapes" className="text-[9px] px-0.5 gap-0.5" title="Formas">
                <Shapes className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="elements" className="text-[9px] px-0.5 gap-0.5" title="Elementos">
                <Sticker className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="icons" className="text-[9px] px-0.5 gap-0.5" title="Ícones">
                <LayoutGrid className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="frames" className="text-[9px] px-0.5 gap-0.5" title="Molduras">
                <Frame className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-[9px] px-0.5 gap-0.5" title="IA">
                <Sparkles className="w-3 h-3" />
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

            <TabsContent value="projects" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ProjectsPanel fabricCanvas={fabricCanvas} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <CanvasToolbar fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
          <CanvasContextMenu fabricCanvas={fabricCanvas} />
          <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-8">
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
        </main>

        {/* Right sidebar — 10 abas */}
        <aside className="w-64 flex-shrink-0 border-l border-border bg-card/30 flex flex-col overflow-hidden">
          <Tabs defaultValue="properties" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid grid-cols-10 m-2 flex-shrink-0 h-8">
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
            </TabsList>

            <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PropertiesPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="text" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <TextEffectsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
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
                <ColorPalettePanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="effects" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <EffectsPanel fabricCanvas={fabricCanvas} selectionVersion={selectionVersion} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
