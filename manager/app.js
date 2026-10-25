/**
 * ACQUIRO MOBILE MANAGER APPLICATION
 * ============================================================================
 * Android 9+ Order Reception, Triage, Customer Directory and Data Export
 * Connected to Supabase Cloud Database
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONFIGURATION & STATE
  // --------------------------------------------------------------------------
  const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'acquiro2026'
  };

  const STORAGE_KEYS = {
    AUTH: 'acquiro_manager_auth',
    PASSWORD: 'acquiro_manager_password',
    THEME: 'acquiro_manager_theme',
    NOTIFS_ACTIVE: 'acquiro_notifs_active',
    SOUND_ACTIVE: 'acquiro_sound_active',
    VIBRATE_ACTIVE: 'acquiro_vibrate_active',
    CUSTOM_DB_URL: 'acquiro_custom_db_url',
    CUSTOM_DB_KEY: 'acquiro_custom_db_key',
    CUSTOM_DB_TABLE: 'acquiro_custom_db_table'
  };

  let ordersState = [];
  let seenOrderIds = new Set();
  let currentFilter = 'all';
  let searchQuery = '';
  let pollIntervalId = null;
  let activeOrderForModal = null;
  let audioContext = null;

  // Retrieve Supabase config
  function getDbConfig() {
    const defaultCfg = (window.ACQUIRO_CONFIG && window.ACQUIRO_CONFIG.supabase) || {};
    return {
      url: localStorage.getItem(STORAGE_KEYS.CUSTOM_DB_URL) || defaultCfg.url || 'https://tpvqnghvvlsqowpklkav.supabase.co',
      anonKey: localStorage.getItem(STORAGE_KEYS.CUSTOM_DB_KEY) || defaultCfg.anonKey || '',
      table: localStorage.getItem(STORAGE_KEYS.CUSTOM_DB_TABLE) || defaultCfg.ordersTable || 'orders'
    };
  }

  // --------------------------------------------------------------------------
  // 2. AUDIO & VIBRATION ENGINE (Modern Tech Ping)
  // --------------------------------------------------------------------------
  function initAudioContext() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
  }

  /**
   * Synthesizes a high-end "Modern Tech Ping" sound using Web Audio API:
   * Dual-harmonic bell ping:
   * Tone 1: 1320 Hz (E6 crystal chime)
   * Tone 2: 2640 Hz (E7 high shimmer)
   * Tone 3: 880 Hz (A5 warm anchor)
   */
  function playModernTechPing() {
    const isSoundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ACTIVE) !== 'false';
    if (!isSoundEnabled) return;

    try {
      initAudioContext();
      if (!audioContext) return;

      const now = audioContext.currentTime;

      // Master Gain
      const masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.connect(audioContext.destination);

      // Tone 1: 1320 Hz (Main Ping)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1320, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08); // subtle upward pitch lift

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.65, now + 0.015); // rapid soft attack
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.38); // clean exponential decay

      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Tone 2: 2640 Hz (Crystalline Shimmer Harmonic)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2640, now);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      // Tone 3: 880 Hz (Warm Body)
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(880, now);

      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.linearRampToValueAtTime(0.35, now + 0.025);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      osc3.connect(gain3);
      gain3.connect(masterGain);

      // Start & Stop
      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + 0.42);
      osc2.stop(now + 0.32);
      osc3.stop(now + 0.36);
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  function triggerVibration() {
    const isVibrateEnabled = localStorage.getItem(STORAGE_KEYS.VIBRATE_ACTIVE) !== 'false';
    if (!isVibrateEnabled) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Modern rhythmic double vibration alert
      navigator.vibrate([220, 80, 220, 80, 360]);
    }
  }

  // --------------------------------------------------------------------------
  // 3. AUTHENTICATION & SECURITY
  // --------------------------------------------------------------------------
  const authView = document.getElementById('auth-view');
  const appShell = document.getElementById('app-shell');
  const authForm = document.getElementById('auth-form');
  const authUsernameInput = document.getElementById('login-username');
  const authPasswordInput = document.getElementById('login-password');
  const authErrorBox = document.getElementById('auth-error');

  function checkAuthStatus() {
    const isAuthed = localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    if (isAuthed) {
      showAppShell();
    } else {
      showAuthGate();
    }
  }

  function showAuthGate() {
    if (authView) authView.style.display = 'flex';
    if (appShell) appShell.style.display = 'none';
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  }

  function showAppShell() {
    if (authView) authView.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';

    initAudioContext();
    startLivePolling();
    fetchOrdersNow();
  }

  function handleLogin(e) {
    if (e) e.preventDefault();
    const enteredUser = (authUsernameInput.value || '').trim();
    const enteredPass = (authPasswordInput.value || '').trim();

    const expectedPass = localStorage.getItem(STORAGE_KEYS.PASSWORD) || DEFAULT_CREDENTIALS.password;

    if (enteredUser.toLowerCase() === DEFAULT_CREDENTIALS.username && enteredPass === expectedPass) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      if (authErrorBox) authErrorBox.style.display = 'none';
      showAppShell();
    } else {
      if (authErrorBox) {
        authErrorBox.textContent = 'Invalid credentials. Default: admin / acquiro2026';
        authErrorBox.style.display = 'block';
      }
    }
  }

  function handleLogout() {
    if (confirm('Are you sure you want to sign out of the Manager Console?')) {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      showAuthGate();
    }
  }

  // --------------------------------------------------------------------------
  // 4. THEME MANAGEMENT
  // --------------------------------------------------------------------------
  const darkThemeToggle = document.getElementById('setting-dark-theme');
  const authLogoImg = document.getElementById('auth-logo');
  const headerLogoImg = document.getElementById('header-logo');

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      if (darkThemeToggle) darkThemeToggle.checked = true;
      if (authLogoImg) authLogoImg.src = 'assets/logo-light.png';
      if (headerLogoImg) headerLogoImg.src = 'assets/logo-light.png';
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      if (darkThemeToggle) darkThemeToggle.checked = false;
      if (authLogoImg) authLogoImg.src = 'assets/logo-dark.png';
      if (headerLogoImg) headerLogoImg.src = 'assets/logo-dark.png';
    }
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
  }

  // --------------------------------------------------------------------------
  // 5. SUPABASE CLOUD DATABASE SYNC & API CALLS
  // --------------------------------------------------------------------------
  const dbIndicator = document.getElementById('header-db-indicator');
  const dbIndicatorText = document.getElementById('db-indicator-text');

  function updateDbStatus(status, text) {
    if (!dbIndicator) return;
    const dot = dbIndicator.querySelector('.db-live-dot');
    if (status === 'connected') {
      if (dot) dot.style.background = '#10b981';
      if (dbIndicatorText) dbIndicatorText.textContent = text || 'Live Sync';
    } else if (status === 'syncing') {
      if (dot) dot.style.background = '#f59e0b';
      if (dbIndicatorText) dbIndicatorText.textContent = text || 'Syncing...';
    } else if (status === 'error') {
      if (dot) dot.style.background = '#f43f5e';
      if (dbIndicatorText) dbIndicatorText.textContent = text || 'Offline';
    }
  }

  async function fetchOrdersNow() {
    const db = getDbConfig();
    if (!db.url || !db.anonKey) {
      updateDbStatus('error', 'Missing DB Key');
      return;
    }

    try {
      updateDbStatus('syncing', 'Checking...');
      const endpoint = `${db.url.replace(/\/+$/, '')}/rest/v1/${db.table}?select=*&order=created_at.desc`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'apikey': db.anonKey,
          'Authorization': `Bearer ${db.anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Supabase returned HTTP ${response.status}`);
      }

      const freshOrders = await response.json();
      updateDbStatus('connected', 'Live Sync');
      handleOrdersUpdate(freshOrders);
    } catch (err) {
      console.warn('Orders fetch error:', err);
      updateDbStatus('error', 'Sync Issue');
    }
  }

  function handleOrdersUpdate(freshOrders) {
    if (!Array.isArray(freshOrders)) return;

    // Detect brand new incoming orders
    let newlyArrivedOrder = null;

    if (seenOrderIds.size > 0) {
      for (const order of freshOrders) {
        if (!seenOrderIds.has(order.id) && (order.status === 'new' || !order.status)) {
          newlyArrivedOrder = order;
          break;
        }
      }
    }

    // Update seen IDs
    freshOrders.forEach(o => seenOrderIds.add(o.id));
    ordersState = freshOrders;

    renderOrders();
    renderCustomerDirectory();
    updateMetrics();

    // Trigger Notification & Alert Sound if new order received
    if (newlyArrivedOrder) {
      notifyNewOrder(newlyArrivedOrder);
    }
  }

  function startLivePolling() {
    if (pollIntervalId) clearInterval(pollIntervalId);
    // Poll Supabase every 7 seconds for realtime reception
    pollIntervalId = setInterval(fetchOrdersNow, 7000);
  }

  // --------------------------------------------------------------------------
  // 6. POP-UP HEADS-UP NOTIFICATION MODAL
  // --------------------------------------------------------------------------
  const alertOverlay = document.getElementById('order-alert-overlay');
  const alertClientName = document.getElementById('alert-client-name');
  const alertServiceType = document.getElementById('alert-service-type');
  const alertOrderDetails = document.getElementById('alert-order-details');
  const btnAlertAccept = document.getElementById('btn-alert-accept');
  const btnAlertDismiss = document.getElementById('btn-alert-dismiss');
  let currentAlertOrder = null;

  function notifyNewOrder(order) {
    const isNotifsActive = localStorage.getItem(STORAGE_KEYS.NOTIFS_ACTIVE) !== 'false';

    // Play Modern Tech Ping
    playModernTechPing();
    // Trigger vibration
    triggerVibration();

    if (!isNotifsActive) return;

    currentAlertOrder = order;
    if (alertClientName) alertClientName.textContent = order.name || 'New Customer Order';
    if (alertServiceType) alertServiceType.textContent = `Service: ${order.service_requested || 'AI Solutions'}`;
    if (alertOrderDetails) {
      alertOrderDetails.innerHTML = `
        <div style="margin-bottom: 4px;"><strong>Contact:</strong> ${escapeHtml(order.phone || order.email || 'N/A')}</div>
        <div style="margin-bottom: 4px;"><strong>Company:</strong> ${escapeHtml(order.company || 'Direct Client')}</div>
        <div><strong>Notes:</strong> ${escapeHtml(order.message || order.project_details || 'New incoming order via Acquiro Web.')}</div>
      `;
    }

    if (alertOverlay) {
      alertOverlay.classList.add('active');
    }
  }

  function dismissAlert() {
    if (alertOverlay) {
      alertOverlay.classList.remove('active');
    }
    currentAlertOrder = null;
  }

  async function acceptAlertOrder() {
    if (!currentAlertOrder) return;
    const orderId = currentAlertOrder.id;
    dismissAlert();
    await updateOrderStatus(orderId, 'accepted');
  }

  // --------------------------------------------------------------------------
  // 7. ORDER RENDERING & TRIAGE
  // --------------------------------------------------------------------------
  const ordersListContainer = document.getElementById('orders-list');
  const ordersEmptyState = document.getElementById('orders-empty-state');
  const metricNewCount = document.getElementById('metric-new-count');
  const metricTotalCount = document.getElementById('metric-total-count');
  const tabNewBadge = document.getElementById('tab-new-badge');

  function updateMetrics() {
    const totalCount = ordersState.length;
    const newCount = ordersState.filter(o => (o.status || 'new') === 'new').length;

    if (metricTotalCount) metricTotalCount.textContent = totalCount;
    if (metricNewCount) metricNewCount.textContent = newCount;

    if (tabNewBadge) {
      if (newCount > 0) {
        tabNewBadge.textContent = newCount;
        tabNewBadge.style.display = 'inline-flex';
      } else {
        tabNewBadge.style.display = 'none';
      }
    }
  }

  function filterAndSearchOrders() {
    return ordersState.filter(order => {
      // Status filter
      const status = (order.status || 'new').toLowerCase();
      if (currentFilter !== 'all' && status !== currentFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchable = [
          order.name,
          order.email,
          order.phone,
          order.company,
          order.order_ref,
          order.service_requested,
          order.message,
          order.project_details
        ].filter(Boolean).join(' ').toLowerCase();

        return searchable.includes(q);
      }

      return true;
    });
  }

  function renderOrders() {
    if (!ordersListContainer) return;

    const filtered = filterAndSearchOrders();

    if (filtered.length === 0) {
      ordersListContainer.innerHTML = '';
      if (ordersEmptyState) ordersEmptyState.style.display = 'block';
      return;
    }

    if (ordersEmptyState) ordersEmptyState.style.display = 'none';

    ordersListContainer.innerHTML = filtered.map(order => createOrderCardHtml(order)).join('');

    // Attach card event listeners
    attachOrderCardEvents();
  }

  function createOrderCardHtml(order) {
    const id = order.id;
    const name = escapeHtml(order.name || 'Unnamed Client');
    const phone = escapeHtml(order.phone || '');
    const email = escapeHtml(order.email || '');
    const company = escapeHtml(order.company || '');
    const service = escapeHtml(order.service_requested || 'General Inquiry');
    const status = (order.status || 'new').toLowerCase();
    const orderRef = escapeHtml(order.order_ref || `ACQ-${String(id).slice(-4).toUpperCase()}`);
    const dateFormatted = formatDate(order.created_at);
    const hasNotes = Boolean(order.manager_notes && order.manager_notes.trim());

    // Status Pill classes
    const statusClassMap = {
      new: 'status-pill-new',
      accepted: 'status-pill-accepted',
      in_progress: 'status-pill-progress',
      completed: 'status-pill-completed',
      cancelled: 'status-pill-cancelled'
    };
    const pillClass = statusClassMap[status] || 'status-pill-new';
    const statusDisplay = status.replace('_', ' ').toUpperCase();

    return `
      <article class="order-card" data-order-id="${id}">
        <div class="order-card-header">
          <div>
            <div class="order-ref-code">${orderRef}</div>
            <h3 class="order-client-name">${name}</h3>
            ${company ? `<div style="font-size: 0.78rem; color: var(--c-text-muted);">${company}</div>` : ''}
          </div>
          <span class="status-pill ${pillClass}">
            <span class="status-dot"></span>
            <span>${statusDisplay}</span>
          </span>
        </div>

        <div class="order-service-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>${service}</span>
        </div>

        <div class="order-meta-row">
          <div class="order-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${dateFormatted}</span>
          </div>
          ${order.budget ? `
            <div class="order-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <span>${escapeHtml(order.budget)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Manager Quick Action Buttons -->
        <div class="order-actions-toolbar">
          ${phone ? `
            <a href="tel:${phone}" class="btn-order-action call" title="Call Client Instantly">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>Call</span>
            </a>
          ` : ''}

          ${email ? `
            <a href="mailto:${email}" class="btn-order-action" title="Send Email">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>Email</span>
            </a>
          ` : ''}

          <button type="button" class="btn-order-action btn-open-details" data-id="${id}" title="View Details & Notes">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <span>Details ${hasNotes ? '📝' : ''}</span>
          </button>

          <!-- Triage Status Dropdown -->
          <select class="order-status-select" data-id="${id}" title="Update Status">
            <option value="new" ${status === 'new' ? 'selected' : ''}>New</option>
            <option value="accepted" ${status === 'accepted' ? 'selected' : ''}>Accept</option>
            <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>In Progress</option>
            <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
      </article>
    `;
  }

  function attachOrderCardEvents() {
    // Details Buttons
    document.querySelectorAll('.btn-open-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const order = ordersState.find(o => String(o.id) === String(id));
        if (order) openOrderDetailsModal(order);
      });
    });

    // Status Selector Change
    document.querySelectorAll('.order-status-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        const id = sel.getAttribute('data-id');
        const newStatus = e.target.value;
        await updateOrderStatus(id, newStatus);
      });
    });
  }

  async function updateOrderStatus(orderId, newStatus) {
    const db = getDbConfig();
    try {
      updateDbStatus('syncing', 'Updating...');

      const endpoint = `${db.url.replace(/\/+$/, '')}/rest/v1/${db.table}?id=eq.${orderId}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'apikey': db.anonKey,
          'Authorization': `Bearer ${db.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }

      // Update local state
      const target = ordersState.find(o => String(o.id) === String(orderId));
      if (target) {
        target.status = newStatus;
      }

      renderOrders();
      updateMetrics();
      updateDbStatus('connected', 'Live Sync');
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Unable to update order status. Please check your Supabase connection.');
      updateDbStatus('error', 'Update Failed');
    }
  }

  // --------------------------------------------------------------------------
  // 8. ORDER DETAILS & MANAGER NOTES MODAL
  // --------------------------------------------------------------------------
  const orderDetailsDialog = document.getElementById('order-details-dialog');
  const modalOrderTitle = document.getElementById('modal-order-title');
  const modalOrderBody = document.getElementById('modal-order-body');
  const modalManagerNotes = document.getElementById('modal-manager-notes');
  const btnSaveNotes = document.getElementById('btn-save-notes');
  const btnCloseOrderDialog = document.getElementById('btn-close-order-dialog');

  function openOrderDetailsModal(order) {
    activeOrderForModal = order;
    if (modalOrderTitle) modalOrderTitle.textContent = `${order.name || 'Order'} - Details`;

    if (modalOrderBody) {
      modalOrderBody.innerHTML = `
        <div style="background: var(--c-bg-subtle); border: 1px solid var(--c-border); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div><strong>Client:</strong> ${escapeHtml(order.name || 'N/A')}</div>
            <div><strong>Company:</strong> ${escapeHtml(order.company || 'N/A')}</div>
            <div><strong>Email:</strong> ${escapeHtml(order.email || 'N/A')}</div>
            <div><strong>Phone:</strong> ${escapeHtml(order.phone || 'N/A')}</div>
            <div><strong>Service:</strong> ${escapeHtml(order.service_requested || 'N/A')}</div>
            <div><strong>Status:</strong> ${escapeHtml((order.status || 'new').toUpperCase())}</div>
            <div><strong>Budget:</strong> ${escapeHtml(order.budget || 'Not specified')}</div>
            <div><strong>Timeline:</strong> ${escapeHtml(order.timeline || 'Not specified')}</div>
          </div>
          <div style="font-size: 0.75rem; color: var(--c-text-muted);">
            Created: ${new Date(order.created_at).toLocaleString()} | Ref: ${escapeHtml(order.order_ref || '#' + order.id)}
          </div>
        </div>

        <div style="margin-bottom: 12px;">
          <label class="auth-label">Customer Project Description</label>
          <div style="background: var(--c-bg-card); border: 1px solid var(--c-border); padding: 10px; border-radius: var(--radius-sm); white-space: pre-wrap; font-size: 0.85rem;">${escapeHtml(order.message || order.project_details || 'No additional scope details provided.')}</div>
        </div>
      `;
    }

    if (modalManagerNotes) {
      modalManagerNotes.value = order.manager_notes || '';
    }

    if (orderDetailsDialog) {
      if (typeof orderDetailsDialog.showModal === 'function') {
        orderDetailsDialog.showModal();
      } else {
        orderDetailsDialog.setAttribute('open', '');
      }
    }
  }

  function closeOrderDetailsModal() {
    if (orderDetailsDialog) {
      if (typeof orderDetailsDialog.close === 'function') {
        orderDetailsDialog.close();
      } else {
        orderDetailsDialog.removeAttribute('open');
      }
    }
    activeOrderForModal = null;
  }

  async function handleSaveNotes() {
    if (!activeOrderForModal) return;
    const newNotes = modalManagerNotes.value.trim();
    const orderId = activeOrderForModal.id;
    const db = getDbConfig();

    try {
      btnSaveNotes.textContent = 'Saving...';
      btnSaveNotes.disabled = true;

      const endpoint = `${db.url.replace(/\/+$/, '')}/rest/v1/${db.table}?id=eq.${orderId}`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'apikey': db.anonKey,
          'Authorization': `Bearer ${db.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ manager_notes: newNotes })
      });

      if (!response.ok) {
        throw new Error(`Failed to save notes: ${response.status}`);
      }

      // Update local state
      activeOrderForModal.manager_notes = newNotes;
      const target = ordersState.find(o => String(o.id) === String(orderId));
      if (target) target.manager_notes = newNotes;

      btnSaveNotes.textContent = 'Saved ✓';
      setTimeout(() => {
        btnSaveNotes.textContent = 'Save Notes';
        btnSaveNotes.disabled = false;
        closeOrderDetailsModal();
        renderOrders();
      }, 700);
    } catch (err) {
      console.error('Error saving notes:', err);
      btnSaveNotes.textContent = 'Save Notes';
      btnSaveNotes.disabled = false;
      alert('Unable to save manager notes to Supabase.');
    }
  }

  // --------------------------------------------------------------------------
  // 9. MANUAL ORDER INTAKE DIALOG
  // --------------------------------------------------------------------------
  const manualOrderDialog = document.getElementById('manual-order-dialog');
  const btnOpenManualOrder = document.getElementById('btn-open-manual-order');
  const btnCloseManualDialog = document.getElementById('btn-close-manual-dialog');
  const manualOrderForm = document.getElementById('manual-order-form');

  function openManualDialog() {
    if (manualOrderDialog) {
      if (typeof manualOrderDialog.showModal === 'function') {
        manualOrderDialog.showModal();
      } else {
        manualOrderDialog.setAttribute('open', '');
      }
    }
  }

  function closeManualDialog() {
    if (manualOrderDialog) {
      if (typeof manualOrderDialog.close === 'function') {
        manualOrderDialog.close();
      } else {
        manualOrderDialog.removeAttribute('open');
      }
    }
    if (manualOrderForm) manualOrderForm.reset();
  }

  async function handleManualOrderSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('manual-cust-name').value.trim();
    const phone = document.getElementById('manual-cust-phone').value.trim();
    const email = document.getElementById('manual-cust-email').value.trim();
    const service = document.getElementById('manual-cust-service').value;
    const details = document.getElementById('manual-cust-details').value.trim();

    const db = getDbConfig();
    const submitBtn = manualOrderForm.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving to Database...';

      const payload = {
        name,
        email,
        phone,
        service_requested: service,
        message: details,
        status: 'new',
        budget: 'Manual Order',
        timeline: 'Standard',
        order_ref: 'TEL-' + Math.floor(1000 + Math.random() * 9000),
        source: 'phone_intake'
      };

      const response = await fetch(`${db.url.replace(/\/+$/, '')}/rest/v1/${db.table}`, {
        method: 'POST',
        headers: {
          'apikey': db.anonKey,
          'Authorization': `Bearer ${db.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Insert failed: ${response.status}`);
      }

      const inserted = await response.json();
      closeManualDialog();

      // Refresh orders
      await fetchOrdersNow();
      playModernTechPing();
    } catch (err) {
      console.error('Manual order submit error:', err);
      alert('Could not record manual order. Please check connection.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Save to Database</span>';
    }
  }

  // --------------------------------------------------------------------------
  // 10. CUSTOMER DIRECTORY & EXCEL / CSV DATA EXPORT TOOLS
  // --------------------------------------------------------------------------
  const customersList = document.getElementById('customers-list');
  const custCountBadge = document.getElementById('cust-count');
  const btnExportExcel = document.getElementById('btn-export-excel');
  const btnExportCsv = document.getElementById('btn-export-csv');

  function getUniqueCustomers() {
    const customerMap = new Map();

    ordersState.forEach(order => {
      const key = (order.email || order.phone || order.name || '').toLowerCase().trim();
      if (!key) return;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: order.name || 'Unnamed',
          email: order.email || '',
          phone: order.phone || '',
          company: order.company || '',
          ordersCount: 1,
          latestService: order.service_requested || 'Inquiry',
          latestDate: order.created_at
        });
      } else {
        const c = customerMap.get(key);
        c.ordersCount += 1;
        if (new Date(order.created_at) > new Date(c.latestDate)) {
          c.latestDate = order.created_at;
          c.latestService = order.service_requested || c.latestService;
        }
      }
    });

    return Array.from(customerMap.values());
  }

  function renderCustomerDirectory() {
    if (!customersList) return;
    const customers = getUniqueCustomers();

    if (custCountBadge) custCountBadge.textContent = customers.length;

    if (customers.length === 0) {
      customersList.innerHTML = `
        <div class="empty-state-box">
          <p style="font-size: 0.85rem; color: var(--c-text-muted);">No customer records logged yet.</p>
        </div>
      `;
      return;
    }

    customersList.innerHTML = customers.map(cust => `
      <div class="order-card" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 2px;">${escapeHtml(cust.name)}</h4>
            ${cust.company ? `<div style="font-size: 0.78rem; color: var(--c-text-muted);">${escapeHtml(cust.company)}</div>` : ''}
          </div>
          <span class="metric-pill purple" style="font-size: 0.72rem;">${cust.ordersCount} Order${cust.ordersCount > 1 ? 's' : ''}</span>
        </div>

        <div style="margin: 8px 0; font-size: 0.82rem; color: var(--c-text-secondary); display: flex; flex-direction: column; gap: 4px;">
          ${cust.phone ? `<div>📞 <strong>Phone:</strong> <a href="tel:${escapeHtml(cust.phone)}" style="color: var(--c-blue);">${escapeHtml(cust.phone)}</a></div>` : ''}
          ${cust.email ? `<div>✉️ <strong>Email:</strong> <a href="mailto:${escapeHtml(cust.email)}" style="color: var(--c-blue);">${escapeHtml(cust.email)}</a></div>` : ''}
          <div>🏷️ <strong>Service:</strong> ${escapeHtml(cust.latestService)}</div>
        </div>
      </div>
    `).join('');
  }

  function formatOrdersForExport() {
    return ordersState.map(o => ({
      'Order Ref': o.order_ref || `ACQ-${o.id}`,
      'Date Created': o.created_at ? new Date(o.created_at).toLocaleString() : '',
      'Status': (o.status || 'new').toUpperCase(),
      'Client Name': o.name || '',
      'Email': o.email || '',
      'Phone': o.phone || '',
      'Company': o.company || '',
      'Service Requested': o.service_requested || '',
      'Budget': o.budget || '',
      'Timeline': o.timeline || '',
      'Project Details': o.message || o.project_details || '',
      'Manager Internal Notes': o.manager_notes || '',
      'Database ID': o.id
    }));
  }

  function exportAsExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Excel export library is loading, please try again in a moment.');
      return;
    }

    const data = formatOrdersForExport();
    if (data.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Acquiro Orders');

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Acquiro_Orders_Report_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, filename);
  }

  function exportAsCsv() {
    const data = formatOrdersForExport();
    if (data.length === 0) {
      alert('No orders available to export.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\r\n'));
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `Acquiro_Orders_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --------------------------------------------------------------------------
  // 11. SETTINGS VIEW HANDLERS
  // --------------------------------------------------------------------------
  const settingNotifsActive = document.getElementById('setting-notifs-active');
  const settingSoundActive = document.getElementById('setting-sound-active');
  const settingVibrateActive = document.getElementById('setting-vibrate-active');
  const btnTestSound = document.getElementById('btn-test-sound');

  const settingDbUrl = document.getElementById('setting-db-url');
  const settingDbKey = document.getElementById('setting-db-key');
  const settingDbTable = document.getElementById('setting-db-table');
  const btnSaveDb = document.getElementById('btn-save-db');
  const btnTestDb = document.getElementById('btn-test-db');
  const dbTestResult = document.getElementById('db-test-result');

  const settingNewPass = document.getElementById('setting-new-pass');
  const btnChangePassword = document.getElementById('btn-change-password');
  const passwordChangeFeedback = document.getElementById('password-change-feedback');
  const btnLogout = document.getElementById('btn-logout');

  function initSettingsView() {
    // Notification toggles
    if (settingNotifsActive) {
      settingNotifsActive.checked = localStorage.getItem(STORAGE_KEYS.NOTIFS_ACTIVE) !== 'false';
      settingNotifsActive.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.NOTIFS_ACTIVE, settingNotifsActive.checked);
      });
    }

    if (settingSoundActive) {
      settingSoundActive.checked = localStorage.getItem(STORAGE_KEYS.SOUND_ACTIVE) !== 'false';
      settingSoundActive.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.SOUND_ACTIVE, settingSoundActive.checked);
      });
    }

    if (settingVibrateActive) {
      settingVibrateActive.checked = localStorage.getItem(STORAGE_KEYS.VIBRATE_ACTIVE) !== 'false';
      settingVibrateActive.addEventListener('change', () => {
        localStorage.setItem(STORAGE_KEYS.VIBRATE_ACTIVE, settingVibrateActive.checked);
      });
    }

    if (btnTestSound) {
      btnTestSound.addEventListener('click', () => {
        initAudioContext();
        playModernTechPing();
        triggerVibration();
      });
    }

    // Database fields
    const curDb = getDbConfig();
    if (settingDbUrl) settingDbUrl.value = curDb.url;
    if (settingDbKey) settingDbKey.value = curDb.anonKey;
    if (settingDbTable) settingDbTable.value = curDb.table;

    if (btnSaveDb) {
      btnSaveDb.addEventListener('click', () => {
        const url = (settingDbUrl.value || '').trim();
        const key = (settingDbKey.value || '').trim();
        const tbl = (settingDbTable.value || '').trim() || 'orders';

        localStorage.setItem(STORAGE_KEYS.CUSTOM_DB_URL, url);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DB_KEY, key);
        localStorage.setItem(STORAGE_KEYS.CUSTOM_DB_TABLE, tbl);

        alert('Database configuration saved. Re-syncing...');
        fetchOrdersNow();
      });
    }

    if (btnTestDb) {
      btnTestDb.addEventListener('click', async () => {
        const url = (settingDbUrl.value || '').trim();
        const key = (settingDbKey.value || '').trim();
        const tbl = (settingDbTable.value || '').trim() || 'orders';

        if (!url || !key) {
          showDbTestResult('Please enter both Supabase URL and Anon Key.', false);
          return;
        }

        try {
          showDbTestResult('Pinging Supabase cloud...', null);
          const t0 = performance.now();
          const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/${tbl}?select=count`;
          const res = await fetch(endpoint, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`
            }
          });

          const latency = Math.round(performance.now() - t0);

          if (res.ok) {
            showDbTestResult(`✓ Connected successfully! Latency: ${latency}ms. Table "${tbl}" is accessible.`, true);
          } else {
            showDbTestResult(`✗ Connection failed with HTTP ${res.status} (${res.statusText})`, false);
          }
        } catch (err) {
          showDbTestResult(`✗ Connection error: ${err.message}`, false);
        }
      });
    }

    // Password change
    if (btnChangePassword) {
      btnChangePassword.addEventListener('click', () => {
        const newPass = (settingNewPass.value || '').trim();
        if (!newPass || newPass.length < 4) {
          if (passwordChangeFeedback) {
            passwordChangeFeedback.style.color = 'var(--c-rose)';
            passwordChangeFeedback.textContent = 'Password must be at least 4 characters.';
            passwordChangeFeedback.style.display = 'block';
          }
          return;
        }

        localStorage.setItem(STORAGE_KEYS.PASSWORD, newPass);
        settingNewPass.value = '';
        if (passwordChangeFeedback) {
          passwordChangeFeedback.style.color = '#10b981';
          passwordChangeFeedback.textContent = '✓ Manager password updated successfully.';
          passwordChangeFeedback.style.display = 'block';
          setTimeout(() => {
            passwordChangeFeedback.style.display = 'none';
          }, 3000);
        }
      });
    }

    // Logout
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout);
    }
  }

  function showDbTestResult(msg, isSuccess) {
    if (!dbTestResult) return;
    dbTestResult.textContent = msg;
    dbTestResult.style.display = 'block';
    if (isSuccess === true) {
      dbTestResult.style.color = '#10b981';
    } else if (isSuccess === false) {
      dbTestResult.style.color = 'var(--c-rose)';
    } else {
      dbTestResult.style.color = 'var(--c-text-muted)';
    }
  }

  // --------------------------------------------------------------------------
  // 12. TAB NAVIGATION & FILTERS
  // --------------------------------------------------------------------------
  function initTabNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    const tabViews = document.querySelectorAll('.tab-content-view');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        tabViews.forEach(view => {
          if (view.id === targetId) {
            view.classList.add('active');
          } else {
            view.classList.remove('active');
          }
        });

        // Trigger render if opening customers
        if (targetId === 'view-customers') {
          renderCustomerDirectory();
        }
      });
    });

    // Category / Status Filter Chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.getAttribute('data-filter') || 'all';
        renderOrders();
      });
    });

    // Search Input
    const searchInput = document.getElementById('order-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = (e.target.value || '').trim();
        renderOrders();
      });
    }

    // Theme Switch
    if (darkThemeToggle) {
      darkThemeToggle.addEventListener('change', () => {
        applyTheme(darkThemeToggle.checked ? 'dark' : 'light');
      });
    }
  }

  // --------------------------------------------------------------------------
  // 13. UTILITY FUNCTIONS
  // --------------------------------------------------------------------------
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(isoStr) {
    if (!isoStr) return 'Recent';
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  }

  // --------------------------------------------------------------------------
  // 14. INITIALIZATION ENTRY POINT
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSettingsView();
    initTabNavigation();

    // Event listeners
    if (authForm) authForm.addEventListener('submit', handleLogin);
    if (btnAlertAccept) btnAlertAccept.addEventListener('click', acceptAlertOrder);
    if (btnAlertDismiss) btnAlertDismiss.addEventListener('click', dismissAlert);
    if (btnCloseOrderDialog) btnCloseOrderDialog.addEventListener('click', closeOrderDetailsModal);
    if (btnSaveNotes) btnSaveNotes.addEventListener('click', handleSaveNotes);

    if (btnOpenManualOrder) btnOpenManualOrder.addEventListener('click', openManualDialog);
    if (btnCloseManualDialog) btnCloseManualDialog.addEventListener('click', closeManualDialog);
    if (manualOrderForm) manualOrderForm.addEventListener('submit', handleManualOrderSubmit);

    if (btnExportExcel) btnExportExcel.addEventListener('click', exportAsExcel);
    if (btnExportCsv) btnExportCsv.addEventListener('click', exportAsCsv);

    // Check saved authentication state
    checkAuthStatus();
  });

})();
