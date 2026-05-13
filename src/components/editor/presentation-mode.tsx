"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";

interface PresentationModeProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  onClose: () => void;
}

export function PresentationMode({ fabricCanvas, onClose }: PresentationModeProps) {
  const { pages, currentPageIndex, savePageState } = useEditorStore();
  const [slideIndex, setSlideIndex] = useState(currentPageIndex);
  const [slides, setSlides] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate all slide thumbnails at full quality
  useEffect(() => {
    const generate = async () => {
      if (!fabricCanvas) return;
      setLoading(true);

      // Save current page
      const currentJSON = JSON.stringify(fabricCanvas.toJSON());
      const currentThumb = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.3, multiplier: 0.15 });
      savePageState(currentPageIndex, currentJSON, currentThumb);

      const allPages = [...pages];
      allPages[currentPageIndex] = { ...allPages[currentPageIndex], fabricJSON: currentJSON };

      const rendered: string[] = [];

      for (let i = 0; i < allPages.length; i++) {
        const page = allPages[i];
        if (i !== currentPageIndex && page.fabricJSON) {
          await new Promise<void>((resolve) => {
            fabricCanvas.loadFromJSON(page.fabricJSON, () => {
              fabricCanvas.requestRenderAll();
              resolve();
            });
          });
        } else if (i === currentPageIndex) {
          fabricCanvas.loadFromJSON(currentJSON, () => fabricCanvas.requestRenderAll());
          await new Promise((r) => setTimeout(r, 50));
        }

        const dataURL = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.9, multiplier: 1 });
        rendered.push(dataURL);
      }

      // Restore current page
      if (pages[currentPageIndex].fabricJSON) {
        await new Promise<void>((resolve) => {
          fabricCanvas.loadFromJSON(pages[currentPageIndex].fabricJSON, () => {
            fabricCanvas.requestRenderAll();
            resolve();
          });
        });
      }

      setSlides(rendered);
      setLoading(false);
    };

    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback((index: number) => {
    setSlideIndex(Math.max(0, Math.min(index, pages.length - 1)));
  }, [pages.length]);

  const goNext = useCallback(() => goTo(slideIndex + 1), [goTo, slideIndex]);
  const goPrev = useCallback(() => goTo(slideIndex - 1), [goTo, slideIndex]);

  // Auto-play
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setSlideIndex((i) => {
          if (i >= pages.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, 3000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, pages.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {loading ? (
          <div className="text-white/50 text-sm animate-pulse">Preparando apresentação...</div>
        ) : slides[slideIndex] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slides[slideIndex]}
            alt={`Slide ${slideIndex + 1}`}
            className="max-w-full max-h-full object-contain shadow-2xl"
            style={{ transition: "opacity 0.3s ease" }}
          />
        ) : (
          <div className="text-white/30 text-sm">Página vazia</div>
        )}

        {/* Prev/Next overlay buttons */}
        {slideIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {slideIndex < pages.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPlaying((v) => !v)}
            className="text-white/70 hover:text-white transition-colors"
            title={playing ? "Pausar" : "Reproduzir automaticamente"}
          >
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <span className="text-white/50 text-xs tabular-nums">
            {slideIndex + 1} / {pages.length}
          </span>
        </div>

        {/* Dot navigation */}
        <div className="flex items-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === slideIndex ? "bg-white w-4" : "bg-white/30 hover:bg-white/60"}`}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors flex items-center gap-1.5 text-xs"
        >
          <X className="w-4 h-4" />
          Sair (Esc)
        </button>
      </div>
    </div>
  );
}
