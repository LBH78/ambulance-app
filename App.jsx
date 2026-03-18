import { useState, useEffect, useRef } from "react";
import { Ambulance, MapPin, User, Calculator, CreditCard, CheckCircle, Clock, Phone, ChevronRight, X, AlertCircle, Stethoscope, Wind, Shield, QrCode, LayoutDashboard, LogOut, RefreshCw, Eye, Truck } from "lucide-react";

// ── Google Maps API Key ──────────────────────────────
const GOOGLE_MAPS_API_KEY = "AIzaSyAs2R_0xGTLkFQrK-F5XV6PtohfhaPNZGk";

// ── Rates ────────────────────────────────────────────
const RATES = {
  baseFare: 600, baseDistance: 5, overLimitRatePerKm: 60,
  nurseRatePerHour: 700, emtRatePerHour: 500,
  monitorFee: 600, oxygenFeeSouth: 500, oxygenFeeCentral: 1000, oxygenFeeNorth: 1500,
};

// ── Mock order store (simulates backend) ─────────────
let ORDER_STORE = [];
let orderCounter = 1000;

function genOrderId() { return "RG" + (++orderCounter); }

function calcFare({ distanceKm, durationMinutes, nurse, emt, monitor, oxygen, oxygenRegion }) {
  const overKm = Math.max(0, distanceKm - RATES.baseDistance);
  const carFare = RATES.baseFare + Math.ceil(overKm * RATES.overLimitRatePerKm);
  const hrs = Math.ceil(durationMinutes / 60);
  const nurseFee = nurse ? hrs * RATES.nurseRatePerHour : 0;
  const emtFee = emt ? hrs * RATES.emtRatePerHour : 0;
  const monitorFee = monitor ? RATES.monitorFee : 0;
  const oxygenFee = oxygen ? (oxygenRegion === "south" ? RATES.oxygenFeeSouth : oxygenRegion === "central" ? RATES.oxygenFeeCentral : RATES.oxygenFeeNorth) : 0;
  const subtotal = carFare + nurseFee + emtFee + monitorFee + oxygenFee;
  const tax = Math.round(subtotal * 0.05);
  return { carFare, nurseFee, emtFee, monitorFee, oxygenFee, subtotal, tax, total: subtotal + tax, overKm: overKm.toFixed(1), hrs };
}

// ── QR Code SVG (simplified visual) ─────────────────
function QRCodeSVG({ size = 160 }) {
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,0,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,0,1,0,1,1,0,1,1,0,1],
    [0,1,0,0,1,0,0,1,1,0,0,1,0,0,1,1,0,1,0],
    [1,1,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,1,1,0,1,0,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,1,0,1,0],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,0,0,1,1,1,0,1,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,0,1,0,1,1,1,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,0,1,1,0,0,1,0],
    [1,1,1,1,1,1,1,0,1,1,0,0,1,0,1,0,1,1,1],
  ];
  const cell = size / 19;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block"}}>
      <rect width={size} height={size} fill="white" rx="8"/>
      {pattern.map((row, r) => row.map((cell_val, c) => cell_val ? (
        <rect key={`${r}-${c}`} x={c*cell+2} y={r*cell+2} width={cell-1} height={cell-1} fill="#1a1a2e" rx="1"/>
      ) : null))}
    </svg>
  );
}

// ════════════════════════════════════════════════════
// SCREENS
// ════════════════════════════════════════════════════

// ── 1. QR Landing ────────────────────────────────────
function QRLandingScreen({ onEnter }) {
  const [pulse, setPulse] = useState(false);
  useEffect(() => { const t = setInterval(() => setPulse(p => !p), 1400); return () => clearInterval(t); }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif", padding: "24px", position: "relative", overflow: "hidden"
    }}>
      {/* Animated background circles */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%", border: "1px solid rgba(239,68,68,0.15)",
          width: `${(i+1)*180}px`, height: `${(i+1)*180}px`,
          animation: `ripple ${2+i*0.5}s ease-out infinite`, animationDelay: `${i*0.3}s`,
          opacity: 0.4
        }}/>
      ))}

      <style>{`
        @keyframes ripple { 0%{transform:scale(0.8);opacity:0.5} 100%{transform:scale(1.3);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Logo */}
      <div style={{
        background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.5)",
        borderRadius: "50%", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24, animation: "float 3s ease-in-out infinite",
        boxShadow: "0 0 30px rgba(239,68,68,0.3)"
      }}>
        <Ambulance size={38} color="#ef4444"/>
      </div>

      <div style={{textAlign:"center", marginBottom: 32, animation: "fadeUp 0.8s ease forwards"}}>
        <div style={{color:"rgba(255,255,255,0.5)", fontSize:12, letterSpacing:6, marginBottom:8}}>榮光救護車</div>
        <h1 style={{color:"white", fontSize:28, fontWeight:900, margin:0, lineHeight:1.2}}>線上派車服務</h1>
        <div style={{color:"rgba(239,68,68,0.9)", fontSize:13, marginTop:8, letterSpacing:2}}>專業 · 迅速 · 安心</div>
      </div>

      {/* QR Code Box */}
      <div style={{
        background: "white", borderRadius: 20, padding: 20,
        boxShadow: `0 0 ${pulse ? 40 : 20}px rgba(239,68,68,${pulse ? 0.5 : 0.2})`,
        transition: "box-shadow 0.7s ease", marginBottom: 28,
        animation: "fadeUp 1s ease 0.2s both"
      }}>
        <QRCodeSVG size={160}/>
        <div style={{textAlign:"center", marginTop:12, color:"#374151", fontSize:12, fontWeight:700, letterSpacing:2}}>
          掃描 QR Code 叫車
        </div>
      </div>

      <div style={{color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom:24, animation:"fadeUp 1s ease 0.4s both"}}>
        或點擊下方按鈕直接進入
      </div>

      <button onClick={onEnter} style={{
        background: "linear-gradient(135deg, #ef4444, #dc2626)",
        color: "white", border: "none", borderRadius: 50, padding: "16px 48px",
        fontSize: 17, fontWeight: 800, cursor: "pointer", letterSpacing: 2,
        boxShadow: "0 8px 32px rgba(239,68,68,0.4)", animation: "fadeUp 1s ease 0.6s both",
        transition: "transform 0.15s, box-shadow 0.15s"
      }}
        onMouseEnter={e => { e.target.style.transform="scale(1.04)"; e.target.style.boxShadow="0 12px 40px rgba(239,68,68,0.6)"; }}
        onMouseLeave={e => { e.target.style.transform="scale(1)"; e.target.style.boxShadow="0 8px 32px rgba(239,68,68,0.4)"; }}
      >
        立即叫車 →
      </button>

      <div style={{
        position:"absolute", bottom:20, color:"rgba(255,255,255,0.2)", fontSize:11, letterSpacing:1
      }}>© 2025 榮光救護車有限公司</div>
    </div>
  );
}

// ── 2. Booking Form ───────────────────────────────────
function BookingScreen({ onNext }) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [patientName, setPatientName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [nurse, setNurse] = useState(false);
  const [emt, setEmt] = useState(false);
  const [monitor, setMonitor] = useState(false);
  const [oxygen, setOxygen] = useState(false);
  const [oxygenRegion, setOxygenRegion] = useState("south");
  const [calculating, setCalculating] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalc = async () => {
    if (!origin || !destination) { setError("請填寫出發地與目的地"); return; }
    if (!patientName || !contactPhone) { setError("請填寫病患姓名與聯絡電話"); return; }
    setError(""); setCalculating(true); setRouteResult(null);
    try {
      const enc = encodeURIComponent;
      const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${enc(origin)}&destinations=${enc(destination)}&mode=driving&language=zh-TW&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(`https://corsproxy.io/?${enc(apiUrl)}`);
      const data = await res.json();
      const el = data.rows?.[0]?.elements?.[0];
      if (data.status === "OK" && el?.status === "OK") {
        setRouteResult({ distanceKm: parseFloat((el.distance.value/1000).toFixed(1)), durationMinutes: Math.round(el.duration.value/60), real: true });
      } else { throw new Error("路徑查詢失敗"); }
    } catch {
      const d = parseFloat((Math.random()*45+5).toFixed(1));
      setRouteResult({ distanceKm: d, durationMinutes: Math.round((d/40)*60), real: false });
    } finally { setCalculating(false); }
  };

  const fare = routeResult ? calcFare({ ...routeResult, nurse, emt, monitor, oxygen, oxygenRegion }) : null;

  const handleProceed = () => {
    if (!routeResult) { setError("請先試算費用"); return; }
    onNext({ origin, destination, patientName, contactPhone, nurse, emt, monitor, oxygen, oxygenRegion, routeResult, fare });
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb",
    borderRadius: 10, fontSize: 15, outline: "none", background: "#fafafa",
    boxSizing: "border-box", transition: "border-color 0.2s",
    fontFamily: "'Noto Sans TC', sans-serif"
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f8f8", fontFamily:"'Noto Sans TC','Microsoft JhengHei',sans-serif" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:"50%", width:42, height:42, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ambulance size={22} color="white"/>
        </div>
        <div>
          <div style={{ color:"white", fontWeight:800, fontSize:17 }}>榮光救護車叫車服務</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>填寫資料 → 確認費用 → 付款 → 派車</div>
        </div>
      </div>

      {/* Steps indicator */}
      <div style={{ background:"white", borderBottom:"1px solid #eee", padding:"12px 20px", display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
        {["填寫資料","確認付款","等待派車"].map((s,i) => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background: i===0 ? "#dc2626" : "#e5e7eb", color: i===0 ? "white" : "#9ca3af", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11 }}>{i+1}</div>
            <span style={{ color: i===0 ? "#dc2626" : "#9ca3af", fontWeight: i===0 ? 700 : 400 }}>{s}</span>
            {i < 2 && <ChevronRight size={14} color="#d1d5db"/>}
          </div>
        ))}
      </div>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"20px 16px 100px" }}>

        {/* Patient info */}
        <div style={{ background:"white", borderRadius:14, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:14, color:"#1f2937", display:"flex", alignItems:"center", gap:8 }}>
            <User size={16} color="#dc2626"/> 病患資料
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#6b7280", display:"block", marginBottom:6 }}>病患姓名 *</label>
              <input style={inputStyle} placeholder="王大明" value={patientName} onChange={e=>setPatientName(e.target.value)}
                onFocus={e=>e.target.style.borderColor="#dc2626"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#6b7280", display:"block", marginBottom:6 }}>聯絡電話 *</label>
              <input style={inputStyle} placeholder="0912-345-678" value={contactPhone} onChange={e=>setContactPhone(e.target.value)}
                onFocus={e=>e.target.style.borderColor="#dc2626"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            </div>
          </div>
        </div>

        {/* Route */}
        <div style={{ background:"white", borderRadius:14, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:14, color:"#1f2937", display:"flex", alignItems:"center", gap:8 }}>
            <MapPin size={16} color="#dc2626"/> 行程地址
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#6b7280", display:"block", marginBottom:6 }}>
                <span style={{ display:"inline-block", background:"#dcfce7", color:"#166534", borderRadius:"50%", width:18, height:18, textAlign:"center", lineHeight:"18px", marginRight:6, fontSize:11, fontWeight:800 }}>A</span>出發地 *
              </label>
              <input style={inputStyle} placeholder="台中市中山醫學大學附設醫院" value={origin} onChange={e=>setOrigin(e.target.value)}
                onFocus={e=>e.target.style.borderColor="#dc2626"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"#6b7280", display:"block", marginBottom:6 }}>
                <span style={{ display:"inline-block", background:"#fee2e2", color:"#991b1b", borderRadius:"50%", width:18, height:18, textAlign:"center", lineHeight:"18px", marginRight:6, fontSize:11, fontWeight:800 }}>B</span>目的地 *
              </label>
              <input style={inputStyle} placeholder="台北市台大醫院" value={destination} onChange={e=>setDestination(e.target.value)}
                onFocus={e=>e.target.style.borderColor="#dc2626"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div style={{ background:"white", borderRadius:14, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:14, color:"#1f2937", display:"flex", alignItems:"center", gap:8 }}>
            <Stethoscope size={16} color="#dc2626"/> 醫護需求（選填）
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            {[
              { label:"護理師", sub:`$${RATES.nurseRatePerHour}/H`, state:nurse, set:setNurse },
              { label:"EMT", sub:`$${RATES.emtRatePerHour}/H`, state:emt, set:setEmt },
            ].map(({ label, sub, state, set }) => (
              <div key={label} onClick={() => set(!state)} style={{
                border: `2px solid ${state ? "#dc2626" : "#e5e7eb"}`,
                background: state ? "#fff5f5" : "white", borderRadius:10, padding:"12px 14px",
                cursor:"pointer", transition:"all 0.2s", textAlign:"center"
              }}>
                <div style={{ fontWeight:800, fontSize:14, color: state ? "#dc2626" : "#374151" }}>{label}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div onClick={() => setMonitor(!monitor)} style={{
              border:`2px solid ${monitor ? "#2563eb" : "#e5e7eb"}`,
              background: monitor ? "#eff6ff" : "white", borderRadius:10, padding:"12px 14px",
              cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:8
            }}>
              <Stethoscope size={16} color={monitor ? "#2563eb" : "#9ca3af"}/>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color: monitor ? "#1d4ed8" : "#374151" }}>監測器</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>${RATES.monitorFee}</div>
              </div>
            </div>
            <div onClick={() => setOxygen(!oxygen)} style={{
              border:`2px solid ${oxygen ? "#2563eb" : "#e5e7eb"}`,
              background: oxygen ? "#eff6ff" : "white", borderRadius:10, padding:"12px 14px",
              cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:8
            }}>
              <Wind size={16} color={oxygen ? "#2563eb" : "#9ca3af"}/>
              <div>
                <div style={{ fontWeight:800, fontSize:13, color: oxygen ? "#1d4ed8" : "#374151" }}>氧氣</div>
                <div style={{ fontSize:11, color:"#9ca3af" }}>依區域計費</div>
              </div>
            </div>
          </div>
          {oxygen && (
            <select value={oxygenRegion} onChange={e=>setOxygenRegion(e.target.value)} style={{ ...inputStyle, marginTop:10 }}>
              <option value="south">嘉義以南 (${RATES.oxygenFeeSouth})</option>
              <option value="central">嘉義以北 ~ 苗栗 (${RATES.oxygenFeeCentral})</option>
              <option value="north">苗栗以北 (${RATES.oxygenFeeNorth})</option>
            </select>
          )}
        </div>

        {/* Fare estimate */}
        {fare && (
          <div style={{ background:"linear-gradient(135deg,#1f2937,#111827)", borderRadius:14, padding:20, marginBottom:16, color:"white" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontWeight:800, fontSize:15 }}>費用試算</span>
              <span style={{ fontSize:11, background: routeResult?.real ? "rgba(34,197,94,0.2)" : "rgba(156,163,175,0.2)", color: routeResult?.real ? "#4ade80" : "#9ca3af", padding:"2px 8px", borderRadius:20, border:`1px solid ${routeResult?.real ? "rgba(34,197,94,0.3)":"rgba(156,163,175,0.3)"}` }}>
                {routeResult?.real ? "✓ 真實數據" : "模擬數據"}
              </span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
              <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:8, padding:12, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>距離</div>
                <div style={{ fontSize:22, fontWeight:900 }}>{routeResult.distanceKm} <span style={{ fontSize:12, fontWeight:400, color:"rgba(255,255,255,0.5)" }}>公里</span></div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:8, padding:12, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>時間</div>
                <div style={{ fontSize:22, fontWeight:900 }}>{routeResult.durationMinutes} <span style={{ fontSize:12, fontWeight:400, color:"rgba(255,255,255,0.5)" }}>分鐘</span></div>
              </div>
            </div>
            {[
              { label:"車資", val: fare.carFare },
              nurse && { label:"護理師", val: fare.nurseFee },
              emt && { label:"EMT", val: fare.emtFee },
              monitor && { label:"監測器", val: fare.monitorFee },
              oxygen && { label:"氧氣", val: fare.oxygenFee },
            ].filter(Boolean).map(({ label, val }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.07)", fontSize:13, color:"rgba(255,255,255,0.7)" }}>
                <span>{label}</span><span>${val.toLocaleString()}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontSize:12, color:"rgba(255,255,255,0.4)" }}>
              <span>營業稅 5%</span><span>+ ${fare.tax.toLocaleString()}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 0 0", borderTop:"1px solid rgba(255,255,255,0.15)", marginTop:8 }}>
              <span style={{ fontWeight:800, fontSize:15 }}>應付金額</span>
              <span style={{ fontWeight:900, fontSize:28, color:"#f87171" }}>${fare.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#dc2626", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        {!routeResult ? (
          <button onClick={handleCalc} disabled={calculating} style={{
            width:"100%", background: calculating ? "#9ca3af" : "linear-gradient(135deg,#374151,#1f2937)",
            color:"white", border:"none", borderRadius:12, padding:"16px", fontSize:16, fontWeight:800,
            cursor: calculating ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10
          }}>
            {calculating ? <><div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}></div> 計算中...</> : <><Calculator size={18}/> 查詢路線 ＆ 試算費用</>}
          </button>
        ) : (
          <button onClick={handleProceed} style={{
            width:"100%", background:"linear-gradient(135deg,#dc2626,#991b1b)",
            color:"white", border:"none", borderRadius:12, padding:"16px", fontSize:16, fontWeight:800,
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            boxShadow:"0 6px 24px rgba(220,38,38,0.35)"
          }}>
            <CreditCard size={18}/> 前往付款 ${fare?.total.toLocaleString()}
          </button>
        )}

        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

// ── 3. Payment Screen ─────────────────────────────────
function PaymentScreen({ booking, onSuccess, onBack }) {
  const [method, setMethod] = useState("card");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handlePay = () => {
    setError("");
    if (method === "card") {
      if (cardNum.replace(/\s/g,"").length < 16) { setError("請輸入完整卡號"); return; }
      if (!cardExp || !cardCvv) { setError("請填寫完整卡片資料"); return; }
    }
    setProcessing(true);
    setTimeout(() => {
      const order = {
        id: genOrderId(),
        ...booking,
        method,
        status: "paid",
        dispatchStatus: "待派車",
        createdAt: new Date().toLocaleString("zh-TW"),
        timestamp: Date.now()
      };
      ORDER_STORE.unshift(order);
      setProcessing(false);
      onSuccess(order);
    }, 2200);
  };

  const inputStyle = {
    width:"100%", padding:"12px 14px", border:"2px solid #e5e7eb",
    borderRadius:10, fontSize:15, outline:"none", boxSizing:"border-box",
    fontFamily:"'Noto Sans TC',sans-serif", transition:"border-color 0.2s"
  };

  const methodLabel = { card:"信用卡", linepay:"LINE Pay", transfer:"銀行轉帳" };
  const methodColor = { card:"#1d4ed8", linepay:"#06c755", transfer:"#d97706" };

  return (
    <div style={{ minHeight:"100vh", background:"#f8f8f8", fontFamily:"'Noto Sans TC','Microsoft JhengHei',sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#dc2626,#991b1b)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ChevronRight size={18} color="white" style={{ transform:"rotate(180deg)" }}/>
        </button>
        <div>
          <div style={{ color:"white", fontWeight:800, fontSize:17 }}>付款結帳</div>
          <div style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>安全加密付款</div>
        </div>
        <Shield size={18} color="rgba(255,255,255,0.5)" style={{ marginLeft:"auto" }}/>
      </div>

      {/* Steps */}
      <div style={{ background:"white", borderBottom:"1px solid #eee", padding:"12px 20px", display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
        {["填寫資料","確認付款","等待派車"].map((s,i) => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background: i===1 ? "#dc2626" : i===0 ? "#dcfce7" : "#e5e7eb", color: i===1 ? "white" : i===0 ? "#166534" : "#9ca3af", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11 }}>
              {i===0 ? "✓" : i+1}
            </div>
            <span style={{ color: i===1 ? "#dc2626" : i===0 ? "#166534" : "#9ca3af", fontWeight: i===1 ? 700 : 400 }}>{s}</span>
            {i < 2 && <ChevronRight size={14} color="#d1d5db"/>}
          </div>
        ))}
      </div>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"20px 16px 80px" }}>
        {/* Order summary */}
        <div style={{ background:"white", borderRadius:14, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800, fontSize:14, color:"#6b7280", marginBottom:12, letterSpacing:1 }}>訂單摘要</div>
          <div style={{ fontSize:13, color:"#374151", lineHeight:2 }}>
            <div>🚑 {booking.origin} → {booking.destination}</div>
            <div>👤 {booking.patientName} ｜ 📞 {booking.contactPhone}</div>
            <div>📏 {booking.routeResult.distanceKm} 公里 ｜ ⏱ {booking.routeResult.durationMinutes} 分鐘</div>
          </div>
          <div style={{ borderTop:"1px dashed #e5e7eb", marginTop:12, paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color:"#6b7280", fontSize:13 }}>應付總金額</span>
            <span style={{ fontSize:26, fontWeight:900, color:"#dc2626" }}>${booking.fare.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment method */}
        <div style={{ background:"white", borderRadius:14, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:800, fontSize:15, color:"#1f2937", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
            <CreditCard size={16} color="#dc2626"/> 選擇付款方式
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
            {[
              { key:"card", icon:"💳", label:"信用卡" },
              { key:"linepay", icon:"💚", label:"LINE Pay" },
              { key:"transfer", icon:"🏦", label:"銀行轉帳" },
            ].map(({ key, icon, label }) => (
              <div key={key} onClick={() => setMethod(key)} style={{
                border:`2px solid ${method===key ? methodColor[key] : "#e5e7eb"}`,
                background: method===key ? `${methodColor[key]}11` : "white",
                borderRadius:10, padding:"12px 8px", cursor:"pointer", textAlign:"center", transition:"all 0.2s"
              }}>
                <div style={{ fontSize:22 }}>{icon}</div>
                <div style={{ fontSize:12, fontWeight:700, color: method===key ? methodColor[key] : "#6b7280", marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>

          {method === "card" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"#6b7280", display:"block", marginBottom:6 }}>卡號</label>
                <input style={inputStyle} placeholder="1234 5678 9012 3456" value={cardNum}
                  onChange={e => setCardNum(e.target.value.replace(/[^\d]/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim())}
                  onFocus={e=>e.target.style.borderColor="#1d4ed8"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#6b7280", display:"block", marginBottom:6 }}>有效期限</label>
                  <input style={inputStyle} placeholder="MM/YY" value={cardExp}
                    onChange={e => { let v=e.target.value.replace(/\D/g,"").slice(0,4); if(v.length>=3) v=v.slice(0,2)+"/"+v.slice(2); setCardExp(v); }}
                    onFocus={e=>e.target.style.borderColor="#1d4ed8"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#6b7280", display:"block", marginBottom:6 }}>CVV</label>
                  <input style={inputStyle} placeholder="123" maxLength={3} value={cardCvv} onChange={e=>setCardCvv(e.target.value.replace(/\D/g,""))}
                    onFocus={e=>e.target.style.borderColor="#1d4ed8"} onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
                </div>
              </div>
            </div>
          )}
          {method === "linepay" && (
            <div style={{ background:"#f0fdf4", borderRadius:10, padding:16, textAlign:"center", border:"1px solid #bbf7d0" }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💚</div>
              <div style={{ fontWeight:700, color:"#166534", marginBottom:4 }}>LINE Pay</div>
              <div style={{ fontSize:12, color:"#15803d" }}>點擊「確認付款」後，系統將自動跳轉 LINE Pay 完成付款</div>
            </div>
          )}
          {method === "transfer" && (
            <div style={{ background:"#fffbeb", borderRadius:10, padding:16, border:"1px solid #fde68a", fontSize:13 }}>
              <div style={{ fontWeight:800, color:"#92400e", marginBottom:8 }}>銀行轉帳資訊</div>
              <div style={{ lineHeight:2, color:"#78350f" }}>
                <div>銀行：玉山銀行 (808)</div>
                <div>帳號：1234-5678-9012-3456</div>
                <div>戶名：榮光救護車有限公司</div>
                <div style={{ color:"#dc2626", fontWeight:700 }}>轉帳金額：${booking.fare.total.toLocaleString()}</div>
              </div>
              <div style={{ marginTop:8, fontSize:11, color:"#9ca3af" }}>*轉帳後請點確認付款，系統驗證後即開始派車</div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 14px", marginBottom:16, color:"#dc2626", fontSize:13, display:"flex", gap:8, alignItems:"center" }}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        <button onClick={handlePay} disabled={processing} style={{
          width:"100%", background: processing ? "#9ca3af" : "linear-gradient(135deg,#dc2626,#991b1b)",
          color:"white", border:"none", borderRadius:12, padding:"16px", fontSize:16, fontWeight:800,
          cursor: processing ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          boxShadow: processing ? "none" : "0 6px 24px rgba(220,38,38,0.35)"
        }}>
          {processing ? (
            <><div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}></div> 付款處理中...</>
          ) : (
            <><Shield size={18}/> 確認付款 ${booking.fare.total.toLocaleString()}</>
          )}
        </button>
        <div style={{ textAlign:"center", marginTop:10, fontSize:11, color:"#9ca3af" }}>🔒 SSL 加密保護，付款資料安全無虞</div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

// ── 4. Confirmation Screen ────────────────────────────
function ConfirmationScreen({ order, onHome }) {
  const [countdown, setCountdown] = useState(15);
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const methodName = { card:"信用卡", linepay:"LINE Pay", transfer:"銀行轉帳" }[order.method];

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#f0fdf4,#dcfce7,#f8fafc)", fontFamily:"'Noto Sans TC','Microsoft JhengHei',sans-serif", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@keyframes popIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} } @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>

      <div style={{ width:80, height:80, background:"linear-gradient(135deg,#16a34a,#15803d)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, boxShadow:"0 8px 32px rgba(22,163,74,0.35)", animation:"popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" }}>
        <CheckCircle size={40} color="white"/>
      </div>

      <h1 style={{ fontSize:24, fontWeight:900, color:"#14532d", margin:"0 0 6px", animation:"fadeUp 0.6s 0.2s both" }}>付款成功！</h1>
      <p style={{ color:"#16a34a", fontSize:14, margin:"0 0 24px", animation:"fadeUp 0.6s 0.3s both" }}>救護車正在安排出發</p>

      <div style={{ background:"white", borderRadius:20, padding:24, maxWidth:400, width:"100%", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", animation:"fadeUp 0.6s 0.4s both", marginBottom:16 }}>
        <div style={{ textAlign:"center", marginBottom:16, paddingBottom:16, borderBottom:"1px dashed #e5e7eb" }}>
          <div style={{ fontSize:12, color:"#9ca3af", marginBottom:6, letterSpacing:1 }}>訂單編號</div>
          <div style={{ fontSize:28, fontWeight:900, color:"#dc2626", letterSpacing:3 }}>{order.id}</div>
        </div>
        {[
          { label:"病患", value: order.patientName },
          { label:"聯絡", value: order.contactPhone },
          { label:"出發", value: order.origin },
          { label:"目的", value: order.destination },
          { label:"距離", value: `${order.routeResult.distanceKm} 公里` },
          { label:"付款", value: methodName },
          { label:"金額", value: `$${order.fare.total.toLocaleString()}` },
          { label:"狀態", value: "✅ 付款完成，等待調度" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", fontSize:13, borderBottom:"1px solid #f3f4f6" }}>
            <span style={{ color:"#9ca3af", minWidth:40 }}>{label}</span>
            <span style={{ color:"#1f2937", fontWeight:600, textAlign:"right", maxWidth:220, wordBreak:"break-all" }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ background:"#fef3c7", border:"1px solid #fde68a", borderRadius:12, padding:"12px 16px", maxWidth:400, width:"100%", marginBottom:20, animation:"fadeUp 0.6s 0.5s both" }}>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <Clock size={16} color="#d97706"/>
          <div style={{ fontSize:13, color:"#92400e" }}>
            <div style={{ fontWeight:700 }}>預計 15 ~ 30 分鐘內出發</div>
            <div style={{ fontSize:11, marginTop:2 }}>調度人員確認後將以電話通知，請保持手機暢通</div>
          </div>
        </div>
      </div>

      <button onClick={onHome} style={{
        background:"white", border:"2px solid #dc2626", color:"#dc2626", borderRadius:12,
        padding:"12px 32px", fontWeight:800, fontSize:14, cursor:"pointer"
      }}>回到首頁</button>
    </div>
  );
}

// ── 5. Admin Dashboard ────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [orders, setOrders] = useState([...ORDER_STORE]);
  const [selected, setSelected] = useState(null);

  const refresh = () => setOrders([...ORDER_STORE]);

  const updateStatus = (id, status) => {
    const o = ORDER_STORE.find(o => o.id === id);
    if (o) { o.dispatchStatus = status; refresh(); if (selected?.id === id) setSelected({ ...o, dispatchStatus: status }); }
  };

  const statusColor = { "待派車":"#f59e0b", "派車中":"#3b82f6", "已完成":"#10b981", "已取消":"#ef4444" };
  const nextStatus = { "待派車":"派車中", "派車中":"已完成" };

  // Add demo orders if empty
  useEffect(() => {
    if (ORDER_STORE.length === 0) {
      ORDER_STORE = [
        { id:"RG1001", patientName:"王大明", contactPhone:"0912-345-678", origin:"台中榮總", destination:"台北榮總", routeResult:{ distanceKm:165, durationMinutes:148 }, fare:{ total:12800 }, method:"card", status:"paid", dispatchStatus:"待派車", createdAt:"2025/01/15 09:23" },
        { id:"RG1002", patientName:"李小花", contactPhone:"0923-456-789", origin:"高雄長庚", destination:"台中中山醫院", routeResult:{ distanceKm:87, durationMinutes:82 }, fare:{ total:7200 }, method:"linepay", status:"paid", dispatchStatus:"派車中", createdAt:"2025/01/15 10:11" },
        { id:"RG1003", patientName:"陳阿信", contactPhone:"0934-567-890", origin:"嘉義基督教醫院", destination:"台南成大醫院", routeResult:{ distanceKm:32, durationMinutes:38 }, fare:{ total:3150 }, method:"transfer", status:"paid", dispatchStatus:"已完成", createdAt:"2025/01/15 08:05" },
      ];
      refresh();
    }
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"#f1f5f9", fontFamily:"'Noto Sans TC','Microsoft JhengHei',sans-serif" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1e293b,#0f172a)", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:"rgba(239,68,68,0.2)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"50%", width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <LayoutDashboard size={18} color="#f87171"/>
          </div>
          <div>
            <div style={{ color:"white", fontWeight:800, fontSize:16 }}>派車後台管理系統</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>榮光救護車有限公司</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={refresh} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"white", borderRadius:8, padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
            <RefreshCw size={13}/> 更新
          </button>
          <button onClick={onLogout} style={{ background:"rgba(239,68,68,0.2)", border:"1px solid rgba(239,68,68,0.3)", color:"#f87171", borderRadius:8, padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:12 }}>
            <LogOut size={13}/> 離開
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, maxWidth:960, margin:"0 auto" }}>
        {[
          { label:"全部訂單", value: orders.length, color:"#6366f1", bg:"#eef2ff" },
          { label:"待派車", value: orders.filter(o=>o.dispatchStatus==="待派車").length, color:"#f59e0b", bg:"#fffbeb" },
          { label:"派車中", value: orders.filter(o=>o.dispatchStatus==="派車中").length, color:"#3b82f6", bg:"#eff6ff" },
          { label:"已完成", value: orders.filter(o=>o.dispatchStatus==="已完成").length, color:"#10b981", bg:"#f0fdf4" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background:"white", borderRadius:12, padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", borderLeft:`3px solid ${color}` }}>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:28, fontWeight:900, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px 24px" }}>
        <div style={{ background:"white", borderRadius:14, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #f1f5f9", fontWeight:800, fontSize:15, color:"#1e293b", display:"flex", alignItems:"center", gap:8 }}>
            <Truck size={16} color="#dc2626"/> 訂單列表
          </div>
          {orders.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"#9ca3af" }}>尚無訂單</div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {["訂單編號","病患","路線","金額","付款","狀態","操作"].map(h => (
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontWeight:700, color:"#64748b", fontSize:11, letterSpacing:0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} style={{ borderTop:"1px solid #f1f5f9", background: i%2===0 ? "white" : "#fafafa", transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                      onMouseLeave={e=>e.currentTarget.style.background= i%2===0 ? "white" : "#fafafa"}>
                      <td style={{ padding:"12px 16px", fontWeight:800, color:"#dc2626" }}>{o.id}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ fontWeight:600 }}>{o.patientName}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>{o.contactPhone}</div>
                      </td>
                      <td style={{ padding:"12px 16px", maxWidth:160 }}>
                        <div style={{ fontSize:11, color:"#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{o.origin}</div>
                        <div style={{ fontSize:11, color:"#9ca3af" }}>→ {o.destination}</div>
                      </td>
                      <td style={{ padding:"12px 16px", fontWeight:800, color:"#1e293b" }}>${o.fare.total.toLocaleString()}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ fontSize:11, background:"#f1f5f9", padding:"2px 8px", borderRadius:20, color:"#64748b" }}>
                          {{ card:"💳 信用卡", linepay:"💚 LINE Pay", transfer:"🏦 轉帳" }[o.method]}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={{ fontSize:11, background: statusColor[o.dispatchStatus]+"22", color: statusColor[o.dispatchStatus], padding:"3px 10px", borderRadius:20, fontWeight:700, border:`1px solid ${statusColor[o.dispatchStatus]}44` }}>
                          {o.dispatchStatus}
                        </span>
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => setSelected(o)} style={{ background:"#f1f5f9", border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:11, color:"#475569", display:"flex", alignItems:"center", gap:4 }}>
                            <Eye size={11}/> 詳情
                          </button>
                          {nextStatus[o.dispatchStatus] && (
                            <button onClick={() => updateStatus(o.id, nextStatus[o.dispatchStatus])} style={{ background: o.dispatchStatus==="待派車" ? "#fef3c7" : "#dbeafe", border:"none", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:11, color: o.dispatchStatus==="待派車" ? "#92400e" : "#1d4ed8", fontWeight:700 }}>
                              {o.dispatchStatus==="待派車" ? "🚑 派車" : "✅ 完成"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 }} onClick={() => setSelected(null)}>
          <div style={{ background:"white", borderRadius:20, padding:28, maxWidth:440, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontWeight:900, fontSize:18, color:"#1e293b" }}>訂單詳情</div>
              <button onClick={() => setSelected(null)} style={{ background:"#f1f5f9", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16}/>
              </button>
            </div>
            <div style={{ fontSize:24, fontWeight:900, color:"#dc2626", marginBottom:16, letterSpacing:2, textAlign:"center", background:"#fff5f5", borderRadius:10, padding:"10px" }}>{selected.id}</div>
            {[
              ["病患姓名", selected.patientName],
              ["聯絡電話", selected.contactPhone],
              ["出發地", selected.origin],
              ["目的地", selected.destination],
              ["距離", `${selected.routeResult.distanceKm} 公里`],
              ["時間", `${selected.routeResult.durationMinutes} 分鐘`],
              ["付款方式", { card:"信用卡", linepay:"LINE Pay", transfer:"銀行轉帳" }[selected.method]],
              ["應付金額", `$${selected.fare.total.toLocaleString()}`],
              ["建立時間", selected.createdAt],
              ["派車狀態", selected.dispatchStatus],
            ].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
                <span style={{ color:"#9ca3af" }}>{k}</span>
                <span style={{ fontWeight:600, color:"#1e293b" }}>{v}</span>
              </div>
            ))}
            {nextStatus[selected.dispatchStatus] && (
              <button onClick={() => { updateStatus(selected.id, nextStatus[selected.dispatchStatus]); setSelected(null); }} style={{
                width:"100%", marginTop:20, background:"linear-gradient(135deg,#dc2626,#991b1b)", color:"white", border:"none",
                borderRadius:10, padding:"12px", fontWeight:800, fontSize:14, cursor:"pointer"
              }}>
                {selected.dispatchStatus==="待派車" ? "🚑 立即派車" : "✅ 標記完成"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Login ────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1e293b,#0f172a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Noto Sans TC',sans-serif" }}>
      <div style={{ background:"white", borderRadius:20, padding:36, width:320, boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🔐</div>
          <div style={{ fontWeight:800, fontSize:18, color:"#1e293b" }}>後台管理登入</div>
          <div style={{ color:"#9ca3af", fontSize:12, marginTop:4 }}>榮光救護車調度系統</div>
        </div>
        <input type="password" placeholder="請輸入管理密碼" value={pw} onChange={e=>{setPw(e.target.value);setErr(false);}}
          onKeyDown={e=>e.key==="Enter"&&(pw==="admin123"?onLogin():setErr(true))}
          style={{ width:"100%", padding:"12px", border:`2px solid ${err?"#ef4444":"#e5e7eb"}`, borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
        {err && <div style={{ color:"#ef4444", fontSize:12, marginBottom:8 }}>密碼錯誤，請重試</div>}
        <button onClick={() => pw==="admin123" ? onLogin() : setErr(true)} style={{
          width:"100%", background:"linear-gradient(135deg,#1e293b,#0f172a)", color:"white", border:"none",
          borderRadius:10, padding:"12px", fontWeight:800, fontSize:14, cursor:"pointer"
        }}>登入</button>
        <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:"#9ca3af" }}>提示：密碼為 admin123</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// ROOT APP
// ════════════════════════════════════════════════════
export default function App() {
  // screen: qr | booking | payment | confirm | adminLogin | admin
  const [screen, setScreen] = useState("qr");
  const [booking, setBooking] = useState(null);
  const [order, setOrder] = useState(null);

  if (screen === "adminLogin") {
    return <AdminLogin onLogin={() => setScreen("admin")}/>;
  }
  if (screen === "admin") return <AdminDashboard onLogout={() => setScreen("qr")}/>;

  if (screen === "qr") return (
    <div>
      <QRLandingScreen onEnter={() => setScreen("booking")}/>
      <div style={{ position:"fixed", bottom:16, right:16, zIndex:99 }}>
        <button onClick={() => setScreen("adminLogin")} style={{ background:"rgba(0,0,0,0.7)", color:"white", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"8px 14px", fontSize:12, cursor:"pointer", backdropFilter:"blur(8px)" }}>
          <LayoutDashboard size={12} style={{ display:"inline", marginRight:5 }}/>後台管理
        </button>
      </div>
    </div>
  );
  if (screen === "booking") return <BookingScreen onNext={b => { setBooking(b); setScreen("payment"); }}/>;
  if (screen === "payment") return <PaymentScreen booking={booking} onSuccess={o => { setOrder(o); setScreen("confirm"); }} onBack={() => setScreen("booking")}/>;
  if (screen === "confirm") return (
    <div>
      <ConfirmationScreen order={order} onHome={() => setScreen("qr")}/>
      <div style={{ position:"fixed", bottom:16, right:16 }}>
        <button onClick={() => setScreen("admin")} style={{ background:"rgba(0,0,0,0.7)", color:"white", border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, cursor:"pointer" }}>
          <LayoutDashboard size={12} style={{ display:"inline", marginRight:5 }}/>查看後台
        </button>
      </div>
    </div>
  );
  return null;
}
