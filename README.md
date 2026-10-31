# Acquiro — AI Voice Agents, Automation & Web Development

Official multi-page business website for **Acquiro**, an engineering company that designs, integrates, tests, and deploys custom AI voice agents, business workflow automations, and modern web applications.

Inspired by modern, colorful, gradient-forward aesthetics ([Beam.ai](https://beam.ai/)), built with lightweight vanilla web standards for performance, accessibility, and zero-overhead maintenance.

---

## 🌟 Core Services

1. **AI Voice Agents & Receptionists** (Primary Service):
   * 24/7 natural conversational phone receptionists.
   * Google Calendar & Calendly appointment booking.
   * Lead capture, FAQ knowledge bases, and smart human call transfers.
   * Configurable integrations with Retell AI, Vapi, and Telnyx.

2. **Business Workflow Automation** (Supporting Service):
   * Lead capture, qualification, and automated CRM updates (HubSpot, GoHighLevel).
   * Google Sheets and Airtable real-time synchronization.
   * Custom multi-step pipelines via n8n, Make, and Zapier.

3. **Professional Business Websites** (Secondary Service):
   * High-converting, responsive multi-page websites and landing pages.
   * Clean semantic HTML5, CSS custom properties, and accessible components.
   * Direct integration with booking widgets, contact forms, and database backends.

---

## 🚀 Pages & Multi-Page Routing

* **Home (`/`)**: Hero with interactive live AI call simulator, real 16:9 AI receptionist video walkthrough, three core service pillars, operational sequence flow, ecosystem integrations, and client engagement process.
* **AI Agents (`/ai-agents`)**: Detailed voice architecture, conversation dialogue breakdown, video walkthrough, and service scopes.
* **Automation (`/automation`)**: 5-node interactive workflow diagram, core automation areas, and tailored scopes.
* **Web Development (`/web-development`)**: Responsive desktop & mobile viewport mockup showcase, engineering features, and 5-stage plan-to-launch framework.
* **About (`/about`)**: Clear business positioning, practical operational problem solving, engineering principles, and verified contact channels.
* **Contact (`/contact`)**: Instant direct contact (Email & Phone with 1-click clipboard copy) and database-connected order/enquiry reception form.

---

## 🗄️ Database & Order Reception (Supabase)

This website is equipped with direct database order reception powered by **Supabase**. When a client submits an inquiry or order on the contact page:
1. An official tracking reference code (`ACQ-YYYYMMDD-XXXX`) is automatically generated.
2. The order is securely dispatched to your Supabase `orders` table via REST API using Row Level Security (RLS).
3. The order is stored with status `new`, which instantly publishes a real-time event to trigger audio chimes and notifications on your upcoming **Android Mobile Manager App**.

### Quick Database Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the Supabase **SQL Editor** and execute [`supabase-schema.sql`](./supabase-schema.sql).
3. Open [`js/supabase-config.js`](./js/supabase-config.js) and paste your **Project URL** and **Anon Key**.
4. Full step-by-step instructions are available in [`DATABASE_SETUP_GUIDE.md`](./DATABASE_SETUP_GUIDE.md).

---

## 📱 Upcoming Android Mobile Manager App

The database schema includes Realtime publications specifically configured for the companion Android Order Manager App. When orders are received on the website or via an AI phone receptionist, the mobile app will:
* Ring an instant sound/vibration alert.
* Display the order in the `New Orders` queue.
* Allow managers to accept with an estimated completion time, call the client with one tap, or update order statuses.

---

## 🛠️ Deployment

### Deploying to Vercel
The repository includes a ready-to-use [`vercel.json`](./vercel.json) configured with `"cleanUrls": true` and asset caching:
```bash
# Deploy with Vercel CLI
vercel --prod
```

### Deploying to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings** -> **Pages**.
3. Under **Branch**, select `main` and root (`/`), then click **Save**.

---

## 📞 Verified Business Contact

* **Email**: acquiro.agency@outlook.com
* **Phone**: +1 214-286-5081 (`tel:+12142865081`)
