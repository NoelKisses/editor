import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY não configurada no .env.local" },
      { status: 500 }
    );
  }

  let body: { description: string; width: number; height: number; platform: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { description, width = 1280, height = 720, platform = "YouTube" } = body;
  if (!description?.trim()) {
    return NextResponse.json({ error: "Campo 'description' é obrigatório" }, { status: 400 });
  }

  const systemPrompt = `You are a professional thumbnail designer. Generate a complete layout specification as JSON for a ${platform} thumbnail (${width}x${height}px).

The user wants: "${description}"

Return ONLY valid JSON with this exact structure:
{
  "backgroundColor": "#hexcolor",
  "backgroundGradient": null or { "type": "linear", "angle": 135, "color1": "#hex", "color2": "#hex" },
  "texts": [
    {
      "content": "Main title text",
      "x": 50,
      "y": 100,
      "fontSize": 96,
      "fontFamily": "Arial",
      "fontWeight": "bold",
      "fill": "#ffffff",
      "textAlign": "center",
      "shadow": true,
      "shadowColor": "rgba(0,0,0,0.8)",
      "shadowBlur": 15
    }
  ],
  "shapes": [
    {
      "type": "rect",
      "x": 0,
      "y": 500,
      "width": 1280,
      "height": 220,
      "fill": "#ff0000",
      "opacity": 0.85
    }
  ],
  "imagePrompt": "Background image description for Imagen AI (optional, or null)"
}

Guidelines:
- Use vibrant, high-contrast colors appropriate for ${platform}
- Make text large and readable (main title: 80-120px for YouTube)
- Add 1-3 text layers maximum
- Add accent shapes/bands for visual interest
- Position elements considering ${width}x${height} canvas
- Include imagePrompt only if a background image would significantly improve the design
- All x,y coordinates are in pixels from top-left
- Use professional font combinations`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "IA retornou formato inválido" }, { status: 500 });
    }

    const layout = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ layout });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
