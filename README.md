Markdown
# 🏆 GoldTrend Analysis

<img width="1208" height="1008" alt="image" src="https://github.com/user-attachments/assets/4d6a67ca-e7a5-4574-9f8f-70c300e97af8" />


**GoldTrend Analysis** เป็นระบบเว็บแอปพลิเคชันสำหรับวิเคราะห์ จัดการ และพยากรณ์ราคาทองคำล่วงหน้า (XAU/USD) ด้วยการใช้ Machine Learning ตัวระบบมาพร้อมกับ Dashboard ที่สวยงามในธีม Dark/Vault ใช้งานง่าย และสามารถจัดการฐานข้อมูลราคาทองคำย้อนหลังได้ในตัว

---

## ✨ Features (ความสามารถหลัก)

- **📈 4-Day Price Forecasting:** พยากรณ์ราคาทองคำล่วงหน้า 4 วันอัตโนมัติด้วย Machine Learning 
- **📊 Interactive Dashboard:** กราฟเปรียบเทียบแนวโน้มราคาจริง (Actual) และราคาคาดการณ์ (Predicted) พร้อมระบบกรองวันที่
- **🎯 Model Metrics:** แสดงค่าความแม่นยำของโมเดล AI เช่น R² Score และ Mean Absolute Error (MAE)
- **⚙️ Data Management (CRUD):** ระบบหลังบ้านสำหรับ เพิ่ม, ดูรายละเอียด, แก้ไข และลบ ข้อมูลราคาทองคำรายวัน (Open, High, Low, Close, Volume)
- **🎨 Modern UI/UX:** ออกแบบด้วยโทนสี Dark Mode (Vault Theme) สบายตาและดูเป็นมืออาชีพ

---

## 💻 Tech Stack (เทคโนโลยีที่ใช้)

**Frontend:**
- [Next.js](https://nextjs.org/) / [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) (สำหรับจัดหน้า UI)
- [Recharts](https://recharts.org/) (สำหรับสร้างกราฟประมวลผล)
- [Lucide React](https://lucide.dev/) (ไอคอน)

**Backend & AI:**
- Next.js API Routes / Python (FastAPI)
- Scikit-Learn (Linear Regression Model)
- Axios (สำหรับจัดการ API Requests)

---

## 📸 Screenshots (ภาพตัวอย่างหน้าจอ)

### 1. Dashboard & Forecasting
<img width="1198" height="1080" alt="image" src="https://github.com/user-attachments/assets/8656aa80-777b-4147-a9f2-c3471c7eef7c" />


### 2. Database Management
<img width="1234" height="1187" alt="image" src="https://github.com/user-attachments/assets/9c22531c-abed-420f-bf2f-1e11359e544a" />


---

## 🚀 Getting Started (วิธีติดตั้งและรันโปรเจกต์)

ทำตามขั้นตอนด้านล่างนี้เพื่อรันโปรเจกต์ในเครื่องของคุณ:

### 1. Clone Repository
```bash
git clone [https://github.com/ช](https://github.com/ชื่อผู้ใช้ของคุณ/gold-trend-analysis.git
cd gold-trend-analysis
2. Install Dependencies
ติดตั้งแพ็กเกจที่จำเป็นทั้งหมดผ่าน npm หรือ yarn

Bash
npm install
# หรือ
yarn install
3. Run the Development Server
เปิดเซิร์ฟเวอร์จำลองเพื่อดูผลลัพธ์

Bash
npm run dev
# หรือ
yarn dev
เปิดเบราว์เซอร์แล้วเข้าไปที่ http://localhost:3000 เพื่อดูผลงาน

📂 Folder Structure (โครงสร้างไฟล์ที่สำคัญ)
Plaintext
📦 gold-trend-analysis
 ┣ 📂 app
 ┃ ┣ 📂 api               # Backend API Routes (จัดการข้อมูลพยากรณ์และ CRUD)
 ┃ ┣ 📜 globals.css       # ไฟล์ CSS หลัก
 ┃ ┣ 📜 layout.tsx        # โครงสร้าง Layout ของเว็บไซต์
 ┃ ┗ 📜 page.tsx          # 🌟 หน้าจอหลัก (Dashboard & Management)
 ┣ 📂 public              # เก็บไฟล์รูปภาพและ Assets ต่างๆ
 ┣ 📜 package.json        # ระบุ Dependencies ของโปรเจกต์
 ┗ 📜 README.md           # ไฟล์อธิบายโปรเจกต์ (ไฟล์นี้)
👤 Author (ผู้จัดทำ)
[ชื่อ-นามสกุลของคุณ]

GitHub: @your-username

Contact: your-email@example.com

Project created for educational and analytical purposes.


---

**💡 วิธีนำไปใช้:**
1. ในโฟลเดอร์โปรเจกต์ของคุณ ให้สร้างไฟล์ชื่อ `README.md` (ถ้ายังไม่มี)
2. ก๊อบปี้ข้อความทั้งหมดด้านบนไปวาง
3. **อย่าลืมเปลี่ยนข้อความภาษาไทยในวงเล็บ** เช่น `[ชื่อผู้ใช้ของคุณ]` ให้เป็นของตัวเองครับ
4. ใช้คำสั่ง `git add README.md`, `git commit -m "Add README"`, และ `git push` เพื่ออัปโหลดไฟล์นี้ขึ้น GitHub
