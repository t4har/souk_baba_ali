/* ==========================================================================
   checkout.js — checkout form, order summary, submission to Apps Script
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  /**
   * Delivery communes. To add a new delivery zone in the future, add a new
   * { fr, ar } entry — nothing else needs to change. The French label is
   * used as the submitted value (so Google Sheets / Telegram messages stay
   * in one consistent language regardless of which UI language the
   * customer used); the displayed label follows the active language.
   */
  SBA.COMMUNES = [
    { fr: "Baba Ali", ar: "بابا علي" },
    { fr: "Baraki", ar: "براقي" },
    { fr: "Birkhadem", ar: "بئر خادم" },
    { fr: "Birtouta", ar: "بئر توتة" },
    { fr: "Bir Mourad Raïs", ar: "بئر مراد رايس" },
    { fr: "Douéra", ar: "الدويرة" },
    { fr: "Draria", ar: "درارية" },
    { fr: "El Achour", ar: "العاشور" },
    { fr: "Gué de Constantine", ar: "قنطرة قسنطينة" },
    { fr: "Khraïcia", ar: "خرايسية" },
    { fr: "Les Eucalyptus", ar: "الكاليتوس" },
    { fr: "Saoula", ar: "سعولة" }
  ];

  SBA.DELIVERY_SLOTS = [
    { fr: "Dès que possible", ar: "في أقرب وقت ممكن" },
    { fr: "Matin (9h - 12h)", ar: "صباحًا (9 - 12)" },
    { fr: "Après-midi (12h - 17h)", ar: "بعد الظهر (12 - 17)" },
    { fr: "Soirée (17h - 21h)", ar: "مساءً (17 - 21)" }
  ];

  function initCheckoutPage() {
    var form = SBA.qs("#checkout-form");
    if (!form) return; // not on checkout page

    var items = SBA.cart.getItems();
    if (items.length === 0) {
      var emptyNotice = SBA.qs("#checkout-empty");
      if (emptyNotice) emptyNotice.hidden = false;
      form.hidden = true;
      var summaryCard = SBA.qs("#checkout-summary");
      if (summaryCard) summaryCard.hidden = true;
      return;
    }

    populateCommunes();
    populateDeliverySlots();
    renderOrderSummary(items);
    wireFormValidation(form);
    wireSubmit(form, items);
  }

  function populateCommunes() {
    var select = SBA.qs("#commune-select");
    if (!select) return;
    var current = select.value;
    select.innerHTML =
      '<option value="" disabled ' + (current ? "" : "selected") + '>' + SBA.i18n.t("checkout.communePlaceholder") + "</option>" +
      SBA.COMMUNES.map(function (c) {
        var label = SBA.i18n.pick(c);
        return '<option value="' + SBA.escapeHTML(c.fr) + '" ' + (c.fr === current ? "selected" : "") + ">" + SBA.escapeHTML(label) + "</option>";
      }).join("");
  }

  function populateDeliverySlots() {
    var wrap = SBA.qs("#delivery-slots");
    if (!wrap) return;
    var checkedValue = (SBA.qs('input[name="deliverySlot"]:checked', wrap) || {}).value;
    wrap.innerHTML = SBA.DELIVERY_SLOTS.map(function (slot, i) {
      var id = "slot-" + i;
      var label = SBA.i18n.pick(slot);
      var isChecked = checkedValue ? slot.fr === checkedValue : i === 0;
      return (
        '<label class="radio-pill" for="' + id + '">' +
          '<input type="radio" name="deliverySlot" id="' + id + '" value="' + SBA.escapeHTML(slot.fr) + '" ' + (isChecked ? "checked" : "") + ">" +
          SBA.escapeHTML(label) +
        "</label>"
      );
    }).join("");
  }

  function renderOrderSummary(items) {
    var listEl = SBA.qs("#order-summary-list");
    var totalEl = SBA.qs("#order-summary-total");
    var countEl = SBA.qs("#order-summary-count");
    if (!listEl) return;

    listEl.innerHTML = items.map(function (it) {
      return (
        '<div class="order-summary-item">' +
          '<span class="qty">' + it.qty + "×</span>" +
          '<span class="name">' + SBA.escapeHTML(SBA.i18n.pick(it.name)) + "</span>" +
          '<span class="price">' + SBA.formatPrice(it.qty * it.price) + "</span>" +
        "</div>"
      );
    }).join("");

    var total = items.reduce(function (s, it) { return s + it.qty * it.price; }, 0);
    var count = items.reduce(function (s, it) { return s + it.qty; }, 0);
    if (totalEl) totalEl.textContent = SBA.formatPrice(total);
    if (countEl) countEl.textContent = count === 1 ? SBA.i18n.t("cart.itemsOne") : SBA.i18n.t("cart.itemsMany", { n: count });
  }

  /* ---------------- Validation ---------------- */

  var PHONE_REGEX = /^0[5-7][0-9]{8}$/; // Algerian mobile format e.g. 0550123456

  var VALIDATORS = {
    firstName: function (v) { return v.trim().length >= 2; },
    lastName: function (v) { return v.trim().length >= 2; },
    phone: function (v) { return PHONE_REGEX.test(v.trim()); },
    secondaryPhone: function (v) { return v.trim() === "" || PHONE_REGEX.test(v.trim()); },
    commune: function (v) { return v.trim() !== ""; },
    address: function (v) { return v.trim().length >= 5; }
  };

  var ERROR_KEYS = {
    firstName: "checkout.errFirstName",
    lastName: "checkout.errLastName",
    phone: "checkout.errPhone",
    secondaryPhone: "checkout.errPhone",
    commune: "checkout.errCommune",
    address: "checkout.errAddress"
  };

  function validateField(field) {
    var name = field.name;
    var validator = VALIDATORS[name];
    if (!validator) return true;

    var valid = validator(field.value);
    var fieldWrap = field.closest(".form-field");
    var errorEl = fieldWrap ? fieldWrap.querySelector(".field-error") : null;

    if (fieldWrap) fieldWrap.classList.toggle("has-error", !valid);
    if (errorEl) errorEl.textContent = valid ? "" : SBA.i18n.t(ERROR_KEYS[name]);
    return valid;
  }

  function wireFormValidation(form) {
    Object.keys(VALIDATORS).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        var fieldWrap = field.closest(".form-field");
        if (fieldWrap && fieldWrap.classList.contains("has-error")) validateField(field);
      });
    });
  }

  function validateForm(form) {
    var allValid = true;
    Object.keys(VALIDATORS).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      if (!validateField(field)) allValid = false;
    });
    return allValid;
  }

  /* ---------------- Submission ---------------- */

  function generateLocalOrderId() {
    var n = Math.floor(100000 + Math.random() * 900000);
    return "BA" + n;
  }

  function wireSubmit(form, items) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!validateForm(form)) {
        var firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
        if (firstError) firstError.focus();
        SBA.toast(SBA.i18n.t("checkout.fixErrorsToast"));
        return;
      }

      var currentItems = SBA.cart.getItems();
      if (currentItems.length === 0) {
        SBA.toast(SBA.i18n.t("checkout.emptyCartToast"));
        return;
      }

      var submitBtn = SBA.qs("#submit-order");
      var btnLabel = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> ' + SBA.i18n.t("checkout.submitting");
      }

      var fd = new FormData(form);
      var localOrderId = generateLocalOrderId();
      var total = currentItems.reduce(function (s, it) { return s + it.qty * it.price; }, 0);

      // Product names are sent in French regardless of the customer's UI
      // language, so the Google Sheet / Telegram notification stay in one
      // consistent language for the store's staff.
      var payload = {
        orderId: localOrderId,
        timestamp: new Date().toISOString(),
        firstName: fd.get("firstName").trim(),
        lastName: fd.get("lastName").trim(),
        phone: fd.get("phone").trim(),
        secondaryPhone: (fd.get("secondaryPhone") || "").trim(),
        commune: fd.get("commune"),
        address: fd.get("address").trim(),
        landmark: (fd.get("landmark") || "").trim(),
        notes: (fd.get("notes") || "").trim(),
        deliverySlot: fd.get("deliverySlot"),
        products: currentItems.map(function (it) {
          return { id: it.id, name: SBA.i18n.pick(it.name, "fr"), qty: it.qty, price: it.price, subtotal: it.qty * it.price };
        }),
        total: total
      };

      SBA.api.submitOrder(payload)
        .then(function (response) {
          var finalOrderId = (response && response.orderId) || localOrderId;
          try {
            localStorage.setItem(SBA.ORDER_KEY, JSON.stringify(Object.assign({}, payload, { orderId: finalOrderId })));
          } catch (err) { /* ignore storage errors */ }
          SBA.cart.clear();
          window.location.href = "confirmation.html";
        })
        .catch(function (err) {
          console.error("Order submission failed:", err);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = btnLabel;
          }
          if (err && err.message === "CONFIG_MISSING") {
            SBA.toast(SBA.i18n.t("checkout.configMissingToast"));
          } else {
            SBA.toast(SBA.i18n.t("checkout.failToast"));
          }
        });
    });
  }

  /* ---------------- Confirmation page ---------------- */

  function initConfirmationPage() {
    var idEl = SBA.qs("#confirmation-order-id");
    var listEl = SBA.qs("#confirmation-items");
    var totalEl = SBA.qs("#confirmation-total");
    var nameEl = SBA.qs("#confirmation-name");
    var addressEl = SBA.qs("#confirmation-address");
    var noOrderEl = SBA.qs("#confirmation-no-order");
    var detailsEl = SBA.qs("#confirmation-details");
    if (!idEl && !noOrderEl) return; // not on confirmation page

    var raw;
    try { raw = localStorage.getItem(SBA.ORDER_KEY); } catch (e) { raw = null; }

    if (!raw) {
      if (detailsEl) detailsEl.hidden = true;
      if (noOrderEl) noOrderEl.hidden = false;
      return;
    }

    var order;
    try { order = JSON.parse(raw); } catch (e) { order = null; }
    if (!order) {
      if (detailsEl) detailsEl.hidden = true;
      if (noOrderEl) noOrderEl.hidden = false;
      return;
    }

    if (idEl) idEl.textContent = "#" + order.orderId;
    if (nameEl) nameEl.textContent = order.firstName + " " + order.lastName;
    if (addressEl) {
      addressEl.textContent = order.address + ", " + order.commune +
        (order.landmark ? " — " + order.landmark : "");
    }
    if (listEl) {
      listEl.innerHTML = order.products.map(function (p) {
        return (
          '<div class="order-summary-item">' +
            '<span class="qty">' + p.qty + "×</span>" +
            '<span class="name">' + SBA.escapeHTML(p.name) + "</span>" +
            '<span class="price">' + SBA.formatPrice(p.subtotal) + "</span>" +
          "</div>"
        );
      }).join("");
    }
    if (totalEl) totalEl.textContent = SBA.formatPrice(order.total);
  }

  /* ---------------- Home page: delivery zone chips ---------------- */

  var ZONE_PIN_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>';

  function renderZoneList() {
    var listEl = SBA.qs("#zone-list");
    if (!listEl) return; // not on home page
    listEl.innerHTML = SBA.COMMUNES.map(function (c) {
      return '<li class="zone-chip">' + ZONE_PIN_SVG + SBA.escapeHTML(SBA.i18n.pick(c)) + "</li>";
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    initCheckoutPage();
    initConfirmationPage();
    renderZoneList();
  });
  document.addEventListener("languagechange", function () {
    // Re-render whichever parts are present on the current page.
    var form = SBA.qs("#checkout-form");
    if (form && !form.hidden) {
      populateCommunes();
      populateDeliverySlots();
      renderOrderSummary(SBA.cart.getItems());
      SBA.qsa(".has-error", form).forEach(function (wrap) {
        var field = wrap.querySelector("input, select, textarea");
        if (field) validateField(field);
      });
    }
    renderZoneList();
  });
})(window.SBA);
