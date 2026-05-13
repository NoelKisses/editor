"use client";

import { useCallback, useRef } from "react";
import { Plus, Trash2, Copy, GripVertical } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";

interface PageStripProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function PageStrip({ fabricCanvas }: PageStripProps) {
  const {
    pages,
    currentPageIndex,
    addPage,
    removePage,
    setCurrentPage,
    savePageState,
    duplicatePage,
    reorderPages,
  } = useEditorStore();

  const dragIndexRef = useRef<number | null>(null);

  const saveCurrent = useCallback(() => {
    if (!fabricCanvas) return;
    const json = JSON.stringify(fabricCanvas.toJSON());
    const thumbnail = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.3, multiplier: 0.15 });
    savePageState(currentPageIndex, json, thumbnail);
  }, [fabricCanvas, currentPageIndex, savePageState]);

  const loadPage = useCallback(async (index: number) => {
    if (!fabricCanvas || index === currentPageIndex) return;

    // Save current page state
    saveCurrent();

    // Switch index
    setCurrentPage(index);

    // Load target page
    const targetPage = pages[index];
    if (targetPage.fabricJSON) {
      await new Promise<void>((resolve) => {
        fabricCanvas.loadFromJSON(targetPage.fabricJSON, () => {
          fabricCanvas.requestRenderAll();
          resolve();
        });
      });
    } else {
      // Empty page — clear canvas
      fabricCanvas.clear();
      fabricCanvas.setBackgroundColor(
        fabricCanvas.backgroundColor ?? "#ffffff",
        fabricCanvas.requestRenderAll.bind(fabricCanvas)
      );
    }
  }, [fabricCanvas, currentPageIndex, pages, saveCurrent, setCurrentPage]);

  const handleAddPage = useCallback(() => {
    saveCurrent();
    addPage();
    // New page starts empty — canvas will be cleared when navigated to
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.requestRenderAll();
    }
  }, [saveCurrent, addPage, fabricCanvas]);

  const handleDuplicate = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    saveCurrent();
    duplicatePage(index);
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.requestRenderAll();
      // Load duplicated page (which will be at index + 1)
      const targetPage = pages[index];
      if (targetPage.fabricJSON) {
        fabricCanvas.loadFromJSON(targetPage.fabricJSON, () => {
          fabricCanvas.requestRenderAll();
        });
      }
    }
  }, [saveCurrent, duplicatePage, pages, fabricCanvas]);

  const handleRemove = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) return;
    removePage(index);
    const newIndex = Math.min(index, pages.length - 2);
    const targetPage = pages[newIndex === index ? Math.max(0, index - 1) : newIndex];
    if (fabricCanvas && targetPage?.fabricJSON) {
      fabricCanvas.loadFromJSON(targetPage.fabricJSON, () => {
        fabricCanvas.requestRenderAll();
      });
    } else if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.requestRenderAll();
    }
  }, [pages, removePage, fabricCanvas]);

  const onDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    reorderPages(dragIndexRef.current, index);
    dragIndexRef.current = index;
  };

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 border-t border-border bg-card/50 overflow-x-auto flex-shrink-0 min-h-[56px]">
      {pages.map((page, index) => (
        <div
          key={page.id}
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => onDragOver(e, index)}
          onDragEnd={() => { dragIndexRef.current = null; }}
          onClick={() => loadPage(index)}
          className={cn(
            "relative flex-shrink-0 group cursor-pointer rounded-md border transition-all overflow-hidden",
            "w-[60px] h-[38px]",
            index === currentPageIndex
              ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.3)] ring-1 ring-primary/30"
              : "border-border hover:border-primary/50"
          )}
          title={page.label}
        >
          {/* Thumbnail or placeholder */}
          {page.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.thumbnail}
              alt={page.label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted/30 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">{index + 1}</span>
            </div>
          )}

          {/* Page number badge */}
          <div className="absolute bottom-0.5 left-0.5 bg-black/60 rounded text-[8px] text-white px-1 leading-tight">
            {index + 1}
          </div>

          {/* Drag handle */}
          <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-2.5 h-2.5 text-white/70" />
          </div>

          {/* Actions */}
          <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleDuplicate(index, e)}
              className="bg-black/60 rounded p-0.5 hover:bg-black/80"
              title="Duplicar página"
            >
              <Copy className="w-2 h-2 text-white" />
            </button>
            {pages.length > 1 && (
              <button
                onClick={(e) => handleRemove(index, e)}
                className="bg-black/60 rounded p-0.5 hover:bg-red-500/80"
                title="Remover página"
              >
                <Trash2 className="w-2 h-2 text-white" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add page button */}
      <button
        onClick={handleAddPage}
        className="flex-shrink-0 w-[60px] h-[38px] rounded-md border border-dashed border-border hover:border-primary/50 hover:bg-accent/30 flex items-center justify-center transition-colors"
        title="Adicionar página"
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Page count */}
      <div className="ml-auto flex-shrink-0 text-[10px] text-muted-foreground tabular-nums">
        {currentPageIndex + 1}/{pages.length}
      </div>
    </div>
  );
}
