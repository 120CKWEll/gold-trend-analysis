'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Coins, TrendingUp, TrendingDown, Settings2, Sparkles, Loader2, CalendarRange,
  Target, AlertCircle, LineChart, ListChecks, Plus, Pencil, Search,
  Eye, Trash2, X, TriangleAlert, FileText, BadgeCheck, CircleDot
} from 'lucide-react';

interface GoldData {
  id?: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  Predicted?: number | null;
  Date?: string;
  isAI?: boolean; // 🟢 แฟล็กที่เพิ่มมาเพื่อแยกข้อมูล AI กับ Database
}

export default function Dashboard() {
  const [goldData, setGoldData] = useState<GoldData[]>([]);
  const [modelMetrics, setModelMetrics] = useState({ r2: 99.64, mae: 15.68 });

  // Tab & modal state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'management'>('dashboard');
  const [viewDetailModal, setViewDetailModal] = useState<GoldData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Chart date-range filter
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterDate, setFilterDate] = useState('');

  // Add/edit form state
  const [formData, setFormData] = useState<GoldData>({ date: '', open: 0, high: 0, low: 0, close: 0, volume: 0 });
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch model metrics
  const fetchMetrics = async () => {
    try {
      const res = await axios.get('/api/metrics');
      setModelMetrics(res.data);
    } catch (error) {
      console.warn("Fetch metrics skipped (or 404):", error);
    }
  };

  // 🟢 ฟังก์ชันใหม่: โหลดข้อมูลจาก 2 แหล่งแล้วนำมาต่อกัน
  const fetchAndMergeData = async (searchDate = '') => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูลจากฐานข้อมูล Supabase
      const dbRes = await axios.get(`/api/gold${searchDate ? `?date=${searchDate}` : ''}`);
      const dbData = dbRes.data.map((item: any) => ({
        ...item,
        Date: item.date,
        Close: Number(item.close)
      }));

      // 2. ดึงข้อมูล AI จาก Render (ถ้าไม่ได้กำลังค้นหาวันที่เฉพาะเจาะจงในตาราง)
      let aiData: any[] = [];
      if (!searchDate) {
        try {
          const aiRes = await axios.get('https://gold-ai-api-aahg.onrender.com/predict');
          let rawAi = aiRes.data;
          
          if (typeof rawAi === 'string') rawAi = JSON.parse(rawAi);
          if (rawAi && !Array.isArray(rawAi) && Array.isArray(rawAi.data)) rawAi = rawAi.data;

          if (Array.isArray(rawAi)) {
            aiData = rawAi.map((item: any) => ({
              ...item,
              Close: parseFloat(item.Close),
              Predicted: item.Predicted ? parseFloat(item.Predicted) : null,
              isAI: true // แปะป้ายว่านี่คือข้อมูลจาก AI
            }));
          }
        } catch (aiErr) {
          console.error("Failed to fetch AI data for merge:", aiErr);
        }
      }

      // 3. นำข้อมูลมาต่อกันแล้วเรียงลำดับตามวันที่ เพื่อให้กราฟเส้นไม่พันกัน
      const combined = [...dbData, ...aiData];
      combined.sort((a, b) => new Date(a.Date || a.date).getTime() - new Date(b.Date || b.date).getTime());
      
      setGoldData(combined);
    } catch (error) {
      console.error("Error fetching and merging data:", error);
    } finally {
      setLoading(false);
    }
  };

  // โหลดข้อมูลเมื่อเปิดหน้าเว็บครั้งแรก
  useEffect(() => {
    fetchAndMergeData();
    fetchMetrics();
  }, []);

  // Filter chart data by date range
  const filteredChartData = goldData.filter((item: any) => {
    if (!startDate && !endDate) return true;
    const current = new Date(item.Date || item.date);
    current.setHours(0, 0, 0, 0);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (current < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (current > end) return false;
    }
    return true;
  });

  // Run price prediction (สามารถใช้ปุ่มนี้ในการ Refresh กราฟได้)
  const handlePredict = async () => {
    await fetchAndMergeData();
  };

  // 🟢 Save form (add or edit) -> เมื่อบันทึกเสร็จให้โหลดกราฟใหม่ทันที
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/gold?id=${isEditing}`, formData);
        alert('Record updated successfully');
      } else {
        await axios.post('/api/gold', formData);
        alert('Record added successfully');
      }
      setFormData({ date: '', open: 0, high: 0, low: 0, close: 0, volume: 0 });
      setIsEditing(null);
      await fetchAndMergeData(filterDate); // สั่งดึงและต่อกราฟใหม่
    } catch (error) {
      console.error("Error saving:", error);
      alert('Failed to save record');
    }
  };

  // Confirm delete from modal
  const executeDelete = async () => {
    if (deleteId) {
      try {
        await axios.delete(`/api/gold?id=${deleteId}`);
        setDeleteId(null);
        await fetchAndMergeData(filterDate);
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const handleEdit = (record: GoldData) => {
    setIsEditing(record.id as number);
    setFormData(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getClose = (r: any): number => {
    const v = r?.Close ?? r?.close;
    return v === undefined || v === null || v === '' ? NaN : Number(v);
  };

  // Latest actual price
  const latestActual = [...goldData]
    .filter((r) => !isNaN(getClose(r)))
    .sort((a, b) => new Date(b.Date || b.date).getTime() - new Date(a.Date || a.date).getTime())[0];

  // Upcoming forecast days
  const forecastDays = [...goldData]
    .filter((r) => isNaN(getClose(r)) && r.Predicted)
    .sort((a, b) => new Date(a.Date || a.date).getTime() - new Date(b.Date || b.date).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#100E0A] text-[#F3EFE4] font-[var(--font-body)] relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        :root {
          --font-display: 'Fraunces', serif;
          --font-body: 'Inter', system-ui, sans-serif;
          --font-mono: 'IBM Plex Mono', monospace;
          --gold: #C9A227;
          --gold-bright: #E8C468;
          --gold-dim: #8A712B;
          --positive: #4F9C82;
          --negative: #C15A3E;
        }
        body { font-family: var(--font-body); }
        .font-display { font-family: var(--font-display); letter-spacing: -0.01em; }
        .font-mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
        .ingot-bar {
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--gold-dim) 15%, var(--gold-bright) 50%, var(--gold-dim) 85%, transparent);
        }
        .vault-panel {
          background: linear-gradient(180deg, #1C1810 0%, #16130D 100%);
          border: 1px solid #2E2717;
        }
        .vault-panel-top {
          box-shadow: inset 0 1px 0 rgba(201,162,39,0.15);
        }
        .ingot-card {
          background: linear-gradient(155deg, #221C12 0%, #17130D 60%);
          border: 1px solid #33291A;
          position: relative;
          overflow: hidden;
        }
        .ingot-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,196,104,0.6), transparent);
        }
        .icon-badge {
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 10px;
        }
        .live-dot {
          width: 7px; height: 7px; border-radius: 999px;
          background: var(--positive);
          box-shadow: 0 0 0 0 rgba(79,156,130,0.6);
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(79,156,130,0.55); }
          70% { box-shadow: 0 0 0 6px rgba(79,156,130,0); }
          100% { box-shadow: 0 0 0 0 rgba(79,156,130,0); }
        }
        .gold-btn {
          background: linear-gradient(135deg, #B8912B 0%, #E8C468 45%, #B8912B 100%);
          background-size: 200% 200%;
          background-position: 0% 50%;
          transition: background-position 0.5s ease, transform 0.15s ease;
        }
        .gold-btn:hover:not(:disabled) {
          background-position: 100% 50%;
          transform: translateY(-1px);
        }
        input[type="date"], input[type="number"], input[type="text"] {
          color-scheme: dark;
        }
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-card { animation: modal-in 0.18s ease-out; }
      `}</style>

      {/* ================= STICKY TOP BAR ================= */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-[#100E0A]/90 border-b border-[#2E2717]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="icon-badge w-9 h-9 bg-gradient-to-br from-[#E8C468] to-[#B8912B] text-[#1A1408]">
              <Coins size={19} strokeWidth={2.25} />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold tracking-tight leading-none">GoldTrend Analysis</h1>
              <p className="text-xs text-[#9A9384] mt-1">ML-powered gold price analysis &amp; forecasting</p>
            </div>
            {latestActual && (
              <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-[#2E2717]">
                <span className="live-dot" />
                <span className="text-[11px] uppercase tracking-wider text-[#9A9384] font-medium">Latest</span>
                <span className="font-mono text-base font-semibold text-[var(--gold-bright)]">
                  ${getClose(latestActual).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handlePredict}
            disabled={loading}
            className={`gold-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-[#1A1408] shadow-lg shadow-black/30 whitespace-nowrap text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} strokeWidth={2.25} />}
            {loading ? "Refreshing Data..." : "Refresh Forecast"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ================= TABS ================= */}
        <div className="flex gap-1 border-b border-[#2E2717]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors relative ${activeTab === 'dashboard' ? 'text-[var(--gold-bright)]' : 'text-[#9A9384] hover:text-[#D9D2C2]'}`}
          >
            <LineChart size={16} strokeWidth={2.25} />
            Dashboard
            {activeTab === 'dashboard' && <span className="absolute -bottom-px left-0 right-0 h-[2px] ingot-bar" />}
          </button>
          <button
            onClick={() => setActiveTab('management')}
            className={`flex items-center gap-2 px-5 py-3 font-medium text-sm transition-colors relative ${activeTab === 'management' ? 'text-[var(--gold-bright)]' : 'text-[#9A9384] hover:text-[#D9D2C2]'}`}
          >
            <Settings2 size={16} strokeWidth={2.25} />
            Manage Data
            {activeTab === 'management' && <span className="absolute -bottom-px left-0 right-0 h-[2px] ingot-bar" />}
          </button>
        </div>

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="ingot-card rounded-xl p-5 flex items-start gap-4">
                <span className="icon-badge w-10 h-10 bg-[var(--gold-bright)]/10 text-[var(--gold-bright)] shrink-0">
                  <Coins size={18} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9A9384] font-medium mb-1">Latest Close</p>
                  <h3 className="font-mono text-2xl font-semibold text-[var(--gold-bright)]">
                    {latestActual ? `$${getClose(latestActual).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </h3>
                  <p className="text-xs text-[#6E6858] mt-1 font-mono">{latestActual ? (latestActual.Date || latestActual.date) : 'No data'}</p>
                </div>
              </div>
              <div className="ingot-card rounded-xl p-5 flex items-start gap-4">
                <span className="icon-badge w-10 h-10 bg-[var(--positive)]/10 text-[var(--positive)] shrink-0">
                  <Target size={18} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9A9384] font-medium mb-1">Model Accuracy (R²)</p>
                  <h3 className="font-mono text-2xl font-semibold text-[var(--positive)]">{modelMetrics.r2.toFixed(2)}%</h3>
                  <p className="text-xs text-[#6E6858] mt-1">Explained variance</p>
                </div>
              </div>
              <div className="ingot-card rounded-xl p-5 flex items-start gap-4">
                <span className="icon-badge w-10 h-10 bg-[#E88A6A]/10 text-[#E88A6A] shrink-0">
                  <AlertCircle size={18} strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9A9384] font-medium mb-1">Mean Abs. Error</p>
                  <h3 className="font-mono text-2xl font-semibold text-[#E88A6A]">{modelMetrics.mae.toFixed(2)}</h3>
                  <p className="text-xs text-[#6E6858] mt-1">Avg. prediction error</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="vault-panel rounded-2xl p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="font-display text-lg font-semibold text-[#F3EFE4] flex items-center gap-2">
                  <TrendingUp size={18} strokeWidth={2.25} className="text-[var(--gold-bright)]" />
                  Price Trend
                </h2>
                <div className="flex items-center gap-2 bg-[#16130D] p-2 rounded-xl border border-[#2E2717]">
                  <CalendarRange size={14} className="text-[#6E6858] ml-1" />
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wide text-[#9A9384] mb-1 px-1">From</label>
                    <input type="date" className="bg-[#1C1810] border border-[#33291A] rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-[var(--gold)] text-[#F3EFE4]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <span className="text-[#6E6858] mt-4">—</span>
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wide text-[#9A9384] mb-1 px-1">To</label>
                    <input type="date" className="bg-[#1C1810] border border-[#33291A] rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-[var(--gold)] text-[#F3EFE4]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="w-full h-[350px]">
                {filteredChartData && filteredChartData.length > 0 ? (
                  <ResponsiveContainer height="100%" width="100%">
                    <AreaChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E8C468" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#E8C468" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="Date" axisLine={false} tickLine={false} tick={{ fill: '#6E6858', fontSize: 12 }} dy={10} minTickGap={40} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6E6858', fontSize: 12 }} domain={['auto', 'auto']} />
                      <CartesianGrid stroke="#2E2717" strokeDasharray="3 3" vertical={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '10px', border: '1px solid #33291A', background: '#1C1810', color: '#F3EFE4', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.5)' }}
                        labelStyle={{ color: '#9A9384' }}
                        formatter={(value: any, name: any) => {
                          if (value === null || value === undefined || isNaN(value) || value === "NaN") return ["-", name];
                          return [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                        }}
                      />
                      <Area type="monotone" dataKey="Close" fill="url(#colorPrice)" fillOpacity={1} name="Actual" stroke="#E8C468" strokeWidth={3} />
                      <Area type="monotone" dataKey="Predicted" fill="none" name="Predicted" stroke="#4F9C82" strokeDasharray="5 5" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#33291A] rounded-lg text-[#6E6858]">
                    <LineChart size={22} strokeWidth={1.75} />
                    No data to display
                  </div>
                )}
              </div>
            </div>

            {/* AI forecast cards */}
            {forecastDays.length > 0 && (
              <div className="vault-panel rounded-2xl p-6">
                <h2 className="font-display text-lg font-semibold mb-4 text-[#F3EFE4] flex items-center gap-2">
                  <Sparkles size={18} strokeWidth={2.25} className="text-[var(--gold-bright)]" />
                  Forecast — Next {forecastDays.length} Trading Days
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {forecastDays.map((row, idx) => {
                    const predicted = Number(row.Predicted);
                    const base = latestActual ? getClose(latestActual) : null;
                    const pct = base ? ((predicted - base) / base) * 100 : null;
                    const isUp = pct !== null && pct >= 0;
                    return (
                      <div key={idx} className="ingot-card rounded-xl p-5">
                        <p className="text-xs uppercase tracking-wide text-[#9A9384] font-medium mb-1">Forecast Day {idx + 1}</p>
                        <p className="font-mono text-sm text-[#7FA8D9] font-semibold mb-3">{row.Date || row.date}</p>
                        <h3 className="font-mono text-2xl font-semibold text-[#F3EFE4] mb-3">
                          ${predicted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h3>
                        {pct !== null && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isUp ? 'bg-[var(--positive)]/15 text-[var(--positive)]' : 'bg-[var(--negative)]/15 text-[var(--negative)]'}`}>
                            {isUp ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
                            {isUp ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Forecast table */}
            <div className="vault-panel rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold mb-4 text-[#F3EFE4] flex items-center gap-2">
                <ListChecks size={18} strokeWidth={2.25} className="text-[var(--gold-bright)]" />
                History &amp; Forecast
              </h2>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-lg border border-[#2E2717]">
                <table className="w-full text-sm text-left relative">
                  <thead className="bg-[#16130D] text-[#C9A227] sticky top-0 z-10 border-b border-[#2E2717]">
                    <tr>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wide text-xs">Date</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wide text-xs">Status</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wide text-xs">Actual</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wide text-xs">Predicted</th>
                      <th className="py-3 px-4 font-semibold uppercase tracking-wide text-xs">Diff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...goldData].sort((a, b) => new Date(b.Date || b.date).getTime() - new Date(a.Date || a.date).getTime()).map((row, index) => {
                      const isFuture = isNaN(getClose(row));
                      let diff = (!isFuture && row.Predicted) ? Number(row.Predicted) - getClose(row) : null;
                      return (
                        <tr key={index} className="border-b border-[#221C12] hover:bg-[#1C1810] transition-colors">
                          <td className="py-4 px-4 font-mono text-[#D9D2C2]">{row.Date || row.date}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isFuture ? 'bg-[#C9A227]/15 text-[var(--gold-bright)]' : 'bg-[#4F9C82]/15 text-[var(--positive)]'}`}>
                              <CircleDot size={10} />
                              {isFuture ? 'Forecast' : 'Actual'}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[#F3EFE4]">{!isFuture ? `$${getClose(row).toFixed(2)}` : "-"}</td>
                          <td className="py-4 px-4 font-mono text-[#F3EFE4]">{row.Predicted ? `$${Number(row.Predicted).toFixed(2)}` : "-"}</td>
                          <td className={`py-4 px-4 font-mono font-bold ${diff !== null ? (diff >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]") : "text-[#6E6858]"}`}>
                            {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(2)}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MANAGE DATA ================= */}
        {activeTab === 'management' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 animate-in fade-in duration-300 items-start">
            {/* Add/edit form */}
            <div className="vault-panel rounded-2xl p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-semibold mb-4 text-[#F3EFE4] flex items-center gap-2">
                {isEditing ? <Pencil size={18} strokeWidth={2.25} className="text-[var(--gold-bright)]" /> : <Plus size={18} strokeWidth={2.25} className="text-[var(--gold-bright)]" />}
                {isEditing ? 'Edit Record' : 'Add Record'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wide text-[#9A9384] mb-1">Date</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#16130D] border border-[#33291A] rounded-lg p-2 outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)]/40 text-[#F3EFE4]" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[#9A9384] mb-1">Open</label>
                    <input type="number" step="0.01" required value={formData.open} onChange={e => setFormData({...formData, open: parseFloat(e.target.value)})} className="w-full bg-[#16130D] border border-[#33291A] rounded-lg p-2 outline-none focus:border-[var(--gold)] text-[#F3EFE4] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[#9A9384] mb-1">High</label>
                    <input type="number" step="0.01" required value={formData.high} onChange={e => setFormData({...formData, high: parseFloat(e.target.value)})} className="w-full bg-[#16130D] border border-[#33291A] rounded-lg p-2 outline-none focus:border-[var(--gold)] text-[#F3EFE4] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[#9A9384] mb-1">Low</label>
                    <input type="number" step="0.01" required value={formData.low} onChange={e => setFormData({...formData, low: parseFloat(e.target.value)})} className="w-full bg-[#16130D] border border-[#33291A] rounded-lg p-2 outline-none focus:border-[var(--gold)] text-[#F3EFE4] font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-[#9A9384] mb-1">Close</label>
                    <input type="number" step="0.01" required value={formData.close} onChange={e => setFormData({...formData, close: parseFloat(e.target.value)})} className="w-full bg-[#16130D] border border-[#33291A] rounded-lg p-2 outline-none focus:border-[var(--gold)] text-[#F3EFE4] font-mono" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs uppercase tracking-wide text-[#9A9384] mb-1">Volume</label>
                    <input type="number" required value={formData.volume} onChange={e => setFormData({...formData, volume: parseInt(e.target.value)})} className="w-full bg-[#16130D] border border-[#33291A] rounded-lg p-2 outline-none focus:border-[var(--gold)] text-[#F3EFE4] font-mono" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="gold-btn text-[#1A1408] px-6 py-2 rounded-lg font-semibold flex-1 flex items-center justify-center gap-2">
                    <BadgeCheck size={16} strokeWidth={2.25} />
                    {isEditing ? 'Save Changes' : 'Add Record'}
                  </button>
                  {isEditing && (
                    <button type="button" onClick={() => { setIsEditing(null); setFormData({ date: '', open: 0, high: 0, low: 0, close: 0, volume: 0 }); }} className="bg-[#221C12] border border-[#33291A] text-[#D9D2C2] px-4 rounded-lg hover:bg-[#2E2717] flex items-center gap-2">
                      <X size={16} strokeWidth={2.25} />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Records table */}
            <div className="vault-panel rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
                <h2 className="font-display text-lg font-semibold text-[#F3EFE4] flex items-center gap-2">
                  <ListChecks size={18} strokeWidth={2.25} className="text-[var(--gold-bright)]" />
                  Database Records
                </h2>
                <div className="flex items-center gap-2 bg-[#16130D] border border-[#2E2717] rounded-lg pl-3 pr-1 py-1">
                  <Search size={14} className="text-[#6E6858]" />
                  <span className="text-sm text-[#9A9384]">Filter by date</span>
                  <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); fetchAndMergeData(e.target.value); }} className="bg-[#1C1810] border border-[#33291A] rounded-md p-1.5 text-sm outline-none focus:border-[var(--gold)] text-[#F3EFE4]" />
                </div>
              </div>
              <div className="overflow-x-auto max-h-[560px] border border-[#2E2717] rounded-lg">
                <table className="w-full text-sm text-left relative">
                  <thead className="bg-[#16130D] text-[#C9A227] sticky top-0 z-10 border-b border-[#2E2717]">
                    <tr>
                      <th className="py-3 px-4 uppercase tracking-wide text-xs font-semibold">Date</th>
                      <th className="py-3 px-4 uppercase tracking-wide text-xs font-semibold">Open</th>
                      <th className="py-3 px-4 uppercase tracking-wide text-xs font-semibold">Close</th>
                      <th className="py-3 px-4 uppercase tracking-wide text-xs font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 🟢 กรองเอาเฉพาะข้อมูลที่มี id (จาก Database จริง) มาแสดงเพื่อป้องกันบั๊ก */}
                    {goldData.filter(row => row.id && !row.isAI).map((row) => (
                      <tr key={row.id} className="border-b border-[#221C12] hover:bg-[#1C1810] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#D9D2C2]">{row.Date || row.date}</td>
                        <td className="py-3 px-4 font-mono text-[#F3EFE4]">{row.open ? `$${Number(row.open).toFixed(2)}` : "-"}</td>
                        <td className="py-3 px-4 font-mono text-[#F3EFE4]">{row.close ? `$${Number(row.close).toFixed(2)}` : "-"}</td>
                        <td className="py-3 px-4 text-center flex justify-center flex-wrap gap-1.5">
                          {/* 🟢 ส่วนที่เติมเต็มโค้ดที่ขาดหายไปด้านล่าง */}
                          <button onClick={() => setViewDetailModal(row)} className="flex items-center gap-1 text-[var(--positive)] bg-[var(--positive)]/10 px-3 py-1 rounded-md hover:bg-[var(--positive)]/20 font-medium transition-colors">
                            <Eye size={13} /> View
                          </button>
                          <button onClick={() => handleEdit(row)} className="flex items-center gap-1 text-[var(--gold-bright)] bg-[var(--gold-bright)]/10 px-3 py-1 rounded-md hover:bg-[var(--gold-bright)]/20 font-medium transition-colors">
                            <Pencil size={13} /> Edit
                          </button>
                          <button onClick={() => setDeleteId(row.id as number)} className="flex items-center gap-1 text-[var(--negative)] bg-[var(--negative)]/10 px-3 py-1 rounded-md hover:bg-[var(--negative)]/20 font-medium transition-colors">
                            <Trash2 size={13} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {goldData.filter(row => row.id && !row.isAI).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#6E6858]">No records found in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}
      {/* 🟢 Modal: ดูรายละเอียด */}
      {viewDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal-card bg-[#16130D] border border-[#33291A] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2E2717] flex justify-between items-center bg-[#1C1810]">
              <h3 className="font-display font-semibold text-[var(--gold-bright)] flex items-center gap-2">
                <FileText size={18} /> Record Details
              </h3>
              <button onClick={() => setViewDetailModal(null)} className="text-[#9A9384] hover:text-[#F3EFE4] transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between border-b border-[#2E2717] pb-2">
                <span className="text-xs uppercase text-[#6E6858] font-medium">Date</span>
                <span className="font-mono text-[#F3EFE4]">{viewDetailModal.date || viewDetailModal.Date}</span>
              </div>
              <div className="flex justify-between border-b border-[#2E2717] pb-2">
                <span className="text-xs uppercase text-[#6E6858] font-medium">Open</span>
                <span className="font-mono text-[#F3EFE4]">${Number(viewDetailModal.open).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-[#2E2717] pb-2">
                <span className="text-xs uppercase text-[#6E6858] font-medium">High</span>
                <span className="font-mono text-[#F3EFE4]">${Number(viewDetailModal.high).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-[#2E2717] pb-2">
                <span className="text-xs uppercase text-[#6E6858] font-medium">Low</span>
                <span className="font-mono text-[#F3EFE4]">${Number(viewDetailModal.low).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-[#2E2717] pb-2">
                <span className="text-xs uppercase text-[#6E6858] font-medium">Close</span>
                <span className="font-mono text-[var(--gold-bright)] font-bold">${Number(viewDetailModal.close).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-xs uppercase text-[#6E6858] font-medium">Volume</span>
                <span className="font-mono text-[#F3EFE4]">{Number(viewDetailModal.volume).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Modal: ยืนยันการลบ */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="modal-card bg-[#1C1810] border border-[#33291A] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--negative)]/10 text-[var(--negative)] flex items-center justify-center mx-auto mb-4">
              <TriangleAlert size={32} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-semibold text-[#F3EFE4] mb-2">Delete Record?</h3>
            <p className="text-sm text-[#9A9384] mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-[#221C12] border border-[#33291A] text-[#D9D2C2] py-2.5 rounded-xl hover:bg-[#2E2717] font-medium transition-colors">
                Cancel
              </button>
              <button onClick={executeDelete} className="flex-1 bg-[var(--negative)] text-white py-2.5 rounded-xl hover:bg-[#B04A30] font-medium transition-colors shadow-lg shadow-red-900/20">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}