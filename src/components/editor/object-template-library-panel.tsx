"use client";

import { useEffect, useRef, useState } from "react";
import { LibraryBig } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ObjectTemplateLibraryPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ThemeKey = "Vermelho" | "Azul" | "Verde" | "Roxo" | "Laranja" | "Mono";

interface ThemeDef {
  primary: string;
  accent: string;
  text: string;
}

const THEMES: Record<string, ThemeDef> = {
  Vermelho: { primary: "#dc2626", accent: "#fbbf24", text: "#ffffff" },
  Azul: { primary: "#2563eb", accent: "#38bdf8", text: "#ffffff" },
  Verde: { primary: "#16a34a", accent: "#bef264", text: "#ffffff" },
  Roxo: { primary: "#7c3aed", accent: "#f0abfc", text: "#ffffff" },
  Laranja: { primary: "#ea580c", accent: "#fde047", text: "#ffffff" },
  Mono: { primary: "#111827", accent: "#9ca3af", text: "#ffffff" },
};

interface TemplateDef {
  id: string;
  label: string;
  previewColor: string;
}

const TEMPLATES: TemplateDef[] = [
  { id: "youtube", label: "YouTube Thumbnail", previewColor: "#dc2626" },
  { id: "instagram", label: "Instagram Quote", previewColor: "#7c3aed" },
  { id: "logo", label: "Logo Simples", previewColor: "#111827" },
  { id: "cta", label: "Botão CTA", previewColor: "#2563eb" },
  { id: "price", label: "Tag de Preço", previewColor: "#16a34a" },
  { id: "promo", label: "Banner Promo", previewColor: "#ea580c" },
  { id: "badge", label: "Badge Achievement", previewColor: "#fbbf24" },
  { id: "stats", label: "Card de Stats", previewColor: "#0ea5e9" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildYouTubeThumbnailTemplate(f: any, theme: ThemeDef): any {
  const bg = new f.Rect({
    left: 0,
    top: 0,
    width: 320,
    height: 180,
    fill: theme.primary,
    rx: 8,
    ry: 8,
  });
  const accentStripe = new f.Rect({
    left: 0,
    top: 140,
    width: 320,
    height: 40,
    fill: theme.accent,
  });
  const text = new f.Textbox("VEJA ISSO!", {
    left: 30,
    top: 50,
    width: 260,
    fontSize: 42,
    fontWeight: "bold",
    fill: theme.text,
    fontFamily: "Impact",
    textAlign: "left",
  });
  return new f.Group([bg, accentStripe, text], {
    left: 0,
    top: 0,
    data: { template: "youtube" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildInstagramQuoteTemplate(f: any, theme: ThemeDef): any {
  const bg = new f.Rect({
    left: 0,
    top: 0,
    width: 240,
    height: 360,
    fill: theme.primary,
    rx: 12,
    ry: 12,
  });
  const accent = new f.Rect({
    left: 20,
    top: 20,
    width: 200,
    height: 320,
    fill: theme.accent,
    opacity: 0.25,
    rx: 8,
    ry: 8,
  });
  const quote = new f.Textbox('"Inspiração diária"', {
    left: 30,
    top: 130,
    width: 180,
    fontSize: 22,
    fontStyle: "italic",
    fill: theme.text,
    textAlign: "center",
  });
  const author = new f.Textbox("— Autor", {
    left: 30,
    top: 220,
    width: 180,
    fontSize: 14,
    fill: theme.text,
    textAlign: "center",
  });
  return new f.Group([bg, accent, quote, author], {
    left: 0,
    top: 0,
    data: { template: "instagram" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLogoTemplate(f: any, theme: ThemeDef): any {
  const circle = new f.Circle({
    left: 0,
    top: 0,
    radius: 60,
    fill: theme.primary,
  });
  const initials = new f.Textbox("AB", {
    left: 0,
    top: 30,
    width: 120,
    fontSize: 48,
    fontWeight: "bold",
    fill: theme.text,
    textAlign: "center",
  });
  return new f.Group([circle, initials], {
    left: 0,
    top: 0,
    data: { template: "logo" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCtaButtonTemplate(f: any, theme: ThemeDef): any {
  const btn = new f.Rect({
    left: 0,
    top: 0,
    width: 220,
    height: 60,
    fill: theme.primary,
    rx: 30,
    ry: 30,
  });
  const label = new f.Textbox("Clique Aqui", {
    left: 20,
    top: 18,
    width: 140,
    fontSize: 20,
    fontWeight: "bold",
    fill: theme.text,
    textAlign: "center",
  });
  const arrow = new f.Textbox("→", {
    left: 170,
    top: 14,
    width: 40,
    fontSize: 28,
    fontWeight: "bold",
    fill: theme.accent,
    textAlign: "center",
  });
  return new f.Group([btn, label, arrow], {
    left: 0,
    top: 0,
    data: { template: "cta" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPriceTagTemplate(f: any, theme: ThemeDef): any {
  const pill = new f.Rect({
    left: 0,
    top: 0,
    width: 160,
    height: 56,
    fill: theme.accent,
    rx: 28,
    ry: 28,
  });
  const dollar = new f.Textbox("$", {
    left: 16,
    top: 12,
    width: 30,
    fontSize: 28,
    fontWeight: "bold",
    fill: theme.primary,
  });
  const price = new f.Textbox("99,90", {
    left: 50,
    top: 14,
    width: 100,
    fontSize: 26,
    fontWeight: "bold",
    fill: theme.primary,
  });
  return new f.Group([pill, dollar, price], {
    left: 0,
    top: 0,
    data: { template: "price" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPromoBannerTemplate(f: any, theme: ThemeDef): any {
  const banner = new f.Rect({
    left: 0,
    top: 0,
    width: 260,
    height: 70,
    fill: theme.primary,
    angle: -8,
    skewX: -10,
  });
  const discount = new f.Textbox("-50% OFF", {
    left: 30,
    top: 18,
    width: 200,
    fontSize: 32,
    fontWeight: "bold",
    fill: theme.text,
    textAlign: "center",
    angle: -8,
  });
  return new f.Group([banner, discount], {
    left: 0,
    top: 0,
    data: { template: "promo" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAchievementBadgeTemplate(f: any, theme: ThemeDef): any {
  const star = new f.Textbox("★", {
    left: 30,
    top: 0,
    width: 80,
    fontSize: 64,
    fill: theme.accent,
    textAlign: "center",
  });
  const ribbon = new f.Rect({
    left: 0,
    top: 70,
    width: 140,
    height: 36,
    fill: theme.primary,
    rx: 4,
    ry: 4,
  });
  const label = new f.Textbox("WINNER", {
    left: 0,
    top: 78,
    width: 140,
    fontSize: 18,
    fontWeight: "bold",
    fill: theme.text,
    textAlign: "center",
  });
  return new f.Group([star, ribbon, label], {
    left: 0,
    top: 0,
    data: { template: "badge" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStatsCardTemplate(f: any, theme: ThemeDef): any {
  const card = new f.Rect({
    left: 0,
    top: 0,
    width: 200,
    height: 140,
    fill: theme.primary,
    rx: 10,
    ry: 10,
  });
  const number = new f.Textbox("1.2K", {
    left: 0,
    top: 24,
    width: 200,
    fontSize: 56,
    fontWeight: "bold",
    fill: theme.text,
    textAlign: "center",
  });
  const label = new f.Textbox("Seguidores", {
    left: 0,
    top: 96,
    width: 200,
    fontSize: 16,
    fill: theme.accent,
    textAlign: "center",
  });
  return new f.Group([card, number, label], {
    left: 0,
    top: 0,
    data: { template: "stats" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTemplate(id: string, f: any, theme: ThemeDef): any {
  switch (id) {
    case "youtube":
      return buildYouTubeThumbnailTemplate(f, theme);
    case "instagram":
      return buildInstagramQuoteTemplate(f, theme);
    case "logo":
      return buildLogoTemplate(f, theme);
    case "cta":
      return buildCtaButtonTemplate(f, theme);
    case "price":
      return buildPriceTagTemplate(f, theme);
    case "promo":
      return buildPromoBannerTemplate(f, theme);
    case "badge":
      return buildAchievementBadgeTemplate(f, theme);
    case "stats":
      return buildStatsCardTemplate(f, theme);
    default:
      return null;
  }
}

export function ObjectTemplateLibraryPanel({
  fabricCanvas,
}: ObjectTemplateLibraryPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("youtube");
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("Vermelho");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const theme = THEMES[selectedTheme];
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        const group = buildTemplate(selectedTemplate, f, theme);
        if (!group) {
          toast.error("Template inválido");
          return;
        }
        const cx =
          (canvas.getWidth ? canvas.getWidth() : canvas.width || 800) / 2;
        const cy =
          (canvas.getHeight ? canvas.getHeight() : canvas.height || 600) / 2;
        const bw = group.width || 200;
        const bh = group.height || 200;
        group.set({
          left: cx - bw / 2,
          top: cy - bh / 2,
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        toast.success("Template inserido");
      })
      .catch(() => {
        toast.error("Erro ao carregar fabric");
      });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = canvas.getObjects().filter((o: any) => o?.data?.template);
    if (objs.length === 0) {
      toast.info("Nenhum template para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objs.length} template(s) removido(s)`);
  };

  const themeKeys = Object.keys(THEMES) as ThemeKey[];

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <LibraryBig className="h-5 w-5" />
        <h3 className="text-sm font-semibold">
          Biblioteca de Templates Rápidos
        </h3>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Tema de Cores</span>
        <div className="grid grid-cols-3 gap-2">
          {themeKeys.map((key) => {
            const t = THEMES[key];
            const active = selectedTheme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTheme(key)}
                className={`flex items-center gap-1 rounded border px-2 py-1 text-xs transition ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: t.primary }}
                />
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Template</span>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((tpl) => {
            const active = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`flex flex-col items-start gap-1 rounded border p-2 text-left text-xs transition ${
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span
                  className="h-6 w-full rounded"
                  style={{ backgroundColor: tpl.previewColor }}
                />
                <span className="font-medium">{tpl.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleInsert} className="w-full">
          Inserir Template
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="w-full"
        >
          Limpar Templates
        </Button>
      </div>
    </div>
  );
}
