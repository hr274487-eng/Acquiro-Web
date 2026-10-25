/**
 * ACQUIRO - Supabase Database Configuration
 * ============================================================================
 * Configure your Supabase project credentials below to receive incoming orders
 * and customer inquiries directly into your cloud database in real time.
 *
 * HOW TO OBTAIN THESE CREDENTIALS:
 * 1. Log in to https://supabase.com and open your Acquiro project.
 * 2. Go to "Project Settings" (gear icon) -> "API".
 * 3. Copy "Project URL" into `url` below.
 * 4. Copy "anon" / "public" Project API key into `anonKey` below.
 * 5. Run the provided `supabase-schema.sql` script in the Supabase SQL Editor.
 *
 * Once filled, all orders submitted on the website will instantly save to your
 * database and alert your upcoming Android Mobile Manager App!
 * ============================================================================
 */

window.ACQUIRO_CONFIG = window.ACQUIRO_CONFIG || {};

window.ACQUIRO_CONFIG.supabase = {
  // Your Supabase Project URL (e.g., "https://abcdefghijklmno.supabase.co")
  url: '',

  // Your Supabase Anon/Public API Key (starts with "eyJ...")
  anonKey: '',

  // The database table designated for orders and inquiries
  ordersTable: 'orders'
};
