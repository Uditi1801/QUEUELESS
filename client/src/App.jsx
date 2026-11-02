import { useEffect, useMemo, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, Bell, Check, CheckCircle2, Clock3, Coffee,
  Heart, Menu, Scissors, Sparkles, Stethoscope, Users, X, Mail, RotateCcw
} from "lucide-react";

const services = [
  { id: "coffee", name: "Coffee & catch-ups", place: "The Daily Pour", detail: "Your favourite table, minus the line.", wait: "12–18 min", icon: Coffee, color: "sage" },
  { id: "beauty", name: "A little self-care", place: "Studio Serein", detail: "A moment to feel like yourself.", wait: "18–25 min", icon: Scissors, color: "rose" },
  { id: "wellness", name: "Care & consultation", place: "The Wellness Room", detail: "Thoughtful care, on your time.", wait: "8–12 min", icon: Stethoscope, color: "sand" }
];

function Header({ admin = false }) {
  const location = useLocation();
  return <header className="header">
    <Link to="/" className="brand">QUEUELESS<span>.</span><small>YOUR TIME, RESPECTED.</small></Link>
    <nav>
      <a href="/#how-it-works">How it works</a>
      <a href="/#the-feeling">The feeling</a>
      <Link className={admin ? "nav-pill active" : "nav-pill"} to={admin ? "/" : "/admin"}>{admin ? "Customer view" : "Staff view"} <ArrowUpRight size={14}/></Link>
    </nav>
  </header>;
}

function Footer() {
  return <footer className="footer"><div className="brand">QUEUELESS<span>.</span></div><p>Less waiting. More living.</p><span>MADE FOR YOUR TIME · 2026</span></footer>;
}

function CustomerPage() {
  const [selected, setSelected] = useState(services[0]);
  const [form, setForm] = useState({ name: "", email: "" });
  const [ticket, setTicket] = useState(null);
  const [emailState, setEmailState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [queueData, setQueueData] = useState({ waitingCount: 3 });

  useEffect(() => { fetch("/api/queue").then(r => r.json()).then(setQueueData).catch(() => {}); }, []);

  async function joinQueue(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const response = await fetch("/api/queue", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, service: selected.place })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join the queue.");
      setTicket(data.entry); setEmailState(data.email); setQueueData({ waitingCount: data.queue.filter(x => x.status === "waiting").length });
    } catch (err) { setError(err.message || "Could not connect to the server. Is it running?"); }
    finally { setLoading(false); }
  }

  return <><Header/>
    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot"/> A BETTER WAY TO WAIT</div>
          <h1>Your time is<br/><em>too lovely</em> to waste.</h1>
          <p className="hero-text">Join the queue from wherever you are. We’ll let you know when it’s your turn — so you can get back to living.</p>
          <a className="text-link" href="#join">Find your place <ArrowRight size={16}/></a>
          <div className="hero-note"><div className="avatar-stack"><i>J</i><i>M</i><i>A</i><i>+</i></div><span><b>1,200+</b> people reclaimed their time</span></div>
        </div>
        <div className="hero-art">
          <div className="photo-frame">
            <img src="https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1100&q=85" alt="Sunlit, calm café interior"/>
            <div className="photo-label"><span>01 / A SLOWER KIND OF DAY</span><b>Take your time.</b></div>
          </div>
          <div className="floating-note"><span className="note-icon"><Clock3 size={17}/></span><div><b>Wait on your terms</b><small>Not in a crowded line.</small></div></div>
          <div className="scribble">your day, uninterrupted ↗</div>
        </div>
      </section>

      <section className="trust-strip"><span>THOUGHTFULLY DESIGNED FOR EVERYDAY PLACES</span><div><b>CAFÉS</b><i>✳</i><b>WELLNESS</b><i>✳</i><b>BEAUTY</b><i>✳</i><b>EVERYDAY ERRANDS</b></div></section>

      <section className="join-section" id="join">
        <div className="section-intro"><div className="eyebrow">THE GOOD PART <span className="eyebrow-dot"/></div><h2>Make room for<br/><em>the moments.</em></h2><p>Choose where you’re headed. We’ll take care of the waiting.</p></div>
        <div className="join-panel">
          {ticket ? <div className="success-panel">
            <div className="success-icon"><Check size={26}/></div><div className="eyebrow">YOU’RE ON THE LIST</div>
            <h2>Lovely. You’re in.</h2><p className="muted">Your place at {ticket.service} is secured.</p>
            <div className="ticket-card"><span>YOUR QUEUE NUMBER</span><strong>{ticket.ticket}</strong><small>{ticket.name} · {ticket.email}</small></div>
            <div className="status-line"><span className="live-dot"/> You’re in the queue <b>{selected.wait}</b></div>
            <p className="email-note">{emailState?.sent ? "Confirmation email sent — check your inbox." : "Queue saved. Add Mailjet credentials to enable email notifications."}</p>
            <button className="button button-outline" onClick={() => { setTicket(null); setForm({name:"",email:""}); }}>Join another queue <ArrowRight size={16}/></button>
          </div> : <>
            <div className="panel-heading"><div><span className="eyebrow">01 — PICK YOUR PLACE</span><h3>Where to next?</h3></div><span className="step-count">01 <i>/</i> 02</span></div>
            <div className="service-list">{services.map(s => { const Icon = s.icon; return <button key={s.id} className={`service-option ${selected.id === s.id ? "selected" : ""}`} onClick={() => setSelected(s)}>
              <span className={`service-icon ${s.color}`}><Icon size={20}/></span><span className="service-copy"><b>{s.name}</b><small>{s.place} · {s.detail}</small></span><span className="service-wait">{s.wait}<small>est. wait</small></span><span className="radio-dot">{selected.id === s.id && <i/>}</span>
            </button>; })}</div>
            <div className="form-divider"/>
            <form onSubmit={joinQueue}>
              <div className="panel-heading compact"><div><span className="eyebrow">02 — SAVE YOUR SPOT</span><h3>And who are we saving it for?</h3></div></div>
              <div className="field-row"><label>Your name<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Alex Morgan"/></label><label>Email address<input required type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label></div>
              {error && <p className="error-text">{error}</p>}
              <button className="button button-dark full" disabled={loading}>{loading ? "Saving your place…" : "Join the queue"} <ArrowRight size={17}/></button>
              <p className="privacy-note"><Heart size={12}/> Your details are only used for queue updates. Promise.</p>
            </form>
          </>}
        </div>
      </section>

      <section className="how-section" id="how-it-works"><div className="eyebrow">SIMPLE AS ONE, TWO, THREE</div><h2>Waiting, <em>reimagined.</em></h2>
        <div className="steps"><article><span>01</span><div className="step-icon"><Users/></div><h3>Save your spot</h3><p>Choose a place, enter your details and get your personal queue number.</p></article><article><span>02</span><div className="step-icon"><Coffee/></div><h3>Go live your life</h3><p>Grab a coffee, browse a little, or simply enjoy being somewhere else.</p></article><article><span>03</span><div className="step-icon"><Bell/></div><h3>We’ll call you</h3><p>A timely email lets you know when it’s your turn. No guesswork required.</p></article></div>
      </section>

      <section className="quote-section" id="the-feeling"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85" alt="Coffee being prepared"/><div><span className="eyebrow">A LITTLE MORE LIFE</span><h2>“The best part of your day shouldn’t be spent <em>standing in line.</em>”</h2><p>QUEUELESS · YOUR TIME, RESPECTED.</p></div></section>
    </main><Footer/>
  </>;
}

function AdminPage() {
  const [data, setData] = useState({ queue: [], nowServing: null, waitingCount: 0, mailjetConfigured: false });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function refresh() {
    try { const r = await fetch("/api/queue"); if (r.ok) setData(await r.json()); } catch {}
  }
  useEffect(() => { refresh(); const id = setInterval(refresh, 3000); return () => clearInterval(id); }, []);
  const waiting = useMemo(() => data.queue.filter(x => x.status === "waiting"), [data.queue]);
  async function callNext() {
    setLoading(true); setNotice(""); setError("");
    try {
      const r = await fetch("/api/queue/next", { method: "POST" }); const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setNotice(`${result.nowServing.ticket} · ${result.nowServing.name} has been called. ${result.email.sent ? "Turn notification email sent." : "Email not sent: " + (result.email.reason || "not configured")}`);
      await refresh();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  async function resetQueue() {
    if (!confirm("Reset the demo queue? This clears all current entries.")) return;
    await fetch("/api/queue/reset", { method: "POST" }); setNotice("Demo queue has been reset."); refresh();
  }
  return <><Header admin/><main className="admin-main">
    <div className="admin-top"><div><div className="eyebrow"><span className="eyebrow-dot"/> STAFF WORKSPACE</div><h1>Good things<br/><em>move smoothly.</em></h1><p>Keep the day flowing. One guest at a time.</p></div><div className="admin-date"><span>QUEUE STATUS</span><b><i className="live-dot"/> LIVE</b><small>Auto-refreshes every 3 seconds</small></div></div>
    <div className="stats-grid"><div className="stat-card"><span>WAITING NOW</span><strong>{waiting.length.toString().padStart(2,"0")}</strong><small>Guests in line</small></div><div className="stat-card"><span>NOW SERVING</span><strong>{data.nowServing?.ticket || "—"}</strong><small>{data.nowServing?.name || "No guest called yet"}</small></div><div className="stat-card"><span>EMAIL NOTIFICATIONS</span><strong className="stat-word">{data.mailjetConfigured ? "ACTIVE" : "SETUP"}</strong><small>{data.mailjetConfigured ? "Mailjet connected" : "Add Mailjet credentials"}</small></div></div>
    <div className="admin-content"><section className="queue-board"><div className="board-head"><div><span className="eyebrow">THE LINE-UP</span><h2>Today’s guests</h2></div><button className="icon-button" onClick={refresh} aria-label="Refresh"><RotateCcw size={16}/></button></div>
      {data.queue.length === 0 ? <div className="empty-state"><Users size={30}/><h3>It’s quiet in here.</h3><p>New guests will appear as they join the queue.</p><Link to="/" className="text-link">Open customer view <ArrowUpRight size={15}/></Link></div> :
      <div className="guest-list">{data.queue.map((guest, i) => <div className={`guest-row ${guest.status === "called" ? "guest-called" : ""}`} key={guest.id}><span className="guest-number">{String(i+1).padStart(2,"0")}</span><div className="guest-avatar">{guest.name.trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase()}</div><div className="guest-info"><b>{guest.name}</b><small>{guest.service} · {guest.email}</small></div><strong className="guest-ticket">{guest.ticket}</strong><span className={`status-chip ${guest.status}`}>{guest.status === "called" ? "Called" : "Waiting"}</span></div>)}</div>}
    </section>
    <aside className="control-card"><span className="eyebrow">QUEUE CONTROL</span><h2>Keep things<br/><em>moving.</em></h2><p>Call the next guest when you’re ready. We’ll update their status and send a personal email notification.</p><div className="next-preview"><span>NEXT IN LINE</span><b>{waiting[0]?.name || "All caught up"}</b><small>{waiting[0] ? `${waiting[0].ticket} · ${waiting[0].service}` : "No guests waiting"}</small></div><button className="button button-dark full" disabled={!waiting.length || loading} onClick={callNext}>{loading ? "Calling…" : "Call next guest"} <ArrowRight size={17}/></button><button className="reset-button" onClick={resetQueue}>Reset demo queue</button>{notice && <p className="notice-text"><CheckCircle2 size={14}/>{notice}</p>}{error && <p className="error-text">{error}</p>}</aside></div>
    <div className="admin-footnote"><span><i className="live-dot"/> LIVE QUEUE</span><span>DEMO MODE · DATA RESETS WHEN SERVER RESTARTS</span></div>
  </main><Footer/></>;
}

export default function App() {
  return <Routes><Route path="/" element={<CustomerPage/>}/><Route path="/admin" element={<AdminPage/>}/></Routes>;
}
