"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface MyImagesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface StoredImage {
  id: string;
  name: string;
  dataURL: string;
  addedAt: number;
}

const STORAGE_KEY = "editor_my_images";
const MAX_IMAGES = 30;
const MAX_SIZE_MB = 2;

function loadStoredImages(): StoredImage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredImage[]) : [];
  } catch {
    return [];
  }
}

function saveStoredImages(images: StoredImage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
  } catch {
    // Storage quota exceeded — silently fail
  }
}

export function MyImagesPanel({ fabricCanvas }: MyImagesPanelProps) {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<StoredImage[]>([]);

  useEffect(() => {
    const stored = loadStoredImages();
    imagesRef.current = stored;
    queueMicrotask(() => setImages(stored));
  }, []);

  const addImagesToStore = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;

    imageFiles.forEach((file) => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" é muito grande (máx ${MAX_SIZE_MB}MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        const prev = imagesRef.current;
        if (prev.length >= MAX_IMAGES) {
          toast.error(`Limite de ${MAX_IMAGES} imagens atingido`);
          return;
        }
        const newImg: StoredImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name.replace(/\.[^.]+$/, ""),
          dataURL,
          addedAt: Date.now(),
        };
        const updated = [newImg, ...prev];
        imagesRef.current = updated;
        saveStoredImages(updated);
        setImages([...updated]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addImagesToStore(files);
    e.target.value = "";
  }, [addImagesToStore]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addImagesToStore(Array.from(e.dataTransfer.files));
  }, [addImagesToStore]);

  const addToCanvas = useCallback(async (img: StoredImage) => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then((m) => m.fabric);
    fabric.Image.fromURL(img.dataURL, (fabricImg: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fi = fabricImg as any;
      if (!fi) return;
      const cw = fabricCanvas.getWidth() / (fabricCanvas.getZoom() || 1);
      const ch = fabricCanvas.getHeight() / (fabricCanvas.getZoom() || 1);
      const scale = Math.min(cw / (fi.width ?? 1), ch / (fi.height ?? 1), 0.6);
      fi.set({ left: 40, top: 40, scaleX: scale, scaleY: scale, selectable: true });
      fabricCanvas.add(fi);
      fabricCanvas.setActiveObject(fi);
      fabricCanvas.requestRenderAll();
      toast.success(`"${img.name}" adicionada ao canvas`);
    });
  }, [fabricCanvas]);

  const removeImage = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = imagesRef.current.filter((i) => i.id !== id);
    imagesRef.current = updated;
    saveStoredImages(updated);
    setImages([...updated]);
    toast.success("Imagem removida da galeria");
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <ImagePlus className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Minhas Imagens</span>
        {images.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">{images.length}/{MAX_IMAGES}</span>
        )}
      </div>

      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-accent/20"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground" />
        <p className="text-[11px] text-muted-foreground">
          Arraste imagens ou clique para fazer upload
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          PNG, JPG, WEBP — máx {MAX_SIZE_MB}MB cada
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 text-center py-4">
          Nenhuma imagem salva ainda
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/50 transition-colors aspect-video bg-muted"
              onClick={() => addToCanvas(img)}
              title={img.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataURL}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                <span className="text-white text-[9px] font-medium px-1 text-center leading-tight line-clamp-2">
                  {img.name}
                </span>
              </div>
              {/* Delete button */}
              <button
                className="absolute top-1 right-1 w-5 h-5 rounded bg-red-500/80 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => removeImage(img.id, e)}
                title="Remover da galeria"
              >
                <Trash2 className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
