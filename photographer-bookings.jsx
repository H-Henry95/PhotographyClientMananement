import { useState, useEffect, useMemo } from "react";

const SK = "photog-bookings-v2";
const DD = { bookings: [], nextId: 1 };
async function load() { try { const r = await window.storage.get(SK); return r?.value ? JSON.parse(r.value) : DD; } catch { return DD; } }
async function save(d) { try { await window.storage.set(SK, JSON.stringify(d)); } catch {} }
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmt$ = v => v ? "$" + Number(v).toLocaleString() : "—";
const fmtD = d => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
const fmtDShort = d => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
const today = () => new Date().toISOString().split("T")[0];

const STAGES = ["inquiry", "consultation", "proposal", "contract", "deposit", "booked", "completed"];
const STAGE_LABELS = { inquiry: "Inquiry", consultation: "Consultation", proposal: "Proposal Sent", contract: "Contract Signed", deposit: "Deposit Paid", booked: "Booked", completed: "Completed" };
const STAGE_COLORS = {
  inquiry: "#a78b6e", consultation: "#c17f4e", proposal: "#d4a24e",
  contract: "#5a8a6a", deposit: "#4a8a9a", booked: "#3a7a5a", completed: "#b0a494",
};
const SHOOT_TYPES = ["Wedding", "Engagement", "Portrait", "Headshot", "Family", "Newborn", "Event", "Corporate", "Product", "Editorial", "Other"];
const CHECKLIST_ITEMS = [
  { key: "inquiryResponded", label: "Inquiry responded" },
  { key: "consultationDone", label: "Consultation completed" },
  { key: "proposalSent", label: "Proposal / quote sent" },
  { key: "contractSent", label: "Contract sent" },
  { key: "contractSigned", label: "Contract signed" },
  { key: "depositReceived", label: "Deposit received" },
  { key: "finalPayment", label: "Final payment received" },
  { key: "shootCompleted", label: "Shoot completed" },
  { key: "editingDone", label: "Editing & retouching done" },
  { key: "delivered", label: "Gallery delivered" },
];

export default function PhotographerApp() {
  const [data, setData] = useState(DD);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selId, setSelId] = useState(null);
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });

  useEffect(() => { load().then(d => { setData(d); setReady(true); }); }, []);
  useEffect(() => { if (ready) save(data); }, [data, ready]);

  const update = fn => setData(p => { const n = { ...p, bookings: p.bookings.map(b => ({ ...b })) }; fn(n); return n; });
  const booking = selId != null ? data.bookings.find(b => b.id === selId) : null;
  const updateBooking = fn => update(d => { const b = d.bookings.find(x => x.id === selId); if (b) fn(b); });

  const activeBookings = data.bookings.filter(b => !["completed"].includes(b.stage)).length;
  const pendingActions = data.bookings.filter(b => ["inquiry", "proposal", "contract"].includes(b.stage)).length;
  const upcomingShoots = data.bookings.filter(b => b.shootDate >= today() && ["deposit", "booked"].includes(b.stage)).sort((a, b) => a.shootDate.localeCompare(b.shootDate));
  const totalRevenue = data.bookings.filter(b => ["booked", "completed", "deposit"].includes(b.stage)).reduce((s, b) => s + (+b.price || 0), 0);

  const emptyForm = { clientName: "", clientEmail: "", clientPhone: "", shootType: "Wedding", shootDate: "", location: "", price: "", hours: "", notes: "", referral: "" };
  const [form, setForm] = useState(emptyForm);
  const saveNew = () => {
    if (!form.clientName.trim()) return;
    update(d => {
      d.bookings.push({ ...form, id: d.nextId, stage: "inquiry", checklist: {}, comms: [], createdAt: today(), favorited: false });
      d.nextId++;
    });
    setForm(emptyForm);
    setView("clients");
  };

  const [commInput, setCommInput] = useState("");
  const addComm = () => {
    if (!commInput.trim()) return;
    updateBooking(b => { b.comms = [{ id: uid(), text: commInput, date: today(), time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) }, ...(b.comms || [])]; });
    setCommInput("");
  };

  const openBooking = id => { setSelId(id); setDTab("overview"); setView("detail"); };
  const deleteBooking = id => { update(d => { d.bookings = d.bookings.filter(b => b.id !== id); }); if (selId === id) setView("clients"); };

  const calDays = useMemo(() => {
    const first = new Date(calMonth.y, calMonth.m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calMonth]);

  const calBookings = useMemo(() => {
    const prefix = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, "0")}`;
    return data.bookings.filter(b => b.shootDate?.startsWith(prefix));
  }, [data.bookings, calMonth]);

  const prevMonth = () => setCalMonth(p => p.m === 0 ? { y: p.y - 1, m: 11 } : { ...p, m: p.m - 1 });
  const nextMonth = () => setCalMonth(p => p.m === 11 ? { y: p.y + 1, m: 0 } : { ...p, m: p.m + 1 });
  const monthLabel = new Date(calMonth.y, calMonth.m).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const [dTab, setDTab] = useState("overview");

  if (!ready) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#faf8f5", color: "#c17f4e", fontFamily: "'Karla', sans-serif", gap: 12 }}>
      <div style={{ width: 20, height: 20, border: "2px solid #eae5de", borderTopColor: "#c17f4e", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
    </div>
  );

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Karla:wght@300;400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        input:focus,textarea:focus,select:focus{border-color:#c17f4e!important;outline:none;box-shadow:0 0 0 3px rgba(193,127,78,.1)}
        textarea{resize:vertical} ::placeholder{color:#c4b9ab}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:#faf8f5} ::-webkit-scrollbar-thumb{background:#ddd5ca;border-radius:3px}
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={S.sidebar}>
        <div style={S.brand}>
          <div style={S.brandIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c17f4e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div>
            <div style={S.brandName}>LUMIÈRE</div>
            <div style={S.brandSub}>Booking Studio</div>
          </div>
        </div>

        <nav style={S.nav}>
          {[
            { key: "dashboard", label: "Dashboard", ico: "◈" },
            { key: "pipeline", label: "Pipeline", ico: "◆" },
            { key: "calendar", label: "Calendar", ico: "◇" },
            { key: "clients", label: "All Bookings", ico: "◎" },
          ].map(n => (
            <button key={n.key} onClick={() => { setView(n.key); setSelId(null); }}
              style={{ ...S.navBtn, ...(view === n.key || (view === "detail" && n.key === "clients") ? S.navActive : {}) }}>
              <span style={S.navIco}>{n.ico}</span>{n.label}
            </button>
          ))}
        </nav>

        <div style={S.sidebarCTA}>
          <button style={S.ctaBtn} onClick={() => setView("newBooking")}>+ New Booking</button>
        </div>
        <div style={S.sidebarFoot}><span style={{ fontSize: 10, color: "#ccc4b8", letterSpacing: "1px", textTransform: "uppercase" }}>Data stored locally</span></div>
      </div>

      {/* ── MAIN ── */}
      <div style={S.main}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div style={S.page}>
            <div style={S.hero}>
              <h1 style={S.heroTitle}>Your Studio</h1>
              <p style={S.heroSub}>Manage every booking from first inquiry to final delivery.</p>
            </div>

            <div style={S.statsGrid}>
              {[
                { label: "Active Bookings", val: activeBookings, color: "#c17f4e", bg: "linear-gradient(135deg, #fdf3ea, #fce8d5)" },
                { label: "Pending Actions", val: pendingActions, color: "#c45a5a", bg: "linear-gradient(135deg, #fcefed, #f9ddd8)" },
                { label: "Upcoming Shoots", val: upcomingShoots.length, color: "#4a8a9a", bg: "linear-gradient(135deg, #ebf5f7, #d6edf2)" },
                { label: "Total Revenue", val: fmt$(totalRevenue), color: "#5a8a6a", bg: "linear-gradient(135deg, #eef5f0, #d8eede)" },
              ].map((s, i) => (
                <div key={i} style={{ ...S.statCard, background: s.bg }}>
                  <div style={S.statVal}>{s.val}</div>
                  <div style={{ ...S.statLbl, color: s.color }}>{s.label}</div>
                </div>
              ))}
            </div>

            <h2 style={S.secTitle}>Upcoming Shoots</h2>
            {upcomingShoots.length === 0 && <p style={S.empty}>No upcoming shoots scheduled</p>}
            <div style={S.upList}>
              {upcomingShoots.slice(0, 5).map(b => (
                <div key={b.id} style={S.upCard} onClick={() => openBooking(b.id)}>
                  <div style={S.upDateBox}>
                    <div style={S.upDay}>{new Date(b.shootDate + "T00:00:00").getDate()}</div>
                    <div style={S.upMon}>{new Date(b.shootDate + "T00:00:00").toLocaleDateString("en", { month: "short" }).toUpperCase()}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={S.upName}>{b.clientName}</div>
                    <div style={S.upMeta}>{b.shootType} · {b.location || "TBD"}{b.hours ? ` · ${b.hours}hr` : ""}</div>
                  </div>
                  <div style={S.upPrice}>{fmt$(b.price)}</div>
                </div>
              ))}
            </div>

            {(() => {
              const iq = data.bookings.filter(b => b.stage === "inquiry").sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 4);
              if (!iq.length) return null;
              return (
                <>
                  <h2 style={{ ...S.secTitle, marginTop: 40 }}>New Inquiries</h2>
                  <div style={S.iqGrid}>
                    {iq.map(b => (
                      <div key={b.id} style={S.iqCard} onClick={() => openBooking(b.id)}>
                        <div style={S.iqType}>{b.shootType}</div>
                        <div style={S.iqName}>{b.clientName}</div>
                        <div style={S.iqDate}>{fmtD(b.createdAt)}</div>
                        {b.shootDate && <div style={S.iqShoot}>Shoot: {fmtDShort(b.shootDate)}</div>}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* PIPELINE */}
        {view === "pipeline" && (
          <div style={S.page}>
            <h1 style={S.pgTitle}>Pipeline</h1>
            <p style={S.pgSub}>Click any card to update its status and details.</p>
            <div style={S.pipeWrap}>
              {STAGES.map(stage => {
                const items = data.bookings.filter(b => b.stage === stage);
                const color = STAGE_COLORS[stage];
                return (
                  <div key={stage} style={S.pipeCol}>
                    <div style={S.pipeHead}>
                      <div style={{ ...S.pipeDot, background: color }} />
                      <span style={S.pipeLbl}>{STAGE_LABELS[stage]}</span>
                      <span style={S.pipeCnt}>{items.length}</span>
                    </div>
                    {items.map(b => (
                      <div key={b.id} style={S.pipeCard} onClick={() => openBooking(b.id)}>
                        <div style={S.pcName}>{b.clientName}</div>
                        <div style={S.pcType}>{b.shootType}</div>
                        {b.shootDate && <div style={S.pcDate}>{fmtDShort(b.shootDate)}</div>}
                        <div style={S.pcPrice}>{fmt$(b.price)}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {view === "calendar" && (
          <div style={S.page}>
            <h1 style={S.pgTitle}>Calendar</h1>
            <div style={S.calNav}>
              <button style={S.calArrow} onClick={prevMonth}>‹</button>
              <span style={S.calMonthLbl}>{monthLabel}</span>
              <button style={S.calArrow} onClick={nextMonth}>›</button>
            </div>
            <div style={S.calGrid}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} style={S.calDH}>{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <div key={`e${i}`} style={S.calCell} />;
                const ds = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const db = calBookings.filter(b => b.shootDate === ds);
                const it = ds === today();
                return (
                  <div key={i} style={{ ...S.calCell, ...(it ? S.calToday : {}) }}>
                    <div style={{ ...S.calNum, ...(it ? { color: "#c17f4e", fontWeight: 700 } : {}) }}>{day}</div>
                    {db.map(b => (
                      <div key={b.id} style={{ ...S.calEvt, background: STAGE_COLORS[b.stage] + "15", borderLeftColor: STAGE_COLORS[b.stage], color: STAGE_COLORS[b.stage] }} onClick={() => openBooking(b.id)}>
                        {b.clientName}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ALL BOOKINGS */}
        {view === "clients" && (
          <div style={S.page}>
            <div style={S.pageHead}>
              <div>
                <h1 style={S.pgTitle}>All Bookings</h1>
                <p style={S.pgSub}>{data.bookings.length} total</p>
              </div>
              <button style={S.primaryBtn} onClick={() => setView("newBooking")}>+ New</button>
            </div>
            {data.bookings.length === 0 && <p style={S.empty}>No bookings yet — create your first one!</p>}
            <div style={S.bList}>
              {[...data.bookings].sort((a, b) => (b.shootDate || b.createdAt || "").localeCompare(a.shootDate || a.createdAt || "")).map(b => {
                const sc = STAGE_COLORS[b.stage];
                const ck = CHECKLIST_ITEMS.filter(c => b.checklist?.[c.key]).length;
                return (
                  <div key={b.id} style={S.bRow} onClick={() => openBooking(b.id)}>
                    <div style={{ ...S.bDot, background: sc }} />
                    <div style={{ flex: 1 }}>
                      <div style={S.bName}>{b.clientName}</div>
                      <div style={S.bMeta}>{b.shootType} · {b.shootDate ? fmtDShort(b.shootDate) : "No date"} · {b.location || "TBD"}</div>
                    </div>
                    <div style={S.bRight}>
                      <div style={S.bPrice}>{fmt$(b.price)}</div>
                      <div style={{ ...S.bStage, color: sc }}>{STAGE_LABELS[b.stage]}</div>
                    </div>
                    <div style={S.bCk}>{ck}/{CHECKLIST_ITEMS.length}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NEW BOOKING */}
        {view === "newBooking" && (
          <div style={S.page}>
            <button style={S.backLink} onClick={() => setView("dashboard")}>← Back</button>
            <h1 style={S.pgTitle}>New Booking</h1>
            <div style={S.formBox}>
              <div style={S.fg}>
                <div style={{ gridColumn: "1 / -1" }}><label style={S.lbl}>Client Name *</label><input style={S.inp} value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Full name" /></div>
                <div><label style={S.lbl}>Email</label><input style={S.inp} value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="email@example.com" /></div>
                <div><label style={S.lbl}>Phone</label><input style={S.inp} value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="(555) 000-0000" /></div>
                <div><label style={S.lbl}>Shoot Type</label><select style={S.inp} value={form.shootType} onChange={e => setForm(f => ({ ...f, shootType: e.target.value }))}>{SHOOT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label style={S.lbl}>Shoot Date</label><input style={S.inp} type="date" value={form.shootDate} onChange={e => setForm(f => ({ ...f, shootDate: e.target.value }))} /></div>
                <div><label style={S.lbl}>Location</label><input style={S.inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Venue or address" /></div>
                <div><label style={S.lbl}>Price</label><input style={S.inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="3500" /></div>
                <div><label style={S.lbl}>Hours</label><input style={S.inp} type="number" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} placeholder="8" /></div>
                <div><label style={S.lbl}>Referral</label><input style={S.inp} value={form.referral} onChange={e => setForm(f => ({ ...f, referral: e.target.value }))} placeholder="Instagram, referral..." /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={S.lbl}>Notes</label><textarea style={{ ...S.inp, minHeight: 70 }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Creative vision, special requests..." /></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, borderTop: "1px solid #eae5de", paddingTop: 18 }}>
                <button style={S.ghostBtn} onClick={() => setView("dashboard")}>Cancel</button>
                <button style={S.primaryBtn} onClick={saveNew}>Create Booking</button>
              </div>
            </div>
          </div>
        )}

        {/* BOOKING DETAIL */}
        {view === "detail" && booking && (
          <div style={S.page}>
            <button style={S.backLink} onClick={() => setView("clients")}>← All Bookings</button>

            <div style={S.dHead}>
              <div>
                <div style={S.dType}>{booking.shootType}</div>
                <h1 style={S.dClientName}>{booking.clientName}</h1>
                <div style={S.dContact}>
                  {booking.clientEmail && <span>{booking.clientEmail}</span>}
                  {booking.clientPhone && <span> · {booking.clientPhone}</span>}
                  {booking.referral && <span> · via {booking.referral}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={S.dPrice}>{fmt$(booking.price)}</div>
                <button style={{ ...S.ghostBtn, color: "#c45a5a", borderColor: "#f0ddd8", fontSize: 11, padding: "5px 14px", marginTop: 8 }} onClick={() => deleteBooking(booking.id)}>Delete</button>
              </div>
            </div>

            <div style={S.stageRow}>
              {STAGES.map((s, i) => {
                const active = booking.stage === s;
                const passed = STAGES.indexOf(booking.stage) > i;
                const color = STAGE_COLORS[s];
                return (
                  <button key={s} onClick={() => updateBooking(b => { b.stage = s; })}
                    style={{ ...S.stageChip, ...(active ? { background: color, color: "#fff", borderColor: color } : passed ? { background: color + "12", color, borderColor: color + "30" } : {}) }}>
                    {STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>

            <div style={S.dtabs}>
              {["overview", "checklist", "comms"].map(t => (
                <button key={t} onClick={() => setDTab(t)} style={{ ...S.dtab, ...(dTab === t ? S.dtabA : {}) }}>
                  {t === "overview" ? "Overview" : t === "checklist" ? "Workflow" : "Communication"}
                </button>
              ))}
            </div>

            {dTab === "overview" && (
              <div style={S.dSection}>
                <div style={S.dGrid}>
                  {[
                    { l: "Shoot Date", v: booking.shootDate ? fmtD(booking.shootDate) : "TBD" },
                    { l: "Location", v: booking.location || "TBD" },
                    { l: "Duration", v: booking.hours ? booking.hours + " hours" : "TBD" },
                    { l: "Price", v: fmt$(booking.price) },
                    { l: "Inquiry Date", v: fmtD(booking.createdAt) },
                    { l: "Referral", v: booking.referral || "—" },
                  ].map((f, i) => (
                    <div key={i} style={S.dFieldBox}>
                      <div style={S.dFieldL}>{f.l}</div>
                      <div style={S.dFieldV}>{f.v}</div>
                    </div>
                  ))}
                </div>
                {booking.notes && <div style={S.dNotes}><span style={{ color: "#b0a494", fontWeight: 600 }}>Notes: </span>{booking.notes}</div>}
                <h3 style={{ ...S.secTitle, marginTop: 30 }}>Quick Edit</h3>
                <div style={S.editRow}>
                  <div><label style={S.lbl}>Shoot Date</label><input style={S.inp} type="date" value={booking.shootDate || ""} onChange={e => updateBooking(b => { b.shootDate = e.target.value; })} /></div>
                  <div><label style={S.lbl}>Location</label><input style={S.inp} value={booking.location || ""} onChange={e => updateBooking(b => { b.location = e.target.value; })} /></div>
                  <div><label style={S.lbl}>Price</label><input style={S.inp} type="number" value={booking.price || ""} onChange={e => updateBooking(b => { b.price = e.target.value; })} /></div>
                  <div><label style={S.lbl}>Hours</label><input style={S.inp} type="number" value={booking.hours || ""} onChange={e => updateBooking(b => { b.hours = e.target.value; })} /></div>
                </div>
              </div>
            )}

            {dTab === "checklist" && (
              <div style={S.dSection}>
                <div style={S.ckProg}>
                  <div style={S.ckBar}><div style={{ ...S.ckFill, width: `${(CHECKLIST_ITEMS.filter(c => booking.checklist?.[c.key]).length / CHECKLIST_ITEMS.length) * 100}%` }} /></div>
                  <span style={S.ckLbl}>{CHECKLIST_ITEMS.filter(c => booking.checklist?.[c.key]).length} / {CHECKLIST_ITEMS.length}</span>
                </div>
                <div style={S.ckList}>
                  {CHECKLIST_ITEMS.map(item => {
                    const done = booking.checklist?.[item.key];
                    return (
                      <button key={item.key} style={S.ckItem} onClick={() => updateBooking(b => { b.checklist = { ...b.checklist, [item.key]: !done }; })}>
                        <div style={{ ...S.ckBox, ...(done ? S.ckBoxDone : {}) }}>
                          {done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                        </div>
                        <span style={{ ...S.ckText, ...(done ? S.ckTextDone : {}) }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {dTab === "comms" && (
              <div style={S.dSection}>
                <div style={S.commBox}>
                  <textarea style={{ ...S.inp, minHeight: 80 }} value={commInput} onChange={e => setCommInput(e.target.value)} placeholder="Log a call, email, or note about this client..." />
                  <div style={{ textAlign: "right", marginTop: 10 }}><button style={S.primaryBtn} onClick={addComm}>Add Entry</button></div>
                </div>
                {(booking.comms || []).length === 0 && <p style={S.empty}>No communication logged yet</p>}
                {(booking.comms || []).map(c => (
                  <div key={c.id} style={S.commCard}>
                    <div style={S.commDate}>{fmtD(c.date)} · {c.time}</div>
                    <div style={S.commText}>{c.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ STYLES ═══ */
const S = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "'Karla', sans-serif", background: "#faf8f5", color: "#3a3330" },

  sidebar: { width: 240, minWidth: 240, background: "#fff", borderRight: "1px solid #eae5de", display: "flex", flexDirection: "column", padding: "28px 18px 20px" },
  brand: { display: "flex", alignItems: "center", gap: 12, marginBottom: 36, padding: "0 6px" },
  brandIcon: { width: 42, height: 42, borderRadius: 12, border: "1px solid #eae5de", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdf8f3" },
  brandName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 700, color: "#2a2420", letterSpacing: "2.5px" },
  brandSub: { fontSize: 10, color: "#b0a494", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navBtn: { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: "none", background: "transparent", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#9a8e82", fontFamily: "inherit", transition: "all .15s", textAlign: "left" },
  navActive: { background: "#fdf3ea", color: "#c17f4e", fontWeight: 600 },
  navIco: { fontSize: 12, width: 18, textAlign: "center" },
  sidebarCTA: { marginTop: 32, padding: "0 4px" },
  ctaBtn: { width: "100%", padding: "12px 0", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 10, background: "#c17f4e", color: "#fff", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.5px", boxShadow: "0 2px 12px rgba(193,127,78,0.2)" },
  sidebarFoot: { marginTop: "auto", padding: "14px 6px 0", borderTop: "1px solid #eae5de" },

  main: { flex: 1, overflowY: "auto", maxHeight: "100vh" },
  page: { padding: "36px 44px 56px", maxWidth: 980, animation: "fadeIn .3s ease" },

  hero: { marginBottom: 28 },
  heroTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 700, color: "#2a2420", margin: 0, lineHeight: 1.05 },
  heroSub: { color: "#b0a494", fontSize: 16, marginTop: 10, lineHeight: 1.5 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 },
  statCard: { borderRadius: 16, padding: "24px 22px", border: "1px solid #eae5de" },
  statVal: { fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: "#2a2420", lineHeight: 1 },
  statLbl: { fontSize: 11, marginTop: 8, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 },

  secTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: "#2a2420", margin: "0 0 16px" },

  upList: { display: "flex", flexDirection: "column", gap: 8 },
  upCard: { display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", background: "#fff", border: "1px solid #eae5de", borderRadius: 14, cursor: "pointer", transition: "box-shadow .2s" },
  upDateBox: { textAlign: "center", minWidth: 50 },
  upDay: { fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: "#c17f4e", lineHeight: 1 },
  upMon: { fontSize: 10, color: "#b0a494", letterSpacing: "1px", marginTop: 3 },
  upName: { fontWeight: 600, fontSize: 16, color: "#2a2420" },
  upMeta: { fontSize: 13, color: "#b0a494", marginTop: 3 },
  upPrice: { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#5a8a6a" },

  iqGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  iqCard: { background: "#fff", border: "1px solid #eae5de", borderRadius: 14, padding: "20px 22px", cursor: "pointer" },
  iqType: { fontSize: 10, color: "#c17f4e", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 10, fontWeight: 700 },
  iqName: { fontWeight: 600, fontSize: 16, color: "#2a2420", marginBottom: 4 },
  iqDate: { fontSize: 12, color: "#ccc4b8" },
  iqShoot: { fontSize: 12, color: "#4a8a9a", marginTop: 6, fontWeight: 600 },

  pgTitle: { fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#2a2420", margin: 0 },
  pgSub: { fontSize: 14, color: "#b0a494", marginTop: 6, marginBottom: 28 },

  pipeWrap: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 },
  pipeCol: { minHeight: 200 },
  pipeHead: { display: "flex", alignItems: "center", gap: 8, paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid #eae5de" },
  pipeDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  pipeLbl: { fontSize: 10, fontWeight: 700, color: "#7a7068", textTransform: "uppercase", letterSpacing: "0.6px" },
  pipeCnt: { fontSize: 10, color: "#b0a494", background: "#f5f0ea", borderRadius: 8, padding: "2px 7px", marginLeft: "auto" },
  pipeCard: { background: "#fff", border: "1px solid #eae5de", borderRadius: 12, padding: "14px", marginBottom: 8, cursor: "pointer" },
  pcName: { fontWeight: 600, fontSize: 13, color: "#2a2420", marginBottom: 3 },
  pcType: { fontSize: 11, color: "#b0a494" },
  pcDate: { fontSize: 11, color: "#4a8a9a", marginTop: 4, fontWeight: 500 },
  pcPrice: { fontSize: 15, color: "#c17f4e", fontWeight: 600, marginTop: 6, fontFamily: "'Cormorant Garamond', serif" },

  calNav: { display: "flex", alignItems: "center", gap: 20, marginBottom: 20 },
  calArrow: { background: "#fff", border: "1px solid #eae5de", borderRadius: 10, color: "#7a7068", fontSize: 20, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" },
  calMonthLbl: { fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: "#2a2420" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#eae5de", borderRadius: 16, overflow: "hidden", border: "1px solid #eae5de" },
  calDH: { background: "#f5f0ea", padding: "12px 0", textAlign: "center", fontSize: 11, color: "#9a8e82", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 },
  calCell: { background: "#fff", minHeight: 100, padding: "10px 12px" },
  calToday: { background: "#fdf8f3" },
  calNum: { fontSize: 14, color: "#b0a494", marginBottom: 4, fontWeight: 500 },
  calEvt: { fontSize: 11, padding: "3px 8px", borderLeft: "3px solid", marginBottom: 3, cursor: "pointer", borderRadius: "0 6px 6px 0", fontWeight: 600 },

  pageHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  bList: { display: "flex", flexDirection: "column", gap: 6 },
  bRow: { display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", background: "#fff", border: "1px solid #eae5de", borderRadius: 14, cursor: "pointer" },
  bDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  bName: { fontWeight: 600, fontSize: 15, color: "#2a2420" },
  bMeta: { fontSize: 13, color: "#b0a494", marginTop: 3 },
  bRight: { textAlign: "right", minWidth: 120 },
  bPrice: { fontSize: 18, fontWeight: 700, color: "#c17f4e", fontFamily: "'Cormorant Garamond', serif" },
  bStage: { fontSize: 10, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 3, fontWeight: 700 },
  bCk: { fontSize: 12, color: "#ccc4b8", minWidth: 40, textAlign: "center" },

  formBox: { background: "#fff", border: "1px solid #eae5de", borderRadius: 18, padding: 32 },
  fg: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  lbl: { display: "block", fontSize: 10, fontWeight: 700, color: "#9a8e82", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 },
  inp: { width: "100%", boxSizing: "border-box", padding: "12px 16px", fontSize: 14, border: "1px solid #e0dbd4", borderRadius: 10, background: "#faf8f5", color: "#2a2420", fontFamily: "'Karla', sans-serif" },
  primaryBtn: { padding: "12px 26px", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 10, background: "#c17f4e", color: "#fff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(193,127,78,0.18)" },
  ghostBtn: { padding: "12px 26px", fontSize: 13, fontWeight: 600, border: "1px solid #e0dbd4", borderRadius: 10, background: "transparent", color: "#9a8e82", cursor: "pointer", fontFamily: "inherit" },
  backLink: { background: "none", border: "none", color: "#b0a494", fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 24, fontFamily: "inherit", fontWeight: 500 },

  dHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  dType: { fontSize: 10, color: "#c17f4e", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8, fontWeight: 700 },
  dClientName: { fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: "#2a2420", margin: 0 },
  dContact: { fontSize: 14, color: "#b0a494", marginTop: 8 },
  dPrice: { fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#c17f4e" },

  stageRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 },
  stageChip: { padding: "8px 16px", fontSize: 11, fontWeight: 700, border: "1px solid #e0dbd4", borderRadius: 20, cursor: "pointer", fontFamily: "inherit", textTransform: "uppercase", letterSpacing: "0.5px", transition: "all .15s", background: "#fff", color: "#b0a494" },

  dtabs: { display: "flex", gap: 0, borderBottom: "1px solid #eae5de", marginBottom: 28 },
  dtab: { padding: "14px 24px", border: "none", background: "none", color: "#b0a494", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", borderBottom: "2px solid transparent", marginBottom: -1, transition: "all .15s" },
  dtabA: { color: "#c17f4e", borderBottomColor: "#c17f4e", fontWeight: 600 },

  dSection: { animation: "fadeIn .25s ease" },
  dGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 },
  dFieldBox: { background: "#fdf8f3", border: "1px solid #eae5de", borderRadius: 12, padding: "16px 18px" },
  dFieldL: { fontSize: 10, color: "#b0a494", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5, fontWeight: 700 },
  dFieldV: { fontSize: 17, color: "#2a2420", fontWeight: 500 },
  dNotes: { background: "#fff", border: "1px solid #eae5de", borderRadius: 14, padding: "18px 22px", fontSize: 15, color: "#5a5450", lineHeight: 1.7 },
  editRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },

  ckProg: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  ckBar: { flex: 1, height: 7, background: "#eae5de", borderRadius: 4, overflow: "hidden" },
  ckFill: { height: "100%", background: "linear-gradient(90deg, #c17f4e, #d4a24e)", borderRadius: 4, transition: "width .3s" },
  ckLbl: { fontSize: 14, color: "#9a8e82", minWidth: 50, fontWeight: 600 },
  ckList: { display: "flex", flexDirection: "column", gap: 4 },
  ckItem: { display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "#fff", border: "1px solid #eae5de", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "background .1s" },
  ckBox: { width: 26, height: 26, borderRadius: 8, border: "2px solid #ddd5ca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" },
  ckBoxDone: { background: "#c17f4e", borderColor: "#c17f4e" },
  ckText: { fontSize: 15, color: "#7a7068" },
  ckTextDone: { color: "#c17f4e", fontWeight: 600 },

  commBox: { background: "#fff", border: "1px solid #eae5de", borderRadius: 16, padding: 22, marginBottom: 20 },
  commCard: { background: "#fff", border: "1px solid #eae5de", borderRadius: 14, padding: "18px 22px", marginBottom: 8 },
  commDate: { fontSize: 12, color: "#ccc4b8", marginBottom: 8, fontWeight: 600 },
  commText: { fontSize: 15, color: "#5a5450", lineHeight: 1.7, whiteSpace: "pre-wrap" },

  empty: { textAlign: "center", color: "#ccc4b8", fontSize: 15, padding: "44px 0" },
};
