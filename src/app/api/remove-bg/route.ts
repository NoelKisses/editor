import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "REMOVE_BG_API_KEY não configurada no .env.local" },
      { status: 500 }
    );
  }

  let body: { image?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { image } = body;
  if (!image) {
    return NextResponse.json({ error: "Campo 'image' é obrigatório" }, { status: 400 });
  }

  // Converte data URL para buffer
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, "base64");

  const formData = new FormData();
  formData.append(
    "image_file",
    new Blob([imageBuffer], { type: "image/png" }),
    "image.png"
  );
  formData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { error: `Remove.bg API error: ${response.status} — ${errText}` },
      { status: response.status }
    );
  }

  const resultBuffer = await response.arrayBuffer();
  const resultBase64 = Buffer.from(resultBuffer).toString("base64");
  const resultDataUrl = `data:image/png;base64,${resultBase64}`;

  return NextResponse.json({ result: resultDataUrl });
}
