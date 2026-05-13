"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tag, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ObjectRenamePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ObjEntry {
  uid: string;
  name: string;
  type: string;
  index: number;
}

function typeShort(type: string): string {
  const m: Record<string, string> = {
    "i-text": "T", textbox: "T", text: "T",
    rect: "R", circle: "C", ellipse: "E", triangle: "Tri",
    image: "IMG", group: "GRP", path: "P", line: "L",
  };
  return m[type] ?? "?";
}

function typeColor(type: string): string {
  if (type.includes("text")) return "bg-purple-500/20 text-purple-400";
  if (type === "image") return "bg-blue-500/20 text-blue-400";
  if (type === "group") return "bg-orange-500/20 text-orange-400";
  return "bg-green-500/20 text-green-400";
}

function RenameRow({ entry, onSave }: {
  entry: ObjEntry;
  onSave: (uid: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(entry.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== entry.name) {
      onSave(entry.uid, trimmed);
    }
    setEditing(false);
  }, [value, entry.name, entry.uid, onSave]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="flex items-center gap-2 py-1 group">
      <span className={`text-[8px] px-1 py-0.5 rounded font-mono flex-shrink-0 ${typeColor(entry.type)}`}>
        {typeShort(entry.type)}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="flex-1 bg-muted/80 border border-primary rounded px-1.5 py-0.5 text-[9px] focus:outline-none"
        />
      ) : (
        <button
          onClick={() => { setValue(entry.name); setEditing(true); }}
          className="flex-1 text-left text-[9px] truncate hover:text-primary transition-colors"
          title="Clique para renomear"
        >
          {entry.name}
        </button>
      )}
      {editing && (
        <button onClick={commit} className="text-primary flex-shrink-0">
          <Check className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function ObjectRenamePanel({ fabricCanvas, selectionVersion }: ObjectRenamePanelProps) {
  const [entries, setEntries] = useState<ObjEntry[]>([]);
  const [filter, setFilter] = useState("");
  let uid = 2000;

  const load = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects().filter((o: any) => !o.data?.isGuideOverlay && !o.data?.isGuide && !o.data?.isGridOverlay);
    setEntries(objs.map((o, i) => {
      if (!o.__ruid) o.__ruid = String(uid++);
      const defaultName = `${typeShort(o.type ?? "?")} ${i + 1}`;
      return {
        uid: o.__ruid as string,
        name: (o.name as string | undefined) ?? defaultName,
        type: o.type ?? "unknown",
        index: i,
      };
    }));
  }, [fabricCanvas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void selectionVersion;
    queueMicrotask(load);
  }, [fabricCanvas, selectionVersion, load]);

  const save = useCallback((ruid: string, name: string) => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = fabricCanvas.getObjects().find((o: any) => o.__ruid === ruid);
    if (!obj) return;
    obj.name = name;
    setEntries(prev => prev.map(e => e.uid === ruid ? { ...e, name } : e));
    toast.success(`Renomeado para "${name}"`);
  }, [fabricCanvas]);

  const autoName = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects().filter((o: any) => !o.data?.isGuideOverlay && !o.data?.isGuide && !o.data?.isGridOverlay);
    const counts: Record<string, number> = {};
    objs.forEach(o => {
      const t = typeShort(o.type ?? "?");
      counts[t] = (counts[t] ?? 0) + 1;
      o.name = `${t}-${counts[t]}`;
    });
    load();
    toast.success("Nomes automáticos aplicados");
  }, [fabricCanvas, load]);

  const filtered = filter
    ? entries.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()) || e.type.includes(filter))
    : entries;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Renomear Objetos</span>
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-primary transition-colors" title="Atualizar">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filtrar por nome ou tipo..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-primary"
      />

      <button
        onClick={autoName}
        className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors"
      >
        <Tag className="w-3 h-3" /> Nomes automáticos (T-1, IMG-2...)
      </button>

      {entries.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-4">Canvas vazio — adicione objetos</p>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {filtered.length} objeto(s)
            </span>
            <span className="text-[8px] text-muted-foreground/60">Clique no nome para editar</span>
          </div>
          {filtered.map(e => (
            <RenameRow key={e.uid} entry={e} onSave={save} />
          ))}
        </div>
      )}
    </div>
  );
}
