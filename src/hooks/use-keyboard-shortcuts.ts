"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useKeyboardShortcuts(fabricRef: RefObject<any>) {
  const { undo, redo, zoom, setZoom, clipboard, setClipboard } = useEditorStore();
  const clipboardRef = useRef<unknown>(null);

  // Keep clipboardRef in sync with global store clipboard
  useEffect(() => { clipboardRef.current = clipboard; }, [clipboard]);

  // Keep zoom in a ref so the keydown closure always sees the latest value
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

    const isModifier = (e: KeyboardEvent) => (isMac ? e.metaKey : e.ctrlKey);

    const isEditingText = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return true;
      const fc = fabricRef.current;
      return fc?.getActiveObject?.()?.isEditing === true;
    };

    // ── helpers (always read fabricRef.current at call time) ──────────────

    const copySelected = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      active.clone((cloned: unknown) => {
        clipboardRef.current = cloned;
        setClipboard(cloned);
        toast.success("Copiado");
      });
    };

    const pasteClipboard = () => {
      const fc = fabricRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloned: any = clipboardRef.current;
      if (!fc || !cloned) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cloned.clone((newObj: any) => {
        fc.discardActiveObject();
        newObj.set({
          left: (cloned.left ?? 0) + 15,
          top: (cloned.top ?? 0) + 15,
          evented: true,
        });
        fc.add(newObj);
        cloned.left += 15;
        cloned.top += 15;
        fc.setActiveObject(newObj);
        fc.requestRenderAll();
        toast.success("Colado");
      });
    };

    const cutSelected = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      active.clone((cloned: unknown) => {
        clipboardRef.current = cloned;
        setClipboard(cloned);
      });
      fc.remove(active);
      fc.requestRenderAll();
      toast.success("Recortado");
    };

    const duplicateSelected = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      active.clone((cloned: any) => {
        cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
        fc.add(cloned);
        fc.setActiveObject(cloned);
        fc.requestRenderAll();
        toast.success("Duplicado");
      });
    };

    const selectAll = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      fc.discardActiveObject();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs: any[] = fc.getObjects();
      if (!objs.length) return;
      import("fabric").then(({ fabric }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sel = new (fabric as any).ActiveSelection(objs, { canvas: fc });
        fc.setActiveObject(sel);
        fc.requestRenderAll();
      });
    };

    const moveSelected = (dx: number, dy: number) => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      active.set({ left: (active.left ?? 0) + dx, top: (active.top ?? 0) + dy });
      active.setCoords();
      fc.requestRenderAll();
    };

    const bringForward = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      fc.bringForward(active);
      fc.requestRenderAll();
    };

    const sendBackward = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      fc.sendBackwards(active);
      fc.requestRenderAll();
    };

    const bringToFront = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      fc.bringToFront(active);
      fc.requestRenderAll();
    };

    const sendToBack = () => {
      const fc = fabricRef.current;
      if (!fc) return;
      const active = fc.getActiveObject();
      if (!active) return;
      fc.sendToBack(active);
      fc.requestRenderAll();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditingText(e)) return;

      const mod = isModifier(e);
      const shift = e.shiftKey;
      const key = e.key;
      const fc = fabricRef.current;

      // ── Undo / Redo ───────────────────────────────────────────────────────
      if (mod && !shift && key === "z") { e.preventDefault(); undo(); return; }
      if (mod && (key === "y" || (shift && key === "Z"))) { e.preventDefault(); redo(); return; }

      // ── Clipboard ─────────────────────────────────────────────────────────
      if (mod && key === "c") { e.preventDefault(); copySelected(); return; }
      if (mod && key === "v") { e.preventDefault(); pasteClipboard(); return; }
      if (mod && key === "x") { e.preventDefault(); cutSelected(); return; }
      if (mod && key === "d") { e.preventDefault(); duplicateSelected(); return; }

      // ── Seleção ───────────────────────────────────────────────────────────
      if (mod && key === "a") { e.preventDefault(); selectAll(); return; }

      // ── Formatação de texto ───────────────────────────────────────────────
      if (mod && key === "b") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (active && ["i-text", "textbox", "text"].includes(active.type)) {
          e.preventDefault();
          active.set({ fontWeight: active.fontWeight === "bold" ? "normal" : "bold" });
          fc?.requestRenderAll();
        }
        return;
      }
      if (mod && key === "i") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (active && ["i-text", "textbox", "text"].includes(active.type)) {
          e.preventDefault();
          active.set({ fontStyle: active.fontStyle === "italic" ? "normal" : "italic" });
          fc?.requestRenderAll();
        }
        return;
      }
      if (mod && key === "u") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (active && ["i-text", "textbox", "text"].includes(active.type)) {
          e.preventDefault();
          active.set({ underline: !active.underline });
          fc?.requestRenderAll();
        }
        return;
      }

      // ── Agrupamento ───────────────────────────────────────────────────────
      if (mod && !shift && key === "g") {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (active?.type === "activeSelection") {
          const group = active.toGroup();
          fc?.setActiveObject(group);
          fc?.requestRenderAll();
          toast.success("Elementos agrupados");
        }
        return;
      }
      if (mod && shift && key === "G") {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (active?.type === "group") {
          const items = active.toActiveSelection();
          fc?.setActiveObject(items);
          fc?.requestRenderAll();
          toast.success("Grupo desfeito");
        }
        return;
      }

      // ── Delete ────────────────────────────────────────────────────────────
      if ((key === "Delete" || key === "Backspace") && !mod) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (!active) return;
        e.preventDefault();
        if (Array.isArray(active._objects)) {
          active._objects.forEach((o: unknown) => fc?.remove(o));
        } else {
          fc?.remove(active);
        }
        fc?.discardActiveObject();
        fc?.requestRenderAll();
        toast.success("Removido");
        return;
      }

      // ── Escape ────────────────────────────────────────────────────────────
      if (key === "Escape") {
        fc?.discardActiveObject();
        fc?.requestRenderAll();
        return;
      }

      // ── Setas (mover 1px; Shift = 10px) ──────────────────────────────────
      const step = shift ? 10 : 1;
      if (key === "ArrowLeft")  { e.preventDefault(); moveSelected(-step, 0); return; }
      if (key === "ArrowRight") { e.preventDefault(); moveSelected(step, 0); return; }
      if (key === "ArrowUp")    { e.preventDefault(); moveSelected(0, -step); return; }
      if (key === "ArrowDown")  { e.preventDefault(); moveSelected(0, step); return; }

      // ── Z-order ───────────────────────────────────────────────────────────
      if (mod && key === "]") { e.preventDefault(); if (shift) { bringToFront(); } else { bringForward(); } return; }
      if (mod && key === "[") { e.preventDefault(); if (shift) { sendToBack(); } else { sendBackward(); } return; }

      // ── Centralizar no canvas (Ctrl+M) ────────────────────────────────────
      if (mod && key === "m") {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (!active || !fc) return;
        const cw = fc.getWidth() / fc.getZoom();
        const ch = fc.getHeight() / fc.getZoom();
        const ow = active.getScaledWidth?.() ?? active.width ?? 0;
        const oh = active.getScaledHeight?.() ?? active.height ?? 0;
        active.set({ left: (cw - ow) / 2, top: (ch - oh) / 2 });
        active.setCoords();
        fc.requestRenderAll();
        toast.success("Centralizado no canvas");
        return;
      }

      // ── Esconder objeto (Ctrl+H) ──────────────────────────────────────────
      if (mod && key === "h") {
        e.preventDefault();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fc?.getActiveObject();
        if (!active || !fc) return;
        active.set({ visible: !active.visible });
        fc.discardActiveObject();
        fc.requestRenderAll();
        toast.success(active.visible ? "Objeto visível" : "Objeto oculto");
        return;
      }

      // ── Zoom (Ctrl++ / Ctrl+- / Ctrl+0) ──────────────────────────────────
      if (mod && (key === "=" || key === "+")) {
        e.preventDefault();
        setZoom(Math.min(5, parseFloat((zoomRef.current + 0.1).toFixed(2))));
        return;
      }
      if (mod && key === "-") {
        e.preventDefault();
        setZoom(Math.max(0.1, parseFloat((zoomRef.current - 0.1).toFixed(2))));
        return;
      }
      if (mod && key === "0") {
        e.preventDefault();
        setZoom(1);
        toast.success("Zoom 100%");
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, setZoom, setClipboard]);
}
