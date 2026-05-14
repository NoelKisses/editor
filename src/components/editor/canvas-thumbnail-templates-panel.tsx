"use client";

import { useCallback, useState } from "react";
import { LayoutTemplate, Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface CanvasThumbnailTemplatesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type TemplateCategory = "youtube" | "reels" | "story" | "podcast" | "banner" | "post";

interface TemplateItem {
  id: string;
  label: string;
  category: TemplateCategory;
  bgColor: string;
  accentColor: string;
  textColor: string;
  layout: "centered" | "split" | "corner" | "minimal" | "bold";
  titleText: string;
  subtitleText: string;
  hasShape: boolean;
  shapeType?: "rect" | "circle" | "triangle";
}

const CATEGORIES: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "youtube", label: "YouTube" },
  { value: "reels", label: "Reels" },
  { value: "story", label: "Story" },
  { value: "podcast", label: "Podcast" },
  { value: "banner", label: "Banner" },
  { value: "post", label: "Post" },
];

const TEMPLATES: TemplateItem[] = [
  // YouTube
  { id: "yt-bold-1", label: "Bold Impact", category: "youtube", bgColor: "#0f0f0f", accentColor: "#ff0000", textColor: "#ffffff", layout: "bold", titleText: "TÍTULO ÉPICO", subtitleText: "Episódio 01", hasShape: true, shapeType: "rect" },
  { id: "yt-split-1", label: "Split Clean", category: "youtube", bgColor: "#1a1a2e", accentColor: "#e94560", textColor: "#ffffff", layout: "split", titleText: "Meu Título", subtitleText: "Subtítulo aqui", hasShape: true, shapeType: "rect" },
  { id: "yt-minimal-1", label: "Minimal Light", category: "youtube", bgColor: "#f8f9fa", accentColor: "#6366f1", textColor: "#111827", layout: "minimal", titleText: "Título Limpo", subtitleText: "Descrição breve", hasShape: false },
  { id: "yt-neon-1", label: "Neon Dark", category: "youtube", bgColor: "#0d0d0d", accentColor: "#00ff9f", textColor: "#ffffff", layout: "centered", titleText: "NEON TITLE", subtitleText: "Sub aqui", hasShape: true, shapeType: "circle" },
  { id: "yt-orange-1", label: "Energy Orange", category: "youtube", bgColor: "#ff6b35", accentColor: "#ffffff", textColor: "#ffffff", layout: "corner", titleText: "TÍTULO AQUI", subtitleText: "Vol. 1", hasShape: true, shapeType: "triangle" },
  { id: "yt-purple-1", label: "Purple Gradient", category: "youtube", bgColor: "#667eea", accentColor: "#764ba2", textColor: "#ffffff", layout: "centered", titleText: "Título Aqui", subtitleText: "Episódio 5", hasShape: false },
  // Reels / Shorts
  { id: "reel-1", label: "Vertical Bold", category: "reels", bgColor: "#000000", accentColor: "#ffffff", textColor: "#ffffff", layout: "bold", titleText: "TÍTULO", subtitleText: "#hashtag", hasShape: true, shapeType: "rect" },
  { id: "reel-2", label: "Gradient Pop", category: "reels", bgColor: "#f72585", accentColor: "#7209b7", textColor: "#ffffff", layout: "centered", titleText: "Trending Now", subtitleText: "Viral content", hasShape: false },
  { id: "reel-3", label: "Minimal Vertical", category: "reels", bgColor: "#fafafa", accentColor: "#2d3748", textColor: "#2d3748", layout: "minimal", titleText: "Meu Reel", subtitleText: "@usuario", hasShape: false },
  // Story
  { id: "story-1", label: "Story Clean", category: "story", bgColor: "#ffffff", accentColor: "#e74c3c", textColor: "#2c3e50", layout: "centered", titleText: "Novidade!", subtitleText: "Arraste para ver", hasShape: true, shapeType: "circle" },
  { id: "story-2", label: "Story Dark", category: "story", bgColor: "#2c2c54", accentColor: "#706fd3", textColor: "#ffffff", layout: "split", titleText: "Exclusivo", subtitleText: "Só aqui", hasShape: false },
  // Podcast
  { id: "pod-1", label: "Podcast Classic", category: "podcast", bgColor: "#1a1a2e", accentColor: "#e94560", textColor: "#ffffff", layout: "centered", titleText: "O Podcast", subtitleText: "Episódio 42", hasShape: true, shapeType: "circle" },
  { id: "pod-2", label: "Podcast Waves", category: "podcast", bgColor: "#0f3460", accentColor: "#e94560", textColor: "#ffffff", layout: "bold", titleText: "PODCAST", subtitleText: "Ep. 10 · 45min", hasShape: false },
  // Banner
  { id: "ban-1", label: "Channel Banner", category: "banner", bgColor: "#141852", accentColor: "#e94560", textColor: "#ffffff", layout: "split", titleText: "Canal Name", subtitleText: "Subscribe!", hasShape: true, shapeType: "rect" },
  { id: "ban-2", label: "Event Banner", category: "banner", bgColor: "#ff6b6b", accentColor: "#ffffff", textColor: "#ffffff", layout: "bold", titleText: "EVENTO", subtitleText: "Dia 15 · 19h", hasShape: false },
  // Post
  { id: "post-1", label: "Quote Post", category: "post", bgColor: "#2d3561", accentColor: "#c05c7e", textColor: "#ffffff", layout: "centered", titleText: "\"Frase inspiradora aqui\"", subtitleText: "— Autor", hasShape: false },
  { id: "post-2", label: "Announcement", category: "post", bgColor: "#ffd32a", accentColor: "#0652DD", textColor: "#0652DD", layout: "bold", titleText: "NOVIDADE", subtitleText: "Confira agora", hasShape: true, shapeType: "rect" },
];

function getLayoutObjects(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any,
  template: TemplateItem,
  cw: number,
  ch: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const objs = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;

  // Background
  objs.push(new f.Rect({
    left: 0, top: 0, width: cw, height: ch,
    fill: template.bgColor, selectable: false, evented: false,
    data: { templatePart: "bg" },
  }));

  if (template.hasShape && template.shapeType === "rect") {
    objs.push(new f.Rect({
      left: -20, top: ch * 0.6,
      width: cw + 40, height: ch * 0.42,
      fill: template.accentColor,
      angle: template.layout === "corner" ? -5 : 0,
      selectable: false, evented: false,
      data: { templatePart: "shape" },
    }));
  }

  if (template.hasShape && template.shapeType === "circle") {
    objs.push(new f.Circle({
      left: cw * 0.6, top: -ch * 0.1,
      radius: ch * 0.55,
      fill: template.accentColor + "33",
      selectable: false, evented: false,
      data: { templatePart: "shape" },
    }));
  }

  if (template.hasShape && template.shapeType === "triangle") {
    objs.push(new f.Triangle({
      left: cw * 0.55, top: -20,
      width: cw * 0.9, height: ch * 1.2,
      fill: template.accentColor + "22",
      selectable: false, evented: false,
      data: { templatePart: "shape" },
    }));
  }

  // Accent line
  if (template.layout === "split" || template.layout === "minimal") {
    objs.push(new f.Rect({
      left: 30, top: ch * 0.45,
      width: 60, height: 5,
      fill: template.accentColor, rx: 2, ry: 2,
      selectable: false, evented: false,
      data: { templatePart: "line" },
    }));
  }

  const titleTop = template.layout === "bold" ? ch * 0.65
    : template.layout === "corner" ? ch * 0.55
    : ch * 0.38;
  const titleFontSize = Math.round(cw * 0.072);
  const subFontSize = Math.round(cw * 0.038);
  const titleLeft = template.layout === "minimal" || template.layout === "split" ? 30 : cw / 2;
  const titleOrigin = template.layout === "minimal" || template.layout === "split" ? "left" : "center";

  objs.push(new f.IText(template.titleText, {
    left: titleLeft,
    top: titleTop,
    fontSize: titleFontSize,
    fill: template.layout === "bold" && template.bgColor !== "#ffffff" ? template.textColor : template.textColor,
    fontFamily: "Arial",
    fontWeight: template.layout === "bold" ? "900" : "700",
    originX: titleOrigin,
    data: { templatePart: "title" },
  }));

  objs.push(new f.IText(template.subtitleText, {
    left: titleLeft,
    top: titleTop + titleFontSize + 10,
    fontSize: subFontSize,
    fill: template.accentColor,
    fontFamily: "Arial",
    fontWeight: "400",
    originX: titleOrigin,
    data: { templatePart: "subtitle" },
  }));

  return objs;
}

export function CanvasThumbnailTemplatesPanel({ fabricCanvas }: CanvasThumbnailTemplatesPanelProps) {
  const [category, setCategory] = useState<TemplateCategory | "all">("youtube");
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = category === "all" || t.category === category;
    const matchSearch = !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.titleText.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const applyTemplate = useCallback((template: TemplateItem) => {
    const cv = fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }

    setApplying(template.id);

    import("fabric").then((m) => {
      const fabric = m.fabric;
      const cw = cv.getWidth();
      const ch = cv.getHeight();

      const objects = getLayoutObjects(fabric, template, cw, ch);

      objects.forEach((obj) => {
        obj.setCoords?.();
        cv.add(obj);
      });

      cv.requestRenderAll();
      setApplying(null);
      toast.success(`Template "${template.label}" aplicado`);
    });
  }, [fabricCanvas]);

  const applyTemplateClear = useCallback((template: TemplateItem) => {
    const cv = fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }

    setApplying(template.id);

    import("fabric").then((m) => {
      const fabric = m.fabric;
      cv.clear();
      const cw = cv.getWidth();
      const ch = cv.getHeight();

      const objects = getLayoutObjects(fabric, template, cw, ch);
      objects.forEach((obj) => {
        obj.setCoords?.();
        cv.add(obj);
      });

      cv.requestRenderAll();
      setApplying(null);
      toast.success(`Canvas limpo e template "${template.label}" aplicado`);
    });
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Templates de Thumbnail</span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border bg-muted/20">
        <Search className="w-3 h-3 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar template..."
          className="flex-1 bg-transparent text-[9px] focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-0.5 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value as TemplateCategory | "all")}
            className={`px-2 py-0.5 rounded text-[7px] border transition-colors ${
              category === c.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto">
        {filtered.map((template) => (
          <div
            key={template.id}
            className="flex items-center gap-2 p-1.5 rounded border border-border hover:border-primary/30 transition-colors group"
          >
            {/* Mini preview */}
            <div
              className="w-16 h-10 rounded flex-shrink-0 flex items-end overflow-hidden relative"
              style={{ background: template.bgColor }}
            >
              {template.hasShape && template.shapeType === "rect" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-4"
                  style={{ background: template.accentColor }}
                />
              )}
              {template.hasShape && template.shapeType === "circle" && (
                <div
                  className="absolute right-0 top-0 w-10 h-10 rounded-full opacity-30"
                  style={{ background: template.accentColor, transform: "translate(30%, -30%)" }}
                />
              )}
              <div className="relative z-10 px-1 pb-0.5">
                <div
                  className="text-[5px] font-bold leading-tight truncate"
                  style={{ color: template.textColor }}
                >
                  {template.titleText.slice(0, 10)}
                </div>
                <div
                  className="text-[4px] leading-tight truncate"
                  style={{ color: template.accentColor }}
                >
                  {template.subtitleText.slice(0, 12)}
                </div>
              </div>
            </div>

            {/* Info + actions */}
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-medium truncate block">{template.label}</span>
              <span className="text-[7px] text-muted-foreground capitalize">{template.category}</span>
            </div>

            <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => applyTemplate(template)}
                disabled={applying === template.id}
                title="Adicionar ao canvas"
                className="w-6 h-6 rounded border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <LayoutTemplate className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-[10px] text-muted-foreground">Nenhum template encontrado</p>
          </div>
        )}
      </div>

      {/* Action hint */}
      <div className="flex gap-1">
        <button
          onClick={() => {
            if (filtered.length > 0) applyTemplateClear(filtered[0]);
          }}
          disabled={filtered.length === 0 || !fabricCanvas}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-destructive/30 text-destructive text-[8px] hover:bg-destructive/5 transition-colors disabled:opacity-40"
        >
          Limpar e aplicar primeiro
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        + adiciona sobre o canvas · &quot;Limpar&quot; remove tudo antes
      </p>
    </div>
  );
}
