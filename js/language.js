/* ==========================================================================
   language.js — FR / AR support for Souk Baba Ali.
   Loaded FIRST (before app.js/cart.js/products.js/search.js/checkout.js),
   since those modules call SBA.i18n.t()/pick() while rendering.

   - Static UI strings: translated via data-i18n / data-i18n-placeholder /
     data-i18n-aria attributes in the HTML (see applyStaticStrings()).
   - Dynamic content (product/category names, communes, cart items) is
     translated wherever it's rendered, by reading the bilingual {fr, ar}
     fields already present in data/products.json, data/categories.json,
     and the COMMUNES/DELIVERY_SLOTS lists in js/checkout.js. Switching
     language fires a "languagechange" event so those renderers refresh
     in place — no page reload.
   ========================================================================== */

window.SBA = window.SBA || {};

(function (SBA) {
  "use strict";

  var STORAGE_KEY = "sba_lang";
  var DEFAULT_LANG = "fr";

  var STRINGS = {
    "nav.home": { fr: "Accueil", ar: "الرئيسية" },
    "nav.products": { fr: "Produits", ar: "المنتجات" },
    "nav.categories": { fr: "Catégories", ar: "الفئات" },
    "nav.delivery": { fr: "Livraison", ar: "التوصيل" },
    "nav.privacy": { fr: "Confidentialité", ar: "الخصوصية" },
    "nav.searchPlaceholder": { fr: "Rechercher un produit…", ar: "ابحث عن منتج…" },
    "nav.cartAria": { fr: "Voir le panier", ar: "عرض السلة" },
    "nav.openMenuAria": { fr: "Ouvrir le menu", ar: "فتح القائمة" },
    "nav.langToggleAria": { fr: "Changer de langue", ar: "تغيير اللغة" },
    "nav.langToggleLabel": { fr: "العربية", ar: "Français" },
    "nav.tagline": { fr: "Épicerie & supermarché", ar: "بقالة وسوبر ماركت" },

    "hero.eyebrow": { fr: "Livraison à Baba Ali & 11 communes voisines", ar: "التوصيل إلى بابا علي و11 بلدية مجاورة" },
    "hero.titleHtml": { fr: "Vos courses, <em>livrées chez vous</em>, payées à la réception.", ar: "تسوقاتك، <em>تُوصَّل إلى بيتك</em>، وتُدفع عند الاستلام." },
    "hero.lead": { fr: "Lait, fromage, épicerie, produits ménagers et plus encore — commandez en ligne, sans création de compte, et payez en espèces à la livraison.", ar: "حليب، جبن، بقالة، منتجات منزلية وأكثر — اطلب عبر الإنترنت بدون إنشاء حساب، وادفع نقدًا عند التسليم." },
    "hero.ctaProducts": { fr: "Voir les produits", ar: "تصفح المنتجات" },
    "hero.ctaHow": { fr: "Comment ça marche", ar: "كيف يعمل الموقع" },
    "hero.stat1": { fr: "produits disponibles", ar: "منتج متوفر" },
    "hero.stat2": { fr: "communes livrées", ar: "بلدية مشمولة بالتوصيل" },
    "hero.stat3": { fr: "de frais d'inscription", ar: "رسوم تسجيل" },
    "hero.stampTop": { fr: "Paiement", ar: "الدفع" },
    "hero.stampBottom": { fr: "à la livraison", ar: "عند التسليم" },

    "promo.title": { fr: "Livraison gratuite dès 3000 DA d'achat", ar: "توصيل مجاني عند الشراء بـ 3000 دج فأكثر" },
    "promo.desc": { fr: "Profitez de la livraison offerte sur toutes les commandes de plus de 3000 DA dans les 12 communes desservies.", ar: "استفيدوا من التوصيل المجاني على كل الطلبات التي تتجاوز 3000 دج في 12 بلدية مشمولة." },
    "promo.cta": { fr: "Commander maintenant", ar: "اطلب الآن" },

    "categories.eyebrow": { fr: "Rayons", ar: "الأقسام" },
    "categories.title": { fr: "Parcourir par catégorie", ar: "تصفح حسب الفئة" },
    "categories.desc": { fr: "18 rayons d'épicerie et de produits du quotidien, des produits laitiers aux produits d'hygiène.", ar: "18 قسمًا للبقالة والمنتجات اليومية، من منتجات الحليب إلى منتجات النظافة." },
    "categories.seeAll": { fr: "Tout voir", ar: "عرض الكل" },
    "categories.loading": { fr: "Chargement des catégories…", ar: "جاري تحميل الفئات…" },

    "featured.eyebrow": { fr: "Sélection", ar: "اختيار" },
    "featured.title": { fr: "Produits vedettes", ar: "منتجات مميزة" },
    "featured.desc": { fr: "Une sélection de produits incontournables, choisis pour vous chaque semaine.", ar: "تشكيلة من المنتجات الأساسية، نختارها لكم كل أسبوع." },
    "featured.seeAll": { fr: "Tous les produits", ar: "كل المنتجات" },
    "loading.products": { fr: "Chargement des produits…", ar: "جاري تحميل المنتجات…" },

    "bestsellers.eyebrow": { fr: "Tendance", ar: "الأكثر طلبًا" },
    "bestsellers.title": { fr: "Meilleures ventes", ar: "الأكثر مبيعًا" },
    "bestsellers.desc": { fr: "Les produits préférés de nos clients à Baba Ali et dans les communes voisines.", ar: "المنتجات المفضلة لعملائنا في بابا علي والبلديات المجاورة." },

    "why.eyebrow": { fr: "Pourquoi nous choisir", ar: "لماذا تختارنا" },
    "why.title": { fr: "Une épicerie de quartier, en ligne", ar: "بقالة الحي، عبر الإنترنت" },
    "why.cod.title": { fr: "Paiement à la livraison", ar: "الدفع عند التسليم" },
    "why.cod.desc": { fr: "Réglez en espèces directement au livreur. Aucune carte bancaire, aucun compte requis.", ar: "ادفع نقدًا مباشرة للموصل. بدون بطاقة بنكية وبدون حساب." },
    "why.fast.title": { fr: "Livraison rapide", ar: "توصيل سريع" },
    "why.fast.desc": { fr: "Commandes préparées et livrées le jour même dans les 12 communes desservies.", ar: "يتم تحضير الطلبات وتوصيلها في نفس اليوم عبر 12 بلدية." },
    "why.quality.title": { fr: "Qualité garantie", ar: "جودة مضمونة" },
    "why.quality.desc": { fr: "Des produits frais et de marques reconnues, sélectionnés avec le même soin qu'en magasin.", ar: "منتجات طازجة وماركات معروفة، نختارها بعناية كما في المتجر." },
    "why.noAccount.title": { fr: "Sans inscription", ar: "بدون تسجيل" },
    "why.noAccount.desc": { fr: "Commandez en quelques clics, sans créer de compte ni partager plus d'informations que nécessaire.", ar: "اطلب بنقرات قليلة، بدون إنشاء حساب أو مشاركة معلومات أكثر من اللازم." },

    "zones.eyebrow": { fr: "Zone de livraison", ar: "منطقة التوصيل" },
    "zones.title": { fr: "Nous livrons dans 12 communes", ar: "نوصّل إلى 12 بلدية" },
    "zones.desc": { fr: "Votre commune n'apparaît pas ? Contactez-nous, nous étendons régulièrement notre zone de livraison.", ar: "بلديتك غير موجودة؟ اتصل بنا، فنحن نوسّع منطقة التوصيل بانتظام." },

    "footer.tagline": { fr: "Votre supermarché de quartier en ligne. Produits frais et d'épicerie, livrés chez vous, payés à la livraison.", ar: "سوبر ماركت حيك عبر الإنترنت. منتجات طازجة وبقالة، تُوصَّل إلى بيتك وتُدفع عند التسليم." },
    "footer.shop": { fr: "Boutique", ar: "المتجر" },
    "footer.allProducts": { fr: "Tous les produits", ar: "كل المنتجات" },
    "footer.cart": { fr: "Mon panier", ar: "سلتي" },
    "footer.info": { fr: "Informations", ar: "معلومات" },
    "footer.privacy": { fr: "Politique de confidentialité", ar: "سياسة الخصوصية" },
    "footer.zones": { fr: "Zones de livraison", ar: "مناطق التوصيل" },
    "footer.contact": { fr: "Contact", ar: "اتصل بنا" },
    "footer.address": { fr: "Baba Ali, Wilaya de Blida", ar: "بابا علي، ولاية البليدة" },
    "footer.rights": { fr: "Tous droits réservés.", ar: "جميع الحقوق محفوظة." },
    "footer.codOnly": { fr: "Paiement à la livraison uniquement · Sans création de compte", ar: "الدفع عند التسليم فقط · بدون إنشاء حساب" },

    "breadcrumb.home": { fr: "Accueil", ar: "الرئيسية" },
    "breadcrumb.products": { fr: "Produits", ar: "المنتجات" },
    "breadcrumb.cart": { fr: "Panier", ar: "السلة" },
    "breadcrumb.checkout": { fr: "Commande", ar: "الطلب" },
    "breadcrumb.privacy": { fr: "Confidentialité", ar: "الخصوصية" },

    "products.pageTitle": { fr: "Tous les produits", ar: "كل المنتجات" },
    "products.toolbarSearchPlaceholder": { fr: "Rechercher par nom, description, catégorie…", ar: "البحث بالاسم أو الوصف أو الفئة…" },
    "products.allCategories": { fr: "Toutes les catégories", ar: "كل الفئات" },
    "products.sortDefault": { fr: "Tri par défaut", ar: "الترتيب الافتراضي" },
    "products.sortPriceAsc": { fr: "Prix croissant", ar: "السعر: من الأقل" },
    "products.sortPriceDesc": { fr: "Prix décroissant", ar: "السعر: من الأعلى" },
    "products.sortNameAsc": { fr: "Nom A → Z", ar: "الاسم: أ ← ي" },
    "products.sortNameDesc": { fr: "Nom Z → A", ar: "الاسم: ي ← أ" },
    "products.chipAll": { fr: "Tout", ar: "الكل" },
    "products.emptyTitle": { fr: "Aucun produit trouvé", ar: "لم يتم العثور على منتج" },
    "products.emptyDesc": { fr: "Essayez un autre mot-clé ou une autre catégorie.", ar: "جرّب كلمة مفتاحية أو فئة أخرى." },
    "products.resultsCount": { fr: "{n} produits trouvés", ar: "{n} منتج موجود" },
    "products.resultCountSingular": { fr: "{n} produit trouvé", ar: "{n} منتج موجود" },
    "products.inStock": { fr: "En stock", ar: "متوفر" },
    "products.lowStock": { fr: "Plus que {n}", ar: "تبقّى {n} فقط" },
    "products.outOfStock": { fr: "Rupture de stock", ar: "غير متوفر" },
    "products.badgeBest": { fr: "Best-seller", ar: "الأكثر مبيعًا" },
    "products.badgeFeatured": { fr: "Vedette", ar: "مميز" },
    "products.addAria": { fr: "Ajouter au panier", ar: "أضف إلى السلة" },
    "products.addedToast": { fr: "{qty} × {name} ajouté au panier", ar: "تمت إضافة {qty} × {name} إلى السلة" },

    "cart.pageTitle": { fr: "Mon panier", ar: "سلتي" },
    "cart.emptyTitle": { fr: "Votre panier est vide", ar: "سلتك فارغة" },
    "cart.emptyDesc": { fr: "Parcourez nos produits et ajoutez vos articles préférés.", ar: "تصفح منتجاتنا وأضف ما يعجبك." },
    "cart.browse": { fr: "Voir les produits", ar: "تصفح المنتجات" },
    "cart.summaryTitle": { fr: "Résumé de la commande", ar: "ملخص الطلب" },
    "cart.itemUnit": { fr: " / unité", ar: " / للوحدة" },
    "cart.remove": { fr: "Retirer", ar: "إزالة" },
    "cart.removedToast": { fr: "Produit retiré du panier", ar: "تمت إزالة المنتج من السلة" },
    "cart.clearedToast": { fr: "Panier vidé", ar: "تم إفراغ السلة" },
    "cart.clearConfirm": { fr: "Vider entièrement le panier ?", ar: "هل تريد إفراغ السلة بالكامل؟" },
    "cart.checkout": { fr: "Passer la commande", ar: "إتمام الطلب" },
    "cart.clear": { fr: "Vider le panier", ar: "إفراغ السلة" },
    "cart.codNote": { fr: "Paiement en espèces à la livraison. Aucun paiement en ligne requis.", ar: "الدفع نقدًا عند التسليم. لا حاجة لأي دفع عبر الإنترنت." },
    "cart.itemsOne": { fr: "1 article", ar: "منتج واحد" },
    "cart.itemsMany": { fr: "{n} articles", ar: "{n} منتجات" },
    "cart.total": { fr: "Total", ar: "الإجمالي" },

    "checkout.pageTitle": { fr: "Finaliser ma commande", ar: "إتمام طلبي" },
    "checkout.emptyTitle": { fr: "Votre panier est vide", ar: "سلتك فارغة" },
    "checkout.emptyDesc": { fr: "Ajoutez des produits avant de passer commande.", ar: "أضف منتجات قبل إتمام الطلب." },
    "checkout.step1": { fr: "Vos coordonnées", ar: "معلوماتك" },
    "checkout.firstName": { fr: "Prénom", ar: "الاسم الأول" },
    "checkout.lastName": { fr: "Nom", ar: "اسم العائلة" },
    "checkout.phone": { fr: "Téléphone", ar: "الهاتف" },
    "checkout.secondaryPhone": { fr: "Téléphone secondaire", ar: "هاتف إضافي" },
    "checkout.optional": { fr: "(optionnel)", ar: "(اختياري)" },
    "checkout.step2": { fr: "Adresse de livraison", ar: "عنوان التوصيل" },
    "checkout.commune": { fr: "Commune de livraison", ar: "بلدية التوصيل" },
    "checkout.communePlaceholder": { fr: "Choisissez votre commune", ar: "اختر بلديتك" },
    "checkout.address": { fr: "Adresse exacte", ar: "العنوان الدقيق" },
    "checkout.addressPlaceholder": { fr: "Rue, numéro, bâtiment, étage…", ar: "الشارع، الرقم، العمارة، الطابق…" },
    "checkout.landmark": { fr: "Point de repère à proximité", ar: "علامة قريبة مميزة" },
    "checkout.landmarkPlaceholder": { fr: "Près de la mosquée, en face de la pharmacie…", ar: "قرب المسجد، أمام الصيدلية…" },
    "checkout.notes": { fr: "Notes additionnelles", ar: "ملاحظات إضافية" },
    "checkout.notesPlaceholder": { fr: "Instructions pour le livreur, étage sans ascenseur, etc.", ar: "تعليمات للموصل، طابق بدون مصعد، إلخ." },
    "checkout.step3": { fr: "Créneau de livraison préféré", ar: "الوقت المفضل للتوصيل" },
    "checkout.summaryTitle": { fr: "Résumé de la commande", ar: "ملخص الطلب" },
    "checkout.submit": { fr: "Confirmer la commande", ar: "تأكيد الطلب" },
    "checkout.submitting": { fr: "Envoi en cours…", ar: "جاري الإرسال…" },
    "checkout.codNote": { fr: "Paiement en espèces à la livraison uniquement. Préparez l'appoint si possible.", ar: "الدفع نقدًا عند التسليم فقط. يرجى تحضير المبلغ المضبوط إن أمكن." },
    "checkout.errFirstName": { fr: "Veuillez indiquer votre prénom.", ar: "يرجى إدخال اسمك الأول." },
    "checkout.errLastName": { fr: "Veuillez indiquer votre nom.", ar: "يرجى إدخال اسم عائلتك." },
    "checkout.errPhone": { fr: "Numéro invalide. Format attendu : 05/06/07XXXXXXXX.", ar: "رقم غير صالح. الصيغة المطلوبة: 05/06/07XXXXXXXX." },
    "checkout.errCommune": { fr: "Veuillez choisir une commune de livraison.", ar: "يرجى اختيار بلدية التوصيل." },
    "checkout.errAddress": { fr: "Veuillez indiquer une adresse plus précise.", ar: "يرجى إدخال عنوان أكثر دقة." },
    "checkout.fixErrorsToast": { fr: "Merci de corriger les champs en rouge", ar: "يرجى تصحيح الحقول الملوّنة بالأحمر" },
    "checkout.emptyCartToast": { fr: "Votre panier est vide", ar: "سلتك فارغة" },
    "checkout.failToast": { fr: "Échec de l'envoi de la commande. Réessayez ou appelez-nous.", ar: "فشل إرسال الطلب. أعد المحاولة أو اتصل بنا." },
    "checkout.configMissingToast": { fr: "Configuration manquante : ajoutez l'URL du Apps Script dans js/api.js", ar: "إعدادات ناقصة: أضف رابط Apps Script في js/api.js" },

    "confirmation.title": { fr: "Merci, votre commande est confirmée !", ar: "شكرًا، تم تأكيد طلبك!" },
    "confirmation.desc": { fr: "Nous avons bien reçu votre commande. Notre équipe vous contactera pour confirmer la livraison.", ar: "تم استلام طلبك بنجاح. سيتواصل معك فريقنا لتأكيد التوصيل." },
    "confirmation.client": { fr: "Client :", ar: "العميل:" },
    "confirmation.address": { fr: "Adresse :", ar: "العنوان:" },
    "confirmation.codNote": { fr: "Paiement en espèces à la livraison. Conservez ce numéro de commande en cas de question.", ar: "الدفع نقدًا عند التسليم. يرجى الاحتفاظ برقم الطلب لأي استفسار." },
    "confirmation.continue": { fr: "Continuer mes achats", ar: "الاستمرار في التسوق" },
    "confirmation.noOrderTitle": { fr: "Aucune commande récente", ar: "لا يوجد طلب حديث" },
    "confirmation.noOrderDesc": { fr: "Nous n'avons trouvé aucune commande récente sur cet appareil.", ar: "لم نعثر على أي طلب حديث على هذا الجهاز." },
    "confirmation.seeProducts": { fr: "Voir les produits", ar: "تصفح المنتجات" },

    "privacy.title": { fr: "Politique de confidentialité", ar: "سياسة الخصوصية" },
    "privacy.updated": { fr: "Dernière mise à jour : 29 juin 2026.", ar: "آخر تحديث: 29 يونيو 2026." },
    "privacy.intro": { fr: "Souk Baba Ali (« nous ») respecte votre vie privée. Cette politique explique quelles données nous collectons lorsque vous utilisez ce site et comment elles sont utilisées.", ar: "سوق بابا علي (« نحن ») يحترم خصوصيتك. تشرح هذه السياسة البيانات التي نجمعها عند استخدامك لهذا الموقع وكيفية استخدامها." },
    "privacy.h1": { fr: "1. Données que nous collectons", ar: "1. البيانات التي نجمعها" },
    "privacy.p1a": { fr: "Nous ne demandons aucune création de compte. Les seules données personnelles collectées sont celles que vous saisissez volontairement dans le formulaire de commande :", ar: "لا نطلب إنشاء أي حساب. البيانات الشخصية الوحيدة التي نجمعها هي تلك التي تدخلها بنفسك في نموذج الطلب:" },
    "privacy.li1": { fr: "Prénom et nom", ar: "الاسم الأول واسم العائلة" },
    "privacy.li2": { fr: "Numéro de téléphone (et numéro secondaire optionnel)", ar: "رقم الهاتف (ورقم إضافي اختياري)" },
    "privacy.li3": { fr: "Commune, adresse de livraison et point de repère", ar: "البلدية، عنوان التوصيل وعلامة قريبة" },
    "privacy.li4": { fr: "Notes additionnelles que vous choisissez d'ajouter", ar: "ملاحظات إضافية تختار إضافتها" },
    "privacy.li5": { fr: "Le contenu de votre commande (produits, quantités, montant total)", ar: "محتوى طلبك (المنتجات، الكميات، المبلغ الإجمالي)" },
    "privacy.p1b": { fr: "Votre panier est par ailleurs enregistré localement dans le navigateur de votre appareil (« stockage local »), afin que vous ne le perdiez pas en changeant de page. Ces données restent sur votre appareil et ne sont pas transmises ailleurs avant la validation de votre commande.", ar: "كما يُحفظ سلة مشترياتك محليًا في متصفح جهازك (« التخزين المحلي ») حتى لا تفقدها عند تغيير الصفحة. تبقى هذه البيانات على جهازك ولا تُرسل إلى أي مكان قبل تأكيد طلبك." },
    "privacy.h2": { fr: "2. Comment vos données sont utilisées", ar: "2. كيف تُستخدم بياناتك" },
    "privacy.p2a": { fr: "Les informations de commande sont utilisées uniquement pour :", ar: "تُستخدم معلومات الطلب فقط من أجل:" },
    "privacy.li6": { fr: "Préparer et livrer votre commande", ar: "تحضير طلبك وتوصيله" },
    "privacy.li7": { fr: "Vous contacter en cas de besoin concernant la livraison", ar: "الاتصال بك عند الحاجة بخصوص التوصيل" },
    "privacy.li8": { fr: "Conserver un historique de commande à des fins de comptabilité interne", ar: "الاحتفاظ بسجل الطلبات لأغراض المحاسبة الداخلية" },
    "privacy.h3": { fr: "3. Où vos données sont stockées", ar: "3. أين تُحفظ بياناتك" },
    "privacy.p3": { fr: "Lorsque vous validez une commande, vos informations sont transmises à un service de traitement (Google Apps Script) qui les enregistre dans un tableur Google Sheets sécurisé, accessible uniquement par l'équipe de Souk Baba Ali. Une notification est également envoyée à notre équipe via Telegram pour traiter votre commande rapidement.", ar: "عند تأكيد طلبك، تُرسل معلوماتك إلى خدمة معالجة (Google Apps Script) تقوم بحفظها في ملف Google Sheets آمن، لا يمكن الوصول إليه إلا من طرف فريق سوق بابا علي. كما يتم إرسال إشعار لفريقنا عبر Telegram لمعالجة طلبك بسرعة." },
    "privacy.h4": { fr: "4. Partage des données", ar: "4. مشاركة البيانات" },
    "privacy.p4": { fr: "Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins commerciales. Vos informations sont utilisées exclusivement pour le traitement de votre commande.", ar: "لا نبيع ولا نشارك بياناتك الشخصية مع أي طرف ثالث لأغراض تجارية. تُستخدم معلوماتك فقط لمعالجة طلبك." },
    "privacy.h5": { fr: "5. Paiement", ar: "5. الدفع" },
    "privacy.p5": { fr: "Le paiement se fait exclusivement en espèces à la livraison. Nous ne collectons et ne stockons aucune information bancaire ou de carte de paiement sur ce site.", ar: "يتم الدفع نقدًا عند التسليم فقط. لا نجمع ولا نحفظ أي معلومات بنكية أو متعلقة ببطاقات الدفع على هذا الموقع." },
    "privacy.h6": { fr: "6. Conservation des données", ar: "6. الاحتفاظ بالبيانات" },
    "privacy.p6": { fr: "Les données de commande sont conservées dans notre registre interne pendant la durée nécessaire à la gestion de la relation commerciale et à nos obligations comptables.", ar: "تُحفظ بيانات الطلبات في سجلنا الداخلي للمدة اللازمة لإدارة العلاقة التجارية والوفاء بالتزاماتنا المحاسبية." },
    "privacy.h7": { fr: "7. Vos droits", ar: "7. حقوقك" },
    "privacy.p7": { fr: "Vous pouvez nous contacter à tout moment pour demander la consultation, la correction ou la suppression de vos données personnelles, à l'adresse", ar: "يمكنك التواصل معنا في أي وقت لطلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها، على العنوان" },
    "privacy.h8": { fr: "8. Cookies et stockage local", ar: "8. ملفات تعريف الارتباط والتخزين المحلي" },
    "privacy.p8": { fr: "Ce site n'utilise pas de cookies de suivi publicitaire. Il utilise uniquement le stockage local de votre navigateur pour conserver le contenu de votre panier d'achat entre les pages.", ar: "لا يستخدم هذا الموقع ملفات تعريف ارتباط للتتبع الإعلاني. يستخدم فقط التخزين المحلي لمتصفحك للحفاظ على محتوى سلة مشترياتك بين الصفحات." },
    "privacy.h9": { fr: "9. Contact", ar: "9. اتصل بنا" },
    "privacy.p9": { fr: "Pour toute question relative à cette politique de confidentialité, contactez-nous au", ar: "لأي سؤال يخص سياسة الخصوصية هذه، يرجى الاتصال بنا على" },
    "privacy.p9b": { fr: "ou par e-mail à", ar: "أو عبر البريد الإلكتروني على" }
  };

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (match, key) {
      return vars[key] !== undefined ? vars[key] : match;
    });
  }

  SBA.i18n = {
    getLanguage: function () {
      try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; } catch (e) { return DEFAULT_LANG; }
    },

    /** Translates a static UI string by key. */
    t: function (key, vars) {
      var entry = STRINGS[key];
      if (!entry) return key;
      var lang = SBA.i18n.getLanguage();
      return interpolate(entry[lang] || entry[DEFAULT_LANG] || key, vars);
    },

    /** Picks the right value from a bilingual {fr, ar} field (data files,
     *  cart items, communes…). Pass an explicit lang to force it
     *  (e.g. "fr" when building the order payload sent to the backend). */
    pick: function (bilingualObj, forcedLang) {
      if (!bilingualObj) return "";
      if (typeof bilingualObj === "string") return bilingualObj; // already a plain string
      var lang = forcedLang || SBA.i18n.getLanguage();
      return bilingualObj[lang] || bilingualObj[DEFAULT_LANG] || "";
    },

    setLanguage: function (lang) {
      if (lang !== "fr" && lang !== "ar") lang = DEFAULT_LANG;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
      applyLanguage(lang);
      document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang: lang } }));
    },

    applyStaticStrings: function (root) {
      var scope = root || document;
      Array.prototype.slice.call(scope.querySelectorAll("[data-i18n]")).forEach(function (el) {
        el.textContent = SBA.i18n.t(el.getAttribute("data-i18n"));
      });
      Array.prototype.slice.call(scope.querySelectorAll("[data-i18n-html]")).forEach(function (el) {
        el.innerHTML = SBA.i18n.t(el.getAttribute("data-i18n-html"));
      });
      Array.prototype.slice.call(scope.querySelectorAll("[data-i18n-placeholder]")).forEach(function (el) {
        el.setAttribute("placeholder", SBA.i18n.t(el.getAttribute("data-i18n-placeholder")));
      });
      Array.prototype.slice.call(scope.querySelectorAll("[data-i18n-aria]")).forEach(function (el) {
        el.setAttribute("aria-label", SBA.i18n.t(el.getAttribute("data-i18n-aria")));
      });
    }
  };

  function applyLanguage(lang) {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    SBA.i18n.applyStaticStrings(document);
  }

  function initLangToggle() {
    SBA.qsa(".lang-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var current = SBA.i18n.getLanguage();
        SBA.i18n.setLanguage(current === "ar" ? "fr" : "ar");
      });
    });
  }

  // SBA.qs/qsa are normally defined in app.js, but language.js loads first,
  // so provide minimal fallbacks here (app.js's versions, loaded next,
  // simply overwrite these with identical implementations).
  SBA.qs = SBA.qs || function (sel, ctx) { return (ctx || document).querySelector(sel); };
  SBA.qsa = SBA.qsa || function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  document.addEventListener("DOMContentLoaded", function () {
    applyLanguage(SBA.i18n.getLanguage());
    initLangToggle();
  });
})(window.SBA);
