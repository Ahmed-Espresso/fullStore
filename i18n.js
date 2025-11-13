
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
  // ============= الترجمات الأساسية =============
  home: { ar: 'الرئيسية', en: 'Home' },
  prjct: { ar: 'المتجر', en: 'Store' },
  theme: { ar: 'الثيم', en: 'Theme' },
  ar: { ar: 'اللغه', en: 'en' },
  
  // ============= العروض والتخفيضات =============
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

  // ============= الدفع والطلبات =============
  process_payment: { ar: 'معالجة الدفع', en: 'Process Payment' },
  payment_method: { ar: 'طريقة الدفع', en: 'Payment Method' },
  payment_cash: { ar: 'الدفع عند الاستلام', en: 'Cash on Delivery' },
  payment_paymob: { ar: 'الدفع بالبطاقة', en: 'Card Payment' },
  payment_method_card: { ar: 'البطاقة الائتمانية', en: 'Credit Card' },
  
  // معلومات البطاقة
  card_number: { ar: 'رقم البطاقة', en: 'Card Number' },
  expiry_date: { ar: 'تاريخ الانتهاء', en: 'Expiry Date' },
  cvv: { ar: 'CVV', en: 'CVV' },
  card_number_placeholder: { ar: '1234 5678 9012 3456', en: '1234 5678 9012 3456' },
  expiry_date_placeholder: { ar: 'MM/YY', en: 'MM/YY' },
  cvv_placeholder: { ar: '123', en: '123' },

  // ============= التواصل السريع =============
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

  // ============= النماذج والعناوين =============
  required_name: { ar: 'الرجاء إدخال الاسم', en: 'Please enter your name' },
  required_phone: { ar: 'الرجاء إدخال رقم الهاتف', en: 'Please enter your phone number' },
  required_location: { ar: 'الرجاء إدخال الموقع', en: 'Please enter your location' },
  send_message: { ar: 'إرسال الرسالة', en: 'Send Message' },
  
  // ============= السلة والطلبات =============
  cart_empty_for_order: { ar: 'ضع منتج في السله اولا', en: 'Please add items to cart first' },
  confirm_order: { ar: 'تأكيد الطلب', en: 'Confirm Order' },
  order_confirmed: { ar: 'تم تأكيد الطلب بنجاح!', en: 'Your order has been confirmed successfully!' },
  cart_title: { ar: 'سلة المشتريات', en: 'Shopping Cart' },
  cart_total: { ar: 'الإجمالي=', en: 'Total=' },
  cart_checkout: { ar: 'تأكيد الطلب', en: 'Checkout' },
  cart_empty: { ar: 'السلة فارغة', en: 'Cart is empty' },

  // ============= المنتجات والمتجر =============
  currency: { ar: 'جنيه', en: 'EGP' },
  item_added: { ar: 'تمت الإضافة إلى السلة', en: 'Item added to cart' },
  product_not_found: { ar: 'المنتج غير موجود', en: 'Product not found' },
  all: { ar: 'الكل', en: 'All' },
  greater: { ar: 'أكثر من', en: 'Greater than' },
  less: { ar: 'أقل من', en: 'Less than' },
  dollar: { ar: 'جنيه', en: 'EGP' },

  // ============= الحقول والنماذج =============
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

  // ============= المكان =============
  get_location: { ar: 'الحصول على الموقع', en: 'Get Location' },
  location_placeholder: { ar: 'سيتم ملؤه تلقائياً أو اكتب موقعاً مختلفاً', en: 'Will be filled automatically or enter different location' },
  getting_location: { ar: 'جاري الحصول على الموقع...', en: 'Getting your location...' },
  location_success: { ar: 'تم الحصول على الموقع بنجاح', en: 'Location obtained successfully' },
  location_fail: { ar: 'فشل في الحصول على الموقع', en: 'Failed to get location' },
  location_manual_placeholder: { ar: 'اكتب العنوان يدوياً', en: 'Enter address manually' },
  location_not_specified: { ar: ' لم يتم تحديد موعد بعد', en: 'No date has been set yet' },

  // ============= البحث =============
  priceValue_placeholder: { ar: 'ادخل السعر', en: 'Enter price' },
  searchName_placeholder: { ar: 'بتدور علي ايه . . .', en: 'What are you looking for...' },
  userInput_placeholder: { ar: 'كلمني . . .', en: 'Talk to me...' },

  // ============= البوت والمحتوى =============
  both1: { ar: 'تسوق معي', en: 'Shop with me' },
  botname: { ar: 'شوبو', en: 'Shopo' },
  online: { ar: 'متصل الآن', en: 'Online now' },
  botwelcm: { ar: 'مرحباً!', en: 'Welcome!' },
  botwelcm2: { ar: 'كيف يمكنني مساعدتك؟', en: 'How can I help you?' },
  bot_reply_rewelcome: { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊', en: 'Welcome back! How can I help? 😊' },
  bot_reply_not_understand: { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.', en: "Sorry, I didn't understand. Please rephrase." },

  // ============= الأقسام الأخرى =============
  abouth1: { ar: 'قصتنا', en: 'Our Story' },
  faqh1: { ar: 'سؤال و جواب', en: 'FAQ' },
  servicesh1: { ar: 'خدماتنا', en: 'Our Services' },
  contacth1: { ar: 'تابعنا علي', en: 'Follow Us' },
  quickh1: { ar: 'خدمه العملاء', en: 'Customer Service' },
  statsh1: { ar: 'احصائياتنا', en: 'Our Statistics' },
  
  // ============= إضافية =============
  portfolio_no_projects: { ar: 'لا توجد منتجات للعرض حالياً', en: 'No products to display at the moment' },
  no_results: { ar: 'لا توجد نتائج', en: 'No results found' },
  processing: { ar: 'جاري المعالجة...', en: 'Processing...' },
  processing_previous_order: { ar: 'جاري معالجة الطلب السابق...', en: 'Processing previous order...' },
  order_saved: { ar: 'تم ارسال الطلب بنجاح', en: 'Order sent successfully' },
  order_save_failed: { ar: 'حدث خطأ أثناء ارسال الطلب', en: 'Error sending order' },
  payment_failed: { ar: 'الرجاء إدخال بيانات البطاقة بشكل صحيح', en: 'Please enter correct card details' },
  invalid_phone: { ar: 'رقم الهاتف غير صحيح لهذه الدولة', en: 'Invalid phone number for this country' },
  phone_example: { ar: 'مثال:', en: 'Example:' },
  select_country: { ar: 'اختر الدولة', en: 'Select Country' },
  country_code: { ar: 'رمز الدولة', en: 'Country Code' },
  phone_required: { ar: 'رقم الهاتف مطلوب', en: 'Phone number is required' },
  invalid_email: { ar: 'البريد الإلكتروني غير صحيح', en: 'Invalid email address' },

  // ============= قسم تتبع الطلبات - تم إصلاحه بالكامل =============
  track_my_order: { ar: 'طلبياتي', en: 'My Order' },
  my_orders: { ar: 'طلبياتي', en: 'My Orders' },
  searching_orders: { ar: 'جاري تحميل الطلبيات...', en: 'Loading orders...' },
  no_orders_found: { ar: 'لا توجد طلبيات', en: 'No orders found' },
  no_orders_message: { ar: 'لم تقم بأي طلبيات بعد', en: 'You have not made any orders yet' },
  back_to_orders: { ar: '', en: '' },
  details_o: { ar: 'تفاصيل الطلب', en: 'Order Details' },

  // معلومات الطلب
  order_info: { ar: 'معلومات الطلب', en: 'Order Information' },
  order_id: { ar: 'رقم الطلب', en: 'Order ID' },
  order_date: { ar: 'تاريخ الطلب', en: 'Order Date' },
  order_total: { ar: 'المبلغ الإجمالي', en: 'Total Amount' },
  estimated_delivery: { ar: 'التسليم المتوقع', en: 'Estimated Delivery' },

  // معلومات العميل
  customer_info: { ar: 'معلومات العميل', en: 'Customer Information' },
  customer_name: { ar: 'الاسم', en: 'Name' },
  customer_phone: { ar: 'رقم الهاتف', en: 'Phone Number' },
  customer_address: { ar: 'العنوان', en: 'Address' },

  // المنتجات والمراحل
  order_products: { ar: 'المنتجات', en: 'Products' },
  order_timeline: { ar: 'مراحل الطلب', en: 'Order Timeline' },

  // حالات الطلب
  order_status_pending: { ar: 'قيد الانتظار', en: 'Pending' },
  order_status_confirmed: { ar: 'تم التأكيد', en: 'Confirmed' },
  order_status_processing: { ar: 'جاري التجهيز', en: 'Processing' },
  order_status_shipped: { ar: 'تم الشحن', en: 'Shipped' },
  order_status_delivered: { ar: 'تم التسليم', en: 'Delivered' },
  order_status_cancelled: { ar: 'ملغي', en: 'Cancelled' },
  order_status_paid: { ar: 'مدفوع', en: 'Paid' },
  order_status_completed: { ar: 'مكتمل', en: 'Completed' },

  // مراحل التتبع
  timeline_ordered: { ar: 'تم استلام الطلب', en: 'Order Received' },
  timeline_confirmed: { ar: 'تم تأكيد الطلب', en: 'Order Confirmed' },
  timeline_processing: { ar: 'جاري تجهيز الطلب', en: 'Order Being Processed' },
  timeline_shipped: { ar: 'تم شحن الطلب', en: 'Order Shipped' },
  timeline_delivered: { ar: 'تم تسليم الطلب', en: 'Order Delivered' },
  timeline_completed: { ar: 'مكتمل', en: 'Completed' },
  timeline_current: { ar: 'حالي', en: 'Current' },
  timeline_upcoming: { ar: 'قادم', en: 'Upcoming' },

  // عناصر واجهة الطلبات
  view_details: { ar: 'عرض التفاصيل', en: 'View Details' },
  order_summary: { ar: 'ملخص الطلب', en: 'Order Summary' },
  items_count: { ar: 'عدد العناصر', en: 'Items Count' },
  continue_shopping: { ar: 'مواصلة التسوق', en: 'Continue Shopping' },
  close: { ar: 'إغلاق', en: 'Close' },
  loading: { ar: 'جاري التحميل', en: 'Loading' },
  error_loading: { ar: 'خطأ في التحميل', en: 'Error loading' },
  retry: { ar: 'إعادة المحاولة', en: 'Retry' },
  order_status: { ar: 'حالة الطلب', en: 'Order Status' },
  delivery_info: { ar: 'معلومات التسليم', en: 'Delivery Information' },
  contact_support: { ar: 'اتصل بالدعم', en: 'Contact Support' },
  download_invoice: { ar: 'تحميل الفاتورة', en: 'Download Invoice' },
  items_total: { ar: 'إجمالي العناصر', en: 'Items Total' },
  shipping_fee: { ar: 'رسوم الشحن', en: 'Shipping Fee' },
  final_total: { ar: 'المجموع النهائي', en: 'Final Total' },

  // عناصر واجهة تفاصيل الطلب
  customer_name_display: { ar: 'الاسم', en: 'Name' },
  customer_phone_display: { ar: 'رقم الهاتف', en: 'Phone' },
  order_location_display: { ar: 'العنوان', en: 'Address' },
  order_date_short: { ar: 'التاريخ', en: 'Date' },
  products_count_display: { ar: 'المنتجات', en: 'Products' },
  order_total_display: { ar: 'الإجمالي', en: 'Total' },
  product_quantity: { ar: 'الكمية', en: 'Quantity' },
  product_subtotal: { ar: 'المجموع', en: 'Subtotal' },

  // التواريخ والأوقات
  at: { ar: 'في', en: 'at' },
  am: { ar: 'ص', en: 'AM' },
  pm: { ar: 'م', en: 'PM' },

// ============= إلغاء الطلبات =============
cancel_order: { ar: 'إلغاء الطلب', en: 'Cancel Order' },
confirm_cancel_order: { ar: 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟', en: 'Are you sure you want to cancel this order?' },
contact_support_to_cancel: { ar: 'تواصل مع خدمة العملاء للإلغاء', en: 'Contact customer service to cancel' },
order_cancelled: { ar: 'تم إلغاء الطلب', en: 'Order cancelled' },
order_cancel_failed: { ar: 'فشل في إلغاء الطلب', en: 'Failed to cancel order' },
timeline_cancelled: { ar: 'تم إلغاء الطلب', en: 'Order Cancelled' },

  // إضافات للكارت
  remove_item: { ar: 'حذف', en: 'Remove' },
  quantity: { ar: 'الكمية', en: 'Quantity' },
  subtotal: { ar: 'المجموع', en: 'Subtotal' },
  continue_shopping_cart: { ar: 'مواصلة التسوق', en: 'Continue Shopping' },
  empty_cart_message: { ar: 'سلة التسوق فارغة', en: 'Your shopping cart is empty' },
  cart_item_price: { ar: 'السعر', en: 'Price' },
  cart_item_total: { ar: 'المجموع', en: 'Total' },
  search_order: { ar: 'بحث عن طلب', en: 'Search Order' },
  search: { ar: 'بحث', en: 'Search' },
  search_results: { ar: 'نتائج البحث', en: 'Search Results' },
  no_search_results: { ar: 'لا توجد نتائج للبحث', en: 'No search results found' },
  select_country: { ar: 'اختر الدولة', en: 'Select Country' }
  
};

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

// دالة مساعدة جديدة للحصول على النص المترجم
function getTranslatedText(key) {
  return translations[key]?.[currentLang] || translations[key]?.ar || key;
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

export { initI18n, setLanguage, applyTranslations, translations, currentLang, getTranslatedText };
