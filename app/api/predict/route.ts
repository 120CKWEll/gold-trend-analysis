import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const execAsync = promisify(exec);

// 1. เพิ่ม NextRequest เข้ามาเป็นพารามิเตอร์ (เพื่อระบุว่าเป็น Route Handler)
// 2. ระบุ : Promise<NextResponse> อย่างชัดเจน
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const scriptPath = path.resolve(process.cwd(), 'run_predict.py');
    const csvPath = path.resolve(process.cwd(), 'data', 'gold_prediction_final_dashboard.csv');

    try {
      await execAsync(`python "${scriptPath}"`);
    } catch (execErr) {
      console.error("Error Executing Python:", execErr);
      return NextResponse.json({ error: 'Failed to run AI model' }, { status: 500 });
    }

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV Output not found' }, { status: 404 });
    }

    const results: any[] = [];
    
    // บังคับ Type เป็น Promise<void> ให้ชัดเจน
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve())
        .on('error', (err: any) => reject(err));
    });

    return NextResponse.json(results, { status: 200 });
    
  } catch (error) {
    console.error("Error processing forecast:", error);
    return NextResponse.json({ error: 'Failed to process forecast' }, { status: 500 });
  }
}