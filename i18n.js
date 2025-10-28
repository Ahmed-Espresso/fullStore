
// i18n.js - النسخة المنقحة
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAtqvEzoqQoCtHS_wvc5mAzb5WKOW1MaeI",
  databaseURL: "https://realestate-d4e29-default-rtdb.firebaseio.com",
  projectId: "realestate-d4e29",
  storageBucket: "realestate-d4e29.appspot.com",
  messagingSenderId: "341854632202",
  appId: "1:341854632202:web:7666024e83d2b9c94962f3"
};

initializeApp(firebaseConfig);
const db = getDatabase();

let translations = {
  // الترجمات الأساسية
  home: { ar: 'الرئيسية', en: 'Home' },
  prjct: { ar: 'المتجر', en: 'Store' },
  theme: { ar: 'الثيم', en: 'Theme' },
  
  // العروض والتخفيضات
  promo_title: { ar: "العروض", en: "Offers" },
  promo_category_discount: { ar: "خصم على قسم", en: "Discount on" },
  promo_product_discount: { ar: "خصم على", en: "Discount on" },
  promo_discount: { ar: "خصم", en: "Discount" },
  promo_days: { ar: "أيام", en: "Days" },
  promo_hours: { ar: "ساعات", en: "Hours" },
  promo_minutes: { ar: "دقائق", en: "Minutes" },
  promo_seconds: { ar: "ثواني", en: "Seconds" },
  promo_shop_now: { ar: "تسوق الآن", en: "Shop Now" },
  promo_buy_now: { ar: "اشتري الآن", en: "Buy Now" },
  no_promotions: { ar: "لا توجد عروض حالياً", en: "No promotions available" },
  promo_colon: { ar: ":", en: ":" },
  promo_expired: { ar: 'انتهى العرض!', en: 'Offer expired!' },

  // الدفع والطلبات
  process_payment: { ar: 'معالجة الدفع', en: 'Process Payment' },
  proceed_to_payment: { ar: 'المتابعة إلى الدفع', en: 'Proceed to Payment' },
  payment_success: { ar: 'تمت عملية الدفع بنجاح', en: 'Payment completed successfully' },
  payment_method: { ar: 'طريقة الدفع', en: 'Payment Method' },
  payment_cash: { ar: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
  payment_paymob: { ar: 'الدفع بالبطاقة', en: 'Card Payment' },
  
  // معلومات البطاقة
  card_number: { ar: 'رقم البطاقة', en: 'Card Number' },
  expiry_date: { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
  cvv: { ar: 'CVV', en: 'CVV' },
  card_number_placeholder: { ar: '1234 5678 9012 3456', en: '1234 5678 9012 3456' },
  expiry_date_placeholder: { ar: 'MM/YY', en: 'MM/YY' },
  cvv_placeholder: { ar: '123', en: '123' },

  // التواصل السريع
  qc_warn_bad_whatsapp: { ar: '⚠️ رقم الواتساب غير مضبوط', en: '⚠️ WhatsApp number is not set' },
  qc_sent_whatsapp: { ar: '✅ تم الإرسال عبر واتساب', en: '✅ Sent via WhatsApp' },
  qc_sent_email: { ar: '✅ تم الإرسال عبر الإيميل', en: '✅ Sent via Email' },
  qc_label_name: { ar: 'الاسم', en: 'Name' },
  qc_label_contact: { ar: 'الإيميل/الرقم', en: 'Email/Phone' },
  qc_label_message: { ar: 'الرسالة', en: 'Message' },
  qc_email_subject: { ar: 'رسالة من', en: 'Message from' },
  qc_warn_no_name: { ar: 'الرجاء إدخال الاسم', en: 'Please enter your name' },
  qc_warn_no_contact: { ar: 'الرجاء إدخال رقم الهاتف أو الإيميل', en: 'Please enter your phone number or email' },
  qc_sent_success: { ar: 'تم إرسال الرسالة بنجاح', en: 'Message sent successfully' },
  qc_sent_failed: { ar: 'فشل في إرسال الرسالة', en: 'Failed to send message' },

  // النماذج والعناوين
  required_name: { ar: 'الرجاء إدخال الاسم', en: 'Please enter your name' },
  required_phone: { ar: 'الرجاء إدخال رقم الهاتف', en: 'Please enter your phone number' },
  required_location: { ar: 'الرجاء إدخال الموقع', en: 'Please enter your location' },
  send_message: { ar: 'إرسال الرسالة', en: 'Send Message' },
  
  // السلة والطلبات
  cart_empty_for_order: { ar: 'الرجاء إضافة منتجات إلى السلة أولاً', en: 'Please add items to your cart first' },
  confirm_order: { ar: 'تأكيد الطلب', en: 'Confirm Order' },
  order_confirmed: { ar: 'تم تأكيد الطلب بنجاح!', en: 'Your order has been confirmed successfully!' },
  cart_title: { ar: 'سلة المشتريات', en: 'Shopping Cart' },
  cart_total: { ar: 'الإجمالي=', en: 'Total=' },
  cart_checkout: { ar: 'تأكيد الطلب', en: 'Checkout' },
  cart_empty: { ar: 'السلة فارغة', en: 'Cart is empty' },

  // المنتجات والمتجر
  currency: { ar: 'جنيه', en: 'EGP' },
  item_added: { ar: 'تمت الإضافة إلى السلة', en: 'Item added to cart' },
  product_not_found: { ar: 'المنتج غير موجود', en: 'Product not found' },
  all: { ar: 'الكل', en: 'All' },
  greater: { ar: 'أكثر من', en: 'Greater than' },
  less: { ar: 'أقل من', en: 'Less than' },
  dollar: { ar: 'جنيه', en: 'EGP' },

  // الحقول والنماذج
  quick_name_label: { ar: 'الاسم', en: 'Name' },
  quick_contact_label: { ar: 'الرقم/الإيميل', en: 'Phone/Email' },
  quick_message_label: { ar: 'الرسالة', en: 'Message' },
  quick_name_placeholder: { ar: 'أدخل اسمك', en: 'Enter your name' },
  quick_contact_placeholder: { ar: 'أدخل رقم الهاتف أو الإيميل', en: 'Enter your phone or email' },
  quick_message_placeholder: { ar: 'اكتب رسالتك هنا...', en: 'Write your message here...' },
  
  checkout_title: { ar: 'تأكيد الطلب', en: 'Checkout' },
  checkout_name: { ar: 'الاسم', en: 'Name' },
  checkout_phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
  checkout_message: { ar: 'الرسالة (اختياري)', en: 'Message (optional)' },
  checkout_location: { ar: 'الموقع (اختياري)', en: 'Location (optional)' },

  // المكان
  get_location: { ar: 'الحصول على الموقع', en: 'Get Location' },
  location_placeholder: { ar: 'سيتم ملؤه تلقائياً أو اكتب موقعاً مختلفاً', en: 'Will be filled automatically or enter different location' },
  getting_location: { ar: 'جاري الحصول على الموقع...', en: 'Getting your location...' },
  location_success: { ar: 'تم الحصول على الموقع بنجاح', en: 'Location obtained successfully' },
  location_fail: { ar: 'فشل في الحصول على الموقع', en: 'Failed to get location' },
  location_manual_placeholder: { ar: 'اكتب العنوان يدوياً', en: 'Enter address manually' },

  // البحث
  priceValue_placeholder: { ar: 'ادخل السعر', en: 'Enter price' },
  searchName_placeholder: { ar: 'بتدور علي ايه . . .', en: 'What are you looking for...' },
  userInput_placeholder: { ar: 'كلمني . . .', en: 'Talk to me...' },

  // البوت والمحتوى
  both1: { ar: 'تسوق معي', en: 'Shop with me' },
  botname: { ar: 'شوبو', en: 'Shopo' },
  online: { ar: 'متصل الآن', en: 'Online now' },
  botwelcm: { ar: 'مرحباً!', en: 'Welcome!' },
  botwelcm2: { ar: 'كيف يمكنني مساعدتك؟', en: 'How can I help you?' },
  bot_reply_rewelcome: { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊', en: 'Welcome back! How can I help? 😊' },
  bot_reply_not_understand: { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.', en: "Sorry, I didn't understand. Please rephrase." },

  // الأقسام الأخرى
  abouth1: { ar: 'قصتنا', en: 'Our Story' },
  faqh1: { ar: 'سؤال و جواب', en: 'FAQ' },
  servicesh1: { ar: 'خدماتنا', en: 'Our Services' },
  contacth1: { ar: 'تابعنا علي', en: 'Follow Us' },
  quickh1: { ar: 'خدمه العملاء', en: 'Customer Service' },
  statsh1: { ar: 'احصائياتنا', en: 'Our Statistics' },
  
  // إضافية
  portfolio_no_projects: { ar: 'لا توجد منتجات للعرض حالياً', en: 'No products to display at the moment' },
  no_results: { ar: 'لا توجد نتائج', en: 'No results found' },
  processing: { ar: 'جاري المعالجة...', en: 'Processing...' },
  processing_previous_order: { ar: 'جاري معالجة الطلب السابق...', en: 'Processing previous order...' },
  order_saved: { ar: 'تم ارسال الطلب بنجاح', en: 'Order sent successfully' },
  order_save_failed: { ar: 'حدث خطأ أثناء ارسال الطلب', en: 'Error sending order' },
  payment_failed: { ar: 'الرجاء إدخال بيانات البطاقة بشكل صحيح', en: 'Please enter correct card details' }
};

// باقي الكود يبقى كما هو...
let currentLang = localStorage.getItem('lang') || 'ar';
const elementsMap = {};

function updateLanguageButton() {
  const lbl = document.getElementById('language-label');
  if (lbl) lbl.textContent = currentLang.toUpperCase();
}

function applyTranslations() {
  Object.entries(elementsMap).forEach(([key, els]) => {
    const txt = translations[key]?.[currentLang] || els[0].dataset.fallback || '';
    els.forEach(el => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = txt;
      } else {
        el.innerHTML = txt;
      }
    });
  });
}

function setLanguage(lang) {
  if (!['ar','en'].includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  updateLanguageButton();
  applyTranslations();
  document.dispatchEvent(new Event('languageChanged'));
}

function initI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!elementsMap[key]) elementsMap[key] = [];
    el.dataset.fallback = el.innerHTML.trim();
    elementsMap[key].push(el);
  });
  
  // معالجة placeholders الخاصة
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (!elementsMap[key]) elementsMap[key] = [];
    el.dataset.fallback = el.placeholder;
    elementsMap[key].push(el);
  });
  
  updateLanguageButton();
  applyTranslations();

  onValue(ref(db, 'translate'),
    snap => {
      const dbTrans = snap.val() || {};
      translations = { ...translations, ...dbTrans };
      applyTranslations();
    },
    err => console.error('i18n Firebase error:', err)
  );
}

export { initI18n, setLanguage, applyTranslations, translations };