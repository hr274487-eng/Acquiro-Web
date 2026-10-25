# Supabase Database Setup Guide for Order Reception & Android Manager App

This guide walks you step-by-step through setting up your **Supabase** database to receive orders and customer inquiries directly from your Acquiro website and connect them with your upcoming Android Mobile Manager App.

---

## 1. Create a Free Supabase Project

1. Visit [supabase.com](https://supabase.com) and click **Start your project** (or log in).
2. Click **New Project** and select your organization.
3. Fill in the project details:
   * **Name**: `Acquiro-Orders` (or any name you prefer)
   * **Database Password**: Choose a strong password and save it in a safe place.
   * **Region**: Choose the region closest to you or your target customers.
4. Click **Create new project**. Supabase will take 1–2 minutes to provision your database.

---

## 2. Execute the Database Schema Script

We have provided a complete SQL script [`supabase-schema.sql`](./supabase-schema.sql) in this repository that creates the `orders` table, configures Row Level Security (RLS), sets up indexing, and enables Realtime notifications.

1. In your Supabase project dashboard, click on **SQL Editor** in the left navigation sidebar.
2. Click **New query** (or the green `+` icon).
3. Open [`supabase-schema.sql`](./supabase-schema.sql) from this repository, copy its entire contents, and paste it into the Supabase SQL editor.
4. Click the green **Run** button in the lower right.
5. You should see a success message: `Success. No rows returned` (or a result table showing the sample seed order `ACQ-DEMO-001`).

---

## 3. Retrieve Your API Credentials

To allow the website and the upcoming Android app to talk to your database, you need two credentials:

1. In your Supabase dashboard, click the **Settings** icon (gear icon at the bottom of the left sidebar).
2. In the Settings sub-menu, click **API** (under Configuration).
3. Under **Project URL**, copy the URL (e.g., `https://xyzcompany.supabase.co`).
4. Under **Project API keys**, find the key named `anon` / `public` and copy it (starts with `eyJ...`).

> [!IMPORTANT]
> Use the **anon / public** key for the website. Never expose the `service_role` (secret) key on the frontend website.

---

## 4. Connect the Website to Supabase

1. Open the file [`js/supabase-config.js`](./js/supabase-config.js) in this project.
2. Paste your credentials into the configuration object:

```javascript
window.ACQUIRO_CONFIG = window.ACQUIRO_CONFIG || {};

window.ACQUIRO_CONFIG.supabase = {
  // Paste your Project URL here
  url: 'https://xyzcompany.supabase.co',

  // Paste your anon public key here
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

  // Keep table name as 'orders'
  ordersTable: 'orders'
};
```

3. Save the file.
4. Open the Contact page (`/contact`) in your browser and submit a test order. You will see an immediate green confirmation badge displaying your unique order reference (e.g., `ACQ-20261025-XXXX`).
5. Go back to Supabase $\rightarrow$ **Table Editor** $\rightarrow$ `orders` to view your incoming order logged in real time!

---

## 5. How This Connects to the Upcoming Android Mobile Manager App

The schema in `supabase-schema.sql` is specially architected for your upcoming Android Manager App:

* **Realtime Publication**: Line `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;` was executed. This enables WebSocket listening.
* **Instant Audio Alerts**: When a client submits an order on the website or through your Acquiro AI phone receptionist, Supabase broadcasts an `INSERT` event. The Android app receives this stream instantly and triggers your chosen order notification chime.
* **Status Pipeline**: Orders start with status `new`. In the mobile app, you can tap to change the status to `accepted`, `in_progress`, or `completed`.
* **Manager Notes**: The `manager_notes` column allows you to type private internal notes directly from your phone.
