import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

// GET — Listar notas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get('clinic_id');
    const tag = searchParams.get('tag');

    let query = supabase
      .from('notes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (clinic_id) {
      query = query.eq('clinic_id', clinic_id);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data: notes, error } = await query.limit(100);

    if (error) throw error;

    // Buscar todas as tags únicas para o filtro
    const { data: allNotes } = await supabase
      .from('notes')
      .select('tags')
      .match(clinic_id ? { clinic_id } : {});

    const allTags = [...new Set(
      (allNotes || []).flatMap(n => n.tags || [])
    )].sort();

    return NextResponse.json({ success: true, notes: notes || [], tags: allTags });
  } catch (error: any) {
    console.error('Notes GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST — Criar nota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, tags, clinic_id, user_id, color } = body;

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        title: title || 'Nova Nota',
        content: content || '',
        tags: tags || [],
        clinic_id: clinic_id || null,
        user_id: user_id || null,
        color: color || 'default',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Notes POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT — Atualizar nota
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, tags, is_pinned, color, linked_note_ids } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;
    if (color !== undefined) updates.color = color;
    if (linked_note_ids !== undefined) updates.linked_note_ids = linked_note_ids;

    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Notes PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — Excluir nota
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notes DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
