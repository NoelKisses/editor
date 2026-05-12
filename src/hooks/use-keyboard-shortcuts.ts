"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useKeyboardShortcuts(fabricRef: RefObject<any>) {
  const { undo, redo } = useEditorStore();
  // clipboard interno — clona o objeto Fabric sem usar window.clipboard
  const clipboardRef = useRef<unknown>(null);

  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;

    const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

    const isModifier = (e: KeyboardEvent) =>
      isMac ? e.metaKey : e.ctrlKey;

    const isEditingText = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return true;
      // Fabric IText em modo edição
      const active = fabricCanvas.getActiveObject?.();
      return active?.isEditing === true;
    };

    const copySelected = () => {
      const active = fabricCanvas.getActiveObject();
      if (!active) return;
      active.clone((cloned: unknown) => {
        clipboardRef.current = cloned;
      });
    };

    const pasteClipboard = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloned: any = clipboardRef.current;
      if (!cloned) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cloned.clone((newObj: any) => {
        fabricCanvas.discardActiveObject();
        newObj.set({
          left: (cloned.left ?? 0) + 15,
          top: (cloned.top ?? 0) + 15,
          evented: true,
        });
        fabricCanvas.add(newObj);
        cloned.left += 15;
        cloned.top += 15;
        fabricCanvas.setActiveObject(newObj);
        fabricCanvas.requestRenderAll();
        toast.success("Colado");
      });
    };

    const cutSelected = () => {
      const active = fabricCanvas.getActiveObject();
      if (!active) return;
      copySelected();
      fabricCanvas.remove(active);
      fabricCanvas.requestRenderAll();
      toast.success("Recortado");
    };

    const duplicateSelected = () => {
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
    };

    const selectAll = () => {
      fabricCanvas.discardActiveObject();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs: any[] = fabricCanvas.getObjects();
      if (!objs.length) return;
      import("fabric").then(({ fabric }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sel = new (fabric as any).ActiveSelection(objs, { canvas: fabricCanvas });
        fabricCanvas.setActiveObject(sel);
        fabricCanvas.requestRenderAll();
      });
    };

    const moveSelected = (dx: number, dy: number) => {
      const active = fabricCanvas.getActiveObject();
      if (!active) return;
      active.set({ left: (active.left ?? 0) + dx, top: (active.top ?? 0) + dy });
      active.setCoords();
      fabricCanvas.requestRenderAll();
    };

    const bringForward = () => {
      const active = fabricCanvas.getActiveObject();
      if (!active) return;
      fabricCanvas.bringForward(active);
      fabricCanvas.requestRenderAll();
    };

    const sendBackward = () => {
      const active = fabricCanvas.getActiveObject();
      if (!active) return;
      fabricCanvas.sendBackwards(active);
      fabricCanvas.requestRenderAll();
    };

    const bringToFront = () => {
      const active = fabricCanvas.getActiveObject();
      if (!active) return;
      fabricCanvas.bringToFront(active);
      fabricCanvas.requestRenderAll();
    };

    const sendToBack = () => {
      const active = fabricCanvas.getActiveObject();
      if (!active) return;
      fabricCanvas.sendToBack(active);
      fabricCanvas.requestRenderAll();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      // Nunca intercepta quando está digitando em input ou IText
      if (isEditingText(e)) return;

      const mod = isModifier(e);
      const shift = e.shiftKey;
      const key = e.key;

      // --- Undo / Redo ---
      if (mod && !shift && key === "z") { e.preventDefault(); undo(); return; }
      if (mod && (key === "y" || (shift && key === "Z"))) { e.preventDefault(); redo(); return; }

      // --- Clipboard ---
      if (mod && key === "c") { e.preventDefault(); copySelected(); return; }
      if (mod && key === "v") { e.preventDefault(); pasteClipboard(); return; }
      if (mod && key === "x") { e.preventDefault(); cutSelected(); return; }
      if (mod && key === "d") { e.preventDefault(); duplicateSelected(); return; }

      // --- Seleção ---
      if (mod && key === "a") { e.preventDefault(); selectAll(); return; }

      // --- Agrupamento ---
      if (mod && !shift && key === "g") {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fabricCanvas.getActiveObject();
        if (active?.type === "activeSelection") {
          const group = active.toGroup();
          fabricCanvas.setActiveObject(group);
          fabricCanvas.requestRenderAll();
          toast.success("Elementos agrupados");
        }
        return;
      }
      if (mod && shift && key === "G") {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fabricCanvas.getActiveObject();
        if (active?.type === "group") {
          const items = active.toActiveSelection();
          fabricCanvas.setActiveObject(items);
          fabricCanvas.requestRenderAll();
          toast.success("Grupo desfeito");
        }
        return;
      }

      // --- Delete ---
      if ((key === "Delete" || key === "Backspace") && !mod) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fabricCanvas.getActiveObject();
        if (!active) return;
        e.preventDefault();
        if (Array.isArray(active._objects)) {
          active._objects.forEach((o: unknown) => fabricCanvas.remove(o));
        } else {
          fabricCanvas.remove(active);
        }
        fabricCanvas.discardActiveObject();
        fabricCanvas.requestRenderAll();
        toast.success("Removido");
        return;
      }

      // --- Escape ---
      if (key === "Escape") { fabricCanvas.discardActiveObject(); fabricCanvas.requestRenderAll(); return; }

      // --- Setas (mover 1px; Shift = 10px) ---
      const step = shift ? 10 : 1;
      if (key === "ArrowLeft")  { e.preventDefault(); moveSelected(-step, 0); return; }
      if (key === "ArrowRight") { e.preventDefault(); moveSelected(step, 0); return; }
      if (key === "ArrowUp")    { e.preventDefault(); moveSelected(0, -step); return; }
      if (key === "ArrowDown")  { e.preventDefault(); moveSelected(0, step); return; }

      // --- Z-order ---
      if (mod && key === "]") { e.preventDefault(); if (shift) { bringToFront(); } else { bringForward(); } return; }
      if (mod && key === "[") { e.preventDefault(); if (shift) { sendToBack(); } else { sendBackward(); } return; }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fabricRef, undo, redo]);
}
