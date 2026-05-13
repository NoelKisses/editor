"use client";

import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

const SHORTCUTS = [
  {
    group: "Edição",
    items: [
      { keys: [`${MOD}`, "C"], label: "Copiar objeto selecionado" },
      { keys: [`${MOD}`, "V"], label: "Colar objeto" },
      { keys: [`${MOD}`, "X"], label: "Recortar objeto selecionado" },
      { keys: [`${MOD}`, "D"], label: "Duplicar objeto selecionado" },
      { keys: ["Delete", "Backspace"], label: "Excluir objeto selecionado" },
      { keys: [`${MOD}`, "Z"], label: "Desfazer" },
      { keys: [`${MOD}`, "Y"], label: "Refazer" },
    ],
  },
  {
    group: "Seleção",
    items: [
      { keys: [`${MOD}`, "A"], label: "Selecionar todos os objetos" },
      { keys: ["Esc"], label: "Desselecionar / sair edição de texto" },
      { keys: [`${MOD}`, "G"], label: "Agrupar objetos selecionados" },
      { keys: [`${MOD}`, "Shift", "G"], label: "Desagrupar seleção" },
    ],
  },
  {
    group: "Mover & Camadas",
    items: [
      { keys: ["↑ ↓ ← →"], label: "Mover objeto (1px)" },
      { keys: ["Shift", "↑↓←→"], label: "Mover objeto (10px)" },
      { keys: [`${MOD}`, "]"], label: "Avançar uma camada" },
      { keys: [`${MOD}`, "["], label: "Recuar uma camada" },
      { keys: [`${MOD}`, "Shift", "]"], label: "Trazer para frente" },
      { keys: [`${MOD}`, "Shift", "["], label: "Enviar para trás" },
      { keys: [`${MOD}`, "M"], label: "Centralizar no canvas" },
    ],
  },
  {
    group: "Formatação de Texto",
    items: [
      { keys: [`${MOD}`, "B"], label: "Negrito" },
      { keys: [`${MOD}`, "I"], label: "Itálico" },
      { keys: [`${MOD}`, "U"], label: "Sublinhado" },
    ],
  },
  {
    group: "Zoom & Visualização",
    items: [
      { keys: [`${MOD}`, "+"], label: "Aumentar zoom" },
      { keys: [`${MOD}`, "-"], label: "Diminuir zoom" },
      { keys: [`${MOD}`, "0"], label: "Zoom 100%" },
      { keys: [`${MOD}`, "Scroll"], label: "Zoom com mouse" },
      { keys: ["Espaço", "+ Arrastar"], label: "Mover canvas (pan)" },
    ],
  },
  {
    group: "Objeto",
    items: [
      { keys: [`${MOD}`, "H"], label: "Mostrar / ocultar objeto" },
      { keys: ["?"], label: "Abrir este painel de atalhos" },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Atalhos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.group}
              </h3>
              <div className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-foreground/80">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <kbd className="inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-foreground/70 shadow-sm">
                            {k}
                          </kbd>
                          {i < item.keys.length - 1 && (
                            <span className="text-[10px] text-muted-foreground/60">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            Pressione <kbd className="inline-flex items-center rounded border border-border bg-muted/60 px-1 py-0.5 text-[9px] font-mono">?</kbd> a qualquer momento para abrir este painel
          </p>
        </div>
      </div>
    </div>
  );
}
