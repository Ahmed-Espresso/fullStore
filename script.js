import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get, push, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.esm.js";
import { initI18n, setLanguage, applyTranslations, translations } from './i18n.js';

// ==================== تهيئة Firebase ====================
const firebaseConfig = {
  apiKey: "AIzaSyAtqvEzoqQoCtHS_wvc5mAzb5WKOW1MaeI",
  databaseURL: "https://realestate-d4e29-default-rtdb.firebaseio.com",
  projectId: "realestate-d4e29",
  storageBucket: "realestate-d4e29.appspot.com",
  messagingSenderId: "341854632202",
  appId: "1:341854632202:web:7666024e83d2b9c94962f3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const ordersRef = ref(db, 'storeOrders');

// ==================== المتغيرات العامة ====================
const CLOUDINARY_CLOUD_NAME = 'de3t3azua';
const CLOUDINARY_API_KEY = '138916392597853';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

let welcomeMessage = "";
let typingTimer = null;
let currentPromo = null;
let currentBot = {};
let currentFAQs = {};
let currentServices = {};
let currentStats = {};
let currentContacts = {};
let currentProducts = {};
let currentQC = {};
let qcSettings = {};
let currentAbout = {};
let currentCategories = {};
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPromotions = {};
let fuseBot,
    welcomeButtons = [],
    isListening = false,
    voiceAsked = false;

let filterResetTimer = null;
let isSubmitting = false; 

// ==================== متغيرات شريط التقدم ====================
let loadingProgress = 0;
let loadingInterval;
let currentLoadingStep = 0;
const loadingSteps = [
  "جاري التحميل...",
  "جاري تحميل البيانات...", 
  "جاري تهيئة المتجر...",
  "جاري تحميل العروض...",
  "جاري التهيئة النهائية...",
  "تم التحميل بنجاح!"
];

// ==================== Auto-scroll for Promotions ====================
let autoScrollInterval = null;
let isAutoScrolling = true;
let scrollSpeed = 0.5; // سرعة التمرير (بكسل لكل إطار)
let scrollDirection = 1; // 1 للتمرير لليمين، -1 للتمرير لليسار
let promotionsContainer = null;
let lastInteractionTime = 0;
let pauseTimeout = null;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const recognitionSearch = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// ==================== إعدادات Paymob ====================
const PAYMOB_CONFIG = {
  apiKey: "YOUR_PAYMOB_API_KEY",
  integrationId: "YOUR_INTEGRATION_ID", 
  iframeId: "YOUR_IFRAME_ID",
  baseUrl: "https://accept.paymob.com/api"
};

// ==================== دوال المساعدة العامة ====================
function currentLang() {
  return document.documentElement.lang || 'ar';
}

function getLocalizedText(obj) {
  const lang = currentLang();
  if (!obj) return '';
  return typeof obj === 'object' ? (obj[lang] || obj.ar) : obj;
}

function getCategoryName(categoryKey, lang) {
  const category = currentCategories[categoryKey];
  return category?.name[lang] || category?.name.ar || 'غير مصنف';
}

// ==================== رموز الدول ====================
const countryCodes = [
  { 
    code: '20', 
    name: { ar: 'مصر', en: 'Egypt' }, 
    flag: '🇪🇬', 
    pattern: /^(1[0-2]\d{8}|1[5-9]\d{8}|10\d{8}|11\d{8}|12\d{8})$/,
    example: '01012345678',
    whatsapp: true
  },
  { 
    code: '966', 
    name: { ar: 'السعودية', en: 'Saudi Arabia' }, 
    flag: '🇸🇦', 
    pattern: /^5[0-9]{8}$/,
    example: '512345678',
    whatsapp: true
  },
  { 
    code: '971', 
    name: { ar: 'الإمارات', en: 'UAE' }, 
    flag: '🇦🇪', 
    pattern: /^5[0-9]{8}$/,
    example: '501234567',
    whatsapp: true
  },
  { 
    code: '973', 
    name: { ar: 'البحرين', en: 'Bahrain' }, 
    flag: '🇧🇭', 
    pattern: /^[0-9]{8}$/,
    example: '36123456',
    whatsapp: true
  },
  { 
    code: '974', 
    name: { ar: 'قطر', en: 'Qatar' }, 
    flag: '🇶🇦', 
    pattern: /^[0-9]{8}$/,
    example: '33123456',
    whatsapp: true
  },
  { 
    code: '965', 
    name: { ar: 'الكويت', en: 'Kuwait' }, 
    flag: '🇰🇼', 
    pattern: /^[0-9]{8}$/,
    example: '50012345',
    whatsapp: true
  },
  { 
    code: '968', 
    name: { ar: 'عمان', en: 'Oman' }, 
    flag: '🇴🇲', 
    pattern: /^[0-9]{8}$/,
    example: '92123456',
    whatsapp: true
  },
  { 
    code: '962', 
    name: { ar: 'الأردن', en: 'Jordan' }, 
    flag: '🇯🇴', 
    pattern: /^7[0-9]{8}$/,
    example: '790123456',
    whatsapp: true
  },
  { 
    code: '1', 
    name: { ar: 'الولايات المتحدة', en: 'United States' }, 
    flag: '🇺🇸', 
    pattern: /^[2-9]\d{9}$/,
    example: '2015550123',
    whatsapp: true
  },
  { 
    code: '44', 
    name: { ar: 'المملكة المتحدة', en: 'United Kingdom' }, 
    flag: '🇬🇧', 
    pattern: /^7[0-9]{9}$/,
    example: '7123456789',
    whatsapp: true
  },
  { 
    code: '33', 
    name: { ar: 'فرنسا', en: 'France' }, 
    flag: '🇫🇷', 
    pattern: /^[6-7]\d{8}$/,
    example: '612345678',
    whatsapp: true
  },
  { 
    code: '49', 
    name: { ar: 'ألمانيا', en: 'Germany' }, 
    flag: '🇩🇪', 
    pattern: /^1[5-9]\d{8}$/,
    example: '15123456789',
    whatsapp: true
  },
  { 
    code: '39', 
    name: { ar: 'إيطاليا', en: 'Italy' }, 
    flag: '🇮🇹', 
    pattern: /^3[0-9]{8,9}$/,
    example: '3123456789',
    whatsapp: true
  },
  { 
    code: '34', 
    name: { ar: 'إسبانيا', en: 'Spain' }, 
    flag: '🇪🇸', 
    pattern: /^[6-7]\d{8}$/,
    example: '612345678',
    whatsapp: true
  },
  { 
    code: '81', 
    name: { ar: 'اليابان', en: 'Japan' }, 
    flag: '🇯🇵', 
    pattern: /^[7-9]\d{8}$/,
    example: '901234567',
    whatsapp: true
  },
  { 
    code: '82', 
    name: { ar: 'كوريا الجنوبية', en: 'South Korea' }, 
    flag: '🇰🇷', 
    pattern: /^1[0-9]{8}$/,
    example: '102345678',
    whatsapp: true
  },
  { 
    code: '86', 
    name: { ar: 'الصين', en: 'China' }, 
    flag: '🇨🇳', 
    pattern: /^1[3-9]\d{9}$/,
    example: '13123456789',
    whatsapp: true
  },
  { 
    code: '91', 
    name: { ar: 'الهند', en: 'India' }, 
    flag: '🇮🇳', 
    pattern: /^[6-9]\d{9}$/,
    example: '9876543210',
    whatsapp: true
  },
  { 
    code: '61', 
    name: { ar: 'أستراليا', en: 'Australia' }, 
    flag: '🇦🇺', 
    pattern: /^4[0-9]{8}$/,
    example: '412345678',
    whatsapp: true
  },
  { 
    code: '55', 
    name: { ar: 'البرازيل', en: 'Brazil' }, 
    flag: '🇧🇷', 
    pattern: /^[1-9]{2}9[0-9]{8}$/,
    example: '11987654321',
    whatsapp: true
  },
  { 
    code: '52', 
    name: { ar: 'المكسيك', en: 'Mexico' }, 
    flag: '🇲🇽', 
    pattern: /^[1-9]{2}[0-9]{8}$/,
    example: '5512345678',
    whatsapp: true
  },
  { 
    code: '7', 
    name: { ar: 'روسيا', en: 'Russia' }, 
    flag: '🇷🇺', 
    pattern: /^9[0-9]{9}$/,
    example: '9123456789',
    whatsapp: true
  },
  { 
    code: '90', 
    name: { ar: 'تركيا', en: 'Turkey' }, 
    flag: '🇹🇷', 
    pattern: /^5[0-9]{9}$/,
    example: '5012345678',
    whatsapp: true
  },
  { 
    code: '27', 
    name: { ar: 'جنوب أفريقيا', en: 'South Africa' }, 
    flag: '🇿🇦', 
    pattern: /^[6-8][0-9]{8}$/,
    example: '712345678',
    whatsapp: true
  }
];

function loadCountryCodes(selectElementId, defaultCountry = '20') {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return;
  
  selectElement.innerHTML = '';
  
  const lang = currentLang();
  
  // إضافة option افتراضي
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = lang === 'ar' ? 'اختر الدولة' : 'Select Country';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selectElement.appendChild(defaultOption);
  
  countryCodes.forEach(country => {
    const option = document.createElement('option');
    option.value = country.code;
    option.textContent = `${country.flag} ${country.name[lang]} (+${country.code})`;
    option.dataset.flag = country.flag;
    option.dataset.name = country.name[lang];
    option.dataset.pattern = country.pattern.toString();
    option.dataset.example = country.example;
    option.dataset.whatsapp = country.whatsapp;
    
    if (country.code === defaultCountry) {
      option.selected = true;
    }
    
    selectElement.appendChild(option);
  });
}

// دالة للحصول على رقم الهاتف الكامل مع رمز الدولة
function validatePhoneNumber(phoneNumber, countryCode) {
  if (!phoneNumber || !countryCode) return false;
  
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 5) return false;
  
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) {
    // إذا لم توجد الدولة، تحقق عام
    return cleanNumber.length >= 7 && cleanNumber.length <= 15;
  }
  
  let numberToValidate = cleanNumber;
  
  // معالجة خاصة لكل دولة
  if (countryCode === '20' && cleanNumber.startsWith('0')) {
    numberToValidate = cleanNumber.substring(1);
  }
  
  return country.pattern.test(numberToValidate);
}

function getFullPhoneNumber(countryCodeSelectId, phoneInputId) {
  const countryCode = document.getElementById(countryCodeSelectId)?.value || '';
  const phoneNumber = document.getElementById(phoneInputId)?.value || '';
  
  if (!countryCode || !phoneNumber) return '';
  
  // تنظيف الرقم من جميع الأحرف غير الرقمية
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // إزالة الأصفار من البداية إذا كانت موجودة
  let finalNumber = cleanNumber.replace(/^0+/, '');
  
  // إرجاع الرقم بشكل صحيح: كود الدولة + الرقم (بدون +)
  return countryCode + finalNumber;
}

// دالة جديدة لإنشاء رابط واتساب
function createWhatsAppLink(phoneNumber, message = '') {
  const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${fullNumber}${message ? `?text=${encodedMessage}` : ''}`;
}

// ==================== نظام التحميل المحسن ====================
function initLoadingSystem() {

  // التأكد من تطبيق الثيم الافتراضي
  const currentTheme = localStorage.getItem('theme');
  if (!currentTheme || !['wine', 'day', 'sunset', 'coffee'].includes(currentTheme)) {
    localStorage.setItem('theme', 'wine');
    document.documentElement.classList.add('theme-wine');
  }
  // إخفاء كل المحتوى ماعدا شاشة التحميل
  document.querySelectorAll('section, #cart-icon-container').forEach(el => {
    el.style.display = 'none';
  });
  
  // بدء شريط التقدم
  startLoadingProgress();
}

function startLoadingProgress() {
  loadingProgress = 0;
  currentLoadingStep = 0;
  
  // إيقاف أي interval سابق
  if (loadingInterval) {
    clearInterval(loadingInterval);
  }
  
  loadingInterval = setInterval(() => {
    // زيادة التقدم بشكل تدريجي
    if (loadingProgress < 90) {
      loadingProgress += Math.random() * 10 + 5;
      if (loadingProgress > 90) loadingProgress = 90;
    } else {
      // إذا وصل إلى 90% وتوقف، حاول إكماله
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
    
    updateLoadingProgress();
    
    // تغيير الرسالة بناءً على التقدم
    if (loadingProgress >= 15 && currentLoadingStep < 1) {
      currentLoadingStep = 1;
      updateLoadingMessage();
    } else if (loadingProgress >= 30 && currentLoadingStep < 2) {
      currentLoadingStep = 2;
      updateLoadingMessage();
    } else if (loadingProgress >= 50 && currentLoadingStep < 3) {
      currentLoadingStep = 3;
      updateLoadingMessage();
    } else if (loadingProgress >= 70 && currentLoadingStep < 4) {
      currentLoadingStep = 4;
      updateLoadingMessage();
    }
  }, 300);
}

function updateLoadingProgress() {
  const progressFill = document.querySelector('.loading-progress-fill');
  const progressText = document.querySelector('.loading-progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${loadingProgress}%`;
  }
  if (progressText) {
    progressText.textContent = `${Math.round(loadingProgress)}%`;
  }
}

function updateLoadingMessage() {
  const messageElement = document.querySelector('.loading-message');
  if (messageElement && loadingSteps[currentLoadingStep]) {
    messageElement.textContent = loadingSteps[currentLoadingStep];
  }
}

function completeLoading() {
  // إيقاف مؤقت التقدم
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  
  // التأكد من وصول التقدم إلى 100%
  loadingProgress = 100;
  currentLoadingStep = 5;
  
  updateLoadingProgress();
  updateLoadingMessage();
  
  // تأخير لإظهار "تم التحميل بنجاح"
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        
        // إظهار الأقسام الرئيسية فقط وإخفاء قسم المنتجات
        document.querySelectorAll('.main-section').forEach(el => {
          if (el.id !== 'portfolioSection') {
            el.style.display = '';
          } else {
            el.style.display = 'none'; // إخفاء قسم المنتجات
          }
        });
        
        // إظهار أيقونة السلة
        document.getElementById('cart-icon-container').style.display = '';
        
        // بدء الرسوم المتحركة للعناصر
        if (typeof initSectionObserver === 'function') {
          initSectionObserver();
        }
        
        setTimeout(() => {
          if (document.getElementById('promotionsContainer') && Object.keys(currentPromotions).length > 0) {
            updateScrollDirection(); // ضبط الاتجاه بناءً على اللغة
            initAutoScroll(); // بدء التحريك التلقائي
          }
        }, 1000);

        // إخطار بأن التحميل اكتمل
        console.log('تم تحميل الموقع بالكامل');
      }, 500);
    }
  }, 1000);
}

function showErrorToast(msg) {
  const t = document.getElementById('global-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 3000);
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('global-toast');
  if (!toast) return;
  
  let bgColor, textColor;
  switch(type) {
    case 'success':
      bgColor = 'var(--color-success)';
      textColor = 'white';
      break;
    case 'error':
      bgColor = 'var(--color-error)';
      textColor = 'white';
      break;
    case 'info':
      bgColor = 'var(--color-info)';
      textColor = 'white';
      break;
    case 'warning':
      bgColor = 'var(--color-warning)';
      textColor = 'white';
      break;
    default:
      bgColor = 'var(--color-accent)';
      textColor = 'white';
  }
  
  toast.textContent = message;
  toast.style.backgroundColor = bgColor;
  toast.style.color = textColor;
  toast.classList.add('visible');
  
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}

// ==================== إدارة السلة ====================
function initCartEvents() {
  const cartIcon = document.getElementById('cart-icon-container');
  const closeCartBtn = document.getElementById('close-cart');
  const checkoutBtn = document.getElementById('checkout-btn');
  const closeCheckoutBtn = document.getElementById('close-checkout');
  const confirmCheckoutBtn = document.getElementById('confirm-checkout');
  const overlay = document.getElementById('overlay');
  
  if (cartIcon) {
    cartIcon.removeEventListener('click', openCartPopup);
    cartIcon.addEventListener('click', openCartPopup);
  }
  
  if (closeCartBtn) {
    closeCartBtn.removeEventListener('click', closeCartPopup);
    closeCartBtn.addEventListener('click', closeCartPopup);
  }
  
  if (checkoutBtn) {
    checkoutBtn.removeEventListener('click', openCheckoutForm);
    checkoutBtn.addEventListener('click', openCheckoutForm);
  }
  
  if (closeCheckoutBtn) {
    closeCheckoutBtn.removeEventListener('click', closeCheckoutForm);
    closeCheckoutBtn.addEventListener('click', closeCheckoutForm);
  }
  
  if (confirmCheckoutBtn) {
    confirmCheckoutBtn.removeEventListener('click', processPayment);
    confirmCheckoutBtn.addEventListener('click', processPayment);
  }
  
  if (overlay) {
    overlay.removeEventListener('click', handleOverlayClick);
    overlay.addEventListener('click', handleOverlayClick);
  }
  
  // إعادة تهيئة أحداث حقول الدفع
  const cardNumber = document.getElementById('card-number');
  const expiryDate = document.getElementById('expiry-date');
  const cvv = document.getElementById('cvv');
  const getLocationBtn = document.getElementById('get-location-btn');
  
  if (cardNumber) {
    cardNumber.removeEventListener('input', formatCardNumber);
    cardNumber.addEventListener('input', formatCardNumber);
  }
  
  if (expiryDate) {
    expiryDate.removeEventListener('input', formatExpiryDate);
    expiryDate.addEventListener('input', formatExpiryDate);
  }
  
  if (cvv) {
    cvv.removeEventListener('input', formatCVV);
    cvv.addEventListener('input', formatCVV);
  }
  
  if (getLocationBtn) {
    getLocationBtn.removeEventListener('click', getCurrentLocation);
    getLocationBtn.addEventListener('click', getCurrentLocation);
  }
  
  // إعادة تهيئة أحداث طرق الدفع
  setupPaymentMethodSelection();
}

function handleOverlayClick() {
  closeCartPopup();
  closeCheckoutForm();
}

// ==================== تحديث الـ Placeholders ====================
function updatePlaceholders() {
  const lang = currentLang();
  
  // حقول البحث والبيانات
  const elementsToUpdate = [
    { id: 'priceValue', attr: 'placeholder' },
    { id: 'searchName', attr: 'placeholder' },
    { id: 'userInput', attr: 'placeholder' },
    { id: 'checkout-location', attr: 'placeholder' },
    { id: 'bot-field', attr: 'placeholder' },
    { id: 'price-search', attr: 'placeholder' },
    { id: 'search-field', attr: 'placeholder' }
  ];
  
  elementsToUpdate.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      const placeholderKey = item.id + '_placeholder';
      const placeholderText = translations[placeholderKey]?.[lang] || 
                            element.dataset.placeholder ||
                            (lang === 'ar' ? element.dataset.placeholderAr : element.dataset.placeholderEn);
      
      if (placeholderText) {
        element[item.attr] = placeholderText;
      }
    }
  });

  // حقول الدفع بالبطاقة
  const paymentFields = [
    { id: 'card-number', key: 'card_number_placeholder' },
    { id: 'expiry-date', key: 'expiry_date_placeholder' },
    { id: 'cvv', key: 'cvv_placeholder' }
  ];

  paymentFields.forEach(field => {
    const element = document.getElementById(field.id);
    if (element) {
      const placeholderText = translations[field.key]?.[lang] || 
                            (lang === 'ar' ? 
                              (field.id === 'card-number' ? '1234 5678 9012 3456' :
                            
                               field.id === 'expiry-date' ? 'MM/YY' : '123') :
                              (field.id === 'card-number' ? '1234 5678 9012 3456' :
                             
                               field.id === 'expiry-date' ? 'MM/YY' : '123'));
      element.placeholder = placeholderText;
    }
  });
}

// ==================== إدارة العروض ====================
function loadPromotions() {
  try {
    onValue(ref(db, 'storePromotions'), snap => {
      const promotionsData = snap.val() || {};
      
      // تنظيف البيانات
      const cleanedPromotions = {};
      Object.entries(promotionsData).forEach(([key, promo]) => {
        if (promo && typeof promo === 'object' && promo.active !== undefined) {
          if (promo.type === 'category') {
            if (promo.categoryKey && promo.discountPercentage !== undefined && promo.endDate) {
              cleanedPromotions[key] = promo;
            }
          } else if (promo.type === 'product') {
            if (promo.productKey && promo.discountPercentage !== undefined && promo.endDate) {
              cleanedPromotions[key] = promo;
            }
          }
        }
      });
      
      currentPromotions = cleanedPromotions;
      renderPromotions(currentPromotions);

      // زيادة شريط التقدم بعد تحميل العروض
      if (loadingProgress < 80) {
        loadingProgress = 80;
        updateLoadingProgress();
        currentLoadingStep = 4;
        updateLoadingMessage();
      }
      
      applyProductDiscounts();
      
      if (Object.keys(currentProducts).length > 0) {
        renderStore(currentProducts);
      }
      
      refreshOffersTranslation();

      // تهيئة التحريك التلقائي للعروض بعد التحميل
            setTimeout(() => {
                if (document.getElementById('promotionsContainer') && Object.keys(currentPromotions).length > 0) {
                    updateScrollDirection(); // ضبط الاتجاه بناءً على اللغة
                    initAutoScroll(); // بدء التحريك التلقائي
                }
            }, 500);

    });
  } catch (e) {
    console.error('promotions load error', e);
    showErrorToast('فشل تحميل العروض');
  }
}

function renderPromotions(promotions) {
  const container = document.getElementById('promotionsContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (!promotions || Object.keys(promotions).length === 0) {
    const noPromoMsg = translations['no_promotions']?.[currentLang()] || 
                      (currentLang() === 'ar' ? 'لا توجد عروض حالياً' : 'No promotions available');
    container.innerHTML = `<p class="no-promotions">${noPromoMsg}</p>`;
    return;
  }
  
  // تصفية العروض الصالحة فقط
  const validPromotions = Object.entries(promotions).filter(([key, promo]) => {
    if (!promo || !promo.active) return false;
    
    // التحقق من تاريخ الانتهاء
    const now = new Date();
    const endDate = new Date(promo.endDate);
    if (now > endDate) {
      promo.expired = true;
    }
    
    // حسب نوع العرض
    if (promo.type === 'category') {
      // يجب أن يكون القسم موجودًا في currentCategories
      return promo.categoryKey && currentCategories[promo.categoryKey];
    } else if (promo.type === 'product') {
      // يجب أن يكون المنتج موجودًا وفي المخزون
      const product = currentProducts[promo.productKey];
      return product && (product.quantity || 0) > 0;
    }
    
    return false;
  });

  if (validPromotions.length === 0) {
    const noPromoMsg = translations['no_promotions']?.[currentLang()] || 
                      (currentLang() === 'ar' ? 'لا توجد عروض حالياً' : 'No promotions available');
    container.innerHTML = `<p class="no-promotions">${noPromoMsg}</p>`;
    return;
  }
  
  validPromotions.forEach(([key, promo]) => {
    const card = document.createElement('div');
    card.className = `promo-card ${promo.type === 'product' ? 'product-promo' : 'category-promo'}`;
    if (promo.expired) {
      card.classList.add('expired');
    }
    card.dataset.key = key;
    
    if (promo.type === 'category') {
      renderCategoryPromo(card, promo);
    } else if (promo.type === 'product') {
      renderProductPromo(card, promo);
    }
    
    container.appendChild(card);
  });
}
function renderCategoryPromo(card, promo) {
  // التحقق من وجود القسم
  const category = currentCategories[promo.categoryKey];
  if (!category) {
    console.warn('Category not found for promotion:', promo.categoryKey);
    return;
  }
  
  const lang = currentLang();
  const categoryName = getLocalizedText(category.name);
  const discountText = translations.promo_category_discount?.[lang] || 'خصم على قسم';
  const discountLabel = translations.promo_discount?.[lang] || 'خصم';
  const shopNowText = translations.promo_shop_now?.[lang] || 'تسوق الآن';
  const daysText = translations.promo_days?.[lang] || 'يوم';
  const hoursText = translations.promo_hours?.[lang] || 'ساعه';
  const minutesText = translations.promo_minutes?.[lang] || 'دقيقه';
  const colonText = translations.promo_colon?.[lang] || ':';
  const expiredText = translations.promo_expired?.[lang] || 'انتهى العرض!';

  const now = new Date();
  const endDate = new Date(promo.endDate);
  const isExpired = now > endDate;
  
  card.innerHTML = `
    <div class="promo-header">
      <div class="promo-discount-banner">
        <span class="discount-shine">${promo.discountPercentage}% ${discountLabel}</span>
      </div>
      <img src="${promo.image || 'placeholder.png'}" alt="${categoryName}">
      ${isExpired ? `<div class="expired-overlay"></div>` : ''}
    </div>
    <div class="promo-content">
      <h3 class="promo-title">${discountText} ${categoryName}</h3>
      
      <div class="promo-timer" data-end="${promo.endDate}">
        ${isExpired ? 
          `<div class="expired-text">${expiredText}</div>` :
          `
          <div class="time-unit">
            <span class="time-value days">00</span>
            <span class="time-label">${daysText}</span>
          </div>
          <span class="time-colon">${colonText}</span>
          <div class="time-unit">
            <span class="time-value hours">00</span>
            <span class="time-label">${hoursText}</span>
          </div>
          <span class="time-colon">${colonText}</span>
          <div class="time-unit">
            <span class="time-value minutes">00</span>
            <span class="time-label">${minutesText}</span>
          </div>
          `
        }
      </div>
      
      ${!isExpired ? `
        <button class="promo-button" onclick="navigateToCategory('${promo.categoryKey}')">
          ${shopNowText}
        </button>
      ` : ''}
    </div>
  `;
  
  if (!isExpired) {
    startCountdown(card.querySelector('.promo-timer'), endDate);
  }
  
  if (isExpired) {
    card.classList.add('expired');
  }
}

function renderProductPromo(card, promo) {
  // التحقق من وجود المنتج
  const product = currentProducts[promo.productKey];
  if (!product) {
    console.warn('Product not found for promotion:', promo.productKey);
    return;
  }
  
  if ((product.quantity || 0) <= 0) {
    console.warn('Product out of stock for promotion:', promo.productKey);
    return;
  }
  
  const lang = currentLang();
  const productName = getLocalizedText(product.title);
  const discountText = translations.promo_product_discount?.[lang] || 'خصم على';
  const discountLabel = translations.promo_discount?.[lang] || 'خصم';
  const buyNowText = translations.promo_buy_now?.[lang] || 'اشتري الآن';
  const daysText = translations.promo_days?.[lang] || 'يوم';
  const hoursText = translations.promo_hours?.[lang] || 'ساعه';
  const minutesText = translations.promo_minutes?.[lang] || 'دقيقه';
  const colonText = translations.promo_colon?.[lang] || ':';
  const currencyText = translations.currency?.[lang] || 'جنيه';
  const expiredText = translations.promo_expired?.[lang] || 'انتهى العرض!';

  const originalPrice = parseFloat(product.price) || 0;
  const discountPercentage = parseFloat(promo.discountPercentage) || 0;
  const discountAmount = originalPrice * (discountPercentage / 100);
  const newPrice = originalPrice - discountAmount;
  const formattedPrice = newPrice.toFixed(0);
  
  const isInCart = cart.some(item => item.id === promo.productKey);
  const cartItem = isInCart ? cart.find(item => item.id === promo.productKey) : null;
  
  const now = new Date();
  const endDate = new Date(promo.endDate);
  const isExpired = now > endDate;
  
  card.innerHTML = `
    <div class="promo-header">
      <div class="promo-discount-banner">
        <span class="discount-shine">${promo.discountPercentage}% ${discountLabel}</span>
      </div>
      <img src="${product.images?.[0]?.url || 'placeholder.png'}" alt="${productName}">
      ${isExpired ? `<div class="expired-overlay"></div>` : ''}
    </div>
    <div class="promo-content">
      <h3 class="promo-title">${discountText} ${productName}</h3>
      
      <div class="price-container">
        <span class="original-price">${originalPrice.toFixed(0)}</span>
        <span class="new-price">${formattedPrice} ${currencyText}</span>
      </div>
      
      <div class="promo-timer" data-end="${promo.endDate}">
        ${isExpired ? 
          `<div class="expired-text">${expiredText}</div>` :
          `
          <div class="time-unit">
            <span class="time-value days">00</span>
            <span class="time-label">${daysText}</span>
          </div>
          <span class="time-colon">${colonText}</span>
          <div class="time-unit">
            <span class="time-value hours">00</span>
            <span class="time-label">${hoursText}</span>
          </div>
          <span class="time-colon">${colonText}</span>
          <div class="time-unit">
            <span class="time-value minutes">00</span>
            <span class="time-label">${minutesText}</span>
          </div>
          `
        }
      </div>
      
      ${!isExpired ? `
        <div class="promo-product-controls">
          <div class="product-quantity-controls" data-product="${promo.productKey}" style="display: ${isInCart ? 'flex' : 'none'}">
            <button class="quantity-btn minus-btn" data-product="${promo.productKey}"><i class="fas fa-minus"></i></button>
            <span class="quantity-value">${isInCart ? cartItem.quantity : 1}</span>
            <button class="quantity-btn plus-btn" data-product="${promo.productKey}"><i class="fas fa-plus"></i></button>
          </div>

          <button class="promo-button add-to-cart-btn" data-product="${promo.productKey}" style="display: ${isInCart ? 'none' : 'block'}">
           <span>${buyNowText}</span>
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  if (!isExpired) {
    const addButton = card.querySelector('.add-to-cart-btn');
    const plusBtn = card.querySelector('.plus-btn');
    const minusBtn = card.querySelector('.minus-btn');
    
    if (addButton) {
      addButton.addEventListener('click', () => {
        addPromoProductToCart(promo.productKey, newPrice, card);
      });
    }
    
    if (plusBtn) {
      plusBtn.onclick = () => {
        const item = cart.find(item => item.id === promo.productKey);
        if (item) {
          updateQuantity(promo.productKey, item.quantity + 1);
        }
      };
    }

    if (minusBtn) {
      minusBtn.onclick = () => {
        const item = cart.find(item => item.id === promo.productKey);
        if (item) {
          updateQuantity(promo.productKey, item.quantity - 1);
        }
      };
    }
  }
  
  if (!isExpired) {
    startCountdown(card.querySelector('.promo-timer'), endDate);
  }
  
  if (isExpired) {
    card.classList.add('expired');
  }
}

function startCountdown(timerElement, endDate) {
  if (!timerElement) return;
  
  function updateCountdown() {
    const now = new Date();
    const timeLeft = endDate - now;
    
    if (timeLeft <= 0) {
      const lang = currentLang();
      const expiredText = translations.promo_expired?.[lang] || 'انتهى العرض!';
      timerElement.innerHTML = `<div class="expired-text">${expiredText}</div>`;
      
      const promoCard = timerElement.closest('.promo-card');
      if (promoCard) {
        promoCard.classList.add('expired');
        
        const buttons = promoCard.querySelectorAll('.promo-button, .promo-product-controls');
        buttons.forEach(btn => btn.style.display = 'none');
      }
      return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    const daysElement = timerElement.querySelector('.days');
    const hoursElement = timerElement.querySelector('.hours');
    const minutesElement = timerElement.querySelector('.minutes');
    
    if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
    if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
    if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
  }
  
  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
  
  const observer = new MutationObserver(() => {
    if (!document.body.contains(timerElement)) {
      clearInterval(interval);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function navigateToCategory(categoryKey) {
  showProjectsSection();
  
  setTimeout(() => {
    const categorySelect = document.getElementById('propertyType');
    if (categorySelect) {
      categorySelect.value = categoryKey;
      performSearch();
      
      const portfolioSection = document.getElementById('portfolioSection');
      if (portfolioSection) {
        const navHeight = document.getElementById('navsec').offsetHeight;
        window.scrollTo({
          top: portfolioSection.offsetTop - navHeight,
          behavior: 'smooth'
        });
      }
    }
  }, 500);
}

function addPromoProductToCart(productKey, discountedPrice, cardElement) {
  const product = currentProducts[productKey];
  if (product) {
    const finalPrice = parseFloat(discountedPrice);
    
    addToCart(
      productKey,
      getLocalizedText(product.title),
      finalPrice,
      product.images?.[0]?.url || 'placeholder.png',
      1
    );
    
    if (cardElement) {
      const addButton = cardElement.querySelector('.add-to-cart-btn');
      const quantityControls = cardElement.querySelector('.product-quantity-controls');
      const quantityValue = cardElement.querySelector('.quantity-value');
      
      if (addButton) addButton.style.display = 'none';
      if (quantityControls) quantityControls.style.display = 'flex';
      if (quantityValue) quantityValue.textContent = '1';
    }
    
    updatePromoCardQuantity(productKey, 1);
    
    const lang = currentLang();
    const successMsg = translations['item_added']?.[lang] || 'تمت الإضافة إلى السلة';
    showToast(successMsg, 'success');
    updateCartCount();
  } else {
    const lang = currentLang();
    const errorMsg = translations['product_not_found']?.[lang] || 'المنتج غير موجود';
    showToast(errorMsg, 'error');
  }
}

function applyProductDiscounts() {
  // إعادة تعيين جميع الخصومات أولاً
  Object.values(currentProducts).forEach(product => {
    if (product) {
      product.hasDiscount = false;
      product.discountedPrice = null;
      product.originalPrice = null;
    }
  });
  
  // تطبيق الخصومات من العروض النشطة والصالحة فقط
  Object.entries(currentPromotions).forEach(([key, promo]) => {
    if (!promo || !promo.active || promo.expired) return;
    
    if (promo.type === 'category') {
      Object.entries(currentProducts).forEach(([productKey, product]) => {
        if (product && product.category === promo.categoryKey) {
          applyDiscountToProduct(product, promo.discountPercentage);
        }
      });
    } else if (promo.type === 'product') {
      const product = currentProducts[promo.productKey];
      if (product) {
        applyDiscountToProduct(product, promo.discountPercentage);
      }
    }
  });
}

function applyDiscountToProduct(product, discountPercentage) {
  if (!product) return;
  
  const originalPrice = parseFloat(product.price) || 0;
  const discount = parseFloat(discountPercentage) || 0;
  
  if (originalPrice > 0 && discount > 0) {
    const discountAmount = originalPrice * (discount / 100);
    const newPrice = originalPrice - discountAmount;
    
    product.discountedPrice = Math.round(newPrice);
    product.originalPrice = Math.round(originalPrice);
    product.hasDiscount = true;
  }
}

// ==================== تحديث ترجمة العروض ====================
function refreshOffersTranslation() {
  const offers = document.querySelectorAll('.offer-item, .special-offer, .promo-card');
  
  offers.forEach(offer => {
    const title = offer.querySelector('.offer-title, .special-offer-title, .promo-title');
    const description = offer.querySelector('.offer-description, .special-offer-desc');
    
    if (title && title.dataset.translate) {
      title.textContent = translate(title.dataset.translate);
    }
    
    if (description && description.dataset.translate) {
      description.textContent = translate(description.dataset.translate);
    }
  });
}

function initAutoScroll() {
    promotionsContainer = document.getElementById('promotionsContainer');
    if (!promotionsContainer) return;

    // بدء التحريك التلقائي
    startAutoScroll();

    // إضافة مستمعات الأحداث لإيقاف التحريك عند التفاعل
    promotionsContainer.addEventListener('mouseenter', stopAutoScroll);
    promotionsContainer.addEventListener('touchstart', handleTouchStart);
    promotionsContainer.addEventListener('wheel', handleWheel);

    promotionsContainer.addEventListener('mouseleave', resumeAutoScrollAfterDelay);
    promotionsContainer.addEventListener('touchend', handleTouchEnd);
}

function startAutoScroll() {
    if (autoScrollInterval) return;
    
    isAutoScrolling = true;
    autoScrollInterval = requestAnimationFrame(autoScrollStep);
}

function stopAutoScroll() {
    if (!autoScrollInterval) return;
    
    isAutoScrolling = false;
    cancelAnimationFrame(autoScrollInterval);
    autoScrollInterval = null;
    lastInteractionTime = Date.now();
}

function resumeAutoScrollAfterDelay() {
    // إلغاء أي وقت انتظار سابق
    if (pauseTimeout) {
        clearTimeout(pauseTimeout);
        pauseTimeout = null;
    }
    
    // الانتظار لمدة 5 ثوانٍ قبل استئناف التحريك
    pauseTimeout = setTimeout(() => {
        if (Date.now() - lastInteractionTime >= 5000) {
            startAutoScroll();
        }
    }, 5000);
}

function autoScrollStep() {
    if (!promotionsContainer || !isAutoScrolling) return;

    // حساب الموضع الجديد
    let currentScroll = promotionsContainer.scrollLeft;
    let maxScroll = promotionsContainer.scrollWidth - promotionsContainer.clientWidth;
    
    // التحقق إذا وصلنا للنهاية
    if (currentScroll >= maxScroll) {
        // العودة للبداية بشكل سلس
        promotionsContainer.scrollTo({
            left: 0,
            behavior: 'smooth'
        });
        
        // إعادة ضبط المؤقت للاستمرار بعد العودة
        setTimeout(() => {
            if (isAutoScrolling) {
                autoScrollInterval = requestAnimationFrame(autoScrollStep);
            }
        }, 1000); // تأخير قبل الاستمرار بعد العودة للبداية
        return;
    }
    
    // التمرير التدريجي
    promotionsContainer.scrollLeft += scrollSpeed * scrollDirection;
    
    // الاستمرار في التحريك
    autoScrollInterval = requestAnimationFrame(autoScrollStep);
}

function handleTouchStart() {
    stopAutoScroll();
}

function handleTouchEnd() {
    lastInteractionTime = Date.now();
    resumeAutoScrollAfterDelay();
}

function handleWheel() {
    stopAutoScroll();
    lastInteractionTime = Date.now();
    resumeAutoScrollAfterDelay();
}

// تحديث الاتجاه بناءً على اللغة
function updateScrollDirection() {
    const lang = currentLang();
    scrollDirection = lang === 'ar' ? -1 : 1;
}

// إعادة تهيئة التحريك عند تغيير اللغة
document.addEventListener('languageChanged', () => {
    updateScrollDirection();
    if (promotionsContainer && isAutoScrolling) {
        stopAutoScroll();
        setTimeout(startAutoScroll, 100);
    }
});

// ==================== إدارة البيانات ====================
function loadInitialData() {
  let loadedCount = 0;
  const totalLoads = 10;

  function updateProgress() {
    loadedCount++;
    const progress = 10 + (loadedCount / totalLoads) * 80;
    loadingProgress = Math.min(progress, 90);
    updateLoadingProgress();
    
    if (loadedCount === 1) {
      currentLoadingStep = 1;
      updateLoadingMessage();
    } else if (loadedCount === 3) {
      currentLoadingStep = 2;
      updateLoadingMessage();
    } else if (loadedCount === 6) {
      currentLoadingStep = 3;
      updateLoadingMessage();
    } else if (loadedCount === 8) {
      currentLoadingStep = 4;
      updateLoadingMessage();
    }
    
    // إضافة تحقق إضافي لضمان اكتمال التحميل
    if (loadedCount >= totalLoads) {
      // زيادة شريط التقدم إلى 100% قبل الإكمال
      loadingProgress = 100;
      updateLoadingProgress();
      setTimeout(completeLoading, 500);
    }
  }

  try {
    onValue(ref(db, 'storeWelcomeMessage'), snap => {
      currentPromo = { welcomeMessage: snap.val() };
      renderWelcome(currentPromo.welcomeMessage);
      updateProgress();
    });
  } catch (e) {
    console.error('welcomeMessage load error', e);
    showErrorToast('فشل تحميل الترحيب');
    updateProgress();
  }
  
  try {
    onValue(ref(db, 'storeAboutUs'), snap => {
      currentAbout = snap.val() || {};
      loadAboutContent(currentAbout);
      updateProgress();
    });
  } catch (e) {
    console.error('aboutUs load error', e);
    showErrorToast('فشل تحميل من انا');
    updateProgress();
  }
  
  try {
    onValue(ref(db, 'storeContactInfo'), snap => {
      currentContacts = snap.val() || {};
      renderContactCards(currentContacts);
      updateProgress();
    });
  } catch (e) {
    console.error('contactInfo load error', e);
    showErrorToast('فشل تحميل التواصل');
    updateProgress();
  }
  
  try {
    onValue(ref(db, 'storeFaqs'), snap => {
      currentFAQs = snap.val() || {};
      renderPublicFAQs(currentFAQs);
      updateProgress();
    });
  } catch (e) { 
    console.error('faqs load error', e);
    showErrorToast('فشل تحميل الأسأله الشائعه'); 
    updateProgress();
  }
  
  try {
    onValue(ref(db, 'storestats'), snap => {
      currentStats = snap.val() || {};
      renderStats(currentStats);
      updateProgress();
    });
  } catch (e) { 
    console.error('stats load error', e);
    showErrorToast('فشل تحميل الأحصائيات'); 
    updateProgress();
  }
  
  try {
    onValue(ref(db, 'storeservices'), snap => {
      currentServices = snap.val() || {};
      renderServices(currentServices);
      updateProgress();
    });
  } catch (e) { 
    console.error('services load error', e);
    showErrorToast('فشل تحميل الخدمات'); 
    updateProgress();
  }  

  try {
    onValue(ref(db, 'storeBotResponses'), snap => {
      currentBot = snap.val() || {};
      setupChatBot(currentBot);
      updateProgress();
    });
  } catch (e) {
    console.error('botResponses load error', e);
    showErrorToast('فشل تحميل الروبوت');
    updateProgress();
  }
  
  try {
    onValue(ref(db, 'storeQuickContact'), snap => {
      qcSettings = snap.val() || {};
      initQuickContact(qcSettings);
      updateProgress();
    });
  } catch (e) {
    console.error('quickContact load error', e);
    showErrorToast('فشل تحميل التواصل السريع');
    updateProgress();
  }
  
  try {
    onValue(ref(db, 'storeCategories'), (snap) => {
      currentCategories = snap.val() || {};
      updateCategoryOptions();
      updateProgress();
      loadProducts();
    });
  } catch (e) {
    console.error('categories load error', e);
    showErrorToast('فشل تحميل التصنيفات');
    updateProgress();
    loadProducts();
  }

  try {
    onValue(ref(db, 'storeProducts'), snap => {
      currentProducts = snap.val() || {};
      initSearch();
      applyProductDiscounts();
      renderStore(currentProducts);
      updateProgress();
      loadPromotions();
    });
  } catch (e) {
    console.error('projects load error', e);
    showErrorToast('فشل تحميل المنتجات');
    updateProgress();
  }
  
  try {
    const transRef = ref(db, 'translations');
    onValue(transRef, (snap) => {
      loadTranslations()
        .then(() => {
          applyTranslations();
          if (currentBot && Object.keys(currentBot).length > 0) {
            setupChatBot(currentBot);
          }
          document.dispatchEvent(new Event('languageChanged'));
          updateProgress();
        })
        .catch(e => {
          console.error('Translations reload error:', e);
          showErrorToast('فشل تحديث الترجمات');
          updateProgress();
        });
    });
  } catch (e) {
    console.error('translations listener error', e);
    showErrorToast('فشل متابعة الترجمة');
    updateProgress();
  }
}

// ==================== إدارة الترجمة ====================
async function loadTranslations() {
  try {
    const transRef = ref(db, 'translate');
    const snapshot = await get(transRef);
    if (snapshot.exists()) {
      Object.assign(translations, snapshot.val());
      applyTranslations();
    }
  } catch (error) {
    console.error("Error loading translations:", error);
  }
}

function translate(key) {
  const lang = currentLang();
  return translations[key]?.[lang] || key;
}

// ==================== إدارة الشريط التنقلي ====================
function initNavbarScroll() {
  const navbar = document.getElementById('navsec');
  let lastScrollY = window.pageYOffset;
  window.addEventListener('scroll', () => {
    const currentY = window.pageYOffset;
    if (currentY <= 0) {
      navbar.classList.remove('hide', 'show');
    } else if (currentY > lastScrollY) {
      navbar.classList.add('hide');
      navbar.classList.remove('show');
    } else {
      navbar.classList.add('show');
      navbar.classList.remove('hide');
    }
    lastScrollY = currentY;
  });
}

function initSectionObserver() {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('section').forEach(sec => {
    sectionObserver.observe(sec);
  });
}

// ==================== إدارة المحادثة ====================
function setupChatBot(responses) {
  const lang = currentLang();
  welcomeButtons = Object.values(responses)
    .filter(r => r.category === 'welcome')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 4)
    .map(r => ({
      raw: r,
      question: typeof r.question === 'object'
        ? r.question[lang] || r.question.ar
        : r.question
    }));

  const list = Object.values(responses).map(r => ({
    question: typeof r.question === 'object'
      ? r.question[lang] || r.question.ar
      : r.question,
    response: r.response,
    keywords: r.keywords || []
  }));

  fuseBot = new Fuse(list, {
    keys: ['question', 'keywords'],
    threshold: 0.3,
    includeScore: true
  });

  showWelcomeMessage();
  initVoiceRecognition();
}

function showWelcomeMessage() {
  const box = document.getElementById('chatBox');
  if (!box) return;

  const lang = currentLang();
  const greeting = translations.botwelcm?.[lang] || 'مرحباً!';
  const prompt = translations.botwelcm2?.[lang] || 'كيف يمكنني مساعدتك؟';

  box.innerHTML = `
    <div class="message bot">
      <h3>${greeting}</h3>
      <p>${prompt}</p>
      <div class="examples">
        ${welcomeButtons.map(b => `
          <button class="welcome-btn" 
                  onclick="handleBotButton('${b.question.replace(/'/g, "\\'")}')">
            ${b.question}
          </button>`
    ).join('')}
      </div>
    </div>`;
  applyTranslations();
}

function handleBotButton(q) {
  document.getElementById('userInput').value = q;
  sendBotMessage();
}

function initVoiceRecognition() {
  recognition.lang = 'ar-SA';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = e => {
    document.getElementById('userInput').value = e.results[0][0].transcript;
    voiceAsked = true;
    sendBotMessage();
    isListening = false;
  };

  const voiceBtn = document.getElementById('voice-btn');
  if (!voiceBtn) return;

  recognition.onstart = () => {
    voiceBtn.classList.add('recording');
  };
  recognition.onend = () => {
    voiceBtn.classList.remove('recording');
    isListening = false;
  };
  recognition.onerror = () => {
    isListening = false;
  };

  voiceBtn.onclick = () => {
    if (!isListening) {
      recognition.start();
      isListening = true;
    }
  };
}

function sendBotMessage() {
  const inp = document.getElementById('userInput');
  const txt = inp.value.trim();
  if (!txt) return;

  const box = document.getElementById('chatBox');
  box.innerHTML += `<div class="message user">${txt}</div>`;
  inp.value = '';
  box.innerHTML += `
    <div class="message bot">
      <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`;
  box.scrollTop = box.scrollHeight;

  setTimeout(() => {
    box.querySelector('.typing-indicator').parentElement.remove();

    let resp = '';
    const lower = txt.toLowerCase();
    const greetings = ['اهلا', 'مرحبا', 'هلا', 'السلام عليكم'];
    if (greetings.some(g => lower.includes(g))) {
      resp = translations['bot_reply_rewelcome']?.[currentLang()] ||
        (currentLang() === 'ar' ?
          'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊' :
          'Welcome back! How can I help? 😊');
    } else {
      const found = fuseBot.search(txt)[0]?.item;
      if (found) {
        const r = found.response;
        resp = typeof r === 'object' ?
          (r[currentLang()] || r.ar) :
          r;
      } else {
        resp = translations['bot_reply_not_understand']?.[currentLang()] ||
          (currentLang() === 'ar' ?
            'عذرًا، لم أفهم. حاول إعادة الصياغة.' :
            "Sorry, I didn't understand. Please rephrase.");
      }
    }

    box.innerHTML += `<div class="message bot">${resp}</div>`;
    box.scrollTop = box.scrollHeight;

    if (voiceAsked) {
      const u = new SpeechSynthesisUtterance(resp);
      const lang = currentLang();
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      speechSynthesis.speak(u);
      voiceAsked = false;
    }
  }, 600);
}

// ==================== تأثير الكتابة للرسالة الترحيبية ====================
function renderWelcome(msg) {
  const lang = currentLang();
  welcomeMessage = typeof msg === 'object'
    ? (msg.text?.[lang] || msg.text?.ar || '')
    : (msg.text || msg);
  clearTimeout(typingTimer);
  initTypingEffect();
}

function initTypingEffect() {
  const container = document.getElementById('typing-container');
  if (!container) return;
  container.innerHTML = '';

  function calculateLines(text) {
    const words = text.split(' ');
    const lines = []; let line = '';
    for (let w of words) {
      const test = line ? line + ' ' + w : w;
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.whiteSpace = 'nowrap';
      span.textContent = test;
      document.body.appendChild(span);
      if (span.offsetWidth > container.clientWidth * 0.9) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
      document.body.removeChild(span);
    }
    lines.push(line);
    return lines;
  }

  const lines = calculateLines(welcomeMessage);
  let idx = 0;

  (function typeLine() {
    if (idx >= lines.length) {
      typingTimer = setTimeout(typeLine, 10000);
      return;
    }
    const div = document.createElement('div');
    div.className = 'typing-line';
    container.appendChild(div);
    let charIdx = 0;

  (function typeChar() {
      if (charIdx <= lines[idx].length) {
        div.innerHTML = lines[idx].slice(0, charIdx) + '<span class="blinking-cursor"></span>';
        charIdx++;
        setTimeout(typeChar, 80);
      } else {
        const cursor = div.querySelector('.blinking-cursor');
        if (cursor) cursor.remove();
        idx++;
        setTimeout(typeLine, idx < lines.length ? 700 : 4000);
      }
    })();
  })();
}

// ==================== الأسئلة الشائعة ====================
function renderPublicFAQs(data) {
  const lang = currentLang();
  const list = document.getElementById('faqList');
  list.innerHTML = '';

  Object.values(data || {})
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(f => {
      const q = typeof f.question === 'object'
        ? (f.question[lang] || f.question.ar)
        : f.question;
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.style.setProperty('--faq-color', f.color || '#fff');

      const btn = document.createElement('button');
      btn.className = 'faq-btn';
      btn.innerHTML = `<i class="${f.icon || ''}"></i><span>${q}</span>`;
      btn.onclick = () => displayAnswer({
        answer: typeof f.answer === 'object'
          ? (f.answer[lang] || f.answer.ar)
          : f.answer,
        color: f.color || '#9e9e9e'
      });

      item.appendChild(btn);
      list.appendChild(item);
    });

    applyTranslations(); 
}

function displayAnswer({ answer, color }) {
  const box = document.getElementById('answerBox');
  box.style.borderColor = color;
  const cnt = box.querySelector('.answer-content');
  cnt.style.color = color;
  cnt.textContent = answer;
}

// ==================== الإحصائيات ====================
function renderStats(data) {
  const lang = currentLang();
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = '';
  Object.values(data || {}).filter(i=>i.visible)
    .sort((a,b)=>(a.order||0)-(b.order||0))
    .forEach(i => {
      const label = typeof i.label === 'object'
        ? (i.label[lang] || i.label.ar)
        : i.label;
      const d = document.createElement('div');
      d.className = 'stats-item';
      d.style.setProperty('--stat-color', i.color);
      d.innerHTML = `<i class="${i.icon}"></i><h3>${label}</h3><p>${i.value}${i.unit}</p>`;
      grid.appendChild(d);
    });
    applyTranslations(); 
}

// ==================== الخدمات ====================
function renderServices(data) {
  const lang = currentLang();
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';

  Object.values(data || {})
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(s => {
      const title = typeof s.title === 'object'
        ? (s.title[lang] || s.title.ar)
        : s.title;
      const desc = typeof s.description === 'object'
        ? (s.description[lang] || s.description.ar)
        : s.description;

      const serviceEl = document.createElement('div');
      serviceEl.className = 'services-item'; 
      serviceEl.style.setProperty('--service-color', s.color);

      serviceEl.innerHTML = `
        <i class="${s.icon}" aria-hidden="true"></i>
        <div class="text-wrapper">
          <h3>${title}</h3>
          <p>${desc}</p>
        </div>
      `;

      grid.appendChild(serviceEl);
    });
   applyTranslations(); 
}

// ==================== من نحن ====================
function loadAboutContent(data) {
  const lang = currentLang();
  const key = Object.keys(data || {})[0];
  const txt = typeof data[key]?.content === 'object'
    ? (data[key].content[lang] || data[key].content.ar)
    : data[key]?.content || '';
  document.getElementById('aboutContent').innerHTML = txt.replace(/\n/g, '<br>');
}

// ==================== بطاقات التواصل ====================
function renderContactCards(data) {
  const grid = document.getElementById('contactGrid');
  grid.innerHTML = '';
  const lang = currentLang();

  Object.values(data || {}).forEach(c => {
    const name = typeof c.name === 'object'
      ? (c.name[lang] || c.name.ar)
      : c.name;
    const a = document.createElement('a');
    a.className = 'contact-card';
    a.href = c.link;
    a.target = '_blank';
    const iconKey = c.icon.split(' ').find(i => iconColors[i]);
    a.style.setProperty('--card-color', iconColors[iconKey] || '#000');
    a.innerHTML = `<i class="${c.icon}"></i><h3>${name}</h3>`;
    grid.appendChild(a);
  });

  applyTranslations();
}

const iconColors = {
  "fa-google": "#D44638", "fa-whatsapp": "#25D366", "fa-facebook": "#1877F2",
  "fa-twitter": "#1DA1F2", "fa-linkedin": "#0077B5", "fa-instagram": "#E4405F",
  "fa-github": "#333", "fa-paypal": "#1877F2", "fa-telegram": "#0088cc",
  "fa-tiktok": "#69c9d0", "fa-youtube": "#ff0000", "fa-microsoft": "#6666ff", "fa-at": "white"
};

// ==================== المتجر والمنتجات ====================
function renderStore(data) {
  const container = document.getElementById('portfolioGrid');
  
  const screenWidth = window.innerWidth;
  let columns = 1;
  
  if (screenWidth >= 768) columns = 3;
  else if (screenWidth >= 480) columns = 2;

  container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  container.innerHTML = '';
  const lang = currentLang();

  if (!data || !Object.keys(data).length) {
    const noProjectsMsg = translations['portfolio_no_projects']?.[lang] || 
                        (lang === 'ar' ? 'لا توجد منتجات للعرض حالياً' : 'No projects to display at the moment');
    
    container.innerHTML = `<p class="no-results">${noProjectsMsg}</p>`;
    return;
  }
 
  const filteredData = Object.entries(data).filter(([key, p]) => (p.quantity || 0) > 0);

  if (filteredData.length === 0) {
    const noProjectsMsg = translations['portfolio_no_projects']?.[lang] || 
                        (lang === 'ar' ? 'لا توجد مشاريع للعرض حالياً' : 'No projects to display at the moment');
    
    container.innerHTML = `<p class="no-results">${noProjectsMsg}</p>`;
    return;
  }

  filteredData
      .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
      .forEach(([key, p]) => {
      const title = getLocalizedText(p.title);
      const desc = getLocalizedText(p.description);
     
      const priceHtml = p.hasDiscount ? 
        `<div class="price-container">
          <span class="original-price" style="text-decoration: line-through; font-size: 0.9em; opacity: 0.7;">
            ${p.originalPrice} 
          </span>
          <span class="new-price" style="color: var(--color-success); font-weight: bold;">
            ${p.discountedPrice} ${translations.currency?.[lang] || 'جنيه'}
          </span>
        </div>` :
        `<span class="info-price"><i class="fas fa-sack-dollar"></i> ${p.price} ${translations.currency?.[lang] || 'جنيه'}</span>`;
      
      const tags = Array.isArray(p.tags?.[lang]) ? p.tags[lang] : (p.tags?.[lang] || '').split(',').map(t => t.trim());

      const imgs = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(imgObj => imgObj.url)
        : ['placeholder.png'];
      const cardColor = p.color || '#fff';
      const textColor = p.textColor || '#000';

      let categoryName = 'غير مصنف';
      let categoryIcon = 'fas fa-tag';

      if (p.category) {
        if (typeof p.category === 'object') {
          categoryName = p.category[lang] || p.category.ar || 'غير مصنف';
        } else if (currentCategories[p.category]) {
          const category = currentCategories[p.category];
          categoryName = typeof category.name === 'object'
            ? (category.name[lang] || category.name.ar || 'غير مصنف')
            : (category.name || 'غير مصنف');
          categoryIcon = category.icon || 'fas fa-tag';
        } else {
          categoryName = p.category;
        }
      }

      const isInCart = cart.some(item => item.id === key);
      const finalPrice = p.hasDiscount ? (p.discountedPrice || p.price) : p.price;

      const card = document.createElement('div');
      card.className = 'project-card';
      card.style.backgroundColor = cardColor;
      card.style.color = textColor;
      card.dataset.key = key;

      card.innerHTML = `
        <div class="card-header">
          <div class="carousel">
            ${imgs.map((url, i) =>
        `<div class="carousel-slide${i === 0 ? ' active' : ''}">
                 <img src="${url}" alt="${title}" loading="lazy">
               </div>`
      ).join('')}
            <div class="carousel-dots">
              ${imgs.map((_, i) =>
        `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
      ).join('')}
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">${title}</h3>
          </div>

          <p class="description">${desc}</p>

          <div class="tags-container">
            ${tags.map(t => `<span class="tag">${t}</span>`).join('')}
            <span class="tag category-tag">
              <i class="${categoryIcon}"></i>
              ${categoryName}
            </span>
          </div>

          <div class="card-footer">
            
${p.hasDiscount ? `
  <div class="price-container">
    <span class="original-price" style="text-decoration: line-through; font-size: 0.9em; opacity: 0.7;">
      ${p.originalPrice} ${translations.currency?.[lang] || 'جنيه'}
    </span>
    <span class="new-price" style="color: var(--color-success); font-weight: bold;">
      ${p.discountedPrice} ${translations.currency?.[lang] || 'جنيه'}
    </span>
  </div>
` : `
  <span class="info-price">
    <i class="fas fa-sack-dollar"></i> ${p.price} ${translations.currency?.[lang] || 'جنيه'}
  </span>
`}
            
            <div class="product-quantity-controls" data-product="${key}" style="display: ${isInCart ? 'flex' : 'none'}">
              <button class="quantity-btn minus-btn" data-product="${key}"><i class="fas fa-minus"></i></button>
              <span class="quantity-value">${isInCart ? cart.find(item => item.id === key).quantity : 1}</span>
              <button class="quantity-btn plus-btn" data-product="${key}"><i class="fas fa-plus"></i></button>
            </div>

            <button class="add-to-cart-btn" data-product="${key}" style="display: ${isInCart ? 'none' : 'block'}">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

  initAllCarousels();
  setupDescriptionToggle();
  setupAddToCartButtons();
  setupQuantityControls();
  applyTranslations();
}

function setupAddToCartButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.target.closest('.add-to-cart-btn').dataset.product;
      const productCard = e.target.closest('.project-card');
      const product = currentProducts[productId];
      
      if (product) {
        const finalPrice = product.hasDiscount ? product.discountedPrice : product.price;
        let quantityElement = productCard.querySelector(`.product-quantity-controls[data-product="${productId}"] .quantity-value`);
        if (!quantityElement) {
          quantityElement = productCard.querySelector(`.quantity-value`);
        }
        const quantity = parseInt(quantityElement.textContent);
        
        addToCart(
          productId,
          getLocalizedText(product.title),
          finalPrice,
          product.images?.[0]?.url || 'placeholder.png',
          quantity
        );
        
        productCard.querySelectorAll(`.add-to-cart-btn[data-product="${productId}"]`).forEach(btn => {
          btn.style.display = 'none';
        });
        productCard.querySelectorAll(`.product-quantity-controls[data-product="${productId}"]`).forEach(controls => {
          controls.style.display = 'flex';
        });
      }
    });
  });
}

function setupQuantityControls() {
  document.querySelectorAll('.plus-btn').forEach(btn => {
    btn.onclick = (e) => {
      const productId = btn.dataset.product;
      const item = cart.find(item => item.id === productId);
      if (item) {
        updateQuantity(productId, item.quantity + 1);
      }
    };
  });

  document.querySelectorAll('.minus-btn').forEach(btn => {
    btn.onclick = (e) => {
      const productId = btn.dataset.product;
      const item = cart.find(item => item.id === productId);
      if (item) {
        updateQuantity(productId, item.quantity - 1);
      }
    };
  });
}

function initAllCarousels() {
  document.querySelectorAll('.project-card').forEach(card => {
    const slides = Array.from(card.querySelectorAll('.carousel-slide'));
    const dots = Array.from(card.querySelectorAll('.carousel-dot'));
    const dotColor = card.dataset.dotColor;
    let idx = 0, startX = 0, timer;

    function show(i) {
      slides[idx].classList.remove('active');
      dots[idx].classList.remove('active');
      dots[idx].style.background = 'rgba(0,0,0,0.2)';

      idx = (i + slides.length) % slides.length;

      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
      dots[idx].style.background = dotColor;
    }

    timer = setInterval(() => show(idx + 1), 5000);

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        clearInterval(timer);
        show(parseInt(dot.dataset.index, 10));
        timer = setInterval(() => show(idx + 1), 5000);
      });
    });

    const carousel = card.querySelector('.carousel');
    carousel.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      clearInterval(timer);
    });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 50) show(idx - 1);
      else if (dx < -50) show(idx + 1);
      timer = setInterval(() => show(idx + 1), 5000);
    });

    card.addEventListener('mouseenter', () => clearInterval(timer));
    card.addEventListener('mouseleave', () => {
      clearInterval(timer);
      timer = setInterval(() => show(idx + 1), 5000);
    });
  });
}

function setupDescriptionToggle() {
  document.querySelectorAll('.project-card .description').forEach(desc => {
    const style = getComputedStyle(desc);
    const lineHeight = parseFloat(style.lineHeight);
    const collapsedHeight = lineHeight * 3;
    desc.style.maxHeight = collapsedHeight + 'px';
    desc.style.transition = 'max-height 0.4s ease';
    desc.addEventListener('click', () => {
      if (!desc.classList.contains('expanded')) {
        desc.classList.add('expanded');
        desc.style.maxHeight = desc.scrollHeight + 'px';
      } else {
        desc.style.maxHeight = collapsedHeight + 'px';
        desc.addEventListener('transitionend', function handler() {
          desc.classList.remove('expanded');
          desc.removeEventListener('transitionend', handler);
        });
      }
    });
  });
}

// ==================== إدارة السلة ====================
function addToCart(id, title, price, image, quantity = 1) {
  const existingItem = cart.find(item => item.id === id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id,
      title,
      price,
      image,
      quantity: quantity
    });
  }

  updateCartCount();
  saveCartToLocalStorage();
  showToast(translations.item_added?.[currentLang()] || 'تمت الإضافة إلى السلة');
}

function updateQuantity(id, newQuantity) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  if (newQuantity <= 0) {
    removeFromCart(id);
  } else {
    item.quantity = newQuantity;
    saveCartToLocalStorage();
    updateCartCount();
    renderCartItems();
    
    updateProductCardQuantity(id, newQuantity);
    updatePromoCardQuantity(id, newQuantity);
  }
}

function updateProductCardQuantity(productId, quantity) {
  const productCards = document.querySelectorAll(`.project-card[data-key="${productId}"]`);
  
  productCards.forEach(card => {
    const quantityValue = card.querySelector('.quantity-value');
    const addButton = card.querySelector('.add-to-cart-btn');
    const quantityControls = card.querySelector('.product-quantity-controls');
    
    if (quantityValue) quantityValue.textContent = quantity;
    
    if (quantity <= 0) {
      if (addButton) addButton.style.display = 'block';
      if (quantityControls) quantityControls.style.display = 'none';
    } else {
      if (addButton) addButton.style.display = 'none';
      if (quantityControls) quantityControls.style.display = 'flex';
    }
  });
}

function updatePromoCardQuantity(productId, quantity) {
  const promoCards = document.querySelectorAll('.promo-card');
  
  promoCards.forEach(card => {
    const addButton = card.querySelector(`.add-to-cart-btn[data-product="${productId}"]`);
    const quantityControls = card.querySelector(`.product-quantity-controls[data-product="${productId}"]`);
    
    if (addButton || quantityControls) {
      const quantityValue = card.querySelector(`.quantity-value`);
      
      if (quantityValue) quantityValue.textContent = quantity;
      
      if (quantity <= 0) {
        if (addButton) addButton.style.display = 'block';
        if (quantityControls) quantityControls.style.display = 'none';
      } else {
        if (addButton) addButton.style.display = 'none';
        if (quantityControls) quantityControls.style.display = 'flex';
      }
    }
  });
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCartToLocalStorage();
  updateCartCount();
  renderCartItems();
  
  // تحديث أزرار المنتج في المتجر
  const productCards = document.querySelectorAll(`.project-card[data-key="${id}"]`);
  productCards.forEach(card => {
    const addButton = card.querySelector(`.add-to-cart-btn[data-product="${id}"]`);
    const controls = card.querySelector(`.product-quantity-controls[data-product="${id}"]`);
    
    if (addButton && controls) {
      addButton.style.display = 'block';
      controls.style.display = 'none';
      
      // إعادة تعيين القيمة إلى 1
      const quantityValue = controls.querySelector('.quantity-value');
      if (quantityValue) {
        quantityValue.textContent = '1';
      }
    }
  });
  
  // تحديث أزرار العروض
  updatePromoCardQuantity(id, 0);
}

function updateCartCount() {
  const countElement = document.getElementById('cart-count');
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  if (countElement) {
    countElement.textContent = count;
  }
}

function saveCartToLocalStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    if (cart.length === 0) {
      updateCartCount();
      return;
    }
    cart.forEach(item => {
      resetProductButtons(item.id);
    });
  }
  updateCartCount();
}

function renderCartItems() {
  const cartItemsElement = document.getElementById('cart-items');
  cartItemsElement.innerHTML = '';
  
  if (cart.length === 0) {
    const emptyText = translations['cart_empty']?.[currentLang()] || 
                     (currentLang() === 'ar' ? 'السلة فارغة' : 'Cart is empty');
    
    cartItemsElement.innerHTML = `<p class="empty-cart">${emptyText}</p>`;
    applyTranslations();
    updateCartTotal();
    return;
  }

  const currency = translations.currency?.[currentLang()] || 
                 (currentLang() === 'ar' ? 'جنيه' : 'EGP');
  
  cart.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-details">
        <h4>${item.title}</h4>
        <div class="cart-item-price">${item.price} ${currency}</div>
        <div class="cart-item-quantity">
          <button class="quantity-btn minus" data-id="${item.id}"> <i class="fas fa-minus"></i></button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
          <button class="quantity-btn plus" data-id="${item.id}"> <i class="fas fa-plus"></i></button>
          <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></button>
        </div>
        
      </div>
      
    `;
    cartItemsElement.appendChild(itemElement);
  });

  document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.target.closest('.quantity-btn').dataset.id;
      const item = cart.find(item => item.id === id);
      if (item) {
        updateQuantity(id, item.quantity - 1);
      }
    };
  });

  document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
    btn.onclick = (e) => {
      const id = e.target.closest('.quantity-btn').dataset.id;
      const item = cart.find(item => item.id === id);
      if (item) {
        updateQuantity(id, item.quantity + 1);
      }
    };
  });

  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const newQuantity = parseInt(e.target.value) || 1;
      updateQuantity(id, newQuantity);
    });
  });

  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.remove-item').dataset.id;
      removeFromCart(id);
    });
  });

  updateCartTotal();
}

function updateCartTotal() {
  const totalElement = document.getElementById('cart-total-price');
  const currency = translations.currency?.[currentLang()] || 
                 (currentLang() === 'ar' ? 'جنيه' : 'EGP');
  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  
  if (totalElement) {
    // إزالة العملة المكررة - عرض الرقم فقط
    totalElement.textContent = total.toFixed(2);
  }
}

function openCartPopup() {
  document.getElementById('cart-popup').classList.remove('hidden');
  document.getElementById('overlay').classList.remove('hidden');
  renderCartItems();
}

function closeCartPopup() {
  document.getElementById('cart-popup').classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
}

function openCheckoutForm() {
    console.log('فتح نموذج تأكيد الطلب...'); // للتتبع
    
    if (!validateCart()) {
        console.log('فشل التحقق من السلة');
        return;
    }
    
    // إغلاق popup السلة
    const cartPopup = document.getElementById('cart-popup');
    if (cartPopup) {
        cartPopup.classList.add('hidden');
    }
    
    // فتح نموذج التأكيد
    const checkoutPopup = document.getElementById('checkout-form-popup');
    const overlay = document.getElementById('overlay');
    
    if (checkoutPopup && overlay) {
        checkoutPopup.classList.remove('hidden');
        overlay.classList.remove('hidden');
        
        // إعادة تعيين النموذج وتهيئة طرق الدفع
        resetCheckoutForm();
        setupPaymentMethodSelection();
        
        console.log('تم فتح نموذج التأكيد بنجاح');
    } else {
        console.error('عناصر نموذج التأكيد غير موجودة');
        showToast('حدث خطأ في فتح نموذج الطلب', 'error');
    }
}

function closeCheckoutForm() {
  document.getElementById('checkout-form-popup').classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
}

function resetProductButtons(productId) {
  const cards = document.querySelectorAll(`.project-card[data-key="${productId}"]`);
  
  cards.forEach(card => {
    const addButton = card.querySelector(`.add-to-cart-btn[data-product="${productId}"]`);
    const controls = card.querySelector(`.product-quantity-controls[data-product="${productId}"]`);
    
    if (addButton && controls) {
      addButton.style.display = 'block';
      controls.style.display = 'none';
      
      const quantityValue = controls.querySelector('.quantity-value');
      if (quantityValue) {
        quantityValue.textContent = '1';
      }
    }
  });
}

// ==================== إدارة الطلبات ومنع الإرسال المزدوج ====================
async function getAddressFromCoords(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    
    if (data.error) return `${lat}, ${lng}`;
    
    const address = data.address;
    let displayName = '';
    
    if (address.road) displayName += address.road + ', ';
    if (address.neighbourhood) displayName += address.neighbourhood + ', ';
    if (address.suburb) displayName += address.suburb + ', ';
    if (address.city_district) displayName += address.city_district + ', ';
    if (address.city) displayName += address.city;
    
    return displayName || data.display_name || `${lat}, ${lng}`;
  } catch (e) {
    return `${lat}, ${lng}`;
  }
}

async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      reject(new Error('Geolocation not supported'));
      return;
    }

    const gettingLocationMsg = translations['getting_location']?.[currentLang()] || 'جاري الحصول على الموقع...';
    const locationSuccessMsg = translations['location_success']?.[currentLang()] || 'تم الحصول على الموقع بنجاح';
    const locationFailMsg = translations['location_fail']?.[currentLang()] || 'فشل في الحصول على الموقع';
       
    showToast(gettingLocationMsg);
    
    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoords(latitude, longitude);
        
        document.getElementById('checkout-location').value = address;
        showToast(locationSuccessMsg);
        resolve(address);
      },
      error => {
        console.error('Error getting location:', error);
        showToast(locationFailMsg, 'error');

        const manualPlaceholder = translations['location_manual_placeholder']?.[currentLang()] || 'اكتب العنوان يدوياً';
        document.getElementById('checkout-location').placeholder = manualPlaceholder;
        reject(error);
        
      },
      { 
        timeout: 10000,
        enableHighAccuracy: true
      }
    );
  });
}

// ==================== إدارة الدفع ====================
function setupPaymentMethodSelection() {
  const paymentOptions = document.querySelectorAll('.payment-option');
  
  paymentOptions.forEach(option => {
    option.addEventListener('click', () => {
      const method = option.dataset.method;
      
      paymentOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      
      updatePaymentInterface(method);
    });
  });

  // تعيين الافتراضي
  const defaultOption = document.querySelector('.payment-option[data-method="cash"]');
  if (defaultOption) {
    defaultOption.classList.add('selected');
  }
}

function updatePaymentInterface(method) {
  const cardFields = document.getElementById('checkout-step2');
  const confirmBtn = document.getElementById('confirm-checkout');
  
  if (method === 'cash') {
    cardFields.classList.add('hidden');
    
    // استخدام نظام الترجمة بدلاً من النصوص الثابتة
    const confirmText = translations['confirm_order']?.[currentLang()] || 'تأكيد الطلب';
    confirmBtn.innerHTML = `<i class="fas fa-check-circle"></i><span data-i18n="confirm_order">${confirmText}</span>`;
    confirmBtn.onclick = processCashPayment;
  } else if (method === 'paymob') {
    cardFields.classList.remove('hidden');
    
    // استخدام نظام الترجمة بدلاً من النصوص الثابتة
    const processText = translations['process_payment']?.[currentLang()] || 'معالجة الدفع';
    confirmBtn.innerHTML = `<i class="fas fa-credit-card"></i><span data-i18n="process_payment">${processText}</span>`;
    confirmBtn.onclick = processPaymobPayment;
  }
  
  // إعادة تطبيق الترجمات للتأكد من تحديث جميع العناصر
  applyTranslations();
}

async function processPaymobPayment() {
  if (!validateCheckoutForm()) return;
  
  if (!validateCardData()) {
    const lang = currentLang();
    const errorMsg = translations['payment_failed']?.[lang] || 'الرجاء إدخال بيانات البطاقة بشكل صحيح';
    showToast(errorMsg, 'error');
    return;
  }
  
  showToast('جاري معالجة الدفع...', 'info');
  
  try {
    const paymentSuccess = await simulatePaymentProcessing();
    
    if (paymentSuccess) {
      showToast('تمت عملية الدفع بنجاح', 'success');
      
      const name = document.getElementById('checkout-name').value;
      const phone = document.getElementById('checkout-phone').value;
      const message = document.getElementById('checkout-message').value;
      const location = document.getElementById('checkout-location').value;
      
      const paymentData = {
        paymentId: 'PMB_' + Date.now(),
        transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        method: 'card',
        status: 'completed',
        amount: cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
      };
      
      const orderSuccess = await sendOrder(name, phone, message, location, 'paymob', paymentData);
      
      if (orderSuccess) {
        resetCheckoutForm();
        cart = [];
        saveCartToLocalStorage();
        updateCartCount();
        updateAllProductButtons();
        closeCheckoutForm();
        
        const lang = currentLang();
        const successMsg = translations['order_confirmed']?.[lang] || 'تم تأكيد الطلب بنجاح!';
        showToast(successMsg, 'success');
      } else {
        throw new Error('فشل في ارسال الطلب');
      }
    } else {
      showToast('فشل في عملية الدفع', 'error');
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    showToast('حدث خطأ أثناء معالجة الدفع', 'error');
  }
}

async function simulatePaymentProcessing() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = Math.random() > 0.2;
      resolve(success);
    }, 2000);
  });
}

function processCashPayment() {
  if (!validateCheckoutForm()) return;
  
  const name = document.getElementById('checkout-name').value;
  const phone = document.getElementById('checkout-phone').value;
  const message = document.getElementById('checkout-message').value;
  const location = document.getElementById('checkout-location').value;
  
  sendOrder(name, phone, message, location, 'cash')
    .then(success => {
      if (success) {
        resetCheckoutForm();
        cart = [];
        saveCartToLocalStorage();
        updateCartCount();
        updateAllProductButtons();
        closeCheckoutForm();
        
        const lang = currentLang();
        const successMsg = translations['order_confirmed']?.[lang] || 'تم تأكيد الطلب بنجاح!';
        showToast(successMsg, 'success');
      }
    })
    .catch(error => {
      console.error('Cash order error:', error);
      showToast('حدث خطأ أثناء تأكيد الطلب', 'error');
    });
}

async function sendOrder(name, phone, message, location, paymentMethod, paymentData = null) {
  if (isSubmitting) {
    const lang = currentLang();
    const processingMsg = translations['processing_previous_order']?.[lang] || 'جاري معالجة الطلب السابق...';
    showToast(processingMsg, 'warning');
    return false;
  }
  
  isSubmitting = true;
  const submitBtn = document.getElementById('confirm-checkout');
  
  if (submitBtn) {
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span data-i18n="processing">جاري المعالجة...</span>';
    applyTranslations();
  }
  
  const lang = currentLang();
  const currency = translations.currency?.[lang] || 'جنيه';
  
  // الحصول على رقم الهاتف الكامل الصحيح
  const countryCode = document.getElementById('checkout-country-code')?.value || '20';
  const fullPhone = getFullPhoneNumber('checkout-country-code', 'checkout-phone');
  
  const orderData = {
    name: name.trim(),
    phone: fullPhone, // الرقم سيصل كـ 201012345678 (مثال لمصر)
    message: (message || '').trim(),
    location: (location || '').trim(),
    paymentMethod,
    paymentData,
    timestamp: Date.now(),
    status: paymentMethod === 'cash' ? 'pending' : 'paid',
    currency,
    total: cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0),
    products: cart.map(item => ({
      id: item.id,
      title: item.title,
      price: parseFloat(item.price),
      quantity: item.quantity,
      image: item.image,
      subtotal: parseFloat(item.price) * item.quantity
    })),
    orderId: 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    countryCode: countryCode,
    originalPhone: phone // حفظ الرقم الأصلي بدون رمز الدولة
  };

  try {
    const orderRef = push(ordersRef);
    await set(orderRef, orderData);
    
    console.log('Order saved successfully:', orderData);
    
    const successMsg = translations['order_saved']?.[lang] || 'تم ارسال الطلب بنجاح ';
    showToast(successMsg, 'success');
    return true;
  } catch (error) {
    console.error('فشل ارسال الطلب:', error);
    const errorMsg = translations['order_save_failed']?.[lang] || 'حدث خطأ أثناء ارسال الطلب';
    showToast(errorMsg, 'error');
    return false;
  } finally {
    isSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = paymentMethod === 'cash' ? 
        '<i class="fas fa-check-circle"></i><span data-i18n="confirm_order">تأكيد الطلب</span>' :
        '<i class="fas fa-credit-card"></i><span data-i18n="process_payment">معالجة الدفع</span>';
      applyTranslations();
    }
  }
}

function resetCheckoutForm() {
  document.getElementById('checkout-form').reset();
  
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.classList.remove('selected');
    if (opt.dataset.method === 'cash') {
      opt.classList.add('selected');
    }
  });
  
  document.getElementById('checkout-step2').classList.add('hidden');
  updatePaymentInterface('cash');
}

function formatCardNumber(e) {
  let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
  let formattedValue = '';
  
  for (let i = 0; i < value.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formattedValue += ' ';
    }
    formattedValue += value[i];
  }
  
  e.target.value = formattedValue.substring(0, 19);
}

function formatExpiryDate(e) {
  let value = e.target.value.replace(/\D/g, '');
  
  if (value.length >= 2) {
    e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
  } else {
    e.target.value = value;
  }
}

function formatCVV(e) {
  let value = e.target.value.replace(/\D/g, '');
  e.target.value = value.substring(0, 4);
}

function processPayment() {
  const paymentMethod = document.querySelector('.payment-option.selected').dataset.method;
  
  if (paymentMethod === 'cash') {
    processCashPayment();
  } else if (paymentMethod === 'paymob') {
    processPaymobPayment();
  }
}

function validateCheckoutForm() {
  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const location = document.getElementById('checkout-location').value.trim();
  const countryCode = document.getElementById('checkout-country-code')?.value || '20';
  
  if (!name) {
    showToast(translations['required_name']?.[currentLang()] || 'الرجاء إدخال الاسم', 'error');
    return false;
  }
  
  if (!phone) {
    showToast(translations['required_phone']?.[currentLang()] || 'الرجاء إدخال رقم الهاتف', 'error');
    return false;
  }
  
  // التحقق من صحة رقم الهاتف
  if (!validatePhoneNumber(phone, countryCode)) {
    const lang = currentLang();
    const countryName = getCountryDisplayName(countryCode, lang);
    const invalidPhoneMsg = translations['invalid_phone']?.[lang] || `رقم الهاتف غير صحيح لـ ${countryName}`;
    showToast(invalidPhoneMsg, 'error');
    return false;
  }
  
  if (!location) {
    showToast(translations['required_location']?.[currentLang()] || 'الرجاء إدخال الموقع', 'error');
    return false;
  }
  
  return true;
}

function validateCart() {
    if (!cart || cart.length === 0) {
        const lang = currentLang();
        const emptyCartMsg = translations['cart_empty_for_order']?.[lang] || 
                           'ضع منتج في السله اولا';
        showToast(emptyCartMsg, 'error');
        return false;
    }
    
    // التحقق من توفر المنتجات في المخزون
    for (const item of cart) {
        const product = currentProducts[item.id];
        if (!product || (product.quantity || 0) < item.quantity) {
            const lang = currentLang();
            const outOfStockMsg = translations['product_not_found']?.[lang] || 
                                'المنتج غير متوفر ';
            showToast(outOfStockMsg, 'error');
            return false;
        }
    }
    
    return true;
}

function validateCardData() {
  const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '') || '';
  const expiryDate = document.getElementById('expiry-date')?.value || '';
  const cvv = document.getElementById('cvv')?.value || '';
  
  if (!/^\d{16}$/.test(cardNumber)) {
    return false;
  }
  
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return false;
  }
  
  if (!/^\d{3,4}$/.test(cvv)) {
    return false;
  }
  
  const [month, year] = expiryDate.split('/');
  const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
  const now = new Date();
  
  if (expiry < now) {
    return false;
  }
  
  return true;
}

function updateAllProductButtons() {
  cart.forEach(item => resetProductButtons(item.id));
  renderStore(currentProducts);
  renderPromotions(currentPromotions);
}

// ==================== البحث والتصفية ====================
function initSearchVoiceRecognition() {
  recognitionSearch.lang = 'ar-SA';
  recognitionSearch.interimResults = false;
  let isListeningSearch = false;

  const voiceBtn = document.getElementById('voiceSearchBtn');
  voiceBtn.onclick = () => {
    if (!isListeningSearch) {
      recognitionSearch.start();
      isListeningSearch = true;
    }
  };

  recognitionSearch.onresult = (e) => {
    document.getElementById('searchName').value = e.results[0][0].transcript;
    performSearch();
    isListeningSearch = false;
  };

  recognitionSearch.onend = () => isListeningSearch = false;
}

function initSearch() {
  document.getElementById('searchBtn').onclick = performSearch;
  document.getElementById('searchName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  document.querySelectorAll('#propertyType, #priceCondition, #priceValue')
    .forEach(el => el.addEventListener('change', performSearch));

  updateCategoryOptions();
  applyTranslations();
}

function updateCategoryOptions() {
  const select = document.getElementById('propertyType');
  const lang = currentLang();
  const allLabel = translations.all?.[lang] || (lang === 'ar' ? 'الكل' : 'All');
  select.innerHTML = `<option value="all">${allLabel}</option>`;
  Object.entries(currentCategories).forEach(([key, category]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = getCategoryName(key, lang);
    select.appendChild(option);
  });
}

function performSearch() {
    try {
        const searchParams = getSearchParams();
        const filtered = filterStore(searchParams);
        renderStore(filtered);
        handleNoResults(filtered);
        initAllCarousels();
    } catch (error) {
        console.error("Search error:", error);
        showErrorToast('حدث خطأ في البحث. الرجاء المحاولة لاحقاً');
    }
}

function getSearchParams() {
  const searchEl = document.getElementById('searchName');
  const catEl = document.getElementById('propertyType');
  if (!searchEl || !catEl) {
    return { searchText: '', category: 'all', priceCondition: '', priceValue: 0 };
  }
  return {
    searchText: searchEl.value.trim().toLowerCase(),
    category: catEl.value,
    priceCondition: document.getElementById('priceCondition').value,
    priceValue: parseFloat(document.getElementById('priceValue').value) || 0
  };
}

function filterStore({ searchText, category, priceCondition, priceValue }) {
  return Object.fromEntries(
    Object.entries(currentProducts).filter(([_, p]) => {
      if ((p.quantity || 0) <= 0) return false;
      
      const title = getLocalizedText(p.title).toLowerCase();
      const description = getLocalizedText(p.description).toLowerCase();
      const productPrice = parseFloat(p.price) || 0;
      
      const priceMatch = priceValue > 0
        ? (priceCondition === 'greater'
          ? productPrice >= priceValue
          : productPrice <= priceValue)
        : true;
      
      const categoryMatch = category === 'all' || p.category === category;
      const textMatch = title.includes(searchText) || description.includes(searchText);
      
      return textMatch && categoryMatch && priceMatch;
    })
  );
}

function handleNoResults(filtered) {
  const container = document.getElementById('portfolioGrid');
  const existingMsg = container.querySelector('.no-results');
  const resultsCount = Object.keys(filtered).length;

  if (resultsCount === 0 && !existingMsg) {
    const noResults = document.createElement('p');
    noResults.className = 'no-results';
    const noResultsText = translations['no_results']?.[currentLang()] || 'لا توجد نتائج';
    noResults.textContent = noResultsText;
    container.appendChild(noResults);
  } else if (resultsCount > 0 && existingMsg) {
    existingMsg.remove();
  }
}

// ==================== التواصل السريع ====================
function initQuickContact(settings) {
  qcSettings = settings || {};
  const form = document.getElementById('quickContactForm');
  const nameEl = document.getElementById('qcName');
  const contactEl = document.getElementById('qcContact');
  const countryCodeEl = document.getElementById('qcCountryCode');
  const msgEl = document.getElementById('qcMessage');
  const btnSubmit = document.getElementById('qcSubmit');
  const msgBox = document.getElementById('qcUserMessageBox');

  // تحديث placeholder بناءً على رمز الدولة
  function updateContactPlaceholder() {
    const countryCode = countryCodeEl.value;
    const country = countryCodes.find(c => c.code === countryCode);
    const lang = currentLang();
    
    if (country && country.example) {
      contactEl.placeholder = `${translations.phone_example?.[lang] || 'Example'}: ${country.example}`;
    } else {
      contactEl.placeholder = translations.phone_example?.[lang] || 'Enter phone number';
    }
  }

  // تحميل رموز الدول مع event listener
  loadCountryCodes('qcCountryCode', '20');
  countryCodeEl.addEventListener('change', updateContactPlaceholder);
  
  // تحديث placeholder أول مرة
  setTimeout(updateContactPlaceholder, 100);

  function showUserMessage(message, isError = false) {
    msgBox.className = `message-box ${isError ? 'error' : 'success'}`;
    msgBox.textContent = message;
    msgBox.style.display = 'block';
    
    setTimeout(() => {
      msgBox.style.display = 'none';
    }, 5000);
  }

  if (btnSubmit) {
    btnSubmit.onclick = async () => {
      if (!form.reportValidity()) return;
      
      const name = nameEl.value.trim();
      const contact = contactEl.value.trim();
      const countryCode = countryCodeEl.value;
      const message = msgEl.value.trim();
      
      if (!name) {
        showUserMessage(translations.qc_warn_no_name?.[currentLang()] || 'الرجاء إدخال الاسم', true);
        return;
      }
      
      if (!contact) {
        showUserMessage(translations.qc_warn_no_contact?.[currentLang()] || 'الرجاء إدخال رقم الهاتف أو الإيميل', true);
        return;
      }
      
      // التحقق إذا كان الاتصال رقم هاتف
      const isPhoneNumber = /^\d+$/.test(contact.replace(/\D/g, ''));
      
      if (isPhoneNumber) {
        // التحقق من صحة رقم الهاتف
        if (!validatePhoneNumber(contact, countryCode)) {
          const lang = currentLang();
          const countryName = getCountryDisplayName(countryCode, lang);
          const invalidPhoneMsg = translations.invalid_phone?.[lang] || `رقم الهاتف غير صحيح لـ ${countryName}`;
          showUserMessage(invalidPhoneMsg, true);
          return;
        }
        
        // حفظ كرسالة واتساب (فقط في قاعدة البيانات)
        const saved = await saveCustomerMessage(name, contact, message, countryCode, true);
        if (saved) {
          form.reset();
          showUserMessage(translations.qc_sent_success?.[currentLang()] || 'تم إرسال الرسالة بنجاح');
        } else {
          showUserMessage(translations.qc_sent_failed?.[currentLang()] || 'فشل في إرسال الرسالة', true);
        }
      } else {
        // إذا كان إيميل، حفظ كإيميل
        const saved = await saveCustomerMessage(name, contact, message);
        if (saved) {
          form.reset();
          showUserMessage(translations.qc_sent_success?.[currentLang()] || 'تم إرسال الرسالة بنجاح');
        } else {
          showUserMessage(translations.qc_sent_failed?.[currentLang()] || 'فشل في إرسال الرسالة', true);
        }
      }
    };
  }
}

// دالة مساعدة للحصول على الاسم المعروض للدولة
function getCountryDisplayName(countryCode, lang = null) {
  if (!lang) lang = currentLang();
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) return countryCode;
  return `${country.flag} ${country.name[lang]}`;
}

async function saveCustomerMessage(name, contact, message, countryCode = null, isWhatsApp = false) {
  const messagesRef = ref(db, 'customerMessages');
  
  // الحصول على الرقم الكامل الصحيح
  const fullPhone = countryCode ? getFullPhoneNumberForWhatsApp(countryCode, contact) : contact;
  
  const newMessage = {
    name,
    contact,
    message,
    countryCode,
    fullPhone, // الرقم سيصل كـ 201012345678 (مثال لمصر)
    isWhatsApp,
    timestamp: Date.now(),
    status: 'new',
    read: false
  };
  
  try {
    await push(messagesRef, newMessage);
    return true;
  } catch (error) {
    console.error('فشل في ارسال الرسالة:', error);
    return false;
  }
}

function getFullPhoneNumberForWhatsApp(countryCode, phoneNumber) {
const cleanNumber = phoneNumber.replace(/\D/g, '');
let finalNumber = cleanNumber.replace(/^0+/, '');
return countryCode + finalNumber;
}

// ==================== إدارة الأقسام ====================
function showHomeSection() {
  document.querySelectorAll('.main-section').forEach(sec => {
    // إخفاء قسم المنتجات فقط وإظهار باقي الأقسام
    if (sec.id === 'portfolioSection') {
      sec.style.display = 'none';
    } else {
      sec.style.display = 'block';
    }
  });
  
  document.getElementById('toggle-home-btn').classList.add('active');
  document.getElementById('toggle-projects-btn').classList.remove('active');
  
  if (filterResetTimer) clearTimeout(filterResetTimer);
  filterResetTimer = setTimeout(resetFilter, 3000);
  
  // التمرير إلى الأعلى
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showProjectsSection() {
  document.querySelectorAll('.main-section').forEach(sec => {
    // إظهار قسم المنتجات فقط وإخفاء باقي الأقسام
    if (sec.id === 'portfolioSection') {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
  
  document.getElementById('toggle-projects-btn').classList.add('active');
  document.getElementById('toggle-home-btn').classList.remove('active');

  const projSec = document.getElementById('portfolioSection');
  if (projSec) {
    const navH = document.getElementById('navsec').offsetHeight;
    window.scrollTo({
      top: projSec.offsetTop - navH,
      behavior: 'smooth'
    });
  }
  
  if (filterResetTimer) clearTimeout(filterResetTimer);
}


function resetFilter() {
  const categorySelect = document.getElementById('propertyType');
  const searchInput = document.getElementById('searchName');
  const priceValue = document.getElementById('priceValue');
  const priceCondition = document.getElementById('priceCondition');
  
  if (categorySelect) categorySelect.value = 'all';
  if (searchInput) searchInput.value = '';
  if (priceValue) priceValue.value = '';
  if (priceCondition) priceCondition.value = 'greater';
  
  performSearch();
}

// ==================== تحميل المنتجات ====================
function loadProducts() {
  try {
    onValue(ref(db, 'storeProducts'), snap => {
      currentProducts = snap.val() || {};
      initSearch();
      // تطبيق الخصومات قبل عرض المنتجات
      applyProductDiscounts();
      renderStore(currentProducts);
      hideSpinner();
      loadPromotions();
    });
  } catch (e) {
    console.error('projects load error', e);
    showErrorToast('فشل تحميل المنتجات');
  }
}

// ==================== إدارة أيقونة السلة القابلة للسحب ====================
function initDraggableCart() {
  const cartIcon = document.getElementById('cart-icon-container');
  if (!cartIcon) return;

  let isDragging = false;
  let startX, startY, initialX, initialY;

  loadCartIconPosition(cartIcon);

  function startDrag(e) {
    isDragging = true;
    cartIcon.classList.add('dragging');
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    startX = clientX;
    startY = clientY;
    
    const rect = cartIcon.getBoundingClientRect();
    initialX = rect.left;
    initialY = rect.top;
    
    cartIcon.style.transition = 'none';
    cartIcon.style.cursor = 'grabbing';
    
    e.preventDefault();
    e.stopPropagation();
  }

  function drag(e) {
    if (!isDragging) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const dx = clientX - startX;
    const dy = clientY - startY;

    let newX = initialX + dx;
    let newY = initialY + dy;

    // تحديد الحدود لتجنب تجاوز الهيدر والفوتر
    const headerHeight = document.getElementById('navsec')?.offsetHeight || 80;
    const footerHeight = 100; // ارتفاع تقديري للفوتر
    
    const maxX = window.innerWidth - cartIcon.offsetWidth;
    const maxY = window.innerHeight - cartIcon.offsetHeight - footerHeight;
    
    newX = Math.max(5, Math.min(newX, maxX - 5)); // تقليل المسافة من الحواف
    newY = Math.max(headerHeight + 5, Math.min(newY, maxY - 5)); // تجنب الهيدر والفوتر

    cartIcon.style.left = `${newX}px`;
    cartIcon.style.top = `${newY}px`;
    cartIcon.style.right = 'auto';

    e.preventDefault();
    e.stopPropagation();
  }

  function stopDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    
    cartIcon.classList.remove('dragging');
    cartIcon.style.cursor = 'grab';
    cartIcon.style.transition = 'all 0.3s ease';

    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
    const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
    
    if (clientX && clientY) {
      const dx = Math.abs(clientX - startX);
      const dy = Math.abs(clientY - startY);
      
      if (dx < 5 && dy < 5) {
        openCartPopup();
      }
    }

    // جذب السلة إلى أقرب حافة أفقية فقط
    snapToEdge(cartIcon);
  }

  function snapToEdge(icon) {
    const rect = icon.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    
    const windowWidth = window.innerWidth;
    
    // تحديد أقرب حافة أفقية فقط (يمين/يسار)
    const toLeft = centerX;
    const toRight = windowWidth - centerX;
    
    const minDistance = Math.min(toLeft, toRight);
    
    let newX;
    
    if (minDistance === toLeft) {
      // جذب إلى اليسار - إخفاء جزء صغير فقط
      newX = 5 - (rect.width * 0.2); // 20% من الأيقونة فقط
    } else {
      // جذب إلى اليمين - إخفاء جزء صغير فقط
      newX = windowWidth - 5 - (rect.width * 0.8); // 20% من الأيقونة فقط
    }
    
    // الحفاظ على الموقع الرأسي الحالي
    const currentY = parseFloat(icon.style.top) || rect.top;
    
    // التأكد من بقاء الأيقونة ضمن الحدود الرأسية
    const headerHeight = document.getElementById('navsec')?.offsetHeight || 80;
    const footerHeight = 50;
    const maxY = window.innerHeight - rect.height - footerHeight;
    const constrainedY = Math.max(headerHeight + 5, Math.min(currentY, maxY - 5));
    
    icon.style.left = `${newX}px`;
    icon.style.top = `${constrainedY}px`;
    
    saveCartIconPosition(icon);
  }

  function saveCartIconPosition(icon) {
    const rect = icon.getBoundingClientRect();
    const pos = {
      x: rect.left,
      y: rect.top
    };
    localStorage.setItem('cartIconPosition', JSON.stringify(pos));
  }

  function loadCartIconPosition(icon) {
    const saved = localStorage.getItem('cartIconPosition');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        if (pos.x !== undefined && pos.y !== undefined) {
          icon.style.left = `${pos.x}px`;
          icon.style.top = `${pos.y}px`;
          icon.style.right = 'auto';
        }
      } catch (e) {
        console.error('Error loading cart position:', e);
        setDefaultPosition(icon);
      }
    } else {
      setDefaultPosition(icon);
    }
    icon.style.pointerEvents = 'auto';
  }

  function setDefaultPosition(icon) {
    const isRTL = document.documentElement.dir === 'rtl';
    const headerHeight = document.getElementById('navsec')?.offsetHeight || 80;
    
    if (isRTL) {
      icon.style.left = '15px';
      icon.style.right = 'auto';
    } else {
      icon.style.left = 'auto';
      icon.style.right = '15px';
    }
    icon.style.top = `${headerHeight + 15}px`; // وضعها أسفل الهيدر مباشرة
  }

  cartIcon.addEventListener('mousedown', startDrag);
  cartIcon.addEventListener('touchstart', startDrag, { passive: false });

  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', drag, { passive: false });

  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
  document.addEventListener('touchcancel', stopDrag);

  window.addEventListener('resize', () => {
    constrainCartPosition(cartIcon);
  });
}

function constrainCartPosition(cartIcon) {
  const rect = cartIcon.getBoundingClientRect();
  const headerHeight = document.getElementById('navsec')?.offsetHeight || 80;
  const footerHeight = 50;
  
  const maxX = window.innerWidth - cartIcon.offsetWidth;
  const maxY = window.innerHeight - cartIcon.offsetHeight - footerHeight;
  
  let currentX = parseFloat(cartIcon.style.left) || 0;
  let currentY = parseFloat(cartIcon.style.top) || 0;
  
  currentX = Math.max(5, Math.min(currentX, maxX - 5));
  currentY = Math.max(headerHeight + 5, Math.min(currentY, maxY - 5));
  
  cartIcon.style.left = `${currentX}px`;
  cartIcon.style.top = `${currentY}px`;
}

// ==================== تهيئة Paymob ====================
function initPaymob() {
  console.log("Paymob system initialized");
}

// ==================== إدارة الأزرار بعد الشراء ====================
function updateProductButtonsAfterPurchase() {
  // تحديث جميع أزرار المنتجات بعد عملية الشراء
  document.querySelectorAll('.project-card').forEach(card => {
    const productId = card.dataset.key;
    const addButton = card.querySelector('.add-to-cart-btn');
    const quantityControls = card.querySelector('.product-quantity-controls');
    const quantityValue = card.querySelector('.quantity-value');
    
    if (addButton && quantityControls) {
      addButton.style.display = 'block';
      quantityControls.style.display = 'none';
      
      if (quantityValue) {
        quantityValue.textContent = '1';
      }
    }
  });
  
  // تحديث أزرار العروض أيضًا
  document.querySelectorAll('.promo-card').forEach(card => {
    const addButton = card.querySelector('.add-to-cart-btn');
    const quantityControls = card.querySelector('.product-quantity-controls');
    const quantityValue = card.querySelector('.quantity-value');
    
    if (addButton && quantityControls) {
      addButton.style.display = 'block';
      quantityControls.style.display = 'none';
      
      if (quantityValue) {
        quantityValue.textContent = '1';
      }
    }
  });
}

// نظام بديل لضمان اكتمال التحميل
function ensureCompleteLoading() {
  // إذا لم يكتمل التحميل خلال 15 ثانية، أكمل قسراً
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
      console.warn('تم تفعيل النظام البديل لإكمال التحميل');
      completeLoading();
    }
  }, 15000);
}

// ==================== تهيئة الصفحة ====================
document.addEventListener('DOMContentLoaded', async () => {
  window.scrollTo({ top: 0, behavior: 'auto' });

  initLoadingSystem();
  initCartEvents();
  updatePlaceholders();
  ensureCompleteLoading();

  // التأكد من أن قسم المنتجات مخفي عند البدء
  const portfolioSection = document.getElementById('portfolioSection');
  if (portfolioSection) {
    portfolioSection.style.display = 'none';
  }

  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const message = document.getElementById('checkout-message').value;
    sendOrder(name, phone, message);
  });

  await initI18n();
  await loadTranslations();
  setLanguage(localStorage.getItem('lang') || 'ar');

  document.getElementById('language-toggle').addEventListener('click', () => {
    setLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
  });
  
  setTimeout(() => {
    loadCountryCodes('qcCountryCode', '20');
    loadCountryCodes('checkout-country-code', '20');
  }, 1000);

  document.addEventListener('languageChanged', async () => {
    renderWelcome(currentPromo?.welcomeMessage);
    loadAboutContent(currentAbout);
    renderContactCards(currentContacts);
    applyProductDiscounts(); 
    renderStore(currentProducts);
    setupChatBot(currentBot);
    renderPublicFAQs(currentFAQs);
    renderStats(currentStats);
    renderServices(currentServices);
    initQuickContact(qcSettings);
    updateCategoryOptions();
    updatePlaceholders();
    applyTranslations();
    renderPromotions(currentPromotions);
    refreshOffersTranslation();
    loadCountryCodes('qcCountryCode');
    loadCountryCodes('checkout-country-code');
    loadCountryCodes('checkout-country-code', '20');
    loadCountryCodes('qcCountryCode', '20');
  });

  loadInitialData();
  showHomeSection();

  initNavbarScroll();
  initSectionObserver();

  document.getElementById('toggle-home-btn').addEventListener('click', showHomeSection);
  document.getElementById('toggle-projects-btn').addEventListener('click', showProjectsSection);

  loadCartFromLocalStorage();
  initSearchVoiceRecognition();
  initPaymob();
  initDraggableCart();

  let dimTimeout;
  function undimIcon() {
    const cartIcon = document.getElementById('cart-icon-container');
    cartIcon.classList.remove('dimmed');
    clearTimeout(dimTimeout);
    dimTimeout = setTimeout(() => {
      cartIcon.classList.add('dimmed');
    }, 3000);
  }

  const cartIcon = document.getElementById('cart-icon-container');
  cartIcon.addEventListener('mousedown', undimIcon);
  cartIcon.addEventListener('touchstart', undimIcon);
  cartIcon.addEventListener('mouseenter', undimIcon);

  document.addEventListener('mousemove', e => {
    if (isDragging) undimIcon();
  });
  document.addEventListener('touchmove', e => {
    if (isDragging) undimIcon();
  });

  undimIcon();
});

// جعل الدوال متاحة عالمياً
window.addPromoProductToCart = addPromoProductToCart;
window.navigateToCategory = navigateToCategory;
window.sendBotMessage = sendBotMessage;
window.handleBotButton = handleBotButton;
window.confirmOrder = confirmOrder;
window.processPayment = processPayment;
window.validateCheckoutForm = validateCheckoutForm;
window.validateCart = validateCart;
window.updateAllProductButtons = updateAllProductButtons;
window.constrainCartPosition = constrainCartPosition;
window.updateProductButtonsAfterPurchase = updateProductButtonsAfterPurchase;
window.initAutoScroll = initAutoScroll;
window.startAutoScroll = startAutoScroll;
window.stopAutoScroll = stopAutoScroll;