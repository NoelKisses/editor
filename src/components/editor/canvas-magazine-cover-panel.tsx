"use client";

import { useEffect, useRef, useState } from "react";
import { Newspaper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasMagazineCoverPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type LayoutStyle = "classic" | "editorial" | "bold" | "minimalist";

interface LayoutParams {
  title: string;
  issue: string;
  headline: string;
  sub1: string;
  sub2: string;
  sub3: string;
  price: string;
  titleColor: string;
  headlineColor: string;
  bgColor: string;
  headlineSize: number;
}

function makeBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  color: string,
) {
  return new f.Rect({
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill: color,
    selectable: false,
  });
}

function makeText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any,
) {
  return new f.Textbox(text, {
    editable: false,
    ...options,
  });
}

function buildClassicLayout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  params: LayoutParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const bg = makeBackground(f, w, h, params.bgColor);
  const masthead = makeText(f, params.title, {
    left: w / 2,
    top: 40,
    width: w - 80,
    fontSize: 96,
    fontWeight: "900",
    fontFamily: "Georgia",
    fill: params.titleColor,
    textAlign: "center",
    originX: "center",
  });
  const issue = makeText(f, params.issue, {
    left: w / 2,
    top: 150,
    width: w - 80,
    fontSize: 14,
    fontFamily: "Georgia",
    fill: params.titleColor,
    textAlign: "center",
    originX: "center",
  });
  const headline = makeText(f, params.headline, {
    left: w / 2,
    top: h / 2 - params.headlineSize,
    width: w - 80,
    fontSize: params.headlineSize,
    fontWeight: "700",
    fontFamily: "Georgia",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
  });
  const sub1 = makeText(f, params.sub1, {
    left: w / 2,
    top: h / 2 + 60,
    width: w - 120,
    fontSize: 20,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
  });
  const sub2 = makeText(f, params.sub2, {
    left: w / 2,
    top: h / 2 + 100,
    width: w - 120,
    fontSize: 18,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
  });
  const sub3 = makeText(f, params.sub3, {
    left: w / 2,
    top: h / 2 + 140,
    width: w - 120,
    fontSize: 18,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
  });
  const price = makeText(f, params.price, {
    left: w - 120,
    top: h - 60,
    width: 100,
    fontSize: 16,
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "right",
  });
  return new f.Group([bg, masthead, issue, headline, sub1, sub2, sub3, price], {
    left: 0,
    top: 0,
  });
}

function buildEditorialLayout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  params: LayoutParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const bg = makeBackground(f, w, h, params.bgColor);
  const masthead = makeText(f, params.title, {
    left: 40,
    top: 30,
    width: w - 80,
    fontSize: 80,
    fontWeight: "900",
    fontFamily: "Georgia",
    fill: params.titleColor,
    textAlign: "left",
  });
  const issue = makeText(f, params.issue, {
    left: 40,
    top: 130,
    width: w - 80,
    fontSize: 12,
    fontFamily: "Georgia",
    fill: params.titleColor,
    textAlign: "left",
  });
  const headline = makeText(f, params.headline, {
    left: 40,
    top: h / 2,
    width: w - 80,
    fontSize: params.headlineSize,
    fontWeight: "700",
    fontFamily: "Georgia",
    fill: params.headlineColor,
    textAlign: "left",
  });
  const sub1 = makeText(f, "> " + params.sub1, {
    left: 40,
    top: h - 220,
    width: w / 2 - 60,
    fontSize: 16,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "left",
  });
  const sub2 = makeText(f, "> " + params.sub2, {
    left: 40,
    top: h - 170,
    width: w / 2 - 60,
    fontSize: 16,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "left",
  });
  const sub3 = makeText(f, "> " + params.sub3, {
    left: 40,
    top: h - 120,
    width: w / 2 - 60,
    fontSize: 16,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "left",
  });
  const price = makeText(f, params.price, {
    left: w - 120,
    top: h - 60,
    width: 100,
    fontSize: 16,
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "right",
  });
  return new f.Group([bg, masthead, issue, headline, sub1, sub2, sub3, price], {
    left: 0,
    top: 0,
  });
}

function buildBoldLayout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  params: LayoutParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const bg = makeBackground(f, w, h, params.bgColor);
  const masthead = makeText(f, params.title, {
    left: w / 2,
    top: 20,
    width: w - 40,
    fontSize: 140,
    fontWeight: "900",
    fontFamily: "Impact",
    fill: params.titleColor,
    textAlign: "center",
    originX: "center",
  });
  const issue = makeText(f, params.issue, {
    left: w / 2,
    top: 170,
    width: w - 80,
    fontSize: 14,
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "center",
    originX: "center",
  });
  const headline = makeText(f, params.headline.toUpperCase(), {
    left: w / 2,
    top: h / 2 - 40,
    width: w - 40,
    fontSize: params.headlineSize + 20,
    fontWeight: "900",
    fontFamily: "Impact",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
    originY: "center",
  });
  const sub1 = makeText(f, params.sub1, {
    left: 30,
    top: h - 180,
    width: w - 60,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "left",
  });
  const sub2 = makeText(f, params.sub2, {
    left: 30,
    top: h - 140,
    width: w - 60,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "left",
  });
  const sub3 = makeText(f, params.sub3, {
    left: 30,
    top: h - 100,
    width: w - 60,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "left",
  });
  const price = makeText(f, params.price, {
    left: w - 120,
    top: h - 50,
    width: 100,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "right",
  });
  return new f.Group([bg, masthead, issue, headline, sub1, sub2, sub3, price], {
    left: 0,
    top: 0,
  });
}

function buildMinimalistLayout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  w: number,
  h: number,
  params: LayoutParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const bg = makeBackground(f, w, h, params.bgColor);
  const masthead = makeText(f, params.title, {
    left: w / 2,
    top: 60,
    width: w - 80,
    fontSize: 56,
    fontWeight: "300",
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "center",
    originX: "center",
    charSpacing: 400,
  });
  const issue = makeText(f, params.issue, {
    left: w / 2,
    top: 140,
    width: w - 80,
    fontSize: 11,
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "center",
    originX: "center",
    charSpacing: 200,
  });
  const headline = makeText(f, params.headline, {
    left: w / 2,
    top: h / 2,
    width: w - 160,
    fontSize: Math.max(params.headlineSize - 8, 24),
    fontWeight: "300",
    fontFamily: "Georgia",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
    originY: "center",
  });
  const sub1 = makeText(f, params.sub1, {
    left: w / 2,
    top: h - 200,
    width: w - 120,
    fontSize: 14,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
  });
  const sub2 = makeText(f, params.sub2, {
    left: w / 2,
    top: h - 170,
    width: w - 120,
    fontSize: 14,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
  });
  const sub3 = makeText(f, params.sub3, {
    left: w / 2,
    top: h - 140,
    width: w - 120,
    fontSize: 14,
    fontFamily: "Helvetica",
    fill: params.headlineColor,
    textAlign: "center",
    originX: "center",
  });
  const price = makeText(f, params.price, {
    left: w / 2,
    top: h - 60,
    width: 100,
    fontSize: 12,
    fontFamily: "Helvetica",
    fill: params.titleColor,
    textAlign: "center",
    originX: "center",
  });
  return new f.Group([bg, masthead, issue, headline, sub1, sub2, sub3, price], {
    left: 0,
    top: 0,
  });
}

export function CanvasMagazineCoverPanel({
  fabricCanvas,
}: CanvasMagazineCoverPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [title, setTitle] = useState("VOGUE");
  const [issue, setIssue] = useState("JANEIRO 2026 • Nº 348");
  const [headline, setHeadline] = useState("A Era da Inteligência Artificial");
  const [sub1, setSub1] = useState("10 Tendências para 2026");
  const [sub2, setSub2] = useState("Entrevista Exclusiva");
  const [sub3, setSub3] = useState("Como Vestir no Verão");
  const [price, setPrice] = useState("R$ 29,90");
  const [layout, setLayout] = useState<LayoutStyle>("classic");
  const [titleColor, setTitleColor] = useState("#d4af37");
  const [headlineColor, setHeadlineColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#1a1a1a");
  const [headlineSize, setHeadlineSize] = useState(56);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        const w = canvas.getWidth();
        const h = canvas.getHeight();
        const params: LayoutParams = {
          title,
          issue,
          headline,
          sub1,
          sub2,
          sub3,
          price,
          titleColor,
          headlineColor,
          bgColor,
          headlineSize,
        };
        let group;
        switch (layout) {
          case "editorial":
            group = buildEditorialLayout(f, w, h, params);
            break;
          case "bold":
            group = buildBoldLayout(f, w, h, params);
            break;
          case "minimalist":
            group = buildMinimalistLayout(f, w, h, params);
            break;
          default:
            group = buildClassicLayout(f, w, h, params);
        }
        group.set({
          data: { magazineCover: true },
        });
        canvas.add(group);
        canvas.requestRenderAll();
        toast.success("Capa de revista gerada");
      })
      .catch(() => {
        toast.error("Falha ao carregar fabric");
      });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => o?.data?.magazineCover === true);
    objects.forEach((obj: unknown) => canvas.remove(obj));
    canvas.requestRenderAll();
    toast.success("Capa removida");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Newspaper className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Capa de Revista</h3>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-title">
          Título da Revista
        </label>
        <Input
          id="mag-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-issue">
          Edição / Data
        </label>
        <Input
          id="mag-issue"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-headline">
          Manchete Principal
        </label>
        <Input
          id="mag-headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-sub1">
          Submanchete 1
        </label>
        <Input
          id="mag-sub1"
          value={sub1}
          onChange={(e) => setSub1(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-sub2">
          Submanchete 2
        </label>
        <Input
          id="mag-sub2"
          value={sub2}
          onChange={(e) => setSub2(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-sub3">
          Submanchete 3
        </label>
        <Input
          id="mag-sub3"
          value={sub3}
          onChange={(e) => setSub3(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-price">
          Preço
        </label>
        <Input
          id="mag-price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Estilo de Layout</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={layout === "classic" ? "default" : "outline"}
            onClick={() => setLayout("classic")}
            size="sm"
          >
            Clássico
          </Button>
          <Button
            variant={layout === "editorial" ? "default" : "outline"}
            onClick={() => setLayout("editorial")}
            size="sm"
          >
            Editorial
          </Button>
          <Button
            variant={layout === "bold" ? "default" : "outline"}
            onClick={() => setLayout("bold")}
            size="sm"
          >
            Bold
          </Button>
          <Button
            variant={layout === "minimalist" ? "default" : "outline"}
            onClick={() => setLayout("minimalist")}
            size="sm"
          >
            Minimalista
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-title-color">
          Cor do Título
        </label>
        <input
          id="mag-title-color"
          type="color"
          value={titleColor}
          onChange={(e) => setTitleColor(e.target.value)}
          className="h-9 w-full cursor-pointer rounded border"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-headline-color">
          Cor da Manchete
        </label>
        <input
          id="mag-headline-color"
          type="color"
          value={headlineColor}
          onChange={(e) => setHeadlineColor(e.target.value)}
          className="h-9 w-full cursor-pointer rounded border"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-bg-color">
          Cor de Fundo
        </label>
        <input
          id="mag-bg-color"
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="h-9 w-full cursor-pointer rounded border"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="mag-headline-size">
          Tamanho da Manchete: {headlineSize}px
        </label>
        <input
          id="mag-headline-size"
          type="range"
          min={32}
          max={96}
          value={headlineSize}
          onChange={(e) => setHeadlineSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleGenerate}>Gerar Capa</Button>
        <Button variant="outline" onClick={handleClear}>
          Limpar Capa
        </Button>
      </div>
    </div>
  );
}
