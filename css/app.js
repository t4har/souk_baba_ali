/* ==========================================================================
   app.js — shared utilities loaded on every page
   Namespace: window.SBA (Souk Baba Ali)
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  /* ---------------- Constants ---------------- */
  SBA.CART_KEY = "sba_cart_v1";
  SBA.ORDER_KEY = "sba_last_order_v1";
  SBA.CURRENCY = "DZD";

  /* ---------------- Helpers ---------------- */

  SBA.formatPrice = function (value) {
    return Number(value).toLocaleString("fr-FR") + " " + SBA.CURRENCY;
  };

  SBA.escapeHTML = function (str) {
    var div = document.createElement("div");
    div.textContent = String(str == null ? "" : str);
    return div.innerHTML;
  };

  SBA.qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  SBA.qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------- Toast notifications ---------------- */

  SBA.toast = function (message, opts) {
    opts = opts || {};
    var el = SBA.qs("#sba-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "sba-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>' +
      "<span>" + SBA.escapeHTML(message) + "</span>";
    el.classList.add("show");
    clearTimeout(SBA._toastTimer);
    SBA._toastTimer = setTimeout(function () {
      el.classList.remove("show");
    }, opts.duration || 2200);
  };

  /* ---------------- Button ripple effect ---------------- */

  function attachRipple(btn) {
    btn.addEventListener("click", function (e) {
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement("span");
      var size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
  }

  function initRipples() {
    SBA.qsa(".btn").forEach(attachRipple);
  }

  /* ---------------- Mobile nav toggle ---------------- */

  function initNavToggle() {
    var toggle = SBA.qs(".nav-toggle");
    var nav = SBA.qs(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    SBA.qsa("a", nav).forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Footer year ---------------- */

  function initFooterYear() {
    SBA.qsa("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------------- Cart badge sync (every page) ---------------- */

  SBA.updateCartBadge = function (bump) {
    var badge = SBA.qs("#cart-count");
    if (!badge) return;
    var count = SBA.cart ? SBA.cart.getCount() : 0;
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
    if (bump) {
      badge.classList.remove("bump");
      // eslint-disable-next-line no-unused-expressions
      void badge.offsetWidth; // restart animation
      badge.classList.add("bump");
    }
  };

  /* ---------------- Header search (global, redirects to products page) ---------------- */

  function initHeaderSearch() {
    var form = SBA.qs("#header-search-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = SBA.qs("input", form);
      var value = (input.value || "").trim();
      window.location.href = "products.html" + (value ? "?q=" + encodeURIComponent(value) : "");
    });
  }

  /* ---------------- Init on DOM ready ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    initRipples();
    initNavToggle();
    initFooterYear();
    initHeaderSearch();
    SBA.updateCartBadge(false);
  });
})(window.SBA);
