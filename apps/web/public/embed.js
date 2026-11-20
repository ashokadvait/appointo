/**
 * Calendly Recreate - Universal Embed & Badge Widget
 */
(function(window, document) {
  'use strict';

  const CalendlyWidget = {
    initBadge: function(options) {
      const opts = Object.assign({
        url: window.location.origin + '/book',
        text: 'Schedule Time with Me',
        color: '#3b82f6',
        textColor: '#ffffff'
      }, options);

      if (document.getElementById('calendly-recreate-badge')) return;

      const badge = document.createElement('div');
      badge.id = 'calendly-recreate-badge';
      badge.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 8px;
        background: ${opts.color};
        color: ${opts.textColor};
        padding: 12px 20px;
        border-radius: 50px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
      `;

      badge.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>${opts.text}</span>
      `;

      badge.addEventListener('mouseenter', () => {
        badge.style.transform = 'translateY(-2px) scale(1.02)';
        badge.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.4)';
      });

      badge.addEventListener('mouseleave', () => {
        badge.style.transform = 'translateY(0) scale(1)';
        badge.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
      });

      badge.addEventListener('click', () => {
        CalendlyWidget.initPopup({ url: opts.url });
      });

      document.body.appendChild(badge);
    },

    initPopup: function(options) {
      const opts = Object.assign({
        url: window.location.origin + '/book'
      }, options);

      const existing = document.getElementById('calendly-recreate-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'calendly-recreate-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.2s ease-out;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        width: 100%;
        max-width: 980px;
        height: 85vh;
        max-height: 720px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        transform: scale(0.96);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-bottom: 1px solid #f1f5f9;
        background: #f8fafc;
      `;

      header.innerHTML = `
        <span style="font-family: system-ui, sans-serif; font-size: 13px; font-weight: 700; color: #1e293b;">
          Book an Appointment
        </span>
        <button id="calendly-recreate-close" style="
          background: none;
          border: none;
          color: #64748b;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        ">&times;</button>
      `;

      const iframe = document.createElement('iframe');
      iframe.src = opts.url;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        flex: 1;
      `;

      modal.appendChild(header);
      modal.appendChild(iframe);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
      });

      const closeBtn = document.getElementById('calendly-recreate-close');
      const closeModal = () => {
        overlay.style.opacity = '0';
        modal.style.transform = 'scale(0.96)';
        setTimeout(() => overlay.remove(), 200);
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
      });
    }
  };

  window.CalendlyWidget = CalendlyWidget;
  window.CalendlyRecreate = CalendlyWidget;
})(window, document);
