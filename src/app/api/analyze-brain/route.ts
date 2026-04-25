import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { PolarsEngine } from '@/lib/polars-engine';
import { BrainService } from '@/lib/brain-service';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // 1. O Polars processa os dados brutos (ex: leads do sistema)
    const stats = PolarsEngine.analyzeLeads(data.leads || []);
    
    // 2. O BrainService cria insights para o "Obsidian"
    const insights = BrainService.analyzeNoteConnections(data.notes || []);
    
    return NextResponse.json({
      success: true,
      analysis: stats,
      suggestions: insights.suggestedLinks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro no processamento Polars' }, { status: 500 });
  }
}
