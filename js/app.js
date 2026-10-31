/**
 * ACQUIRO — AI Voice Agents, Automation & Web Development
 * Application JavaScript: Navigation, Accordions, Interactive Demos, Copy Utilities, and Form Dispatch
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // --- 1. Sticky Navbar Effect on Scroll ---
  const header = document.querySelector('.site-header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // --- 2. Accessible Mobile Navigation ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu-wrapper');

  if (mobileToggle && navMenu) {
    const toggleMenu = (open) => {
      const isOpen = open !== undefined ? open : !navMenu.classList.contains('open');
      navMenu.classList.toggle('open', isOpen);
      mobileToggle.setAttribute('aria-expanded', isOpen);
      mobileToggle.innerHTML = isOpen
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    };

    mobileToggle.addEventListener('click', () => toggleMenu());

    // Close menu when clicking any nav link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        toggleMenu(false);
      }
    });
  }

  // --- 3. Accessible FAQ Accordions ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

        // Close other items for a clean single-open accordion experience
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherTrigger = otherItem.querySelector('.faq-trigger');
            const otherContent = otherItem.querySelector('.faq-content');
            if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
            if (otherContent) otherContent.setAttribute('hidden', '');
          }
        });

        if (isExpanded) {
          trigger.setAttribute('aria-expanded', 'false');
          content.setAttribute('hidden', '');
          item.classList.remove('active');
        } else {
          trigger.setAttribute('aria-expanded', 'true');
          content.removeAttribute('hidden');
          item.classList.add('active');
        }
      });
    }
  });

  // --- 4. Copy Utilities (Email, Phone, Brief) ---
  const setupCopyBtn = (btnSelector, textSourceSelector, successLabel) => {
    const btn = document.querySelector(btnSelector);
    const source = document.querySelector(textSourceSelector);
    if (!btn || !source) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const textToCopy = source.textContent.trim();
      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>${successLabel}</span>`;
        btn.style.borderColor = 'var(--c-brand-violet)';
        btn.style.color = 'var(--c-brand-violet)';

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 2200);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    });
  };

  setupCopyBtn('#btn-copy-email', '#text-contact-email', 'Copied!');
  setupCopyBtn('#btn-copy-phone', '#text-contact-phone', 'Copied!');

  // --- 5. Interactive Simulation Sequence Stage Switcher (if present) ---
  const simTabs = document.querySelectorAll('.sim-step-tab');
  const simPanes = document.querySelectorAll('.sim-display-pane');
  if (simTabs.length > 0 && simPanes.length > 0) {
    simTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetStep = tab.getAttribute('data-step');
        simTabs.forEach(t => t.classList.remove('active'));
        simPanes.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const activePane = document.getElementById(`sim-pane-${targetStep}`);
        if (activePane) activePane.classList.add('active');
      });
    });
  }

  // --- 6. Contact Form Handling & URL Parameter Preselection ---
  const contactForm = document.getElementById('acquiro-contact-form');
  const formFeedback = document.getElementById('contact-form-feedback');

  // Preselect service based on URL query parameter (e.g. ?service=ai-receptionist or ?service=automation)
  if (contactForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    if (serviceParam) {
      const matchingRadio = contactForm.querySelector(`input[name="service_interest"][value="${serviceParam}"]`) 
        || contactForm.querySelector(`input[name="service_interest"][data-alias="${serviceParam}"]`);
      if (matchingRadio) {
        matchingRadio.checked = true;
        // highlight pill
        const pill = matchingRadio.closest('.service-pill-label');
        if (pill) {
          pill.classList.add('selected');
        }
      }
    }

    // Radio pills styling update on change
    contactForm.querySelectorAll('input[name="service_interest"]').forEach(radio => {
      radio.addEventListener('change', () => {
        contactForm.querySelectorAll('.service-pill-label').forEach(p => p.classList.remove('selected'));
        if (radio.checked) {
          radio.closest('.service-pill-label')?.classList.add('selected');
        }
      });
    });

    // Form Submit Handler (with Supabase Cloud Database Order Reception)
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = (document.getElementById('form-name')?.value || '').trim();
      const email = (document.getElementById('form-email')?.value || '').trim();
      const phone = (document.getElementById('form-phone')?.value || '').trim();
      const business = (document.getElementById('form-business')?.value || '').trim();
      const serviceRadio = contactForm.querySelector('input[name="service_interest"]:checked');
      const service = serviceRadio ? serviceRadio.value : 'AI Voice Agents & Receptionists';
      const details = (document.getElementById('form-details')?.value || '').trim();
      const submitBtn = contactForm.querySelector('button[type="submit"]');

      if (!name || !email || !details) {
        if (formFeedback) {
          formFeedback.className = 'form-feedback-box active error';
          formFeedback.innerHTML = `<strong>Please complete all required fields:</strong> Your name, work email, and project details are needed to prepare your proposal.`;
          formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (formFeedback) {
          formFeedback.className = 'form-feedback-box active error';
          formFeedback.innerHTML = `<strong>Invalid email address:</strong> Please provide a valid work email address.`;
          formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }

      // Generate human-friendly tracking code
      const now = new Date();
      const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderId = `ACQ-${dateStamp}-${randSuffix}`;

      // Compile plain-text project brief
      const briefText = 
`ACQUIRO ORDER / PROJECT ENQUIRY
=========================================
Order Ref:      ${orderId}
Client Name:    ${name}
Work Email:     ${email}
Phone Number:   ${phone || 'Not specified'}
Business Name:  ${business || 'Not specified'}
Service Focus:  ${service}

Order / Project Requirements:
${details}
=========================================
Generated via Acquiro Order Reception System`;

      const subject = encodeURIComponent(`Order Enquiry [${orderId}]: ${service} - ${business || name}`);
      const body = encodeURIComponent(briefText);
      const mailtoUrl = `mailto:acquiro.agency@outlook.com?subject=${subject}&body=${body}`;

      // Check if Supabase Database is configured
      const sbConfig = window.ACQUIRO_CONFIG?.supabase;
      const isSupabaseConfigured = Boolean(
        sbConfig &&
        typeof sbConfig.url === 'string' &&
        sbConfig.url.trim().startsWith('https://') &&
        typeof sbConfig.anonKey === 'string' &&
        sbConfig.anonKey.trim().length > 20
      );

      if (isSupabaseConfigured) {
        const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span>Saving Order to Database...</span>`;
        }

        try {
          const rawUrl = sbConfig.url.trim().replace(/\/+$/, '');
          const baseUrl = rawUrl.endsWith('/rest/v1') ? rawUrl.slice(0, -8) : rawUrl;
          const endpoint = `${baseUrl}/rest/v1/${sbConfig.ordersTable || 'orders'}`;
          const orderPayload = {
            order_id: orderId,
            customer_name: name,
            customer_email: email,
            customer_phone: phone || null,
            company_name: business || null,
            service_type: service,
            order_details: details,
            status: 'new',
            priority: 'normal',
            source: 'website',
            metadata: {
              submittedAt: now.toISOString(),
              pageUrl: window.location.href,
              userAgent: navigator.userAgent
            }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'apikey': sbConfig.anonKey.trim(),
              'Authorization': `Bearer ${sbConfig.anonKey.trim()}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(orderPayload)
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Database responded with status ${response.status}`);
          }

          // Successful database insertion
          if (formFeedback) {
            formFeedback.className = 'form-feedback-box active success';
            formFeedback.innerHTML = `
              <div class="order-badge-pill">
                <span class="status-pulse-dot"></span>
                <span>Order Received &bull; Ref: ${orderId}</span>
              </div>
              <h4 style="font-size: 1.2rem; margin: 8px 0; color: #14532d;">Order Successfully Logged in Database!</h4>
              <p style="font-size: 0.885rem; color: #166534; line-height: 1.55; margin-bottom: 12px;">
                Thank you, <strong>${name}</strong>. Your order requirements for <strong>${service}</strong> have been securely recorded in our Supabase database and queued for manager review.
              </p>
              <div style="background: #ffffff; border: 1px solid #bbf7d0; border-radius: var(--radius-sm); padding: 14px; font-size: 0.825rem; color: #14532d; margin-bottom: 14px; line-height: 1.6;">
                <div><strong>Order ID:</strong> <span style="font-family: var(--font-mono); font-weight: 700;">${orderId}</span></div>
                <div><strong>Status:</strong> <span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: 600;">NEW (Queued for Manager)</span></div>
                <div><strong>Client:</strong> ${name} &bull; ${email} ${phone ? `&bull; ${phone}` : ''}</div>
              </div>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <a href="${mailtoUrl}" class="btn btn-secondary btn-sm" id="btn-email-backup">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <span>Send Direct Email Copy</span>
                </a>
                <button type="button" class="copy-button" id="copy-brief-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  <span>Copy Reference to Clipboard</span>
                </button>
              </div>
              <div class="brief-display-code" id="brief-copy-source" style="display: none;">${briefText}</div>
            `;

            setupCopyBriefButton(briefText);
            contactForm.reset();
            formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } catch (dbErr) {
          console.error('Supabase submission error:', dbErr);
          // Graceful fallback to email client
          if (formFeedback) {
            formFeedback.className = 'form-feedback-box active info';
            formFeedback.innerHTML = `
              <div style="margin-bottom: 8px;">
                <strong>Order Brief Compiled [${orderId}]!</strong> Database connection encountered a notice (${dbErr.message || 'check RLS policies'}). We are directing your enquiry directly via email to <strong>acquiro.agency@outlook.com</strong>.
              </div>
              <div style="margin: 10px 0;">
                <a href="${mailtoUrl}" class="btn btn-primary btn-sm">
                  <span>Open Email Client</span>
                </a>
              </div>
              <button type="button" class="copy-button" id="copy-brief-btn">
                <span>Copy Project Brief to Clipboard</span>
              </button>
              <div class="brief-display-code" id="brief-copy-source">${briefText}</div>
            `;
            setupCopyBriefButton(briefText);
            window.location.href = mailtoUrl;
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
        }
      } else {
        // Supabase not yet configured: Open email client with compiled brief
        window.location.href = mailtoUrl;

        if (formFeedback) {
          formFeedback.className = 'form-feedback-box active info';
          formFeedback.innerHTML = `
            <div style="margin-bottom: 10px;">
              <strong>Your Order Enquiry is Compiled! [Ref: ${orderId}]</strong> We have opened your email client to send directly to <strong>acquiro.agency@outlook.com</strong>.
            </div>
            <p style="font-size: 0.85rem; color: #475569; margin-bottom: 12px;">
              If your email client did not open automatically, copy the structured brief below and email it to <strong>acquiro.agency@outlook.com</strong> or call us at <strong>+1 214-286-5081</strong>.
            </p>
            <button type="button" class="copy-button" id="copy-brief-btn" style="margin-bottom: 10px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copy Project Brief to Clipboard</span>
            </button>
            <div class="brief-display-code" id="brief-copy-source">${briefText}</div>
            <div style="font-size: 0.775rem; color: #64748b; margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
              <strong>Database Integration:</strong> Ready for Supabase cloud storage. Add your Project URL &amp; Anon Key in <code>js/supabase-config.js</code> to enable live database writes.
            </div>
          `;
          setupCopyBriefButton(briefText);
          formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    function setupCopyBriefButton(textToCopy) {
      const copyBtn = document.getElementById('copy-brief-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(textToCopy);
            copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied to Clipboard!</span>`;
            setTimeout(() => {
              copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy to Clipboard</span>`;
            }, 2500);
          } catch (err) {
            console.warn('Clipboard write failed:', err);
          }
        });
      }
    }
  }

  // --- 7. Privacy & Terms Dialog Modals ---
  const privacyModal = document.getElementById('privacy-dialog');
  const termsModal = document.getElementById('terms-dialog');

  document.querySelectorAll('.open-privacy-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (privacyModal) {
        if (typeof privacyModal.showModal === 'function') {
          privacyModal.showModal();
        } else {
          privacyModal.setAttribute('open', '');
        }
      }
    });
  });

  document.querySelectorAll('.open-terms-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (termsModal) {
        if (typeof termsModal.showModal === 'function') {
          termsModal.showModal();
        } else {
          termsModal.setAttribute('open', '');
        }
      }
    });
  });

  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('dialog');
      if (modal) {
        if (typeof modal.close === 'function') {
          modal.close();
        } else {
          modal.removeAttribute('open');
        }
      }
    });
  });

  // Close modal when clicking on backdrop
  [privacyModal, termsModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog && typeof modal.close === 'function') {
          modal.close();
        }
      });
    }
  });

  // --- 8. Dynamic Copyright Year ---
  const yearEls = document.querySelectorAll('.current-year');
  const currentYear = new Date().getFullYear();
  yearEls.forEach(el => {
    el.textContent = currentYear;
  });
});
