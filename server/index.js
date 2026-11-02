import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Mailjet from "node-mailjet";
import { randomUUID } from "node:crypto";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

let queue = [];
let nowServing = null;
let nextNumber = 24;

const mailjetReady = Boolean(
  process.env.MJ_APIKEY_PUBLIC &&
  process.env.MJ_APIKEY_PRIVATE &&
  process.env.MAIL_FROM
);

const mailjet = mailjetReady
  ? new Mailjet({
      apiKey: process.env.MJ_APIKEY_PUBLIC,
      apiSecret: process.env.MJ_APIKEY_PRIVATE
    })
  : null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

async function sendEmail({ to, name, subject, html }) {
  if (!mailjet) return { sent: false, reason: "Mailjet is not configured" };
  const response = await mailjet.post("send", { version: "v3.1" }).request({
    Messages: [{
      From: {
        Email: process.env.MAIL_FROM,
        Name: process.env.MAIL_FROM_NAME || "QUEUELESS"
      },
      To: [{ Email: to, Name: name || "Guest" }],
      Subject: subject,
      HTMLPart: html
    }]
  });
  const message = response.body?.Messages?.[0];
  if (message?.Status !== "success") {
    throw new Error(message?.Errors?.[0]?.ErrorMessage || "Mailjet did not accept the message");
  }
  return { sent: true, messageId: message.To?.[0]?.MessageID || null };
}

function emailShell(eyebrow, title, body, ticket) {
  return `
  <div style="margin:0;background:#f5f0e8;padding:36px 14px;font-family:Arial,sans-serif;color:#302a25">
    <div style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #e8dfd3">
      <div style="padding:25px 30px;border-bottom:1px solid #eee6dc">
        <div style="font-family:Georgia,serif;font-size:25px;letter-spacing:2px">QUEUELESS<span style="color:#bd765f">.</span></div>
        <div style="font-size:10px;letter-spacing:2px;color:#998c7e;margin-top:6px">YOUR TIME, RESPECTED.</div>
      </div>
      <div style="padding:34px 30px">
        <div style="font-size:10px;letter-spacing:2px;color:#b36f59;font-weight:bold">${eyebrow}</div>
        <h1 style="font-family:Georgia,serif;font-size:34px;font-weight:normal;line-height:1.15;margin:14px 0">${title}</h1>
        <p style="font-size:14px;line-height:1.8;color:#71665c">${body}</p>
        <div style="margin:26px 0;padding:20px;background:#f5f0e8;text-align:center">
          <div style="font-size:10px;letter-spacing:2px;color:#8c7d6f">YOUR QUEUE NUMBER</div>
          <div style="font-family:Georgia,serif;font-size:48px;color:#a9614d;margin:7px 0">${ticket}</div>
        </div>
        <p style="font-size:12px;line-height:1.7;color:#8b8075">You can keep this email handy for your visit. We’ll let you know when it’s your turn.</p>
      </div>
      <div style="padding:18px 30px;background:#302a25;color:#e9dfd3;font-size:10px;letter-spacing:1px">LESS WAITING. MORE LIVING. &nbsp; · &nbsp; QUEUELESS</div>
    </div>
  </div>`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "QUEUELESS API", mailjetConfigured: mailjetReady });
});

app.get("/api/queue", (_req, res) => {
  res.json({
    queue,
    nowServing,
    waitingCount: queue.filter((entry) => entry.status === "waiting").length,
    mailjetConfigured: mailjetReady
  });
});

app.post("/api/queue", async (req, res) => {
  try {
    const { name, email, service } = req.body || {};
    if (!name?.trim() || !email?.trim() || !service?.trim()) {
      return res.status(400).json({ error: "Please provide your name, email and service." });
    }
    const ticket = `Q${String(nextNumber++).padStart(2, "0")}`;
    const entry = {
      id: randomUUID(),
      name: name.trim(),
      email: email.trim(),
      service: service.trim(),
      ticket,
      status: "waiting",
      joinedAt: new Date().toISOString()
    };
    queue.push(entry);
    let emailResult = { sent: false, reason: "Mailjet is not configured" };
    try {
      emailResult = await sendEmail({
        to: entry.email,
        name: entry.name,
        subject: `You're in the queue — ${ticket}`,
        html: emailShell(
          "QUEUE CONFIRMED",
          `You're on the list, ${escapeHtml(entry.name.split(" ")[0])}.`,
          `Your place for <strong>${escapeHtml(entry.service)}</strong> is secured. There are ${queue.filter((item) => item.status === "waiting").length} guest(s) currently waiting, including you.`,
          ticket
        )
      });
    } catch (emailError) {
      console.error("Confirmation email failed:", emailError.message);
      emailResult = { sent: false, reason: emailError.message };
    }
    res.status(201).json({ entry, email: emailResult, queue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong while joining the queue." });
  }
});

app.post("/api/queue/next", async (_req, res) => {
  const next = queue.find((entry) => entry.status === "waiting");
  if (!next) return res.status(404).json({ error: "There are no guests waiting right now." });

  next.status = "called";
  next.calledAt = new Date().toISOString();
  nowServing = next;

  let emailResult = { sent: false, reason: "Mailjet is not configured" };
  try {
    emailResult = await sendEmail({
      to: next.email,
      name: next.name,
      subject: `It's your turn — ${next.ticket}`,
      html: emailShell(
        "PLEASE MAKE YOUR WAY OVER",
        `We’re ready for you, ${escapeHtml(next.name.split(" ")[0])}.`,
        `Your number <strong>${next.ticket}</strong> has been called for <strong>${escapeHtml(next.service)}</strong>. Please make your way to the counter now.`,
        next.ticket
      )
    });
  } catch (emailError) {
    console.error("Turn notification failed:", emailError.message);
    emailResult = { sent: false, reason: emailError.message };
  }

  res.json({ nowServing, email: emailResult, queue });
});

app.post("/api/queue/reset", (_req, res) => {
  queue = [];
  nowServing = null;
  nextNumber = 24;
  res.json({ ok: true, queue, nowServing });
});

app.listen(PORT, () => {
  console.log(`QUEUELESS API running at http://localhost:${PORT}`);
  console.log(`Mailjet ${mailjetReady ? "configured" : "not configured — demo mode"}`);
});
