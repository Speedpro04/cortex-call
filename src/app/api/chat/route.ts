import { NextResponse } from "next/server";
import { askCortexCallWithRAG } from "@/lib/gemini-rag";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ response: "O que você deseja saber?" }, { status: 400 });
    }

    const text = await askCortexCallWithRAG(message);

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ response: "Desculpe, tive um problema ao processar sua solicitação neural." }, { status: 500 });
  }
}