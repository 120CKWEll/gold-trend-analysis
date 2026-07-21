import { NextResponse, NextRequest } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

// 1. ตั้งค่าและเชื่อมต่อฐานข้อมูล (จะสร้างไฟล์ gold.db ในโฟลเดอร์หลักอัตโนมัติ)
const dbPath = path.resolve(process.cwd(), 'data', 'gold.db');
const db = new (sqlite3.verbose()).Database(dbPath);

// สร้างตารางหากยังไม่มี
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS gold_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER
  )`);
});

// Helper Functions สำหรับรองรับ Async/Await
const queryAll = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
};

const execute = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err); else resolve(this);
    });
  });
};

// ==========================================
// 🔵 GET: ดึงข้อมูล (รองรับการค้นหาผ่าน ?date=YYYY-MM-DD)
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const searchDate = req.nextUrl.searchParams.get('date');
    let sql = 'SELECT * FROM gold_prices ORDER BY date DESC';
    let params: any[] = [];

    if (searchDate) {
      sql = 'SELECT * FROM gold_prices WHERE date = ? ORDER BY date DESC';
      params = [searchDate];
    }

    const rows = await queryAll(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
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
    
    const sql = `INSERT INTO gold_prices (date, open, high, low, close, volume) VALUES (?, ?, ?, ?, ?, ?)`;
    const result = await execute(sql, [date, open, high, low, close, volume]);
    
    return NextResponse.json({ message: 'Data added successfully', id: result.lastID });
  } catch (error) {
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

    const sql = `UPDATE gold_prices SET date = ?, open = ?, high = ?, low = ?, close = ?, volume = ? WHERE id = ?`;
    await execute(sql, [date, open, high, low, close, volume, id]);

    return NextResponse.json({ message: 'Data updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

// ==========================================
// 🔴 DELETE: ลบข้อมูล (อ้างอิงผ่าน ?id=...)
// ==========================================
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    await execute(`DELETE FROM gold_prices WHERE id = ?`, [id]);
    
    return NextResponse.json({ message: 'Data deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}