"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, Group, Ungroup, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface ObjectGroupPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface GroupEntry {
  id: string;
  label: string;
  count: number;
  visible: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any;
}

let groupIdCounter = 1;

function buildGroupEntries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objs: any[]
): GroupEntry[] {
  return objs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((o: any) => o.type === "group" && !o.data?.isGuideOverlay && !o.data?.isGuide)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((o: any, i: number) => {
      if (!o.__gid) o.__gid = String(groupIdCounter++);
      return {
        id: o.__gid as string,
        label: o.name ?? `Grupo ${i + 1}`,
        count: o._objects?.length ?? 0,
        visible: o.visible !== false,
        ref: o,
      };
    });
}

function GroupRow({ entry, onSelect, onToggle, onUngroup, onRename }: {
  entry: GroupEntry;
  onSelect: (e: GroupEntry) => void;
  onToggle: (e: GroupEntry) => void;
  onUngroup: (e: GroupEntry) => void;
  onRename: (e: GroupEntry, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(entry.label);

  const commitName = () => {
    if (nameVal.trim()) onRename(entry, nameVal.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-col border border-border rounded overflow-hidden">
      <div className="flex items-center gap-1 p-1.5 bg-muted/20 hover:bg-muted/40 transition-colors">
        <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {editing ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditing(false); }}
            className="flex-1 bg-muted border border-primary rounded px-1 text-[9px] focus:outline-none"
          />
        ) : (
          <button
            onClick={() => onSelect(entry)}
            onDoubleClick={() => setEditing(true)}
            className="flex-1 text-left text-[9px] truncate hover:text-primary transition-colors"
            title="Clique para selecionar, duplo clique para renomear"
          >
            {entry.label}
          </button>
        )}
        <span className="text-[8px] text-muted-foreground/60 flex-shrink-0">{entry.count} obj</span>
        <button
          onClick={() => onToggle(entry)}
          className="text-[8px] text-muted-foreground/60 hover:text-primary transition-colors flex-shrink-0 px-1"
          title={entry.visible ? "Ocultar" : "Mostrar"}
        >
          {entry.visible ? "👁" : "—"}
        </button>
        <button
          onClick={() => onUngroup(entry)}
          className="text-[8px] text-destructive/60 hover:text-destructive transition-colors flex-shrink-0 px-1"
          title="Desfazer grupo"
        >
          ✕
        </button>
      </div>
      {expanded && (
        <div className="px-3 py-1.5 flex flex-col gap-0.5 bg-muted/10">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(entry.ref._objects ?? []).map((o: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground/50 w-3">{i + 1}</span>
              <span className="text-[9px] text-muted-foreground truncate">{o.name ?? o.type ?? "objeto"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ObjectGroupPanel({ fabricCanvas, selectionVersion }: ObjectGroupPanelProps) {
  const [groups, setGroups] = useState<GroupEntry[]>([]);
  const [hasMulti, setHasMulti] = useState(false);
  const [hasGroup, setHasGroup] = useState(false);

  const load = useCallback(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = fabricCanvas.getObjects() as any[];
      setGroups(buildGroupEntries(all));
      const sel = fabricCanvas.getActiveObject();
      setHasMulti(sel?.type === "activeSelection");
      setHasGroup(sel?.type === "group");
    });
  }, [fabricCanvas]);

  useEffect(() => {
    load();
  }, [fabricCanvas, selectionVersion, load]);

  const groupSelected = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel: any = fabricCanvas.getActiveObject();
    if (!sel || sel.type !== "activeSelection") {
      toast.error("Selecione múltiplos objetos para agrupar");
      return;
    }
    const grp = sel.toGroup();
    grp.name = `Grupo ${groupIdCounter}`;
    fabricCanvas.requestRenderAll();
    load();
    toast.success("Objetos agrupados");
  }, [fabricCanvas, load]);

  const ungroupSelected = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sel: any = fabricCanvas.getActiveObject();
    if (!sel || sel.type !== "group") {
      toast.error("Selecione um grupo para desagrupar");
      return;
    }
    sel.toActiveSelection();
    fabricCanvas.requestRenderAll();
    load();
    toast.success("Grupo desfeito");
  }, [fabricCanvas, load]);

  const selectGroup = useCallback((entry: GroupEntry) => {
    if (!fabricCanvas) return;
    fabricCanvas.setActiveObject(entry.ref);
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas]);

  const toggleGroup = useCallback((entry: GroupEntry) => {
    entry.ref.set({ visible: !entry.visible });
    fabricCanvas?.requestRenderAll();
    load();
  }, [fabricCanvas, load]);

  const ungroupEntry = useCallback((entry: GroupEntry) => {
    if (!fabricCanvas) return;
    fabricCanvas.setActiveObject(entry.ref);
    entry.ref.toActiveSelection();
    fabricCanvas.requestRenderAll();
    load();
    toast.success(`"${entry.label}" desfeito`);
  }, [fabricCanvas, load]);

  const renameGroup = useCallback((entry: GroupEntry, name: string) => {
    entry.ref.name = name;
    load();
    toast.success(`Renomeado para "${name}"`);
  }, [load]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Grupos de Objetos</span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={groupSelected}
          disabled={!hasMulti}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-30"
        >
          <Group className="w-3 h-3" /> Agrupar (⌘G)
        </button>
        <button
          onClick={ungroupSelected}
          disabled={!hasGroup}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-30"
        >
          <Ungroup className="w-3 h-3" /> Desagrupar
        </button>
      </div>

      {/* Groups list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Grupos no canvas ({groups.length})
          </span>
          <button onClick={load} className="text-[8px] text-muted-foreground/60 hover:text-primary transition-colors">
            Atualizar
          </button>
        </div>

        {groups.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4 opacity-60">
            Nenhum grupo criado ainda
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {groups.map(g => (
              <GroupRow
                key={g.id}
                entry={g}
                onSelect={selectGroup}
                onToggle={toggleGroup}
                onUngroup={ungroupEntry}
                onRename={renameGroup}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Duplo clique no nome para renomear • ✕ para desagrupar
      </p>
    </div>
  );
}
