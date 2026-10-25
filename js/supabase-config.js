/**
 * ACQUIRO - Supabase Database Configuration
 * ============================================================================
 * Configure your Supabase project credentials below to receive incoming orders
 * and customer inquiries directly into your cloud database in real time.
 * ============================================================================
 */

window.ACQUIRO_CONFIG = window.ACQUIRO_CONFIG || {};

window.ACQUIRO_CONFIG.supabase = {
  // Supabase Project Base URL
  url: 'https://tpvqnghvvlsqowpklkav.supabase.co',

  // Supabase Anon / Public API Key
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnFuZ2h2dmxzcW93cGtsa2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MTg4MjcsImV4cCI6MjEwODQ5NDgyN30.fCENMp7E7otno_XLfx-eqaAB7tKRT_IhTnd2Bs4FsMM',

  // The database table designated for orders and inquiries
  ordersTable: 'orders'
};
