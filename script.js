import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.esm.js";
import { initI18n, setLanguage, applyTranslations, translations } from './i18n.js';

const CLOUDINARY_CLOUD_NAME = 'de3t3azua';
const CLOUDINARY_API_KEY = '138916392597853';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// ─────────── Notification Helper ───────────
function showErrorToast(msg) {
  const t = document.getElementById('global-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('visible');
  setTimeout(() => t.classList.remove('visible'), 3000);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('visible');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// ————— Firebase Init —————
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

// ————— Global State —————
let welcomeMessage = "";
let typingTimer = null;
let currentPromo = null;
let currentBot = {};
let currentFAQs    = {};
let currentServices= {};
let currentStats   = {};
let currentContacts = {};
let currentProducts = {};
let currentQC = {};
let qcSettings = {};
let currentAbout = {};
let currentCategories = {};
let cart = [];
let fuseBot,
    welcomeButtons = [],
    isListening = false,
    voiceAsked = false;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// ————— Helper Functions ————
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

// ————— Helpers for Search —————
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

// ————— Load Translations —————
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

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function showSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.classList.remove('hidden');
  }
}

function hideSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  window.scrollTo({ top: 0, behavior: 'auto' });

  // ربط أحداث السلة
  document.getElementById('cart-icon-container').addEventListener('click', openCartPopup);
  document.getElementById('close-cart').addEventListener('click', closeCartPopup);
  document.getElementById('checkout-btn').addEventListener('click', openCheckoutForm);
  document.getElementById('close-checkout').addEventListener('click', closeCheckoutForm);
  document.getElementById('overlay').addEventListener('click', () => {
    closeCartPopup();
    closeCheckoutForm();
  });

  // معالج نموذج الطلب
  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const message = document.getElementById('checkout-message').value;
    sendOrder(name, phone, message);
  });

  showSpinner();
  await initI18n();
  await loadTranslations();
  setLanguage(localStorage.getItem('lang') || 'ar');

  document.getElementById('language-toggle').addEventListener('click', () => {
    setLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
  });

  document.addEventListener('languageChanged', async () => {
    renderWelcome(currentPromo?.welcomeMessage);
    initPromotions(currentPromo);
    loadAboutContent(currentAbout);
    renderContactCards(currentContacts);
    renderStore(currentProducts);
    setupChatBot(currentBot);
    renderPublicFAQs(currentFAQs);
    renderStats(currentStats);
    renderServices(currentServices);
    initQuickContact(qcSettings);
    updateCategoryOptions();
    applyTranslations();
  });

  loadInitialData();
  showHomeSection();

  (function () {
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
  })();

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

  document.getElementById('toggle-home-btn').addEventListener('click', showHomeSection);
  document.getElementById('toggle-projects-btn').addEventListener('click', showProjectsSection);

  loadCartFromLocalStorage();

  
  // ─── اكتشاف اتجاه الصفحة ───
  const isRTL = getComputedStyle(document.documentElement).direction === 'rtl';
  
  // ─────────── جعل أيقونة السلة قابلة للسحب والتحريك ───────────
  const cartIcon = document.getElementById('cart-icon-container');
  
let dimTimeout;

// دالة لإلغاء التظليل فور التفاعل
function undimIcon() {
  cartIcon.classList.remove('dimmed');
  clearTimeout(dimTimeout);
  // بعد 3 ثواني من الخمول نُظلم الأيقونة
  dimTimeout = setTimeout(() => {
    cartIcon.classList.add('dimmed');
  }, 3000);
}

// استدعيها عند بداية السحب أو المرور فوق الأيقونة
cartIcon.addEventListener('mousedown', undimIcon);
cartIcon.addEventListener('touchstart', undimIcon);
cartIcon.addEventListener('mouseenter', undimIcon);

// أيضًا عند النقل (drag) نفسه
document.addEventListener('mousemove', e => {
  if (isDragging) undimIcon();
});
document.addEventListener('touchmove', e => {
  if (isDragging) undimIcon();
});

// شغّل المؤقت أول مرة بعد التحميل
undimIcon();

  let isDragging = false;
  let startX, startY, initialX, initialY;
  const dragThreshold = 5;
  let currentX, currentY; // آخر موضع أثناء السحب

  function setInitialPosition() {
  // ن读取 مركز العنصر نسبة إلى الـ viewport
  const rect = cartIcon.getBoundingClientRect();

  if (isRTL) {
    // initialX: المسافة من اليمين
    initialX = window.innerWidth - rect.right;
  } else {
    // initialX: المسافة من اليسار
    initialX = rect.left;
  }
  initialY = rect.top;
}
  setInitialPosition();

  // بدء السحب
  cartIcon.addEventListener('mousedown', startDrag);
  cartIcon.addEventListener('touchstart', startDragTouch, { passive: false });

  // التحرك أثناء السحب
  document.addEventListener('mousemove', drag);
  document.addEventListener('touchmove', dragTouch, { passive: false });

  // إنهاء السحب
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);

  // تحميل الموضع المحفوظ
  loadCartIconPosition();

  function startDrag(e) {
    isDragging = true;
  startX = e.clientX || e.touches[0].clientX;
  startY = e.clientY || e.touches[0].clientY;
  setInitialPosition();

  // نُعطّل الـtransition أثناء السحب
  cartIcon.style.transition = 'none';

  cartIcon.style.cursor = 'grabbing';
  cartIcon.style.zIndex = '10000';
  e.preventDefault();
  }
  function startDragTouch(e) {
    if (e.touches.length === 1) {
      startDrag(e);
    }
  }

  function drag(e) {
    if (!isDragging) return;
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    const dx = clientX - startX;
    const dy = clientY - startY;

    // موضع جديد افقي ورأسي
const effectiveDx = isRTL ? -dx : dx;
let newX = initialX + effectiveDx;
    let newY = initialY + dy;

    // حدود الشاشة
    const maxX = window.innerWidth - cartIcon.offsetWidth;
    const maxY = window.innerHeight - cartIcon.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    // نطبّقها على الخاصية المناسبة
    if (isRTL) {
  cartIcon.style.right = `${newX}px`;
  cartIcon.style.left  = 'auto';          // <–– نمسح الـ left حتى لا يتداخل
} else {
  cartIcon.style.left  = `${newX}px`;
  cartIcon.style.right = 'auto';          // <–– نمسح الـ right
}
cartIcon.style.top = `${newY}px`;
currentX = newX;
currentY = newY;

    e.preventDefault();
  }

  function dragTouch(e) {
    if (!isDragging || e.touches.length !== 1) return;
    drag(e);
  }
function stopDrag(e) {
  if (!isDragging) return;
  isDragging = false;
  cartIcon.style.cursor = 'grab';
  cartIcon.style.zIndex = '1000';

  // تعامل مع النقر البسيط
  const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
  const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
  if (clientX && clientY) {
    const dx = Math.abs(clientX - startX);
    const dy = Math.abs(clientY - startY);
    if (dx < dragThreshold && dy < dragThreshold) {
      openCartPopup();
      return saveCartIconPosition();
    }
  }

  // حساب أبعاد ومركز الأيقونة
  const rect = cartIcon.getBoundingClientRect();
  const iconCenterX = rect.left + rect.width / 2;
  const midX = window.innerWidth / 2;
  const penetration = 0.2;
  const offsetX = rect.width * penetration; // 20% من العرض
  const transitionProps = 'top 0.3s ease, left 0.3s ease, right 0.3s ease';

  if (iconCenterX < midX) {
    // == لصق جهة اليسار مع أنيميشن ==
    // 1) احسب القيمة الرقمية الحالية
    const currentLeft = rect.left;
    // 2) عطل المؤثرات
    cartIcon.style.transition = 'none';
    // 3) ثبت رقمياً الـ left وامسح الـ right
    cartIcon.style.left  = `${currentLeft}px`;
    cartIcon.style.right = 'auto';
    // 4) جبر إعادة الرسم
    void cartIcon.offsetWidth;
    // 5) أعد تفعيل المؤثرات
    cartIcon.style.transition = transitionProps;
    // 6) حركها إلى الإزاحة المطلوبة
    cartIcon.style.left = `-${offsetX}px`;
  } else {
    // == لصق جهة اليمين مع أنيميشن ==
    const currentRight = window.innerWidth - rect.right;
    cartIcon.style.transition = 'none';
    cartIcon.style.right = `${currentRight}px`;
    cartIcon.style.left  = 'auto';
    void cartIcon.offsetWidth;
    cartIcon.style.transition = transitionProps;
    cartIcon.style.right = `-${offsetX}px`;
  }

  // ثبّت الموضع الرأسي الأخير
  cartIcon.style.top = `${currentY}px`;

  saveCartIconPosition();
}
  
  function saveCartIconPosition() {
    const pos = {
      x: isRTL ? cartIcon.style.right : cartIcon.style.left,
      y: cartIcon.style.top
    };
    localStorage.setItem('cartIconPosition', JSON.stringify(pos));
  }

  function loadCartIconPosition() {
    const saved = JSON.parse(localStorage.getItem('cartIconPosition') || '{}');
    if (saved.x) {
      if (isRTL) cartIcon.style.right = saved.x;
      else       cartIcon.style.left  = saved.x;
    }
    if (saved.y) cartIcon.style.top = saved.y;
    cartIcon.style.pointerEvents = 'auto';
  }
  
  // استدعاء الدالة لتحديد موضع الأيقونة عند التحميل
  constrainCartPosition();
  
  // إضافة مستمع لحجم النافذة لتحديد موضع السلة
  window.addEventListener('resize', constrainCartPosition);
});

// ————— ضمان بقاء أيقونة السلة داخل الشاشة —————
function constrainCartPosition() {
  const cartIcon = document.getElementById('cart-icon-container');
  if (!cartIcon) return;

  const rect = cartIcon.getBoundingClientRect();
  const maxX = window.innerWidth - rect.width;
  const maxY = window.innerHeight - rect.height;

  let currentX, currentY;

  if (document.documentElement.dir === 'rtl') {
    currentX = parseFloat(cartIcon.style.right) || 0;
    // إذا كانت القيمة غير محددة أو سالبة، استخدم القيمة الافتراضية
    if (isNaN(currentX)) currentX = 10; // افتراضي 10px من اليمين
    currentX = Math.max(10, Math.min(currentX, maxX - 10)); // لا تقترب أكثر من 10px من الحافة
    cartIcon.style.right = `${currentX}px`;
  } else {
    currentX = parseFloat(cartIcon.style.left) || 0;
    if (isNaN(currentX)) currentX = 10; // افتراضي 10px من اليسار
    currentX = Math.max(10, Math.min(currentX, maxX - 10));
    cartIcon.style.left = `${currentX}px`;
  }

  currentY = parseFloat(cartIcon.style.top) || 0;
  if (isNaN(currentY)) currentY = 10; // افتراضي 10px من الأعلى
  currentY = Math.max(10, Math.min(currentY, maxY - 10));
  cartIcon.style.top = `${currentY}px`;
}

// ————— Load Data —————
function loadInitialData() {
  try {
    onValue(ref(db, 'storeWelcomeMessage'), snap => {
      currentPromo = { welcomeMessage: snap.val() };
      renderWelcome(currentPromo.welcomeMessage);
      hideSpinner();
    });
  } catch (e) {
    console.error('welcomeMessage load error', e);
    showErrorToast('فشل تحميل الترحيب');
  }
  try {
    onValue(ref(db, 'storeAboutUs'), snap => {
      currentAbout = snap.val() || {};
      loadAboutContent(currentAbout);
      hideSpinner();
    });
  } catch (e) {
    console.error('aboutUs load error', e);
    showErrorToast('فشل تحميل من انا');
  }
  try {
    onValue(ref(db, 'storeContactInfo'), snap => {
      currentContacts = snap.val() || {};
      renderContactCards(currentContacts);
      hideSpinner();
    });
  } catch (e) {
    console.error('contactInfo load error', e);
    showErrorToast('فشل تحميل التواصل');
  }
  try {
    onValue(ref(db, 'storeFaqs'), snap => {
      currentFAQs = snap.val() || {};
      renderPublicFAQs(currentFAQs);
      hideSpinner();
    });
  } catch (e) { 
    console.error('faqs load error', e);
    showErrorToast('فشل تحميل الأسأله الشائعه'); 
  }
  try {
    onValue(ref(db, 'storestats'), snap => {
      currentStats = snap.val() || {};
      renderStats(currentStats);
      hideSpinner();
    });
  } catch (e) { 
    console.error('stats load error', e);
    showErrorToast('فشل تحميل الأحصائيات'); 
  }
  try {
    onValue(ref(db, 'storeservices'), snap => {
      currentServices = snap.val() || {};
      renderServices(currentServices);
      hideSpinner();
    });
  } catch (e) { 
    console.error('services load error', e);
    showErrorToast('فشل تحميل الخدمات'); 
  }  
  try {
    onValue(ref(db, 'storePromotions/activePromo'), snap => {
      currentPromo = { ...currentPromo, ...snap.val() };
      initPromotions(currentPromo);
      hideSpinner();
    });
  } catch (e) {
    console.error('promotions load error', e);
    showErrorToast('فشل تحميل العروض');
  }
  try {
    onValue(ref(db, 'storeBotResponses'), snap => {
      currentBot = snap.val() || {};
      setupChatBot(currentBot);
      hideSpinner();
    });
  } catch (e) {
    console.error('botResponses load error', e);
    showErrorToast('فشل تحميل الروبوت');
  }
  try {
    onValue(ref(db, 'storeQuickContact'), snap => {
      qcSettings = snap.val() || {};
      initQuickContact(qcSettings);
      hideSpinner();
    });
  } catch (e) {
    console.error('quickContact load error', e);
    showErrorToast('فشل تحميل التواصل السريع');
  }
  try {
    // تحميل التصنيفات أولاً
    onValue(ref(db, 'storeCategories'), (snap) => {
      currentCategories = snap.val() || {};
      updateCategoryOptions();
      hideSpinner();
      
      // بعد تحميل التصنيفات، تحميل المنتجات
      loadProducts();
    });
  } catch (e) {
    console.error('categories load error', e);
    showErrorToast('فشل تحميل التصنيفات');
    // إذا فشل تحميل التصنيفات، تحميل المنتجات مباشرة
    loadProducts();
  }
  try {
    onValue(ref(db, 'storeProducts'), snap => {
      currentProducts = snap.val() || {};
      initSearch();
      renderStore(currentProducts);
      hideSpinner();
    });
  } catch (e) {
    console.error('projects load error', e);
    showErrorToast('فشل تحميل المشاريع');
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
        })
        .catch(e => {
          console.error('Translations reload error:', e);
          showErrorToast('فشل تحديث الترجمات');
        });
    });
  } catch (e) {
    console.error('translations listener error', e);
    showErrorToast('فشل متابعة الترجمة');
  }
}

// ————— ChatBot Functions —————
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

window.handleBotButton = q => {
  document.getElementById('userInput').value = q;
  sendBotMessage();
};

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
  if (!voiceBtn) return;  // حارس بسيط

  recognition.onstart = () => {
    voiceBtn.classList.add('recording');
  };
  recognition.onend = () => {
    voiceBtn.classList.remove('recording');
    isListening = false;    // إعادة ضبط هنا للتوثيق
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

window.sendBotMessage = () => {
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
};

// ————— Typing effect for welcome message —————
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

// ————— Promotions —————
function initPromotions(p) {
  const card = document.getElementById('promoCard');
  if (!p) {
    card.style.display = 'none';
    return;
  }
  card.style.display = 'block';

  const lang = currentLang();

  const title = typeof p.title === 'object'
    ? (p.title[lang] || p.title.ar)
    : p.title;
  document.getElementById('promoTitle').textContent = title;

  document.getElementById('promoDiscount').textContent = p.discount;

  let timer;
  const countdownEl = card.querySelector('.offer-countdown');

  function update() {
    const diff = p.expiresAt - Date.now();
    if (diff <= 0) {
      clearInterval(timer);
      countdownEl.innerHTML = `<div class="expired" data-i18n="promo_expired">انتهى العرض!</div>`;
      applyTranslations();
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24)),
      hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hrs).padStart(2, '0');
    document.getElementById('minutes').textContent = String(mins).padStart(2, '0');
  }

  update();
  timer = setInterval(update, 1000);
  applyTranslations();
}

// ————— FAQs —————
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
  cnt.style.color     = color;
  cnt.textContent     = answer;
}

// ————— Stats —————
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

// ————— Services —————
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
// ————— About Us —————
function loadAboutContent(data) {
  const lang = currentLang();
  const key = Object.keys(data || {})[0];
  const txt = typeof data[key]?.content === 'object'
    ? (data[key].content[lang] || data[key].content.ar)
    : data[key]?.content || '';
  document.getElementById('aboutContent').innerHTML = txt.replace(/\n/g, '<br>');
}

// ————— Contact Cards —————
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

// ————— renderStore —————
function renderStore(data) {
  const container = document.getElementById('portfolioGrid');
  container.innerHTML = '';
  const lang = currentLang();

  if (!data || !Object.keys(data).length) {
    container.innerHTML = `
      <p class="no-results" data-i18n="portfolio_no_projects">
        لا توجد مشاريع للعرض حالياً
      </p>`;
    return;
  }

  Object.entries(data)
    .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
    .forEach(([key, p]) => {
      const title = getLocalizedText(p.title);
      const desc = getLocalizedText(p.description);
      const price = p.price || '';
      const rating = p.rating || '';
      const tags = Array.isArray(p.tags?.[lang]) ? p.tags[lang] : (p.tags?.[lang] || '').split(',').map(t => t.trim());
      
      // تحسين معالجة المميزات
      const features = Array.isArray(p.features?.[lang]) ? 
        p.features[lang] : 
        (p.features?.[lang] || '').split(',').map(f => {
          const txt = (typeof f === 'object') ? (f[lang] || f.ar) : f;
          return txt.trim();
        });
        
      const imgs = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(imgObj => imgObj.url)
        : ['placeholder.png'];
      const cardColor = p.color || '#fff';
      const textColor = p.textColor || '#000';

      let categoryName = 'غير مصنف';
      if (p.category) {
        if (typeof p.category === 'object') {
          categoryName = p.category[lang] || p.category.ar || 'غير مصنف';
        } else if (currentCategories[p.category]) {
          const category = currentCategories[p.category];
          categoryName = typeof category.name === 'object'
            ? (category.name[lang] || category.name.ar || 'غير مصنف')
            : (category.name || 'غير مصنف');
        } else {
          categoryName = p.category;
        }
      }

      // إضافة هذا السطر لتحديد ما إذا كان المنتج في السلة
      const isInCart = cart.some(item => item.id === key);

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
            <div class="card-rating">
              <i class="fas fa-star"></i>
              <span class="rating-number">${rating}</span>
            </div>
          </div>
          <p class="description">${desc}</p>
          <div class="tags-container">
            ${tags.map(t => `<span class="tag">${t}</span>`).join('')}
            <!-- إضافة أيقونة التفاصيل هنا -->
            <div class="info-icon">
              <i class="fas fa-info-circle"></i>
            </div>
          </div>
          <div class="card-footer">
            <span class="info-price">
            <i class="fas fa-sack-dollar"></i> ${price} ${translations.currency?.[currentLang()] || 'جنيه'}
            </span>
            
            <!-- تحكم الكمية (مخفي في البداية) -->
            <div class="product-quantity-controls" data-product="${key}" style="display: ${isInCart ? 'flex' : 'none'}">
              <button class="quantity-btn minus-btn" data-product="${key}">-</button>
              <span class="quantity-value">${isInCart ? cart.find(item => item.id === key).quantity : 1}</span>
              <button class="quantity-btn plus-btn" data-product="${key}">+</button>
            </div>

            <!-- زر الإضافة إلى السلة (ظاهر في البداية) -->
            <button class="add-to-cart-btn" data-product="${key}" style="display: ${isInCart ? 'none' : 'block'}">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
        
        <!-- قسم التفاصيل المعدل -->
        <div class="details-content" style="background: ${cardColor}; color: ${textColor}">
    <div class="details-header">
      <div class="details-title-wrap">
        <h3 class="details-title">${title}</h3>
        <div class="product-category">
          <i class="fas fa-tag"></i>
          <span>${categoryName}</span>
        </div>
      </div>
    </div>
    
    <div class="features-section">
      <h4>${translations.features?.[currentLang()] || 'المميزات'}</h4>
      <div class="features-grid">
        ${features.map(f => `
          <div class="feature-item">
            <i class="fas fa-check-circle"></i>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="price-highlight">
      <span class="price-label">${translations.total_price?.[currentLang()] || 'السعر الإجمالي'}:</span>
      <span class="price-value">${price} ${translations.currency?.[currentLang()] || 'جنيه'}</span>
    </div>
    
    <button class="close-details-btn">
      <span data-i18n="close">${translations.close?.[currentLang()] || 'أغلاق'}</span>
    </button>
  </div>
`;

      container.appendChild(card);
    });

  initAllCarousels();
  setupDescriptionToggle();
  setupAddToCartButtons();
  setupQuantityControls();
  setupDetailsToggles();
  applyTranslations();
}

function setupDetailsToggles() {
  document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('click', function(e) {
      e.stopPropagation();
      const card = this.closest('.project-card');
      card.classList.add('show-details');
    });
  });

  document.querySelectorAll('.close-details-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const card = this.closest('.project-card');
      card.classList.remove('show-details');
    });
  });
}

function setupAddToCartButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.target.closest('.add-to-cart-btn').dataset.product;
      const productCard = e.target.closest('.project-card');
      let quantityElement = productCard.querySelector(`.product-quantity-controls[data-product="${productId}"] .quantity-value`);
      // إذا لم نجده في القسم الرئيسي، قد يكون في قسم التفاصيل
      if (!quantityElement) {
        quantityElement = productCard.querySelector(`.quantity-value`);
      }
      const quantity = parseInt(quantityElement.textContent);
      
      const product = currentProducts[productId];
      if (product) {
        addToCart(
          productId,
          getLocalizedText(product.title),
          product.price,
          product.images?.[0]?.url || 'placeholder.png',
          quantity
        );
        
        // إخفاء زر الإضافة وإظهار تحكم الكمية في جميع الأقسام
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
  // الزيادة
  document.querySelectorAll('.plus-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = btn.dataset.product;
      const item = cart.find(item => item.id === productId);
      if (item) {
        updateQuantity(productId, item.quantity + 1);
      }
    });
  });

  // النقصان
  document.querySelectorAll('.minus-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = btn.dataset.product;
      const item = cart.find(item => item.id === productId);
      if (item) {
        updateQuantity(productId, item.quantity - 1);
      }
    });
  });
}

// ————— Carousel Initialization —————
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

// ===== Cart Functions =====

// إضافة المنتج إلى السلة
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

// تحديث كمية المنتج
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
    
    // تحديث القيمة في بطاقة المنتج
    const quantityValue = document.querySelector(`.product-quantity-controls[data-product="${id}"] .quantity-value`);
    if (quantityValue) {
      quantityValue.textContent = newQuantity;
    }
  }
}

// إزالة المنتج من السلة
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCartToLocalStorage();
  updateCartCount();
  renderCartItems();
  resetProductButtons(id);
  
  // إظهار زر الإضافة وإخفاء تحكم الكمية
  const addButton = document.querySelector(`.add-to-cart-btn[data-product="${id}"]`);
  const controls = document.querySelector(`.product-quantity-controls[data-product="${id}"]`);
  
  if (addButton && controls) {
    addButton.style.display = 'block';
    controls.style.display = 'none';
  }
}

// تحديث عداد السلة
function updateCartCount() {
  const countElement = document.getElementById('cart-count');
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  if (countElement) {
    countElement.textContent = count;
  }
}

// حفظ السلة في التخزين المحلي
function saveCartToLocalStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// تحميل السلة من التخزين المحلي
function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
    
    // عند التحميل، يجب إظهار عناصر التحكم وإخفاء أزرار الإضافة للمنتجات الموجودة في السلة
    cart.forEach(item => {
      resetProductButtons(item.id);
    });
  }
  updateCartCount();
}

// عرض عناصر السلة
function renderCartItems() {
  const cartItemsElement = document.getElementById('cart-items');
  if (!cartItemsElement) return;

  cartItemsElement.innerHTML = '';

  if (cart.length === 0) {
    cartItemsElement.innerHTML = '<p class="empty-cart" data-i18n="cart_empty">السلة فارغة</p>';
    applyTranslations();
    updateCartTotal();
    return;
  }

  cart.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'cart-item';
    itemElement.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-details">
        <h4>${item.title}</h4>
        <div class="cart-item-price">${item.price} جنيه</div>
        <div class="cart-item-quantity">
          <button class="quantity-btn minus" data-id="${item.id}">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}">
          <button class="quantity-btn plus" data-id="${item.id}">+</button>
        </div>
      </div>
      <button class="remove-item" data-id="${item.id}">
        <i class="fas fa-trash"></i>
      </button>
    `;
    cartItemsElement.appendChild(itemElement);
  });

  // إضافة مستمعي الأحداث للأزرار
  document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.quantity-btn').dataset.id;
      const item = cart.find(item => item.id === id);
      if (item) {
        updateQuantity(id, item.quantity - 1);
      }
    });
  });

  document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.closest('.quantity-btn').dataset.id;
      const item = cart.find(item => item.id === id);
      if (item) {
        updateQuantity(id, item.quantity + 1);
      }
    });
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

  // تحديث الإجمالي
  updateCartTotal();
}

// تحديث الإجمالي
function updateCartTotal() {
  const totalElement = document.getElementById('cart-total-price');
  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  if (totalElement) {
    totalElement.textContent = total.toFixed(2);
  }
}

// فتح نافذة السلة
function openCartPopup() {
  document.getElementById('cart-popup').classList.remove('hidden');
  document.getElementById('overlay').classList.remove('hidden');
  renderCartItems();
}

// إغلاق نافذة السلة
function closeCartPopup() {
  document.getElementById('cart-popup').classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
}

// فتح نموذج التأكيد
function openCheckoutForm() {
  closeCartPopup();
  document.getElementById('checkout-form-popup').classList.remove('hidden');
  document.getElementById('overlay').classList.remove('hidden');
}

// إغلاق نموذج التأكيد
function closeCheckoutForm() {
  document.getElementById('checkout-form-popup').classList.add('hidden');
  document.getElementById('overlay').classList.add('hidden');
}
function resetProductButtons(productId) {
  const addButton = document.querySelector(`.add-to-cart-btn[data-product="${productId}"]`);
  const controls = document.querySelector(`.product-quantity-controls[data-product="${productId}"]`);
  
  if (addButton && controls) {
    addButton.style.display = 'block';
    controls.style.display = 'none';
    
    // إعادة تعيين الكمية إلى 1
    const quantityValue = controls.querySelector('.quantity-value');
    if (quantityValue) {
      quantityValue.textContent = '1';
    }
  }
}
// إرسال الطلب
function sendOrder(name, phone, message) {
  const lang = currentLang();
  const waNum = normalizeWhatsAppNumber(qcSettings.whatsappNumber || '');
  const email = qcSettings.emailAddress;

  // تنسيق تفاصيل الطلب
  let orderDetails = `*${getLocalizedText(translations.checkout_title) || 'طلب جديد'}*\n\n`;
  orderDetails += `*${getLocalizedText(translations.checkout_name) || 'الاسم'}:* ${name}\n`;
  orderDetails += `*${getLocalizedText(translations.checkout_phone) || 'رقم الهاتف'}:* ${phone}\n`;

  if (message) {
    orderDetails += `*${getLocalizedText(translations.checkout_message) || 'الرسالة'}:* ${message}\n`;
  }

  orderDetails += '\n*المنتجات:*\n';

  // حفظ المنتجات قبل تفريغ السلة
  const orderedProducts = [...cart];
  
  cart.forEach(item => {
    orderDetails += `- ${item.title} (${item.quantity} × ${item.price})\n`;
  });

  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const currency = translations.currency?.[currentLang()] || 'جنيه';
  orderDetails += `\n*${getLocalizedText(translations.cart_total) || 'المجموع'}:* ${total.toFixed(2)} ${currency}`;
  

  // إرسال عبر واتساب
  if (waNum) {
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(orderDetails)}`, '_blank');
  }

  // إرسال عبر البريد الإلكتروني
  if (email) {
    const subject = encodeURIComponent(`${getLocalizedText(translations.checkout_title) || 'طلب جديد'} - ${name}`);
    const body = encodeURIComponent(orderDetails);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  // تفريغ السلة والمجموع بعد الإرسال
  cart = [];
  saveCartToLocalStorage();
  updateCartCount();
  updateCartTotal();
  
  // إعادة تعيين أزرار المنتجات لكل منتج تم شراؤه
  orderedProducts.forEach(item => {
    resetProductButtons(item.id);
  });

  closeCheckoutForm();
  showToast(getLocalizedText(translations.order_sent) || 'تم إرسال طلبك بنجاح!');
}

// ===== Search & Filter =====
const recognitionSearch = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognitionSearch.lang = 'ar-SA';
recognitionSearch.interimResults = false;
let isListeningSearch = false;

function initSearch() {
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

  document.getElementById('searchBtn').onclick = performSearch;
  document.getElementById('searchName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  onValue(ref(db, 'storeCategories'), (snap) => {
    currentCategories = snap.val() || {};
    updateCategoryOptions();
  });

  document.querySelectorAll('#propertyType, #priceCondition, #priceValue')
    .forEach(el => el.addEventListener('change', performSearch));

  updateCategoryOptions();
  applyTranslations();
}

function performSearch() {
  try {
    const searchParams = getSearchParams();
    const filtered = filterStore(searchParams);
    renderStore(filtered);
    handleNoResults(filtered);

  } catch (error) {
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
      const title = getLocalizedText(p.title).toLowerCase();
      const productPrice = parseFloat(p.price) || 0;
      const priceMatch = priceValue > 0
        ? (priceCondition === 'greater'
          ? productPrice >= priceValue
          : productPrice <= priceValue)
        : true;
      const categoryMatch = category === 'all' || p.category === category;
      const textMatch = title.includes(searchText);
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
    noResults.textContent = translations['no_search_results']?.[currentLang()] || 'لا توجد نتائج';
    container.appendChild(noResults);
  } else if (resultsCount > 0 && existingMsg) {
    existingMsg.remove();
  }
}

// ————— Quick Contact —————
function normalizeWhatsAppNumber(raw) {
  return raw.trim().replace(/\D/g, '');
}

function initQuickContact(settings) {
  qcSettings = settings || {};
  const form = document.getElementById('quickContactForm');
  const nameEl = document.getElementById('qcName');
  const contactEl = document.getElementById('qcContact');
  const msgEl = document.getElementById('qcMessage');
  const btnWA = document.getElementById('qcSendWhatsapp');
  const btnEM = document.getElementById('qcSendEmail');
  const msgBox = document.getElementById('qcUserMessageBox');

  function showUserMessage(key, isError = false) {
    const lang = currentLang();
    const txt = translations[key]?.[lang] || '';
    msgBox.className = `message-box ${isError ? 'error' : 'success'}`;
    msgBox.textContent = txt;
    setTimeout(() => msgBox.textContent = '', 3000);
  }

  if (btnWA) {
    btnWA.querySelector('i').className = qcSettings.buttonWhatsappIcon || '';
    const labelWA = qcSettings.buttonWhatsappLabel;
    btnWA.querySelector('span').textContent =
      typeof labelWA === 'object'
        ? (labelWA[currentLang()] || labelWA.ar)
        : labelWA || '';
    btnWA.onclick = () => {
      if (!form.reportValidity()) return;
      const name = nameEl.value.trim();
      const contact = contactEl.value.trim();
      if (!contact) return showUserMessage('qc_warn_no_contact', true);

      const waNum = normalizeWhatsAppNumber(qcSettings.whatsappNumber || '');
      if (!waNum) return showUserMessage('qc_warn_bad_whatsapp', true);

      const fullMsg =
        `${translations.qc_label_name[currentLang()]}: ${name}\n` +
        `${translations.qc_label_contact[currentLang()]}: ${contact}\n` +
        `${translations.qc_label_message[currentLang()]}: ${msgEl.value.trim()}`;

      window.open(
        `https://wa.me/${waNum}?text=${encodeURIComponent(fullMsg)}`,
        '_blank'
      );
      setTimeout(() => {
        form.reset();
        showUserMessage('qc_sent_whatsapp');
      }, 10000);
    };
  }

  if (btnEM) {
    btnEM.querySelector('i').className = qcSettings.buttonEmailIcon || '';
    const labelEM = qcSettings.buttonEmailLabel;
    btnEM.querySelector('span').textContent =
      typeof labelEM === 'object'
        ? (labelEM[currentLang()] || labelEM.ar)
        : labelEM || '';
    btnEM.onclick = () => {
      if (!form.reportValidity()) return;
      const name = nameEl.value.trim();
      const contact = contactEl.value.trim();
      if (!contact) return showUserMessage('qc_warn_no_contact', true);
      const subject = encodeURIComponent(
        `${translations.qc_email_subject[currentLang()]} ${name}`
      );
      const body = encodeURIComponent(
        `${translations.qc_label_name[currentLang()]}: ${name}\n` +
        `${contact}\n\n${msgEl.value.trim()}`
      );
      window.location.href =
        `mailto:${qcSettings.emailAddress}?subject=${subject}&body=${body}`;
      setTimeout(() => {
        form.reset();
        showUserMessage('qc_sent_email');
      }, 10000);
    };
  }
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

// ————— Show/Hide Sections —————
function showHomeSection() {
  document.querySelectorAll('.main-section').forEach(sec => {
    sec.style.display = sec.id !== 'portfolioSection' ? 'block' : 'none';
  });
  document.getElementById('toggle-home-btn').classList.add('active');
  document.getElementById('toggle-projects-btn').classList.remove('active');
}

function showProjectsSection() {
  document.querySelectorAll('.main-section').forEach(sec => {
    sec.style.display = sec.id === 'portfolioSection' ? 'block' : 'none';
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
}