"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "editor_brand_guidelines";

const DEFAULT_BRAND = {
  name: "Minha Marca",
  primary: "#3b82f6",
  secondary: "#1e293b",
  accent: "#f59e0b",
  headingFont: "Arial",
  bodyFont: "Verdana",
  logoUrl: "",
};

type BrandKit = typeof DEFAULT_BRAND;

function loadBrandFromStorage(): BrandKit {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BRAND };
    return { ...DEFAULT_BRAND, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_BRAND };
  }
}

function saveBrandToStorage(brand: BrandKit): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brand));
  } catch {
    // ignore storage errors
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActiveObject(canvas: any): any | null {
  if (!canvas) return null;
  try {
    return canvas.getActiveObject() ?? null;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyColorToObject(obj: any, color: string): void {
  if (!obj) return;
  const type: string = obj.type ?? "";
  if (type === "line" || type === "polyline" || type === "path") {
    obj.set("stroke", color);
  } else {
    obj.set("fill", color);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFontToObject(obj: any, fontFamily: string): void {
  if (!obj) return;
  const type: string = obj.type ?? "";
  if (type === "text" || type === "textbox" || type === "i-text") {
    obj.set("fontFamily", fontFamily);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAllObjects(canvas: any): any[] {
  if (!canvas) return [];
  try {
    return canvas.getObjects() ?? [];
  } catch {
    return [];
  }
}

interface CanvasBrandGuidelinesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasBrandGuidelinesPanel({
  fabricCanvas,
}: CanvasBrandGuidelinesPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [brand, setBrand] = useState<BrandKit>({ ...DEFAULT_BRAND });

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    queueMicrotask(() => {
      const saved = loadBrandFromStorage();
      setBrand(saved);
    });
  }, []);

  function handleSave() {
    saveBrandToStorage(brand);
    toast.success("Marca salva com sucesso!");
  }

  function handleLoad() {
    const saved = loadBrandFromStorage();
    setBrand(saved);
    toast.success("Marca carregada!");
  }

  function handleApplyColorToSelected() {
    const canvas = canvasRef.current;
    const obj = getActiveObject(canvas);
    if (!obj) {
      toast.error("Nenhum objeto selecionado.");
      return;
    }
    applyColorToObject(obj, brand.primary);
    canvas.renderAll();
    toast.success("Cor primária aplicada ao objeto selecionado.");
  }

  function handleApplyFontToSelected() {
    const canvas = canvasRef.current;
    const obj = getActiveObject(canvas);
    if (!obj) {
      toast.error("Nenhum objeto selecionado.");
      return;
    }
    const type: string = obj.type ?? "";
    if (type !== "text" && type !== "textbox" && type !== "i-text") {
      toast.error("O objeto selecionado não é um texto.");
      return;
    }
    applyFontToObject(obj, brand.headingFont);
    canvas.renderAll();
    toast.success("Fonte de heading aplicada ao objeto selecionado.");
  }

  function handleApplyPaletteToCanvas() {
    const canvas = canvasRef.current;
    const objects = getAllObjects(canvas);
    if (objects.length === 0) {
      toast.error("Nenhum objeto no canvas.");
      return;
    }
    const palette = [brand.primary, brand.secondary, brand.accent];
    objects.forEach((obj, index) => {
      const color = palette[index % palette.length];
      applyColorToObject(obj, color);
    });
    canvas.renderAll();
    toast.success("Paleta aplicada a todos os objetos do canvas.");
  }

  function handleFieldChange<K extends keyof BrandKit>(
    key: K,
    value: BrandKit[K]
  ) {
    setBrand((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "16px",
        fontSize: "13px",
        color: "#e2e8f0",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Bookmark size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: "14px" }}>
          Guia de Marca
        </span>
      </div>

      {/* Brand Name */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ fontSize: "12px", color: "#94a3b8" }}>
          Nome da Marca
        </label>
        <input
          type="text"
          value={brand.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "6px 10px",
            color: "#e2e8f0",
            fontSize: "13px",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Colors */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
          Cores
        </span>

        {(
          [
            { key: "primary", label: "Primária" },
            { key: "secondary", label: "Secundária" },
            { key: "accent", label: "Destaque" },
          ] as { key: keyof BrandKit; label: string }[]
        ).map(({ key, label }) => (
          <div
            key={key}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <input
              type="color"
              value={brand[key] as string}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              style={{
                width: "32px",
                height: "32px",
                padding: "2px",
                border: "1px solid #334155",
                borderRadius: "4px",
                background: "#1e293b",
                cursor: "pointer",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#94a3b8", width: "70px", flexShrink: 0 }}>
              {label}
            </span>
            <input
              type="text"
              value={brand[key] as string}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              maxLength={7}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "4px 8px",
                color: "#e2e8f0",
                fontSize: "12px",
                fontFamily: "monospace",
                outline: "none",
                width: "90px",
              }}
            />
          </div>
        ))}
      </div>

      {/* Color Palette Preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
          Paleta
        </span>
        <div style={{ display: "flex", borderRadius: "6px", overflow: "hidden", height: "20px" }}>
          <div style={{ flex: 1, background: brand.primary }} />
          <div style={{ flex: 1, background: brand.secondary }} />
          <div style={{ flex: 1, background: brand.accent }} />
        </div>
      </div>

      {/* Fonts */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
          Tipografia
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#94a3b8" }}>
            Fonte de Heading
          </label>
          <select
            value={brand.headingFont}
            onChange={(e) => handleFieldChange("headingFont", e.target.value)}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "6px",
              padding: "6px 10px",
              color: "#e2e8f0",
              fontSize: "13px",
              outline: "none",
              width: "100%",
              cursor: "pointer",
            }}
          >
            <option value="Arial">Arial</option>
            <option value="Impact">Impact</option>
            <option value="Helvetica Neue">Helvetica Neue</option>
            <option value="Georgia">Georgia</option>
            <option value="Montserrat">Montserrat</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "#94a3b8" }}>
            Fonte de Body
          </label>
          <select
            value={brand.bodyFont}
            onChange={(e) => handleFieldChange("bodyFont", e.target.value)}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "6px",
              padding: "6px 10px",
              color: "#e2e8f0",
              fontSize: "13px",
              outline: "none",
              width: "100%",
              cursor: "pointer",
            }}
          >
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
      </div>

      {/* Logo URL */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label style={{ fontSize: "12px", color: "#94a3b8" }}>
          URL do Logo (referência)
        </label>
        <input
          type="text"
          value={brand.logoUrl}
          onChange={(e) => handleFieldChange("logoUrl", e.target.value)}
          placeholder="https://..."
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "6px 10px",
            color: "#e2e8f0",
            fontSize: "13px",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Save / Load */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleSave}
          style={{
            flex: 1,
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "7px 10px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Salvar Marca
        </button>
        <button
          onClick={handleLoad}
          style={{
            flex: 1,
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "7px 10px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Carregar Marca
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "#1e293b" }} />

      {/* Apply Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
          Aplicar ao Canvas
        </span>

        <button
          onClick={handleApplyColorToSelected}
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "7px 10px",
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Aplicar cor primária ao selecionado
        </button>

        <button
          onClick={handleApplyFontToSelected}
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            border: "1px solid #334155",
            borderRadius: "6px",
            padding: "7px 10px",
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Aplicar fonte ao selecionado
        </button>

        <button
          onClick={handleApplyPaletteToCanvas}
          style={{
            background: "#0f172a",
            color: "#f59e0b",
            border: "1px solid #78350f",
            borderRadius: "6px",
            padding: "7px 10px",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Aplicar paleta ao canvas
        </button>
      </div>
    </div>
  );
}
