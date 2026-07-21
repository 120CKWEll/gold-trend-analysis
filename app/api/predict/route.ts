import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

// แปลง exec ให้รองรับ async/await
const execAsync = promisify(exec);

export async function GET(): Promise<Response> {
  try {
    const scriptPath = path.resolve(process.cwd(), 'run_predict.py');
    const csvPath = path.resolve(process.cwd(), 'data', 'gold_prediction_final_dashboard.csv');

    // 1. สั่งรัน Python Script
    try {
      await execAsync(`python "${scriptPath}"`);
    } catch (execErr: any) {
      console.error("Error Executing Python:", execErr?.message || execErr);
      return NextResponse.json({ error: 'Failed to run AI model' }, { status: 500 });
    }

    // 2. ตรวจสอบว่ามีไฟล์ CSV หรือไม่
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV Output not found' }, { status: 404 });
    }

    // 3. อ่านไฟล์ CSV
    const results: any[] = [];
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    // 4. ส่งผลลัพธ์กลับ
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error processing forecast:", error);
    return NextResponse.json({ error: 'Failed to process forecast' }, { status: 500 });
  }
}