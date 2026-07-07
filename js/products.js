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

  /* ---------------- Product card template ---------------- */

  function stockBadge(stock) {
    if (stock <= 0) return '<span class="stock-badge out">' + SBA.i18n.t("products.outOfStock") + "</span>";
    if (stock <= 5) return '<span class="stock-badge low">' + SBA.i18n.t("products.lowStock", { n: stock }) + "</span>";
    return '<span class="stock-badge">' + SBA.i18n.t("products.inStock") + "</span>";
  }

  SBA.productCardHTML = function (p, index) {
    var disabled = p.stock <= 0;
    var name = SBA.i18n.pick(p.name);
    var description = SBA.i18n.pick(p.description);
    var categoryLabel = SBA.getCategoryLabel(p.category);
    var badge = "";
    if (p.bestSeller) badge = '<span class="product-badge best">' + SBA.i18n.t("products.badgeBest") + "</span>";
    else if (p.featured) badge = '<span class="product-badge">' + SBA.i18n.t("products.badgeFeatured") + "</span>";

    return (
      '<article class="product-card" style="animation-delay:' + Math.min(index * 0.04, 0.4) + 's" data-id="' + SBA.escapeHTML(p.id) + '">' +
        '<div class="product-media">' +
          badge +
          '<img src="' + SBA.escapeHTML(p.image) + '" alt="' + SBA.escapeHTML(name) + '" loading="lazy" width="320" height="240">' +
          stockBadge(p.stock) +
        "</div>" +
        '<div class="product-body">' +
          '<span class="product-category">' + SBA.escapeHTML(categoryLabel) + "</span>" +
          '<h3 class="product-name">' + SBA.escapeHTML(name) + "</h3>" +
          '<p class="product-desc">' + SBA.escapeHTML(description) + "</p>" +
          '<div class="product-footer">' +
            '<div class="product-price">' + SBA.formatPrice(p.price) + "</div>" +
          "</div>" +
          '<div class="product-row-actions">' +
            '<div class="qty-stepper" role="group" aria-label="' + SBA.i18n.t("checkout.commune") + '">' +
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
  };

  /** Wires qty steppers + add-to-cart buttons within a container (event delegation). */
  SBA.wireProductCardEvents = function (container, products) {
    if (container.dataset.sbaWired === "1") return; // avoid double-binding on re-render
    container.dataset.sbaWired = "1";
    container.addEventListener("click", function (e) {
      var card = e.target.closest(".product-card");
      if (!card) return;
      var id = card.dataset.id;
      var product = products.find(function (p) { return p.id === id; });
      if (!product) return;

      var qtyInput = card.querySelector(".qty-value");

      if (e.target.closest(".qty-inc")) {
        var next = Math.min(parseInt(qtyInput.value, 10) + 1, product.stock || 99);
        qtyInput.value = next;
      } else if (e.target.closest(".qty-dec")) {
        var prev = Math.max(parseInt(qtyInput.value, 10) - 1, 1);
        qtyInput.value = prev;
      } else if (e.target.closest(".add-cart-btn")) {
        var btn = e.target.closest(".add-cart-btn");
        var qty = parseInt(qtyInput.value, 10) || 1;
        SBA.cart.add(product, qty);
        btn.classList.remove("added");
        void btn.offsetWidth;
        btn.classList.add("added");
        SBA.toast(SBA.i18n.t("products.addedToast", { qty: qty, name: SBA.i18n.pick(product.name) }));
        qtyInput.value = 1;
      }
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
