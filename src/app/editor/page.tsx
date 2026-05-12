"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { TemplatePicker } from "@/components/editor/template-picker";
import { AiSuggestionsPanel } from "@/components/editor/ai-suggestions-panel";
import { RemoveBgButton } from "@/components/editor/remove-bg-button";
import { PropertiesPanel } from "@/components/editor/properties-panel";
import { LayersPanel } from "@/components/editor/layers-panel";
import { ShapesPanel } from "@/components/editor/shapes-panel";
import { ElementsPanel } from "@/components/editor/elements-panel";
import { BackgroundPanel } from "@/components/editor/background-panel";
import { AlignTools } from "@/components/editor/align-tools";
import { useEditorStore } from "@/store/editor-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import {
  Home,
  Layers,
  Sparkles,
  Settings2,
  SlidersHorizontal,
  Shapes,
  Sticker,
  ImageIcon,
  AlignCenter,
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
  const [, forceUpdate] = useState(0);
  const [selectionVersion, setSelectionVersion] = useState(0);
  const { template } = useEditorStore();

  const handleCanvasReady = useCallback((canvas: unknown) => {
    fabricRef.current = canvas;
    forceUpdate((n) => n + 1);
  }, []);

  const handleSelectionChange = useCallback(() => {
    setSelectionVersion((n) => n + 1);
  }, []);

  useKeyboardShortcuts(fabricRef.current);

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
        {/* Left sidebar */}
        <aside className="w-72 flex-shrink-0 border-r border-border bg-card/30 flex flex-col overflow-hidden">
          <Tabs defaultValue="templates" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid grid-cols-4 m-2 flex-shrink-0 h-8">
              <TabsTrigger value="templates" className="text-[10px] px-1 gap-0.5">
                <Layers className="w-3 h-3" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="shapes" className="text-[10px] px-1 gap-0.5">
                <Shapes className="w-3 h-3" />
                <span className="hidden sm:inline">Formas</span>
              </TabsTrigger>
              <TabsTrigger value="elements" className="text-[10px] px-1 gap-0.5">
                <Sticker className="w-3 h-3" />
                <span className="hidden sm:inline">Elementos</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-[10px] px-1 gap-0.5">
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <TemplatePicker />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="shapes" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <ShapesPanel fabricCanvas={fabricRef.current} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="elements" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <ElementsPanel fabricCanvas={fabricRef.current} />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <AiSuggestionsPanel />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <CanvasToolbar fabricCanvas={fabricRef.current} />
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

        {/* Right sidebar */}
        <aside className="w-64 flex-shrink-0 border-l border-border bg-card/30 flex flex-col overflow-hidden">
          <Tabs defaultValue="properties" className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid grid-cols-4 m-2 flex-shrink-0 h-8">
              <TabsTrigger value="properties" className="text-[10px] px-1 gap-0.5" title="Propriedades">
                <SlidersHorizontal className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-[10px] px-1 gap-0.5" title="Camadas">
                <Layers className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="align" className="text-[10px] px-1 gap-0.5" title="Alinhar">
                <AlignCenter className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="background" className="text-[10px] px-1 gap-0.5" title="Fundo">
                <ImageIcon className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <PropertiesPanel
                  fabricCanvas={fabricRef.current}
                  selectionVersion={selectionVersion}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="layers" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <LayersPanel
                  fabricCanvas={fabricRef.current}
                  selectionVersion={selectionVersion}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="align" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-3 pb-3">
                  <AlignTools fabricCanvas={fabricRef.current} />
                  <div className="mt-4">
                    <RemoveBgButton fabricCanvas={fabricRef.current} />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="background" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="px-3 pb-3">
                  <BackgroundPanel fabricCanvas={fabricRef.current} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
