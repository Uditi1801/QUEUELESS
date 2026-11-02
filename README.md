# QUEUELESS

A polished virtual queue demo built with React + Vite, Express, and Mailjet transactional email.

## What it demonstrates
1. A customer chooses a service and joins a virtual queue.
2. The backend creates a queue ticket and sends a confirmation email through Mailjet.
3. The admin dashboard can call the next waiting customer.
4. The backend updates queue state and sends that customer a turn notification email.

The demo uses in-memory data. Queue entries reset whenever the backend restarts.

## Requirements
- Node.js 20+
- npm
- Mailjet API key + secret (optional for local UI testing; required for real emails)

## Setup
From this folder:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

Copy `server/.env.example` to `server/.env`, then add your Mailjet credentials:

```env
MJ_APIKEY_PUBLIC=your_mailjet_api_key
MJ_APIKEY_PRIVATE=your_mailjet_secret_key
MAIL_FROM=verified-sender@example.com
MAIL_FROM_NAME=QUEUELESS
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
```

Use a sender address that is verified in your Mailjet account. Do not share your API keys or commit `.env`.

## Run
```bash
npm run dev
```
- Customer experience: http://localhost:5173
- Admin dashboard: click **Staff view** in the top navigation, or open http://localhost:5173/admin
- API health: http://localhost:4000/api/health

If Mailjet credentials are missing, the queue still works in demo mode and the UI will say that email was not configured. With valid credentials, the server sends real transactional emails.

## Demo flow
1. Open the customer page and join with your name and email.
2. Show the confirmation state and queue number.
3. Open Staff view.
4. Click **Call next guest**.
5. The next customer moves to "Your turn" and receives an email if Mailjet is configured.

## Important
This is a presentation/demo prototype, not a production queue platform. It has no database, login, multi-location support, or persistent queue storage.
