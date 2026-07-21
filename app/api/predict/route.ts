import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

// 1. ระบุ : Promise<NextResponse> ที่ฟังก์ชัน
export async function GET(): Promise<NextResponse> {
  // 2. ระบุ <NextResponse> ที่ new Promise ชัดเจน (จุดสำคัญที่แก้ Type Error)
  return new Promise<NextResponse>((resolve) => {
    // 1. ระบุตำแหน่งไฟล์
    const scriptPath = path.resolve(process.cwd(), 'run_predict.py');
    const csvPath = path.resolve(process.cwd(), 'data', 'gold_prediction_final_dashboard.csv');

    // 2. สั่งรัน Python Script
    exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error Executing Python:`, error.message);
        return resolve(NextResponse.json({ error: 'Failed to run AI model' }, { status: 500 }));
      }

      // 3. อ่านไฟล์ CSV หลังจาก Python ทำงานเสร็จ
      const results: any[] = [];
      
      if (!fs.existsSync(csvPath)) {
        return resolve(NextResponse.json({ error: 'CSV Output not found' }, { status: 404 }));
      }

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          // 4. ส่งผลลัพธ์กลับไปให้หน้า Frontend
          resolve(NextResponse.json(results));
        })
        .on('error', (err) => {
          console.error("Error reading CSV:", err);
          resolve(NextResponse.json({ error: 'Failed to read CSV output' }, { status: 500 }));
        });
    });
  });
}