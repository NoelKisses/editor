"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { TemplatePicker } from "@/components/editor/template-picker";
import { AiSuggestionsPanel } from "@/components/editor/ai-suggestions-panel";
import { RemoveBgButton } from "@/components/editor/remove-bg-button";
import { useEditorStore } from "@/store/editor-store";
import { Home, Layers, Sparkles, Settings2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// Fabric.js precisa de import dinâmico para evitar SSR issues
const FabricCanvas = dynamic(
  () => import("@/components/canvas/fabric-canvas").then((m) => m.FabricCanvas),
  { ssr: false }
);

export default function EditorPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  const [, forceUpdate] = useState(0);
  const { template } = useEditorStore();

  const handleCanvasReady = useCallback((canvas: unknown) => {
    fabricRef.current = canvas;
    forceUpdate((n) => n + 1);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50 flex-shrink-0">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-8 w-8"
          )}
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
            <TabsList className="grid grid-cols-3 m-2 flex-shrink-0">
              <TabsTrigger value="templates" className="gap-1 text-xs">
                <Layers className="w-3.5 h-3.5" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                IA
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-1 text-xs">
                <Settings2 className="w-3.5 h-3.5" />
                Ferramentas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <TemplatePicker />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <AiSuggestionsPanel />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tools" className="flex-1 overflow-hidden m-0 px-3 pb-3">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 pt-2">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Imagem</h3>
                    <RemoveBgButton fabricCanvas={fabricRef.current} />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <CanvasToolbar fabricCanvas={fabricRef.current} />
          <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-8">
            {template ? (
              <FabricCanvas onCanvasReady={handleCanvasReady} />
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
      </div>
    </div>
  );
}
