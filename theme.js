const THEMES = ['wine', 'day', 'sunset', 'coffee'];
let theme = localStorage.getItem('theme') || 'wine';

// متغيرات لكل ثيم
let dayCanvas, dayCtx, bokeh = [];
let wineCanvas, wineCtx, wineParticles = [];
let coffeeCanvas, coffeeCtx, coffeeParticles = [];
let sunsetCanvas, sunsetCtx, bubbles = [];

// إنشاء الصور بشكل متزامن
const loadImages = async () => {
  const beanImg = new Image();
  const appleImg = new Image();
  
  await Promise.all([
    new Promise(resolve => {
      beanImg.onload = resolve;
      beanImg.src = 'coffee.png';
    }),
    new Promise(resolve => {
      appleImg.onload = resolve;
      appleImg.src = 'apple.png';
    })
  ]);
  
  return { beanImg, appleImg };
};

// ------------- Day Theme -------------
function initDayElements() {
  dayCanvas.width = window.innerWidth;
  dayCanvas.height = window.innerHeight;
  bokeh = [];
  for (let i = 0; i < 100; i++) {
    bokeh.push({
      x: Math.random() * dayCanvas.width,
      y: Math.random() * dayCanvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * 2 * Math.PI
    });
  }
}

function drawDayScene() {
  dayCtx.clearRect(0, 0, dayCanvas.width, dayCanvas.height);
  bokeh.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.phase += 0.02;
    if (p.x < 0) p.x = dayCanvas.width;
    if (p.x > dayCanvas.width) p.x = 0;
    if (p.y < 0) p.y = dayCanvas.height;
    if (p.y > dayCanvas.height) p.y = 0;
  });
  bokeh.forEach(p => {
    dayCtx.beginPath();
    dayCtx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
    dayCtx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(p.phase)})`;
    dayCtx.shadowBlur = 10;
    dayCtx.shadowColor = 'rgba(255,255,255,0.8)';
    dayCtx.fill();
  });
  dayCtx.shadowBlur = 0;
}

function animateDay() {
  if (theme === 'day') drawDayScene();
  requestAnimationFrame(animateDay);
}

// ------------- Wine Theme (تساقط التفاح) -------------
function initWineElements(appleImg) {
  wineCanvas.width = window.innerWidth;
  wineCanvas.height = window.innerHeight;
  wineParticles = [];
  for (let i = 0; i < 10; i++) {
    wineParticles.push({
      x: Math.random() * wineCanvas.width,
      y: -Math.random() * wineCanvas.height,
      speed: 0.1 + Math.random() * 1,
      img: appleImg
    });
  }
}

function drawWineScene() {
  wineCtx.clearRect(0, 0, wineCanvas.width, wineCanvas.height);
  for (let p of wineParticles) {
    wineCtx.drawImage(p.img, p.x, p.y, 20, 20);
    p.y += p.speed;
    if (p.y > wineCanvas.height) {
      p.y = -20;
      p.x = Math.random() * wineCanvas.width;
    }
  }
}

function animateWine() {
  if (theme === 'wine') drawWineScene();
  requestAnimationFrame(animateWine);
}

// ------------- Coffee Theme -------------
function initCoffeeElements(beanImg) {
  coffeeCanvas.width = window.innerWidth;
  coffeeCanvas.height = window.innerHeight;
  coffeeParticles = [];
  for (let i = 0; i < 10; i++) {
    coffeeParticles.push({
      x: Math.random() * coffeeCanvas.width,
      y: -Math.random() * coffeeCanvas.height,
      speed: 0.1 + Math.random() * 1,
      img: beanImg
    });
  }
}

function drawCoffeeScene() {
  coffeeCtx.clearRect(0, 0, coffeeCanvas.width, coffeeCanvas.height);
  for (let p of coffeeParticles) {
    coffeeCtx.drawImage(p.img, p.x, p.y, 20, 20);
    p.y += p.speed;
    if (p.y > coffeeCanvas.height) {
      p.y = -20;
      p.x = Math.random() * coffeeCanvas.width;
    }
  }
}

function animateCoffee() {
  if (theme === 'coffee') drawCoffeeScene();
  requestAnimationFrame(animateCoffee);
}

// ------------- Sunset Theme (فقاعات متصاعدة) -------------
function initSunsetElements() {
  sunsetCanvas.width = window.innerWidth;
  sunsetCanvas.height = window.innerHeight;
  bubbles = [];
  for (let i = 0; i < 20; i++) {
    bubbles.push({
      x: Math.random() * sunsetCanvas.width,
      y: sunsetCanvas.height + Math.random() * 100,
      r: 2 + Math.random() * 3,
      speed: 0.3 + Math.random() * 1
    });
  }
}

function drawSunsetScene() {
  sunsetCtx.clearRect(0, 0, sunsetCanvas.width, sunsetCanvas.height);
  for (let b of bubbles) {
    sunsetCtx.beginPath();
    sunsetCtx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
    sunsetCtx.fillStyle = 'rgba(255,255,255,0.3)';
    sunsetCtx.fill();
    b.y -= b.speed;
    if (b.y + b.r < 0) b.y = sunsetCanvas.height + Math.random() * 50;
  }
}

function animateSunset() {
  if (theme === 'sunset') drawSunsetScene();
  requestAnimationFrame(animateSunset);
}

// ------------- Apply & Toggle -------------
function applyTheme(initial = false) {
  // إزالة أي ثيمات قديمة
  document.documentElement.classList.remove('theme-night');
  THEMES.forEach(t => {
    document.documentElement.classList.remove(`theme-${t}`);
  });
  
  // تطبيق الثيم الجديد
  document.documentElement.classList.add(`theme-${theme}`);
  
  // جعل الصفحة مرئية
  document.documentElement.style.visibility = 'visible';
  
  if (initial) {
    // تحديث أيقونة الثيم
    updateIcon();
  }
}

function toggleTheme() {
  let idx = THEMES.indexOf(theme);
  theme = THEMES[(idx + 1) % THEMES.length];
  localStorage.setItem('theme', theme);
  applyTheme();
  updateIcon();
}

function updateIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  
  const icon = btn.querySelector('i');
  if (!icon) return;
  
  const map = {
    day: 'fas fa-moon',
    wine: 'fas fa-apple-alt',
    coffee: 'fas fa-coffee',
    sunset: 'fas fa-wine-glass-alt'
  };
  
  icon.className = map[theme] || map.wine;
}

// ------------- Startup -------------
document.addEventListener('DOMContentLoaded', async () => {
  // إنشاء عناصر Canvas لكل الثيمات
  dayCanvas = document.createElement('canvas'); 
  dayCanvas.id = 'day-canvas';
  wineCanvas = document.createElement('canvas'); 
  wineCanvas.id = 'wine-canvas';
  coffeeCanvas = document.createElement('canvas'); 
  coffeeCanvas.id = 'coffee-canvas';
  sunsetCanvas = document.createElement('canvas'); 
  sunsetCanvas.id = 'sunset-canvas';

  // إضافة العناصر إلى body
  document.body.prepend(
    dayCanvas,
    wineCanvas,
    coffeeCanvas,
    sunsetCanvas
  );

  // الحصول على السياقات الرسومية
  dayCtx = dayCanvas.getContext('2d');
  wineCtx = wineCanvas.getContext('2d');
  coffeeCtx = coffeeCanvas.getContext('2d');
  sunsetCtx = sunsetCanvas.getContext('2d');

  // تحميل الصور
  const { beanImg, appleImg } = await loadImages();

  // تهيئة الثيمات
  initDayElements();
  initWineElements(appleImg);
  initCoffeeElements(beanImg);
  initSunsetElements();
  
  // بدء الرسوم المتحركة
  animateDay();
  animateWine();
  animateCoffee();
  animateSunset();

  // تطبيق الثيم الأولي
  applyTheme(true);
  
  // إضافة مستمع حدث للتبديل بين الثيمات
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // التعامل مع تغيير حجم النافذة
  const handleResize = () => {
    initDayElements();
    initWineElements(appleImg);
    initCoffeeElements(beanImg);
    initSunsetElements();
  };

  window.addEventListener('resize', handleResize);
});