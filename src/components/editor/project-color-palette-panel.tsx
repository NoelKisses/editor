"use client";

import { useCallback, useEffect, useState } from "react";
import { Palette, Plus, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ProjectColorPalettePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface SavedColor {
  id: string;
  hex: string;
  name: string;
}

const STORAGE_KEY = "editor_project_palette";

const BRAND_PALETTES: { name: string; colors: string[] }[] = [
  { name: "Material", colors: ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722"] },
  { name: "Pastel", colors: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff", "#e8baff", "#ffc8dd", "#cdb4db", "#a2d2ff", "#bde0fe"] },
  { name: "Neon", colors: ["#ff0080", "#ff4500", "#ffff00", "#00ff41", "#00ffff", "#7b2fff", "#ff69b4", "#39ff14"] },
  { name: "Monocromático", colors: ["#000000", "#1a1a1a", "#333333", "#4d4d4d", "#666666", "#808080", "#999999", "#b3b3b3", "#cccccc", "#e6e6e6", "#f2f2f2", "#ffffff"] },
];

function loadColors(): SavedColor[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveColors(colors: SavedColor[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch {
    // silent
  }
}

export function ProjectColorPalettePanel({ fabricCanvas, selectionVersion }: ProjectColorPalettePanelProps) {
  const [savedColors, setSavedColors] = useState<SavedColor[]>([]);
  const [newColor, setNewColor] = useState("#4f46e5");
  const [newName, setNewName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePalette, setActivePalette] = useState<string | null>(null);
  const [currentObjectColor, setCurrentObjectColor] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setSavedColors(loadColors());
    });
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (obj?.fill && typeof obj.fill === "string") {
        setCurrentObjectColor(obj.fill);
      } else {
        setCurrentObjectColor(null);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const addColor = useCallback(() => {
    const name = newName.trim() || newColor.toUpperCase();
    const newEntry: SavedColor = { id: `${Date.now()}`, hex: newColor, name };
    const updated = [...savedColors, newEntry];
    setSavedColors(updated);
    saveColors(updated);
    setNewName("");
    toast.success(`Cor "${name}" adicionada`);
  }, [newColor, newName, savedColors]);

  const removeColor = useCallback((id: string) => {
    const updated = savedColors.filter(c => c.id !== id);
    setSavedColors(updated);
    saveColors(updated);
    toast.success("Cor removida");
  }, [savedColors]);

  const applyToObject = useCallback((hex: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }
    obj.set({ fill: hex });
    fabricCanvas.requestRenderAll();
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const copyHex = useCallback((id: string, hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }, []);

  const saveCurrentObjectColor = useCallback(() => {
    if (!currentObjectColor) { toast.error("Nenhum objeto com cor selecionado"); return; }
    const name = currentObjectColor.toUpperCase();
    const newEntry: SavedColor = { id: `${Date.now()}`, hex: currentObjectColor, name };
    const updated = [...savedColors, newEntry];
    setSavedColors(updated);
    saveColors(updated);
    toast.success("Cor do objeto salva na paleta");
  }, [currentObjectColor, savedColors]);

  const extractCanvasColors = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects();
    const colorSet = new Set<string>();
    objs.forEach(o => {
      if (typeof o.fill === "string" && o.fill.startsWith("#")) colorSet.add(o.fill);
      if (typeof o.stroke === "string" && o.stroke.startsWith("#")) colorSet.add(o.stroke);
    });

    let added = 0;
    const newEntries: SavedColor[] = [];
    colorSet.forEach(hex => {
      if (!savedColors.find(c => c.hex === hex)) {
        newEntries.push({ id: `${Date.now()}-${added}`, hex, name: hex.toUpperCase() });
        added++;
      }
    });

    if (added === 0) { toast.error("Nenhuma nova cor encontrada"); return; }
    const updated = [...savedColors, ...newEntries];
    setSavedColors(updated);
    saveColors(updated);
    toast.success(`${added} cor${added > 1 ? "es" : ""} extraída${added > 1 ? "s" : ""} do canvas`);
  }, [fabricCanvas, savedColors]);

  const clearAll = useCallback(() => {
    setSavedColors([]);
    saveColors([]);
    toast.success("Paleta limpa");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Paleta do Projeto</span>
      </div>

      {/* Current object color */}
      {currentObjectColor && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded border border-border bg-muted/10">
          <div className="w-5 h-5 rounded border border-border flex-shrink-0" style={{ backgroundColor: currentObjectColor }} />
          <span className="flex-1 text-[8px] font-mono">{currentObjectColor.toUpperCase()}</span>
          <button onClick={saveCurrentObjectColor}
            className="text-[8px] text-primary hover:underline">Salvar</button>
        </div>
      )}

      {/* Add color */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nova Cor</span>
        <div className="flex items-center gap-2">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
            className="w-8 h-8 rounded border border-border cursor-pointer flex-shrink-0" />
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder={newColor.toUpperCase()}
            className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary"
          />
          <button onClick={addColor}
            className="flex items-center gap-0.5 px-2 py-1 rounded border border-primary text-primary text-[8px] hover:bg-primary/10 transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Saved colors */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Cores Salvas ({savedColors.length})
          </span>
          <div className="flex items-center gap-2">
            <button onClick={extractCanvasColors} className="text-[8px] text-primary hover:underline">Extrair do canvas</button>
            {savedColors.length > 0 && (
              <button onClick={clearAll} className="text-[8px] text-destructive hover:underline">Limpar</button>
            )}
          </div>
        </div>

        {savedColors.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-3">Nenhuma cor salva ainda</p>
        ) : (
          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {savedColors.map(c => (
              <div key={c.id}
                className="flex items-center gap-2 px-2 py-1 rounded border border-border hover:border-primary/20 group">
                <div
                  className="w-6 h-6 rounded border border-border flex-shrink-0 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  onClick={() => applyToObject(c.hex)}
                  title="Aplicar ao objeto selecionado"
                />
                <span className="flex-1 text-[9px] truncate">{c.name}</span>
                <span className="text-[7px] font-mono text-muted-foreground">{c.hex.toUpperCase()}</span>
                <button onClick={() => copyHex(c.id, c.hex)}
                  className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                  {copiedId === c.id ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
                <button onClick={() => removeColor(c.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Brand palettes */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Paletas Prontas</span>
        <div className="grid grid-cols-2 gap-1">
          {BRAND_PALETTES.map(p => (
            <button key={p.name} onClick={() => setActivePalette(activePalette === p.name ? null : p.name)}
              className={`py-1 rounded border text-[8px] transition-colors ${activePalette === p.name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {p.name}
            </button>
          ))}
        </div>
        {activePalette && (
          <div className="flex flex-wrap gap-1 p-2 rounded border border-border">
            {BRAND_PALETTES.find(p => p.name === activePalette)?.colors.map(hex => (
              <button key={hex}
                onClick={() => applyToObject(hex)}
                title={hex}
                className="w-5 h-5 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Clique em uma cor para aplicar ao objeto selecionado
      </p>
    </div>
  );
}
