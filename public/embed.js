/**
 * Calendly Recreate - Universal Embed & Badge Widget
 * Reverse-engineered from Calendly's widget.js architecture
 */
(function(window, document) {
  'use strict';

  const CalendlyRecreate = {
    initBadgeWidget: function(options) {
      const opts = Object.assign({
        url: window.location.origin + '/#book',
        text: 'Schedule Time with Me',
        color: '#3b82f6',
        textColor: '#ffffff'
      }, options);

      // Check if badge already exists
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
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
        CalendlyRecreate.initPopupWidget({ url: opts.url });
      });

      document.body.appendChild(badge);
    },

    initPopupWidget: function(options) {
      const opts = Object.assign({
        url: window.location.origin + '/#book'
      }, options);

      // Remove existing overlay if any
      const existing = document.getElementById('calendly-recreate-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'calendly-recreate-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(9, 13, 22, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        transition: opacity 0.2s ease-out;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #101726;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        width: 100%;
        max-width: 1040px;
        height: 680px;
        max-height: 90vh;
        overflow: hidden;
        position: relative;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
      `;

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 16px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: background 0.15s ease;
      `;

      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'rgba(255, 255, 255, 0.2)'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'rgba(255, 255, 255, 0.1)'; });

      const closePopup = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
      };

      closeBtn.addEventListener('click', closePopup);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePopup();
      });

      const iframe = document.createElement('iframe');
      iframe.src = opts.url;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;

      modal.appendChild(closeBtn);
      modal.appendChild(iframe);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });
    }
  };

  window.CalendlyRecreate = CalendlyRecreate;
})(window, document);
