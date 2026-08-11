/* ==========================================================================
   products.js — product & category catalog loading and rendering
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  SBA.catalog = {
    products: [],
    categories: [],
    loaded: false
  };

  /** Loads products.json + categories.json once and caches them. */
  SBA.loadCatalog = function () {
    if (SBA.catalog.loaded) return Promise.resolve(SBA.catalog);
    return Promise.all([
      fetch("data/products.json").then(function (r) {
        if (!r.ok) throw new Error("products.json HTTP " + r.status);
        return r.json();
      }),
      fetch("data/categories.json").then(function (r) {
        if (!r.ok) throw new Error("categories.json HTTP " + r.status);
        return r.json();
      })
    ]).then(function (results) {
      SBA.catalog.products = results[0];
      SBA.catalog.categories = results[1];
      SBA.catalog.loaded = true;
      return SBA.catalog;
    });
  };

  /* ---------------- Shared card helpers ---------------- */

  function stockBadge(stock) {
    if (stock <= 0) return '<span class="stock-badge out">' + SBA.i18n.t("products.outOfStock") + "</span>";
    if (stock <= 5) return '<span class="stock-badge low">' + SBA.i18n.t("products.lowStock", { n: stock }) + "</span>";
    return '<span class="stock-badge">' + SBA.i18n.t("products.inStock") + "</span>";
  }

  /** Calculates the price for a given weight selection. Returns an integer (DA). */
  function calcWeightPrice(pricePerKg, weightG) {
    return Math.round(pricePerKg * weightG / 1000);
  }

  /** Builds the shared article opening + media section (used by both card types). */
  function cardMedia(p, index, name, badge) {
    return (
      '<article class="product-card" style="animation-delay:' + Math.min(index * 0.04, 0.4) + 's"' +
        ' data-id="' + SBA.escapeHTML(p.id) + '"' +
        (p.soldByWeight ? ' data-sold-by-weight="1" data-price-per-kg="' + p.pricePerKg + '"' : '') + '>' +
        '<div class="product-media">' +
          badge +
          '<img src="' + SBA.escapeHTML(p.image) + '" alt="' + SBA.escapeHTML(name) + '" loading="lazy" width="320" height="240">' +
          stockBadge(p.stock) +
        "</div>"
    );
  }

  /* ---------------- Regular product card (sold by unit) ---------------- */

  function unitCardHTML(p, index, name, description, categoryLabel, badge, disabled) {
    return (
      cardMedia(p, index, name, badge) +
        '<div class="product-body">' +
          '<span class="product-category">' + SBA.escapeHTML(categoryLabel) + "</span>" +
          '<h3 class="product-name">' + SBA.escapeHTML(name) + "</h3>" +
          '<p class="product-desc">' + SBA.escapeHTML(description) + "</p>" +
          '<div class="product-footer">' +
            '<div class="product-price">' + SBA.formatPrice(p.price) + "</div>" +
          "</div>" +
          '<div class="product-row-actions">' +
            '<div class="qty-stepper" role="group">' +
              '<button type="button" class="qty-dec" aria-label="-" ' + (disabled ? "disabled" : "") + ">−</button>" +
              '<input type="text" class="qty-value" value="1" inputmode="numeric" readonly>' +
              '<button type="button" class="qty-inc" aria-label="+" ' + (disabled ? "disabled" : "") + ">+</button>" +
            "</div>" +
            '<button type="button" class="add-cart-btn" aria-label="' + SBA.i18n.t("products.addAria") + '" ' + (disabled ? "disabled" : "") + ">" +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h15l-1.5 9h-12L5 3H2"/><circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/></svg>' +
            "</button>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ---------------- Weight-based product card ---------------- */

  var DEFAULT_WEIGHT = 250; // grams pre-selected when card renders

  function weightCardHTML(p, index, name, description, categoryLabel, badge, disabled) {
    var defaultPrice = SBA.formatPrice(calcWeightPrice(p.pricePerKg, DEFAULT_WEIGHT));
    var customPlaceholder = SBA.i18n.t("weight.customPlaceholder");
    var addLabel = SBA.i18n.t("weight.addBtn");
    var perKgLabel = SBA.i18n.t("weight.perKg");

    return (
      cardMedia(p, index, name, badge) +
        '<div class="product-body">' +
          '<span class="product-category">' + SBA.escapeHTML(categoryLabel) + "</span>" +
          '<h3 class="product-name">' + SBA.escapeHTML(name) + "</h3>" +
          '<p class="product-desc">' + SBA.escapeHTML(description) + "</p>" +

          /* Price-per-kg display */
          '<div class="product-price">' +
            SBA.formatPrice(p.pricePerKg) +
            '<small class="per-kg-label">' + SBA.escapeHTML(perKgLabel) + "</small>" +
          "</div>" +

          /* Weight selector */
          '<div class="weight-selector">' +
            '<div class="weight-quick-btns" role="group" aria-label="Poids">' +
              '<button type="button" class="weight-quick-btn" data-weight="100" aria-pressed="false">100 g</button>' +
              '<button type="button" class="weight-quick-btn" data-weight="250" aria-pressed="true">250 g</button>' +
              '<button type="button" class="weight-quick-btn" data-weight="500" aria-pressed="false">500 g</button>' +
            "</div>" +
            '<div class="weight-selector-row">' +
              '<input type="number" class="weight-custom-input" placeholder="' + SBA.escapeHTML(customPlaceholder) + '" min="50" step="50" aria-label="' + SBA.escapeHTML(customPlaceholder) + '">' +
              '<span class="weight-price-preview" aria-live="polite">' + defaultPrice + "</span>" +
            "</div>" +
            '<span class="weight-error"></span>' +
          "</div>" +

          '<button type="button" class="add-cart-btn-weight" ' + (disabled ? "disabled" : "") + ">" +
            SBA.escapeHTML(addLabel) +
          "</button>" +
        "</div>" +
      "</article>"
    );
  }

  /* ---------------- Public card renderer — branches on soldByWeight ---------------- */

  SBA.productCardHTML = function (p, index) {
    var disabled    = p.stock <= 0;
    var name        = SBA.i18n.pick(p.name);
    var description = SBA.i18n.pick(p.description);
    var catLabel    = SBA.getCategoryLabel(p.category);
    var badge       = "";
    if (p.bestSeller) badge = '<span class="product-badge best">' + SBA.i18n.t("products.badgeBest") + "</span>";
    else if (p.featured) badge = '<span class="product-badge">' + SBA.i18n.t("products.badgeFeatured") + "</span>";

    return p.soldByWeight
      ? weightCardHTML(p, index, name, description, catLabel, badge, disabled)
      : unitCardHTML(p, index, name, description, catLabel, badge, disabled);
  };

  /* ---------------- Event wiring — handles both card types ---------------- */

  /** Reads the currently selected weight (g) from a weight-based card.
   *  Returns null if the value is invalid (< 50 g). */
  function getSelectedWeight(card) {
    var activeBtn = card.querySelector(".weight-quick-btn[aria-pressed='true']");
    var customInput = card.querySelector(".weight-custom-input");
    var errorEl = card.querySelector(".weight-error");
    var weightG;

    if (customInput && customInput.value.trim() !== "") {
      weightG = parseInt(customInput.value, 10);
    } else if (activeBtn) {
      weightG = parseInt(activeBtn.dataset.weight, 10);
    } else {
      weightG = DEFAULT_WEIGHT;
    }

    if (!weightG || weightG < 50) {
      if (errorEl) errorEl.textContent = SBA.i18n.t("weight.minError");
      return null;
    }
    if (errorEl) errorEl.textContent = "";
    return weightG;
  }

  /** Updates the live price preview inside a weight card. */
  function updateWeightPreview(card, pricePerKg) {
    var weightG = getSelectedWeight(card);
    var preview = card.querySelector(".weight-price-preview");
    if (!preview) return;
    if (weightG) {
      preview.textContent = SBA.formatPrice(calcWeightPrice(pricePerKg, weightG));
    }
  }

  SBA.wireProductCardEvents = function (container, products) {
    if (container.dataset.sbaWired === "1") return; // guard against double-binding
    container.dataset.sbaWired = "1";

    /* ── click handler (unit qty stepper, weight quick-btns, both add-to-cart) ── */
    container.addEventListener("click", function (e) {
      var card = e.target.closest(".product-card");
      if (!card) return;
      var id = card.dataset.id;
      var product = products.find(function (p) { return p.id === id; });
      if (!product) return;

      /* === Weight-based card events === */
      if (product.soldByWeight) {
        var pricePerKg = product.pricePerKg;

        /* Quick-weight button toggle */
        var quickBtn = e.target.closest(".weight-quick-btn");
        if (quickBtn) {
          card.querySelectorAll(".weight-quick-btn").forEach(function (b) {
            b.setAttribute("aria-pressed", b === quickBtn ? "true" : "false");
          });
          var customInput = card.querySelector(".weight-custom-input");
          if (customInput) customInput.value = ""; // clear custom when quick-btn chosen
          updateWeightPreview(card, pricePerKg);
          return;
        }

        /* Add-to-cart button */
        if (e.target.closest(".add-cart-btn-weight")) {
          var btn = e.target.closest(".add-cart-btn-weight");
          var weightG = getSelectedWeight(card);
          if (!weightG) return; // validation failed — error shown by getSelectedWeight

          var calculatedPrice = calcWeightPrice(pricePerKg, weightG);

          // Build a synthetic cart product keyed by id + weight so that
          // 250 g and 500 g of the same cheese are two separate cart entries.
          var cartProduct = {
            id:          product.id + "_" + weightG + "g",
            productId:   product.id,
            name:        product.name,
            image:       product.image,
            stock:       product.stock,
            soldByWeight: true,
            weightG:     weightG,
            pricePerKg:  pricePerKg,
            price:       calculatedPrice   // unit price = price for this weight
          };
          SBA.cart.add(cartProduct, 1);

          btn.classList.remove("added");
          void btn.offsetWidth;
          btn.classList.add("added");
          SBA.toast(
            SBA.i18n.t("products.addedToast", {
              qty:  weightG + " g",
              name: SBA.i18n.pick(product.name)
            })
          );
          return;
        }
        return; // ignore other clicks inside weight cards
      }

      /* === Unit-based card events === */
      var qtyInput = card.querySelector(".qty-value");

      if (e.target.closest(".qty-inc")) {
        qtyInput.value = Math.min(parseInt(qtyInput.value, 10) + 1, product.stock || 99);
      } else if (e.target.closest(".qty-dec")) {
        qtyInput.value = Math.max(parseInt(qtyInput.value, 10) - 1, 1);
      } else if (e.target.closest(".add-cart-btn")) {
        var addBtn = e.target.closest(".add-cart-btn");
        var qty = parseInt(qtyInput.value, 10) || 1;
        SBA.cart.add(product, qty);
        addBtn.classList.remove("added");
        void addBtn.offsetWidth;
        addBtn.classList.add("added");
        SBA.toast(SBA.i18n.t("products.addedToast", { qty: qty, name: SBA.i18n.pick(product.name) }));
        qtyInput.value = 1;
      }
    });

    /* ── input handler — live price preview for custom weight field ── */
    container.addEventListener("input", function (e) {
      var customInput = e.target.closest(".weight-custom-input");
      if (!customInput) return;
      var card = customInput.closest(".product-card");
      if (!card) return;

      // Deactivate all quick-weight buttons while user types a custom value
      card.querySelectorAll(".weight-quick-btn").forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });

      var pricePerKg = parseFloat(card.dataset.pricePerKg);
      if (pricePerKg) updateWeightPreview(card, pricePerKg);
    });
  };

  /* ---------------- Category helpers ---------------- */

  /** Looks up a category's localized label from its slug (p.category is
   *  stored as a slug, e.g. "lait", so cards/filters/breadcrumbs stay
   *  stable across language switches). Falls back to the slug itself if
   *  the catalog hasn't loaded yet. */
  SBA.getCategoryLabel = function (slug) {
    var cat = (SBA.catalog.categories || []).find(function (c) { return c.slug === slug; });
    return cat ? SBA.i18n.pick(cat.name) : slug;
  };

  SBA.categoryCardHTML = function (cat) {
    var label = SBA.i18n.pick(cat.name);
    return (
      '<a class="category-card" href="products.html?category=' + encodeURIComponent(cat.slug) + '">' +
        '<img src="' + SBA.escapeHTML(cat.icon) + '" alt="" loading="lazy" width="52" height="52">' +
        "<span>" + SBA.escapeHTML(label) + "</span>" +
      "</a>"
    );
  };

  /* ---------------- Home page sections ---------------- */

  function renderHomeSections() {
    var featuredEl = SBA.qs("#featured-grid");
    var bestEl = SBA.qs("#bestseller-grid");
    var catEl = SBA.qs("#category-grid");
    if (!featuredEl && !bestEl && !catEl) return; // not on home page

    SBA.loadCatalog().then(function (data) {
      if (catEl) {
        catEl.innerHTML = data.categories.map(SBA.categoryCardHTML).join("");
      }
      if (featuredEl) {
        var featured = data.products.filter(function (p) { return p.featured; }).slice(0, 8);
        featuredEl.innerHTML = featured.map(SBA.productCardHTML).join("");
        SBA.wireProductCardEvents(featuredEl, data.products);
      }
      if (bestEl) {
        var best = data.products.filter(function (p) { return p.bestSeller; }).slice(0, 8);
        bestEl.innerHTML = best.map(SBA.productCardHTML).join("");
        SBA.wireProductCardEvents(bestEl, data.products);
      }
    }).catch(function (err) {
      console.error(err);
      [featuredEl, bestEl].forEach(function (el) {
        if (el) el.innerHTML = '<p class="text-muted">Impossible de charger les produits pour le moment.</p>';
      });
    });
  }

  document.addEventListener("DOMContentLoaded", renderHomeSections);
  document.addEventListener("languagechange", renderHomeSections);
})(window.SBA);
