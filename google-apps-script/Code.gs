/**
 * ============================================================================
 * SOUK BABA ALI — Order intake backend (Google Apps Script)
 * ============================================================================
 * WHAT THIS SCRIPT DOES
 * 1. Receives an order (JSON) sent by the website's checkout page.
 * 2. Appends one row per order into the "Orders" sheet of this spreadsheet.
 * 3. Sends a formatted notification to a Telegram chat.
 * 4. Returns { status: "success", orderId: "..." } back to the website.
 *
 * HOW TO USE (see README.md for the full step-by-step guide)
 * 1. Open Google Sheets, create a new spreadsheet (e.g. "Souk Baba Ali — Orders").
 * 2. Go to Extensions > Apps Script, delete the placeholder code, and paste
 *    this entire file in.
 * 3. Fill in TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID below.
 * 4. Click Deploy > New deployment > type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy the generated Web App URL (ends with /exec).
 * 6. Paste that URL into js/api.js as SCRIPT_URL.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// CONFIGURATION — edit these two lines only
// ---------------------------------------------------------------------------
var TELEGRAM_BOT_TOKEN = "PASTE_YOUR_TELEGRAM_BOT_TOKEN_HERE";
var TELEGRAM_CHAT_ID   = "PASTE_YOUR_TELEGRAM_CHAT_ID_HERE";

// Name of the sheet (tab) where orders are stored. Created automatically
// with headers if it does not exist yet.
var SHEET_NAME = "Orders";

var SHEET_HEADERS = [
  "Timestamp", "Order ID", "Customer Name", "Phone", "Secondary Phone",
  "Commune", "Address", "Landmark", "Notes", "Products JSON", "Total", "Status"
];

// ---------------------------------------------------------------------------
// Entry point — called by the website on every "Place Order" click
// ---------------------------------------------------------------------------
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    validateOrder(data);

    var orderId = generateOrderId();
    appendOrderRow(orderId, data);
    sendTelegramNotification(orderId, data);

    return jsonResponse({ status: "success", orderId: orderId });
  } catch (err) {
    return jsonResponse({ status: "error", message: String(err && err.message || err) });
  }
}

// Lets you sanity-check the deployment by opening the /exec URL in a browser.
function doGet(e) {
  return jsonResponse({ status: "ok", message: "Souk Baba Ali order endpoint is running." });
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateOrder(data) {
  var required = ["firstName", "lastName", "phone", "commune", "address", "products", "total"];
  required.forEach(function (field) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new Error("Champ manquant : " + field);
    }
  });
  if (!Array.isArray(data.products) || data.products.length === 0) {
    throw new Error("La commande ne contient aucun produit.");
  }
}

// ---------------------------------------------------------------------------
// Order ID generator — sequential, zero-padded (e.g. #000145)
// Stored as a script property so it survives across executions.
// ---------------------------------------------------------------------------
function generateOrderId() {
  var props = PropertiesService.getScriptProperties();
  var last = parseInt(props.getProperty("LAST_ORDER_NUMBER") || "0", 10);
  var next = last + 1;
  props.setProperty("LAST_ORDER_NUMBER", String(next));
  return "#" + String(next).padStart(6, "0");
}

// ---------------------------------------------------------------------------
// Google Sheets — append one row per order
// ---------------------------------------------------------------------------
function getOrdersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendOrderRow(orderId, data) {
  var sheet = getOrdersSheet();
  var productsSummary = JSON.stringify(data.products);

  sheet.appendRow([
    new Date(),
    orderId,
    data.firstName + " " + data.lastName,
    data.phone,
    data.secondaryPhone || "",
    data.commune,
    data.address,
    data.landmark || "",
    (data.notes || "") + (data.deliverySlot ? " | Créneau : " + data.deliverySlot : ""),
    productsSummary,
    data.total,
    "Pending"
  ]);
}

// ---------------------------------------------------------------------------
// Telegram notification
// ---------------------------------------------------------------------------
function sendTelegramNotification(orderId, data) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.indexOf("PASTE_YOUR") === 0) {
    return; // Telegram not configured yet — skip silently
  }

  var productLines = data.products.map(function (p) {
    return p.qty + " x " + p.name;
  }).join("\n");

  var message =
    "🛒 NOUVELLE COMMANDE\n\n" +
    "Commande :\n" + orderId + "\n\n" +
    "Client :\n" + data.firstName + " " + data.lastName + "\n\n" +
    "Téléphone :\n" + data.phone + (data.secondaryPhone ? " / " + data.secondaryPhone : "") + "\n\n" +
    "Commune :\n" + data.commune + "\n\n" +
    "Adresse :\n" + data.address + "\n\n" +
    (data.landmark ? "Repère :\n" + data.landmark + "\n\n" : "") +
    "Produits :\n" + productLines + "\n\n" +
    "Total :\n" + data.total + " DZD\n\n" +
    (data.deliverySlot ? "Créneau :\n" + data.deliverySlot + "\n\n" : "") +
    (data.notes ? "Notes :\n" + data.notes : "");

  var url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
  var payload = { chat_id: TELEGRAM_CHAT_ID, text: message };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

// ---------------------------------------------------------------------------
// Helper — JSON response with the right content type
// ---------------------------------------------------------------------------
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
