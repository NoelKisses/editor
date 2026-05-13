"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Trash2, Palette, Type, Star } from "lucide-react";
import { toast } from "sonner";

interface FavoritesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface FavoriteColor {
  id: string;
  hex: string;
  name: string;
}

interface FavoriteFont {
  id: string;
  family: string;
  sample: string;
}

interface FavoriteElement {
  id: string;
  name: string;
  type: string;
  json: string;
  thumbnail: string;
}

const COLORS_KEY = "editor_fav_colors";
const FONTS_KEY = "editor_fav_fonts";
const ELEMENTS_KEY = "editor_fav_elements";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") as T; } catch { return fallback; }
}

type Tab = "elements" | "colors" | "fonts";

export function FavoritesPanel({ fabricCanvas, selectionVersion }: FavoritesPanelProps) {
  const [tab, setTab] = useState<Tab>("elements");
  const [favColors, setFavColors] = useState<FavoriteColor[]>([]);
  const [favFonts, setFavFonts] = useState<FavoriteFont[]>([]);
  const [favElements, setFavElements] = useState<FavoriteElement[]>([]);
  const [colorInput, setColorInput] = useState("#6366f1");
  const [colorName, setColorName] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      setFavColors(loadJSON<FavoriteColor[]>(COLORS_KEY, []));
      setFavFonts(loadJSON<FavoriteFont[]>(FONTS_KEY, []));
      setFavElements(loadJSON<FavoriteElement[]>(ELEMENTS_KEY, []));
    });
  }, []);

  // Detect current object to allow quick-save
  useEffect(() => {
    void selectionVersion;
  }, [selectionVersion]);

  const saveCurrentElement = useCallback(async () => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    await new Promise<void>((resolve) => {
      obj.clone((cloned: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = JSON.stringify((cloned as any).toJSON(["data", "name"]));
        const name = (obj as { name?: string }).name ?? obj.type ?? "Elemento";
        const thumb = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.3, multiplier: 0.15 });
        const el: FavoriteElement = {
          id: `fav-${Date.now()}`,
          name,
          type: obj.type ?? "object",
          json,
          thumbnail: thumb,
        };
        const updated = [el, ...loadJSON<FavoriteElement[]>(ELEMENTS_KEY, [])].slice(0, 30);
        localStorage.setItem(ELEMENTS_KEY, JSON.stringify(updated));
        setFavElements(updated);
        toast.success(`"${name}" salvo nos favoritos`);
        resolve();
      });
    });
  }, [fabricCanvas]);

  const addColor = useCallback(() => {
    const name = colorName.trim() || colorInput;
    const color: FavoriteColor = { id: `col-${Date.now()}`, hex: colorInput, name };
    const updated = [color, ...loadJSON<FavoriteColor[]>(COLORS_KEY, []).filter(c => c.hex !== colorInput)].slice(0, 40);
    localStorage.setItem(COLORS_KEY, JSON.stringify(updated));
    setFavColors(updated);
    setColorName("");
    toast.success("Cor adicionada");
  }, [colorInput, colorName]);

  const addCurrentFont = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj || obj.type !== "i-text" && obj.type !== "textbox" && obj.type !== "text") {
      toast.error("Selecione um texto para salvar a fonte");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const family = (obj as any).fontFamily ?? "Sans-Serif";
    const font: FavoriteFont = { id: `fnt-${Date.now()}`, family, sample: "Abc 123" };
    const updated = [font, ...loadJSON<FavoriteFont[]>(FONTS_KEY, []).filter(f => f.family !== family)].slice(0, 20);
    localStorage.setItem(FONTS_KEY, JSON.stringify(updated));
    setFavFonts(updated);
    toast.success(`"${family}" salva`);
  }, [fabricCanvas]);

  const deleteColor = useCallback((id: string) => {
    const updated = loadJSON<FavoriteColor[]>(COLORS_KEY, []).filter(c => c.id !== id);
    localStorage.setItem(COLORS_KEY, JSON.stringify(updated));
    setFavColors(updated);
  }, []);

  const deleteFont = useCallback((id: string) => {
    const updated = loadJSON<FavoriteFont[]>(FONTS_KEY, []).filter(f => f.id !== id);
    localStorage.setItem(FONTS_KEY, JSON.stringify(updated));
    setFavFonts(updated);
  }, []);

  const deleteElement = useCallback((id: string) => {
    const updated = loadJSON<FavoriteElement[]>(ELEMENTS_KEY, []).filter(e => e.id !== id);
    localStorage.setItem(ELEMENTS_KEY, JSON.stringify(updated));
    setFavElements(updated);
  }, []);

  const applyColor = useCallback((hex: string) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    obj.set({ fill: hex });
    fabricCanvas.requestRenderAll();
    toast.success("Cor aplicada");
  }, [fabricCanvas]);

  const applyFont = useCallback((family: string) => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }
    obj.set({ fontFamily: family });
    fabricCanvas.requestRenderAll();
    toast.success(`Fonte "${family}" aplicada`);
  }, [fabricCanvas]);

  const applyElement = useCallback(async (el: FavoriteElement) => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then(m => m.fabric);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fabric as any).util.enlivenObjects([JSON.parse(el.json)], (objects: unknown[]) => {
      const obj = objects[0];
      if (!obj) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).set({ left: 80, top: 80, evented: true, selectable: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).setCoords?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.add(obj as any);
      fabricCanvas.setActiveObject(obj as Parameters<typeof fabricCanvas.setActiveObject>[0]);
      fabricCanvas.requestRenderAll();
      toast.success(`"${el.name}" adicionado`);
    }, "fabric");
  }, [fabricCanvas]);

  const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
    { value: "elements", label: "Elementos", icon: <Star className="w-3 h-3" /> },
    { value: "colors", label: "Cores", icon: <Palette className="w-3 h-3" /> },
    { value: "fonts", label: "Fontes", icon: <Type className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Favoritos</span>
      </div>

      {/* Tab selector */}
      <div className="grid grid-cols-3 gap-1">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center justify-center gap-1 py-1.5 rounded border text-[10px] transition-colors ${tab === t.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ELEMENTS */}
      {tab === "elements" && (
        <>
          <button
            onClick={saveCurrentElement}
            className="flex items-center justify-center gap-2 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
          >
            <Heart className="w-3 h-3" /> Salvar objeto selecionado
          </button>
          {favElements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Star className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-[11px] text-muted-foreground">Nenhum elemento favoritado</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {favElements.map(el => (
                <div key={el.id} className="flex items-center gap-2 p-1.5 rounded border border-border hover:border-primary/30 transition-colors group">
                  {el.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={el.thumbnail} alt={el.name} className="w-10 h-7 object-cover rounded-sm border border-border/50 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-7 bg-muted rounded-sm flex-shrink-0 flex items-center justify-center">
                      <Star className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium truncate">{el.name}</p>
                    <p className="text-[8px] text-muted-foreground capitalize">{el.type}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => applyElement(el)}
                      className="text-[8px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      Usar
                    </button>
                    <button onClick={() => deleteElement(el.id)} className="w-5 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-red-400/40 hover:text-red-400 transition-colors">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* COLORS */}
      {tab === "colors" && (
        <>
          <div className="flex gap-2">
            <input type="color" value={colorInput} onChange={e => setColorInput(e.target.value)} className="w-8 h-8 rounded border border-border cursor-pointer flex-shrink-0" />
            <input
              type="text"
              value={colorName}
              onChange={e => setColorName(e.target.value)}
              placeholder="Nome (opcional)"
              className="flex-1 text-[10px] bg-background border border-border rounded px-2 py-1 outline-none focus:border-primary/50"
            />
            <button onClick={addColor} className="px-2 py-1 rounded border border-primary text-primary text-[10px] hover:bg-primary/10 transition-colors flex-shrink-0">+</button>
          </div>
          {favColors.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Palette className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-[11px] text-muted-foreground">Nenhuma cor favoritada</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
              {favColors.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 p-1.5 rounded border border-border hover:border-primary/30 transition-colors group cursor-pointer"
                  onClick={() => applyColor(c.hex)}
                >
                  <div className="w-5 h-5 rounded-sm border border-border/50 flex-shrink-0" style={{ background: c.hex }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-mono truncate">{c.hex}</p>
                    {c.name !== c.hex && <p className="text-[8px] text-muted-foreground truncate">{c.name}</p>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteColor(c.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-2.5 h-2.5 text-muted-foreground hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* FONTS */}
      {tab === "fonts" && (
        <>
          <button
            onClick={addCurrentFont}
            className="flex items-center justify-center gap-2 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
          >
            <Type className="w-3 h-3" /> Salvar fonte do texto selecionado
          </button>
          {favFonts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Type className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-[11px] text-muted-foreground">Nenhuma fonte favoritada</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {favFonts.map(f => (
                <div key={f.id} className="flex items-center gap-2 p-1.5 rounded border border-border hover:border-primary/30 transition-colors group cursor-pointer" onClick={() => applyFont(f.family)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ fontFamily: f.family }}>{f.sample}</p>
                    <p className="text-[8px] text-muted-foreground truncate">{f.family}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteFont(f.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-2.5 h-2.5 text-muted-foreground hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
