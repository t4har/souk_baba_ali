/* ==========================================================================
   cart.js — persistent shopping cart (localStorage) + cart page rendering
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  function readCart() {
    try {
      var raw = localStorage.getItem(SBA.CART_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Cart read error:", e);
      return [];
    }
  }

  function writeCart(items) {
    try {
      localStorage.setItem(SBA.CART_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Cart write error:", e);
    }
  }

  SBA.cart = {
    getItems: readCart,

    getCount: function () {
      return readCart().reduce(function (sum, it) { return sum + it.qty; }, 0);
    },

    getTotal: function () {
      return readCart().reduce(function (sum, it) { return sum + it.qty * it.price; }, 0);
    },

    /** Adds a product to the cart, or increases qty if it's already in it. */
    add: function (product, qty) {
      qty = Math.max(1, parseInt(qty, 10) || 1);
      var items = readCart();
      var existing = items.find(function (it) { return it.id === product.id; });
      var maxQty = typeof product.stock === "number" ? product.stock : Infinity;

      if (existing) {
        existing.qty = Math.min(existing.qty + qty, maxQty);
      } else {
        items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          qty: Math.min(qty, maxQty)
        });
      }
      writeCart(items);
      SBA.updateCartBadge(true);
      return items;
    },

    setQty: function (id, qty) {
      var items = readCart();
      var item = items.find(function (it) { return it.id === id; });
      if (!item) return items;
      var maxQty = typeof item.stock === "number" ? item.stock : Infinity;
      qty = Math.max(1, Math.min(parseInt(qty, 10) || 1, maxQty));
      item.qty = qty;
      writeCart(items);
      SBA.updateCartBadge(false);
      return items;
    },

    increment: function (id) {
      var items = readCart();
      var item = items.find(function (it) { return it.id === id; });
      if (!item) return items;
      var maxQty = typeof item.stock === "number" ? item.stock : Infinity;
      item.qty = Math.min(item.qty + 1, maxQty);
      writeCart(items);
      SBA.updateCartBadge(false);
      return items;
    },

    decrement: function (id) {
      var items = readCart();
      var item = items.find(function (it) { return it.id === id; });
      if (!item) return items;
      item.qty -= 1;
      if (item.qty <= 0) {
        items = items.filter(function (it) { return it.id !== id; });
      }
      writeCart(items);
      SBA.updateCartBadge(false);
      return items;
    },

    remove: function (id) {
      var items = readCart().filter(function (it) { return it.id !== id; });
      writeCart(items);
      SBA.updateCartBadge(false);
      return items;
    },

    clear: function () {
      writeCart([]);
      SBA.updateCartBadge(false);
      return [];
    }
  };

  /* ---------------- Cart page rendering ---------------- */

  function cartItemTemplate(item) {
    var subtotal = item.qty * item.price;
    var name = SBA.i18n.pick(item.name);
    return (
      '<li class="cart-item" data-id="' + SBA.escapeHTML(item.id) + '">' +
        '<img src="' + SBA.escapeHTML(item.image) + '" alt="' + SBA.escapeHTML(name) + '" loading="lazy" width="84" height="84">' +
        '<div class="cart-item-info">' +
          "<h3>" + SBA.escapeHTML(name) + "</h3>" +
          '<div class="unit-price">' + SBA.formatPrice(item.price) + SBA.i18n.t("cart.itemUnit") + "</div>" +
          '<div class="qty-stepper" role="group" aria-label="' + SBA.escapeHTML(name) + '">' +
            '<button type="button" class="qty-dec" aria-label="-">−</button>' +
            '<input type="text" class="qty-value" value="' + item.qty + '" inputmode="numeric" readonly>' +
            '<button type="button" class="qty-inc" aria-label="+">+</button>' +
          "</div>" +
        "</div>" +
        '<div class="cart-item-controls">' +
          '<div class="cart-item-subtotal">' + SBA.formatPrice(subtotal) + "</div>" +
          '<button type="button" class="cart-item-remove">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
            SBA.i18n.t("cart.remove") +
          "</button>" +
        "</div>" +
      "</li>"
    );
  }

  function renderCartPage() {
    var listEl = SBA.qs("#cart-list");
    var emptyEl = SBA.qs("#cart-empty");
    var summaryEl = SBA.qs("#cart-summary");
    if (!listEl) return; // not on cart page

    var items = readCart();

    if (items.length === 0) {
      listEl.innerHTML = "";
      listEl.hidden = true;
      if (emptyEl) emptyEl.hidden = false;
      if (summaryEl) summaryEl.hidden = true;
      return;
    }

    listEl.hidden = false;
    if (emptyEl) emptyEl.hidden = true;
    if (summaryEl) summaryEl.hidden = false;

    listEl.innerHTML = items.map(cartItemTemplate).join("");
    updateSummary(items);
  }

  function updateSummary(items) {
    var count = items.reduce(function (s, it) { return s + it.qty; }, 0);
    var total = items.reduce(function (s, it) { return s + it.qty * it.price; }, 0);
    var elCount = SBA.qs("#summary-count");
    var elTotal = SBA.qs("#summary-total");
    var elCheckoutBtn = SBA.qs("#go-checkout");
    if (elCount) elCount.textContent = count === 1 ? SBA.i18n.t("cart.itemsOne") : SBA.i18n.t("cart.itemsMany", { n: count });
    if (elTotal) elTotal.textContent = SBA.formatPrice(total);
    if (elCheckoutBtn) elCheckoutBtn.toggleAttribute("disabled", count === 0);
  }

  function initCartPageEvents() {
    var listEl = SBA.qs("#cart-list");
    if (!listEl) return;

    listEl.addEventListener("click", function (e) {
      var li = e.target.closest(".cart-item");
      if (!li) return;
      var id = li.dataset.id;

      if (e.target.closest(".qty-inc")) {
        SBA.cart.increment(id);
        renderCartPage();
      } else if (e.target.closest(".qty-dec")) {
        SBA.cart.decrement(id);
        renderCartPage();
      } else if (e.target.closest(".cart-item-remove")) {
        SBA.cart.remove(id);
        renderCartPage();
        SBA.toast(SBA.i18n.t("cart.removedToast"));
      }
    });

    var clearBtn = SBA.qs("#clear-cart");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (confirm(SBA.i18n.t("cart.clearConfirm"))) {
          SBA.cart.clear();
          renderCartPage();
          SBA.toast(SBA.i18n.t("cart.clearedToast"));
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCartPage();
    initCartPageEvents();
  });
  document.addEventListener("languagechange", renderCartPage);
})(window.SBA);
