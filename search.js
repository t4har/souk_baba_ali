/* ==========================================================================
   search.js — products page: live search, category filter, sorting
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  function getURLParam(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
  }

  function normalize(str) {
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function initProductsPage() {
    var grid = SBA.qs("#product-grid");
    if (!grid) return; // not on products page

    var searchInput = SBA.qs("#search-input");
    var categorySelect = SBA.qs("#category-select");
    var sortSelect = SBA.qs("#sort-select");
    var chipsWrap = SBA.qs("#category-chips");
    var resultsMeta = SBA.qs("#results-meta");
    var emptyState = SBA.qs("#empty-state");

    var state = {
      query: getURLParam("q"),
      category: getURLParam("category"),
      sort: "default"
    };

    SBA.loadCatalog().then(function (data) {
      populateCategoryControls(data.categories);
      if (searchInput) searchInput.value = state.query;
      if (categorySelect) categorySelect.value = state.category;
      syncChips();
      renderResults(data.products);

      if (searchInput) {
        searchInput.addEventListener("input", debounce(function () {
          state.query = searchInput.value.trim();
          renderResults(data.products);
        }, 180));
      }
      if (categorySelect) {
        categorySelect.addEventListener("change", function () {
          state.category = categorySelect.value;
          syncChips();
          renderResults(data.products);
        });
      }
      if (sortSelect) {
        sortSelect.addEventListener("change", function () {
          state.sort = sortSelect.value;
          renderResults(data.products);
        });
      }
      if (chipsWrap) {
        chipsWrap.addEventListener("click", function (e) {
          var chip = e.target.closest(".chip-filter");
          if (!chip) return;
          state.category = chip.dataset.category || "";
          if (categorySelect) categorySelect.value = state.category;
          syncChips();
          renderResults(data.products);
        });
      }

      SBA.wireProductCardEvents(grid, data.products);
    }).catch(function (err) {
      console.error(err);
      grid.innerHTML = '<p class="text-muted">Impossible de charger les produits pour le moment. Vérifiez votre connexion et réessayez.</p>';
    });

    function populateCategoryControls(categories) {
      if (categorySelect) {
        categorySelect.innerHTML =
          '<option value="">Toutes les catégories</option>' +
          categories.map(function (c) {
            return '<option value="' + SBA.escapeHTML(c.name) + '">' + SBA.escapeHTML(c.name) + "</option>";
          }).join("");
      }
      if (chipsWrap) {
        chipsWrap.innerHTML =
          '<button type="button" class="chip-filter" data-category="" aria-pressed="true">Tout</button>' +
          categories.map(function (c) {
            return '<button type="button" class="chip-filter" data-category="' + SBA.escapeHTML(c.name) + '" aria-pressed="false">' + SBA.escapeHTML(c.name) + "</button>";
          }).join("");
      }
    }

    function syncChips() {
      if (!chipsWrap) return;
      SBA.qsa(".chip-filter", chipsWrap).forEach(function (chip) {
        var isActive = (chip.dataset.category || "") === state.category;
        chip.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function applyFilters(products) {
      var q = normalize(state.query);
      return products.filter(function (p) {
        var matchesQuery = !q ||
          normalize(p.name).indexOf(q) !== -1 ||
          normalize(p.description).indexOf(q) !== -1 ||
          normalize(p.category).indexOf(q) !== -1;
        var matchesCategory = !state.category || p.category === state.category;
        return matchesQuery && matchesCategory;
      });
    }

    function applySort(products) {
      var sorted = products.slice();
      switch (state.sort) {
        case "price-asc":
          sorted.sort(function (a, b) { return a.price - b.price; });
          break;
        case "price-desc":
          sorted.sort(function (a, b) { return b.price - a.price; });
          break;
        case "name-asc":
          sorted.sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); });
          break;
        case "name-desc":
          sorted.sort(function (a, b) { return b.name.localeCompare(a.name, "fr"); });
          break;
        default:
          break; // keep catalog order
      }
      return sorted;
    }

    function renderResults(products) {
      var filtered = applySort(applyFilters(products));

      if (resultsMeta) {
        resultsMeta.textContent = filtered.length + (filtered.length === 1 ? " produit trouvé" : " produits trouvés");
      }

      if (filtered.length === 0) {
        grid.innerHTML = "";
        if (emptyState) emptyState.hidden = false;
        return;
      }
      if (emptyState) emptyState.hidden = true;

      grid.innerHTML = filtered.map(SBA.productCardHTML).join("");
    }
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, delay);
    };
  }

  document.addEventListener("DOMContentLoaded", initProductsPage);
})(window.SBA);
