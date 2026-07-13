/* ==========================================================================
   api.js — connects the static site to the Google Apps Script backend
   ==========================================================================
   HOW TO CONFIGURE:
   1. Deploy the Apps Script (see /google-apps-script/Code.gs and README.md).
   2. Copy the Web App URL you get after deployment (ends with /exec).
   3. Paste it below as SCRIPT_URL.
   That's the ONLY change needed to connect the site to your Google Sheet
   and Telegram notifications. No other code needs to be touched.
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxM7eUGAGhdoTGuQZb7Lc0comMRNs7YAkjEl6lBMxW_L529Hso9AYYV9b1943nHuzpY/exec";

  SBA.api = {
    /**
     * Sends the order to the Apps Script endpoint.
     * Uses Content-Type: text/plain on purpose — this keeps the request a
     * CORS "simple request" so the browser does not send an OPTIONS
     * preflight, which Apps Script web apps cannot answer. The script reads
     * the raw body and JSON.parse()s it itself (see Code.gs).
     */
    submitOrder: function (orderPayload) {
      if (!SCRIPT_URL || SCRIPT_URL.indexOf("AKfycbxM7eUGAGhdoTGuQZb7Lc0comMRNs7YAkjEl6lBMxW_L529Hso9AYYV9b1943nHuzpY") !== -1) {
        return Promise.reject(new Error("CONFIG_MISSING"));
      }

      return fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(orderPayload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP_" + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!data || data.status !== "success") {
            throw new Error((data && data.message) || "UNKNOWN_ERROR");
          }
          return data; // { status: 'success', orderId: '...' }
        });
    }
  };
})(window.SBA);
