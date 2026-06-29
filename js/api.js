/* ==========================================================================
   api.js — connects the static site to the Google Apps Script backend
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  // Google Apps Script Web App URL
  var SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxM7eUGAGhdoTGuQZb7Lc0comMRNs7YAkjEl6lBMxW_L529Hso9AYYV9b1943nHuzpY/exec";

  SBA.api = {
    /**
     * Sends the order to the Apps Script endpoint.
     */
    submitOrder: function (orderPayload) {
      // Verify that the Apps Script URL exists
      if (!SCRIPT_URL) {
        return Promise.reject(new Error("CONFIG_MISSING"));
      }

      return fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(orderPayload),
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("HTTP_" + res.status);
          }
          return res.json();
        })
        .then(function (data) {
          if (!data || data.status !== "success") {
            throw new Error((data && data.message) || "UNKNOWN_ERROR");
          }

          return data;
        })
        .catch(function (err) {
          console.error("Apps Script Error:", err);
          throw err;
        });
    },
  };
})(window.SBA);
