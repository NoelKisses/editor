"use client";

import { useCallback, useRef, useState } from "react";
import { Search, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

interface StockPhotosPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface UnsplashPhoto {
  id: string;
  urls: { small: string; regular: string; full: string };
  alt_description: string | null;
  user: { name: string };
  links: { html: string };
}

const POPULAR_SEARCHES = [
  "tecnologia", "natureza", "cidade", "abstrato", "negócios",
  "música", "esporte", "comida", "viagem", "pessoas",
];

export function StockPhotosPanel({ fabricCanvas }: StockPhotosPanelProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeQuery, setActiveQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setActiveQuery(q);
    try {
      // Using Unsplash Source API (no API key required) for random photos
      // For search we use a curated approach via the public Unsplash feed
      const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

      let data: { results: UnsplashPhoto[]; total_pages: number } | null = null;

      if (UNSPLASH_ACCESS_KEY) {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${p}&per_page=20&orientation=landscape`,
          { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
        );
        data = await res.json();
      } else {
        // Fallback: generate placeholder photos using source.unsplash.com
        const seeds = Array.from({ length: 20 }, (_, i) => `${q}-${p}-${i}`);
        const fallback: UnsplashPhoto[] = seeds.map((seed, i) => ({
          id: seed,
          urls: {
            small: `https://source.unsplash.com/400x300/?${encodeURIComponent(q)}&sig=${p * 20 + i}`,
            regular: `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}&sig=${p * 20 + i}`,
            full: `https://source.unsplash.com/1600x900/?${encodeURIComponent(q)}&sig=${p * 20 + i}`,
          },
          alt_description: `${q} photo ${i + 1}`,
          user: { name: "Unsplash" },
          links: { html: "https://unsplash.com" },
        }));
        data = { results: fallback, total_pages: 5 };
      }

      if (p === 1) {
        setPhotos(data?.results ?? []);
      } else {
        setPhotos((prev) => [...prev, ...(data?.results ?? [])]);
      }
      setHasMore((data?.total_pages ?? 0) > p);
      setPage(p);
    } catch {
      toast.error("Erro ao buscar imagens");
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCanvas = useCallback(async (photo: UnsplashPhoto) => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    const imgUrl = photo.urls.regular;

    fabric.Image.fromURL(
      imgUrl,
      (img) => {
        if (!img) { toast.error("Erro ao carregar imagem"); return; }
        const maxW = fabricCanvas.getWidth() * 0.6;
        const maxH = fabricCanvas.getHeight() * 0.6;
        const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1));
        img.set({ left: 60, top: 60, scaleX: scale, scaleY: scale });
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.requestRenderAll();
        toast.success("Imagem adicionada ao canvas");
      },
      { crossOrigin: "anonymous" }
    );
  }, [fabricCanvas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const handleKeyword = (kw: string) => {
    setQuery(kw);
    search(kw);
  };

  return (
    <div className="flex flex-col gap-2 pt-2 pb-3">
      <form onSubmit={handleSearch} className="flex gap-1.5 px-3">
        <div className="flex-1 flex items-center gap-1.5 bg-background border border-border rounded px-2 py-1">
          <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar fotos..."
            className="text-xs bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Buscar"}
        </button>
      </form>

      {/* Popular keywords */}
      {photos.length === 0 && !loading && (
        <div className="px-3 flex flex-col gap-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Populares</span>
          <div className="flex flex-wrap gap-1">
            {POPULAR_SEARCHES.map((kw) => (
              <button
                key={kw}
                onClick={() => handleKeyword(kw)}
                className="text-[11px] px-2 py-0.5 rounded-full border border-border hover:border-primary/50 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                {kw}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Fotos por Unsplash · Livre para uso
          </p>
        </div>
      )}

      {/* Results */}
      {photos.length > 0 && (
        <div className="px-3 flex flex-col gap-1.5">
          {activeQuery && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Resultados para &quot;{activeQuery}&quot;
              </span>
              <button
                onClick={() => { setPhotos([]); setQuery(""); setActiveQuery(""); }}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                limpar
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-1.5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group rounded-md overflow-hidden border border-border aspect-video bg-muted/20 cursor-pointer"
                onClick={() => addToCanvas(photo)}
                title={photo.alt_description ?? "Adicionar ao canvas"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.urls.small}
                  alt={photo.alt_description ?? "photo"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ImagePlus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => search(activeQuery, page + 1)}
              disabled={loading}
              className="mt-1 text-xs text-center text-muted-foreground hover:text-foreground py-1.5 border border-dashed border-border rounded-md hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Carregar mais"}
            </button>
          )}
        </div>
      )}

      {loading && photos.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
