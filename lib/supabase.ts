import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// สร้างตัวแปร client สำหรับเรียกใช้ฐานข้อมูล
export const supabase = createClient(supabaseUrl, supabaseAnonKey);