-- ============================================================================
-- ACQUIRO ORDER & RECEPTION DATABASE SCHEMA (SUPABASE)
-- ============================================================================
-- This script sets up the complete database schema for receiving orders,
-- inquiries, and customer bookings from the Acquiro website, AI voice receptionists,
-- and the upcoming Android Mobile Manager App.
--
-- Instructions:
-- 1. Log in to your Supabase Dashboard: https://supabase.com
-- 2. Open your project, click on "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste the contents of this file, and click "Run".
-- ============================================================================

-- 1. Create custom enum types for order status and priority
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('new', 'accepted', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_priority AS ENUM ('normal', 'urgent', 'scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the primary orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,                     -- Human-friendly code (e.g. ACQ-20261025-9481)
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    company_name TEXT,
    service_type TEXT NOT NULL,                        -- e.g. 'AI Voice Agents', 'Workflow Automation', 'Web Development'
    order_details TEXT NOT NULL,                       -- Scope, inquiry details, requirements
    status order_status NOT NULL DEFAULT 'new',        -- 'new' alerts the Android Manager App
    priority order_priority NOT NULL DEFAULT 'normal',
    source TEXT NOT NULL DEFAULT 'website',            -- 'website', 'ai_receptionist', 'manual'
    manager_notes TEXT,                                -- Internal notes added via mobile app
    estimated_delivery TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,                -- Browser/device info, webhook traces
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create helpful indexes for fast lookup and dashboard filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_service_type ON public.orders(service_type);

-- 4. Automatically update 'updated_at' timestamp on any row update
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_orders_set_updated_at ON public.orders;
CREATE TRIGGER tr_orders_set_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 5. Enable Row Level Security (RLS) for data protection
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy A: Allow public visitors / website forms to insert new orders (Anon role)
DROP POLICY IF EXISTS "Allow anonymous orders intake" ON public.orders;
CREATE POLICY "Allow anonymous orders intake"
    ON public.orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy B: Allow authenticated managers (Mobile App users) to view all orders
DROP POLICY IF EXISTS "Allow managers to view orders" ON public.orders;
CREATE POLICY "Allow managers to view orders"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy C: Allow authenticated managers (Mobile App users) to update orders (accept, complete, notes)
DROP POLICY IF EXISTS "Allow managers to update orders" ON public.orders;
CREATE POLICY "Allow managers to update orders"
    ON public.orders
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy D: Optional public read access by unique order_id (allows customers to check their order status)
DROP POLICY IF EXISTS "Allow order status lookup by order_id" ON public.orders;
CREATE POLICY "Allow order status lookup by order_id"
    ON public.orders
    FOR SELECT
    TO anon
    USING (order_id IS NOT NULL);

-- 6. Enable Supabase Realtime for instant push notifications to Android Manager App
-- This publishes insert/update events to the mobile app in real time!
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Insert a sample demo order for initial testing
INSERT INTO public.orders (
    order_id,
    customer_name,
    customer_email,
    customer_phone,
    company_name,
    service_type,
    order_details,
    status,
    priority,
    source,
    manager_notes
) VALUES (
    'ACQ-DEMO-001',
    'Jordan Ellis',
    'jordan.ellis@apexgroup.com',
    '+1 415-555-0199',
    'Apex Logistics LLC',
    'AI Voice Agents & Receptionists',
    'Need a 24/7 AI voice receptionist to field after-hours dispatch requests and sync slots directly with Google Calendar.',
    'new',
    'urgent',
    'website',
    'Test seed record for verifying database setup.'
) ON CONFLICT (order_id) DO NOTHING;

-- Verification query
SELECT id, order_id, customer_name, service_type, status, created_at FROM public.orders;
