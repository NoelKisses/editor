"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Type, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CustomFontPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface LoadedFont {
  name: string;
  family: string;
}

export function CustomFontPanel({ fabricCanvas }: CustomFontPanelProps) {
  const [fonts, setFonts] = useState<LoadedFont[]>([]);
  const [sampleText, setSampleText] = useState("Texto de exemplo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
        toast.error(`Formato não suportado: ${file.name}`);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const fontFamily = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-");
        const fontFace = new FontFace(fontFamily, arrayBuffer);
        const loaded = await fontFace.load();
        document.fonts.add(loaded);

        setFonts((prev) => {
          if (prev.some((f) => f.family === fontFamily)) return prev;
          return [...prev, { name: file.name, family: fontFamily }];
        });
        toast.success(`Fonte "${file.name}" carregada`);
      } catch {
        toast.error(`Erro ao carregar ${file.name}`);
      }
    }
  }, []);

  const applyToCanvas = useCallback(async (fontFamily: string) => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    const active = fabricCanvas.getActiveObject();

    if (active && ["i-text", "textbox", "text"].includes(active.type)) {
      active.set({ fontFamily });
      fabricCanvas.requestRenderAll();
      toast.success(`Fonte "${fontFamily}" aplicada`);
    } else {
      // Add new text with this font
      const text = new fabric.IText(sampleText || "Texto", {
        left: 80,
        top: 80,
        fontSize: 48,
        fontFamily,
        fill: "#ffffff",
        fontWeight: "bold",
        shadow: "rgba(0,0,0,0.5) 2px 2px 8px",
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.requestRenderAll();
      toast.success(`Texto adicionado com fonte "${fontFamily}"`);
    }
  }, [fabricCanvas, sampleText]);

  const removeFont = useCallback((family: string) => {
    setFonts((prev) => prev.filter((f) => f.family !== family));
    toast("Fonte removida da lista");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Fontes Personalizadas</span>
      </div>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
      >
        <Upload className="w-6 h-6 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground text-center">
          Arraste ou clique para carregar<br />
          <span className="text-[10px] opacity-60">.TTF, .OTF, .WOFF, .WOFF2</span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Sample text input */}
      {fonts.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Texto de prévia</label>
          <input
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary/50"
            placeholder="Texto de exemplo..."
          />
        </div>
      )}

      {/* Loaded fonts list */}
      {fonts.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/50 text-center py-2">
          Nenhuma fonte carregada ainda
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {fonts.length} fonte(s) carregada(s)
          </span>
          {fonts.map((font) => (
            <div key={font.family} className="flex flex-col gap-1 p-2 rounded-lg border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground truncate">{font.name}</span>
                <button onClick={() => removeFont(font.family)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p
                className="text-sm text-foreground leading-tight truncate cursor-pointer hover:text-primary transition-colors"
                style={{ fontFamily: font.family }}
                onClick={() => applyToCanvas(font.family)}
                title="Clique para aplicar ao texto selecionado ou adicionar novo texto"
              >
                {sampleText || font.family}
              </p>
              <button
                onClick={() => applyToCanvas(font.family)}
                className="text-[10px] text-primary hover:underline text-left"
              >
                Aplicar ao canvas →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
