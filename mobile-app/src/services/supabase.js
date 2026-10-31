export const DEFAULT_CONFIG = {
  url: 'https://tpvqnghvvlsqowpklkav.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnFuZ2h2dmxzcW93cGtsa2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MTg4MjcsImV4cCI6MjEwODQ5NDgyN30.fCENMp7E7otno_XLfx-eqaAB7tKRT_IhTnd2Bs4FsMM',
  table: 'orders'
};

export function normalizeOrder(o) {
  if (!o) return {};
  const name = o.customer_name || o.name || 'Unnamed Client';
  const email = o.customer_email || o.email || '';
  const phone = o.customer_phone || o.phone || '';
  const company = o.company_name || o.company || '';
  const service = o.service_type || o.service_requested || 'AI Voice Agents & Receptionists';
  const details = o.order_details || o.message || o.project_details || 'New incoming order via Acquiro Web.';
  const ref = o.order_id || o.order_ref || `ACQ-${String(o.id).slice(0, 8).toUpperCase()}`;

  return {
    ...o,
    id: o.id,
    name,
    customer_name: name,
    email,
    customer_email: email,
    phone,
    customer_phone: phone,
    company,
    company_name: company,
    service,
    service_type: service,
    service_requested: service,
    details,
    order_details: details,
    message: details,
    project_details: details,
    order_ref: ref,
    order_id: ref,
    status: (o.status || 'new').toLowerCase(),
    budget: o.budget || (o.metadata && o.metadata.budget) || 'Custom Scope',
    timeline: o.timeline || (o.metadata && o.metadata.timeline) || 'Standard',
    created_at: o.created_at || new Date().toISOString(),
    manager_notes: o.manager_notes || '',
    priority: o.priority || 'normal',
    source: o.source || 'website'
  };
}

export async function fetchOrdersFromSupabase(config = DEFAULT_CONFIG) {
  const url = config.url.replace(/\/+$/, '');
  const endpoint = `${url}/rest/v1/${config.table}?select=*&order=created_at.desc`;

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Supabase returned HTTP ${res.status}`);
  }

  const rawOrders = await res.json();
  return Array.isArray(rawOrders) ? rawOrders.map(normalizeOrder) : [];
}

export async function updateOrderStatusInSupabase(orderId, newStatus, config = DEFAULT_CONFIG) {
  const url = config.url.replace(/\/+$/, '');
  const endpoint = `${url}/rest/v1/${config.table}?id=eq.${orderId}`;

  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ status: newStatus })
  });

  if (!res.ok) {
    throw new Error(`Failed to update status: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Supabase RLS Blocked: 0 rows updated. You must run the RLS SQL policy in Supabase SQL editor.');
  }

  return data;
}

export async function updateManagerNotesInSupabase(orderId, notes, config = DEFAULT_CONFIG) {
  const url = config.url.replace(/\/+$/, '');
  const endpoint = `${url}/rest/v1/${config.table}?id=eq.${orderId}`;

  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ manager_notes: notes })
  });

  if (!res.ok) {
    throw new Error(`Failed to save notes: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Supabase RLS Blocked: 0 rows updated for notes. You must run the RLS SQL policy in Supabase SQL editor.');
  }

  return data;
}

export async function deleteOrderInSupabase(orderId, config = DEFAULT_CONFIG) {
  const url = config.url.replace(/\/+$/, '');
  const endpoint = `${url}/rest/v1/${config.table}?id=eq.${orderId}`;

  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to delete order: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Supabase RLS Blocked: 0 rows deleted. You must run the RLS SQL policy in Supabase SQL editor.');
  }

  return true;
}

export async function createManualOrderInSupabase(orderData, config = DEFAULT_CONFIG) {
  const url = config.url.replace(/\/+$/, '');
  const endpoint = `${url}/rest/v1/${config.table}`;

  const payload = {
    order_id: 'TEL-' + Math.floor(1000 + Math.random() * 9000),
    customer_name: orderData.name,
    customer_email: orderData.email,
    customer_phone: orderData.phone || null,
    company_name: orderData.company || null,
    service_type: orderData.service,
    order_details: orderData.details,
    status: 'new',
    priority: 'normal',
    source: 'manual_intake'
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Insert failed: HTTP ${res.status}`);
  }

  const inserted = await res.json();
  return normalizeOrder(Array.isArray(inserted) ? inserted[0] : inserted);
}

export async function testSupabaseConnection(config = DEFAULT_CONFIG) {
  const t0 = Date.now();
  const url = config.url.replace(/\/+$/, '');
  const endpoint = `${url}/rest/v1/${config.table}?select=count`;

  const res = await fetch(endpoint, {
    headers: {
      'apikey': config.anonKey,
      'Authorization': `Bearer ${config.anonKey}`
    }
  });

  const latency = Date.now() - t0;
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} (${res.statusText})`);
  }

  return { success: true, latency };
}
