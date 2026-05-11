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

  let body: { image?: string; template?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { image, template } = body;
  if (!image) {
    return NextResponse.json({ error: "Campo 'image' é obrigatório" }, { status: 400 });
  }

  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg";

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    },
    `Você é um especialista em design visual e marketing digital, com foco em thumbnails para YouTube e redes sociais.

Analise esta thumbnail${template ? ` (formato: ${template})` : ""} e forneça exatamente 4 a 5 sugestões práticas e específicas para melhorá-la.

Foque em:
- Hierarquia visual e legibilidade do texto
- Contraste e cores
- Composição e posicionamento
- Apelo emocional e clareza da mensagem
- Técnicas para aumentar o CTR (taxa de cliques)

Responda APENAS com um array JSON de strings, sem markdown, sem explicações adicionais:
["sugestão 1", "sugestão 2", "sugestão 3", "sugestão 4"]`,
  ]);

  const responseText = result.response.text();

  let suggestions: string[] = [];
  try {
    const match = responseText.match(/\[[\s\S]*\]/);
    if (match) {
      suggestions = JSON.parse(match[0]);
    }
  } catch {
    suggestions = responseText
      .split("\n")
      .map((s) => s.replace(/^[-•*\d.]\s*/, "").trim())
      .filter((s) => s.length > 10)
      .slice(0, 5);
  }

  return NextResponse.json({ suggestions });
}
