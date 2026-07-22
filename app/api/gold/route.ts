import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase'; // ตรวจสอบ Path ให้ตรงกับที่คุณสร้างไฟล์เชื่อมต่อไว้

export const dynamic = 'force-dynamic';

// ==========================================
// 🔵 GET: ดึงข้อมูล (รองรับการค้นหาผ่าน ?date=YYYY-MM-DD)
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const searchDate = req.nextUrl.searchParams.get('date');
    
    let query = supabase.from('gold_prices').select('*').order('date', { ascending: false });

    if (searchDate) {
      query = query.eq('date', searchDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// ==========================================
// 🟢 POST: เพิ่มข้อมูลใหม่
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, open, high, low, close, volume } = body;
    
    const { data, error } = await supabase
      .from('gold_prices')
      .insert([{ date, open, high, low, close, volume }])
      .select();

    if (error) throw error;

    return NextResponse.json({ message: 'Data added successfully', data });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json({ error: 'Failed to add data' }, { status: 500 });
  }
}

// ==========================================
// 🟠 PUT: แก้ไขข้อมูล (อ้างอิงผ่าน ?id=...)
// ==========================================
export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const body = await req.json();
    const { date, open, high, low, close, volume } = body;

    const { error } = await supabase
      .from('gold_prices')
      .update({ date, open, high, low, close, volume })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

// ==========================================
// 🔴 DELETE: ลบข้อมูล (อ้างอิงผ่าน ?id=...)
// ==========================================
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    
    const { error } = await supabase
      .from('gold_prices')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
