/* ==========================================================================
   checkout.js — checkout form, order summary, submission to Apps Script
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  /**
   * Delivery communes. To add a new delivery zone in the future,
   * just add a new string to this array — nothing else needs to change.
   */
  SBA.COMMUNES = [
    "Baba Ali",
    "Baraki",
    "Birkhadem",
    "Birtouta",
    "Bir Mourad Raïs",
    "Douéra",
    "Draria",
    "El Achour",
    "Gué de Constantine",
    "Khraïcia",
    "Les Eucalyptus",
    "Saoula"
  ];

  SBA.DELIVERY_SLOTS = [
    "Dès que possible",
    "Matin (9h - 12h)",
    "Après-midi (12h - 17h)",
    "Soirée (17h - 21h)"
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
    select.innerHTML =
      '<option value="" disabled selected>Choisissez votre commune</option>' +
      SBA.COMMUNES.map(function (c) {
        return '<option value="' + SBA.escapeHTML(c) + '">' + SBA.escapeHTML(c) + "</option>";
      }).join("");
  }

  function populateDeliverySlots() {
    var wrap = SBA.qs("#delivery-slots");
    if (!wrap) return;
    wrap.innerHTML = SBA.DELIVERY_SLOTS.map(function (slot, i) {
      var id = "slot-" + i;
      return (
        '<label class="radio-pill" for="' + id + '">' +
          '<input type="radio" name="deliverySlot" id="' + id + '" value="' + SBA.escapeHTML(slot) + '" ' + (i === 0 ? "checked" : "") + ">" +
          SBA.escapeHTML(slot) +
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
          '<span class="name">' + SBA.escapeHTML(it.name) + "</span>" +
          '<span class="price">' + SBA.formatPrice(it.qty * it.price) + "</span>" +
        "</div>"
      );
    }).join("");

    var total = items.reduce(function (s, it) { return s + it.qty * it.price; }, 0);
    var count = items.reduce(function (s, it) { return s + it.qty; }, 0);
    if (totalEl) totalEl.textContent = SBA.formatPrice(total);
    if (countEl) countEl.textContent = count + (count === 1 ? " article" : " articles");
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

  var ERROR_MESSAGES = {
    firstName: "Veuillez indiquer votre prénom.",
    lastName: "Veuillez indiquer votre nom.",
    phone: "Numéro invalide. Format attendu : 05/06/07XXXXXXXX.",
    secondaryPhone: "Numéro invalide. Format attendu : 05/06/07XXXXXXXX.",
    commune: "Veuillez choisir une commune de livraison.",
    address: "Veuillez indiquer une adresse plus précise."
  };

  function validateField(field) {
    var name = field.name;
    var validator = VALIDATORS[name];
    if (!validator) return true;

    var valid = validator(field.value);
    var fieldWrap = field.closest(".form-field");
    var errorEl = fieldWrap ? fieldWrap.querySelector(".field-error") : null;

    if (fieldWrap) fieldWrap.classList.toggle("has-error", !valid);
    if (errorEl) errorEl.textContent = valid ? "" : ERROR_MESSAGES[name];
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
        SBA.toast("Merci de corriger les champs en rouge");
        return;
      }

      var currentItems = SBA.cart.getItems();
      if (currentItems.length === 0) {
        SBA.toast("Votre panier est vide");
        return;
      }

      var submitBtn = SBA.qs("#submit-order");
      var btnLabel = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Envoi en cours…';
      }

      var fd = new FormData(form);
      var localOrderId = generateLocalOrderId();
      var total = currentItems.reduce(function (s, it) { return s + it.qty * it.price; }, 0);

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
          return { id: it.id, name: it.name, qty: it.qty, price: it.price, subtotal: it.qty * it.price };
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
            SBA.toast("Configuration manquante : ajoutez l'URL du Apps Script dans js/api.js");
          } else {
            SBA.toast("Échec de l'envoi de la commande. Réessayez ou appelez-nous.");
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

  document.addEventListener("DOMContentLoaded", function () {
    initCheckoutPage();
    initConfirmationPage();
  });
})(window.SBA);
