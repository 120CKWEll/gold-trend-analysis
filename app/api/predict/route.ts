import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // เอา URL ของ Render ที่ได้มาใส่ตรงนี้ครับ (อย่าลืมเติม /predict หรือ path ตามที่คุณตั้งไว้ใน Flask)
    const renderUrl = 'https://gold-ai-api-aahg.onrender.com/predict'; 

    const response = await fetch(renderUrl);
    const data = await response.json();

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Error fetching from Render:", error);
    return NextResponse.json({ error: 'Failed to run AI model' }, { status: 500 });
  }
}
