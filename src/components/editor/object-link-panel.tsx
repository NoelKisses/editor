"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ObjectLinkPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ObjectLink {
  id: string;
  objectId: string;
  label: string;
  url: string;
  openIn: "_blank" | "_self";
}

const LINK_TAG = "__link__";

function getObjectId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any
): string {
  if (!obj.data?.linkId) {
    obj.data = { ...(obj.data ?? {}), linkId: `obj-${Date.now()}` };
  }
  return obj.data.linkId as string;
}

export function ObjectLinkPanel({ fabricCanvas, selectionVersion }: ObjectLinkPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [links, setLinks] = useState<ObjectLink[]>([]);
  const [url, setUrl] = useState("https://");
  const [label, setLabel] = useState("");
  const [openIn, setOpenIn] = useState<"_blank" | "_self">("_blank");
  const [currentObjId, setCurrentObjId] = useState<string | null>(null);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (obj) {
        setHasObject(true);
        const id = getObjectId(obj);
        setCurrentObjId(id);
      } else {
        setHasObject(false);
        setCurrentObjId(null);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const addLink = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    if (!url.trim() || url === "https://") { toast.error("URL inválida"); return; }

    const objId = getObjectId(obj);
    const id = `link-${Date.now()}`;
    const linkLabel = label.trim() || url;

    const link: ObjectLink = { id, objectId: objId, label: linkLabel, url: url.trim(), openIn };

    // Store on object data
    obj.data = {
      ...(obj.data ?? {}),
      [LINK_TAG]: true,
      links: [...(obj.data?.links ?? []), link],
    };

    // Visual indicator: add a subtle highlight
    if (!obj._origBorderColor) {
      obj._origBorderColor = obj.borderColor;
    }
    obj.set({ borderColor: "#3b82f6", borderScaleFactor: 2 });
    fabricCanvas.requestRenderAll();

    setLinks(prev => [...prev, link]);
    setUrl("https://");
    setLabel("");
    toast.success(`Link adicionado: ${linkLabel}`);
  }, [fabricCanvas, url, label, openIn]);

  const removeLink = useCallback((id: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    if (obj) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obj.data.links = (obj.data.links ?? []).filter((l: any) => l.id !== id);
      if ((obj.data.links ?? []).length === 0) {
        obj.set({ borderColor: obj._origBorderColor ?? null });
        delete obj._origBorderColor;
      }
      fabricCanvas.requestRenderAll();
    }
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success("Link removido");
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (obj) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLinks((obj.data?.links ?? []) as any[]);
      } else {
        setLinks([]);
      }
    });
  }, [fabricCanvas, currentObjId]);

  const exportLinksJson = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allLinks: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((obj: any) => {
      if (obj.data?.[LINK_TAG] && obj.data.links?.length) {
        allLinks.push(...obj.data.links);
      }
    });
    const json = JSON.stringify(allLinks, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "canvas-links.json";
    a.click();
    toast.success(`${allLinks.length} link(s) exportado(s)`);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Link className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Links nos Objetos</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Link className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para adicionar links</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Novo Link</span>

            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="Rótulo (opcional)"
              className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />

            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://exemplo.com"
              className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />

            <div className="grid grid-cols-2 gap-1">
              {(["_blank", "_self"] as const).map(t => (
                <button key={t} onClick={() => setOpenIn(t)}
                  className={`py-1 rounded border text-[8px] transition-colors ${openIn === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {t === "_blank" ? "Nova aba" : "Mesma aba"}
                </button>
              ))}
            </div>

            <button onClick={addLink}
              className="flex items-center justify-center gap-0.5 py-1.5 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Plus className="w-3 h-3" /> Adicionar Link
            </button>
          </div>

          {links.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-3 text-center">
              <p className="text-[9px] text-muted-foreground">Nenhum link neste objeto</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Links ({links.length})</span>
              {links.map(l => (
                <div key={l.id} className="flex items-center gap-2 px-2 py-1.5 rounded border border-border">
                  <ExternalLink className="w-3 h-3 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-medium truncate">{l.label}</p>
                    <p className="text-[7px] text-muted-foreground truncate">{l.url}</p>
                  </div>
                  <span className="text-[7px] text-muted-foreground flex-shrink-0">{l.openIn === "_blank" ? "↗" : "→"}</span>
                  <button onClick={() => removeLink(l.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={exportLinksJson}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
            <Link className="w-3 h-3" /> Exportar links (.json)
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Links armazenados nos dados do objeto
          </p>
        </>
      )}
    </div>
  );
}
