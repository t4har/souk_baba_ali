# Souk Baba Ali — Online Supermarket Website

A complete, **100% free**, static online ordering website for a small supermarket in Baba Ali, Algeria. Built with plain **HTML, CSS and vanilla JavaScript** only — no frameworks, no backend server, no database. Orders are stored in **Google Sheets** and notified instantly via **Telegram**, using **Google Apps Script** as the only "backend".

Payment is **cash on delivery only**. Customers do not create accounts.

---

## 1. Project structure

```
/
├── index.html              Home page
├── products.html           Full product catalog with search/filter/sort
├── cart.html                Shopping cart
├── checkout.html            Delivery form + order summary
├── confirmation.html        Order confirmation
├── privacy.html             Privacy policy
├── robots.txt
├── sitemap.xml
├── css/
│   ├── style.css            Design tokens, layout, components
│   └── responsive.css       Breakpoints for tablet/mobile
├── js/
│   ├── app.js                Shared utilities (nav, toasts, ripple, cart badge)
│   ├── api.js                 Connects the site to Google Apps Script
│   ├── cart.js                 LocalStorage cart logic + cart page rendering
│   ├── products.js            Loads products.json, renders product/category cards
│   ├── search.js               Live search, category filter, sorting
│   └── checkout.js             Checkout form, validation, order submission
├── data/
│   ├── products.json         ← Edit this file to add/remove/change products
│   └── categories.json        Category list (icons + names)
├── images/
│   ├── products/              One placeholder image per product (SVG)
│   ├── categories/             One icon per category (SVG)
│   └── assets/                  Logo, favicon, hero illustration, OG image
├── google-apps-script/
│   └── Code.gs                The Apps Script source — copy/paste into Google Sheets
└── README.md                  This file
```

Everything runs as static files. There is no build step — you can open `index.html`
directly in a browser, or host the folder as-is on GitHub Pages / Cloudflare Pages.

---

## 2. Run it locally

Because the pages load `data/products.json` with `fetch()`, opening `index.html`
directly from disk (`file://`) will be blocked by the browser's CORS rules for
local files. Use any simple local server instead, for example:

```bash
# Python 3
python3 -m http.server 8080

# or, with Node.js installed
npx serve .
```

Then open `http://localhost:8080` in your browser.

---

## 3. Host it for free on GitHub Pages

1. Create a new GitHub repository (e.g. `souk-baba-ali`).
2. Upload all the files in this project to the repository (keep the folder
   structure exactly as it is).
3. In the repository, go to **Settings > Pages**.
4. Under "Build and deployment", choose **Deploy from a branch**, select the
   `main` branch and the `/ (root)` folder, then click **Save**.
5. After a minute, GitHub gives you a URL like
   `https://your-username.github.io/souk-baba-ali/` — that's your live site.

## 3bis. Or host it for free on Cloudflare Pages

1. Push the project to a GitHub (or GitLab) repository as above.
2. Go to the Cloudflare dashboard > **Workers & Pages > Create application > Pages**.
3. Connect your repository.
4. Build settings: leave the build command **empty** and the output directory
   as `/` (this is a static site, nothing to build).
5. Click **Save and Deploy**. Cloudflare gives you a `*.pages.dev` URL.

Both options are entirely free for a small business site like this one.

---

## 4. Set up Google Sheets (order storage)

1. Go to [Google Sheets](https://sheets.google.com) and create a new, blank
   spreadsheet. Name it something like **"Souk Baba Ali — Orders"**.
2. That's it for now — the Apps Script in the next step will automatically
   create an "Orders" tab with the right column headers the first time an
   order comes in.

---

## 5. Deploy the Google Apps Script backend

1. In the spreadsheet you just created, click **Extensions > Apps Script**.
2. Delete any placeholder code in the editor (the default `function myFunction(){}`).
3. Open the file [`google-apps-script/Code.gs`](google-apps-script/Code.gs) from
   this project, copy its entire contents, and paste it into the Apps Script
   editor.
4. Near the top of the script, fill in:
   ```js
   var TELEGRAM_BOT_TOKEN = "PASTE_YOUR_TELEGRAM_BOT_TOKEN_HERE";
   var TELEGRAM_CHAT_ID   = "PASTE_YOUR_TELEGRAM_CHAT_ID_HERE";
   ```
   (See section 6 below to get these two values. You can leave them as
   placeholders for now and come back later — orders will still be saved
   to the spreadsheet either way.)
5. Click **Deploy > New deployment**.
6. Click the gear icon next to "Select type" and choose **Web app**.
7. Configure:
   - **Execute as:** Me
   - **Who has access:** Anyone
8. Click **Deploy**. The first time, Google will ask you to authorize the
   script — click through the consent screens (you'll see an "unverified
   app" warning because this is your own personal script; this is expected
   and safe for your own script).
9. Copy the **Web app URL** shown (it ends with `/exec`).

### Connect the website to your deployment

Open [`js/api.js`](js/api.js) and replace this line:

```js
var SCRIPT_URL = "https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec";
```

with the URL you just copied. Save the file, re-upload it (or push to GitHub),
and your checkout page is now connected to your Google Sheet.

> **Important:** every time you choose "Deploy > New deployment" again (rather
> than "Manage deployments > Edit > New version" on the *same* deployment),
> Google gives you a **new** URL. If you redeploy, remember to update
> `js/api.js` with the new URL.

---

## 6. Create a Telegram bot and get your Chat ID

### Create the bot

1. Open Telegram and search for **@BotFather**.
2. Send `/newbot` and follow the prompts (choose a name and a username
   ending in `bot`, e.g. `SoukBabaAliBot`).
3. BotFather replies with a **bot token** that looks like
   `123456789:AAExampleTokenValue`. Copy it — this is your
   `TELEGRAM_BOT_TOKEN`.

### Get your Chat ID

1. Start a conversation with your new bot (search for its username and send
   it any message, e.g. "hello").
2. In your browser, visit:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   (replace `<YOUR_BOT_TOKEN>` with the token from BotFather).
3. Look for `"chat":{"id":123456789, ...}` in the response — that number is
   your `TELEGRAM_CHAT_ID`.
   - If you want order notifications in a **group chat** instead of a
     private chat, add the bot to the group first, send a message in the
     group, then repeat step 2 — the chat id for a group is usually a
     negative number.
4. Paste both values into `Code.gs` as shown in section 5, then re-deploy
   (**Manage deployments > Edit > New version**) so the change takes effect.

### Example notification your team will receive

```
🛒 NOUVELLE COMMANDE

Commande :
#000145

Client :
Ahmed Benali

Téléphone :
0550123456

Commune :
Douéra

Adresse :
Rue ...

Repère :
Près de la mosquée

Produits :
2 x Lait
1 x Fromage
4 x Pain

Total :
1850 DZD

Notes :
Appeler avant d'arriver
```

---

## 7. Managing products (no coding required)

All products live in [`data/products.json`](data/products.json). To add,
edit or remove a product, just edit this file — no other file needs to
change.

Each product looks like this:

```json
{
  "id": "P037",
  "name": { "fr": "Lait Entier Candia 1L", "ar": "حليب كامل كانديا 1 لتر" },
  "category": "lait",
  "description": { "fr": "Lait entier UHT, riche et onctueux.", "ar": "حليب كامل معقم، غني وقوامه كريمي." },
  "price": 180,
  "image": "images/products/P037.svg",
  "stock": 30,
  "featured": false,
  "bestSeller": false
}
```

- `id` must be unique (e.g. `P037`).
- `name` and `description` are **bilingual objects** — the site reads
  whichever language is active and falls back to French if a translation is
  ever missing. You can leave `ar` identical to `fr` for a new product
  until you have a translation; it just won't be localized yet.
- `category` must match a category **slug** (not the display name) from
  `data/categories.json`, e.g. `"lait"`, `"fromage"`, `"epicerie"`.
- `image` can point to any image file — drop a real product photo into
  `images/products/` and reference it here (JPG, PNG, WEBP and SVG all work).
- `featured: true` shows the product in the homepage's "Produits vedettes"
  section; `bestSeller: true` shows it in "Meilleures ventes".
- Set `stock` to `0` to automatically show "Rupture de stock" / "غير متوفر"
  and disable the add-to-cart button for that product.

To add a brand-new category, add an entry to `data/categories.json`:

```json
{ "slug": "boulangerie", "name": { "fr": "Boulangerie", "ar": "مخبزة" }, "icon": "images/categories/boulangerie.svg" }
```

(Use any square icon image for `icon` — even a placeholder works.)

---

## 8. Managing delivery communes

The list of delivery communes lives in **one place**:
[`js/checkout.js`](js/checkout.js), near the top:

```js
SBA.COMMUNES = [
  { fr: "Baba Ali", ar: "بابا علي" },
  { fr: "Baraki", ar: "براقي" },
  // ...
];
```

To add or remove a delivery zone, just edit this array — the checkout
page's dropdown and the homepage's delivery-zone chip list both rebuild
from it automatically in both languages, no other change needed. The
French label (`fr`) is what gets submitted to Google Sheets / Telegram,
regardless of which language the customer used to order — this keeps
order records in one consistent language for the store's staff.

---

## 9. Bilingual support (French / Arabic)

The site ships with a language toggle button in the header of every page
(look for the globe icon next to the cart button). Switching language:

- Updates every static UI string instantly, **without reloading the
  page** (button labels, headings, form labels, toasts, error messages…).
- Updates every dynamic piece of content already on screen — product
  names/descriptions, category names, cart items, communes, delivery time
  slots — by re-reading their bilingual `{ fr, ar }` fields.
- Switches `<html dir>` between `ltr` and `rtl` and mirrors the layout
  accordingly (the cart sheet, search icons, badges, the price "stamp" on
  the hero, etc. all have explicit RTL-aware positioning).
- Swaps the typeface: **Poppins-style Inter/Fraunces** for French headings
  stay as-is, while **Cairo** (a font with proper Arabic glyphs) takes over
  automatically once Arabic is active.
- Remembers the choice in `localStorage`, so returning visitors see the
  site in the language they last used.

### How it's implemented

- [`js/language.js`](js/language.js) is the single source of truth for
  every static UI string, in a `STRINGS` dictionary keyed by `fr`/`ar`. It
  must load **before** `app.js`/`cart.js`/`products.js`/`search.js`/
  `checkout.js` on every page (already wired this way) since those modules
  call `SBA.i18n.t()` / `SBA.i18n.pick()` while rendering.
- Static text in HTML uses `data-i18n="key"` (text content),
  `data-i18n-html="key"` (innerHTML, for the one heading that contains an
  `<em>` tag), `data-i18n-placeholder="key"` (input placeholders) or
  `data-i18n-aria="key"` (aria-labels).
- Bilingual data fields (`{ fr: "...", ar: "..." }`) are read with
  `SBA.i18n.pick(field)`, which returns whichever language is active.
- A `languagechange` event fires on every switch; each module that renders
  dynamic content (cart, products, search results, checkout form, the
  homepage's delivery-zone list) listens for it and re-renders in place.

### Adding a new UI string

1. Add a key to the `STRINGS` object in `js/language.js`:
   ```js
   "mySection.myLabel": { fr: "Mon texte", ar: "نصي" },
   ```
2. Reference it in HTML: `<span data-i18n="mySection.myLabel">Mon texte</span>`
   (the French text inside the tag is just a fallback shown before JS runs).
3. Or reference it in JS: `SBA.i18n.t("mySection.myLabel")`.

### Adding a translation for a new product/category/commune

Just fill in the `ar` field alongside `fr` wherever the bilingual schema is
used — `data/products.json`, `data/categories.json`, and the `COMMUNES` /
`DELIVERY_SLOTS` arrays in `js/checkout.js`. No other file needs touching.

---

## 10. Customization quick reference

| What you want to change          | Where to edit it                          |
|-----------------------------------|--------------------------------------------|
| Products, prices, stock           | `data/products.json` (bilingual `name`/`description`) |
| Categories                        | `data/categories.json` (bilingual `name`) |
| Delivery communes                 | `js/checkout.js` (`SBA.COMMUNES`, bilingual) |
| Static UI text (FR/AR)            | `js/language.js` (`STRINGS` dictionary)   |
| Colors, fonts, spacing             | `css/style.css` (`:root` CSS variables at the top) |
| Apps Script endpoint URL           | `js/api.js` (`SCRIPT_URL`)                |
| Telegram bot token / chat ID        | `google-apps-script/Code.gs`              |
| Phone number / contact info shown   | Footer section of every `.html` page      |
| Site text, page titles              | Directly inside each `.html` file          |

---

## 11. Browser support & accessibility

- Works on all modern browsers (Chrome, Firefox, Safari, Edge) on desktop,
  tablet and mobile.
- Fully responsive layout down to small phone screens.
- Semantic HTML, labelled form fields, keyboard-navigable menus, visible
  focus states, and `prefers-reduced-motion` support.
- Lazy-loaded images (`loading="lazy"`) for fast page loads.
- Full RTL layout support for Arabic, including mirrored icons/badges and
  a right-to-left reading order throughout.

---

## 12. Known limitations (by design, to stay 100% free and static)

- There is no real-time stock sync between multiple browser tabs/devices —
  stock numbers come from `products.json` and are not decremented
  automatically after an order. Update `stock` manually in the JSON file as
  needed, or extend `Code.gs` to write stock changes back to a sheet if you
  later want that automation.
- The order ID counter is stored in the Apps Script project's properties.
  If you ever delete and recreate the script from scratch, the counter
  restarts from `#000001`.
- This project ships with placeholder product photos (clean SVG icons in the
  site's color palette). Replace them with real product photos any time by
  swapping files in `images/products/` and updating the `image` field in
  `products.json` — no code changes required.
- Product names sent to Google Sheets / Telegram are always recorded in
  French, regardless of which language the customer ordered in, so the
  store's order log stays in one consistent language.

---

## 13. Support

For questions about this codebase, check the comments at the top of each
JavaScript file — every module is documented inline.
