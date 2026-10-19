"use strict";

/* =====================================================
   1. EASY-TO-EDIT SETTINGS
   Change the text below to make the website your own.
   Use {name} anywhere to insert her name.
   ===================================================== */
const CONFIG = {
  maxNameLength: 20,        // longest name allowed
  nextQuestionDelay: 1800,  // milliseconds before the next question appears
  soundOnByDefault: true,   // sound effects start on (she can mute them)

  // The seven questions (add or remove lines if you like)
  questions: [
    "{name}, do you agree that you deserve all the happiness in the world? 🥹",
    "Can I call you a certified cutie? 🎀",
    "Would you accept a virtual teddy bear from me? 🧸",
    "Will you promise to smile at least once today? 🌸",
    "Would you like unlimited virtual chocolates? 🍫",
    "Can we make more beautiful memories together? 💕",
    "Will you accept this little surprise made especially for you? 🎁"
  ],

  // Shown after YES (message number matches question number, then repeats)
  yesMessages: [
    "Awww, that made my day! 💗",
    "Achievement unlocked: Certified Cutie! 🏆",
    "Yay! Your virtual teddy bear is on its way, hugs included! 🧸💗",
    "You just earned 100 virtual hugs! 🤗",
    "Sweet! Unlimited chocolates are being delivered! 🍫✨",
    "My heart just did a happy dance! 💃💕",
    "You are officially the best, {name}! 🎁✨"
  ],

  // Shown whenever someone gets close to or clicks NO
  noMessages: [
    "Hehe, nice try, {name}! 🙈💗",
    "Oops, you almost caught me! Try again, cutie! 🏃‍♀️💨",
    "Aww, don't give up! I'm a little too quick! 🎀",
    "That was close, {name}! Here's a little hug for trying! 🧸💕"
  ],

  // Random compliments (final screen)
  compliments: [
    "{name}, your smile could light up an entire city! 🌟",
    "{name}, you are kinder than you realize. 💗",
    "Being around you makes ordinary days feel special, {name}. ✨",
    "{name}, you're like a warm hug in human form. 🤗",
    "Your laugh is officially the best sound ever, {name}! 😄",
    "{name}, the world is a brighter place with you in it. 🌈",
    "You are stronger than you think, {name}. 💪🌸",
    "{name}, you make people feel safe and happy. 🧸",
    "Certified cutie AND certified legend: that's you, {name}! 🏆",
    "{name}, you deserve every good thing coming your way. 🍀"
  ],

  // The final message (each line is a paragraph)
  finalMessage: [
    "Hey {name}! 💗",
    "I made this little website to put a smile on your face. I hope it made you laugh and brightened your day, even if that naughty NO button annoyed you a little! 😂",
    "Always remember that you deserve happiness, kindness, laughter, and beautiful moments.",
    "Keep smiling and being the wonderful person you are. Sending you a big virtual hug! 🧸💕",
    "Made with lots of good vibes, especially for you. ✨"
  ],

  // The extra message that appears when the gift opens (write something personal here!)
  giftMessage: [
    "Surprise, {name}! 🎉 Your gift is a lifetime supply of cheering for you.",
    "Whenever you need a smile, come back to this page and press Play Again. 💌",
    "🎟️ Coupon: One free virtual hug, valid forever and ever!"
  ]
};

/* =====================================================
   2. SMALL HELPERS
   ===================================================== */
const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Restart a CSS animation on an element
function replayAnimation(el, className) {
  el.classList.remove(className);
  void el.offsetWidth; // forces the browser to notice the change
  el.classList.add(className);
}

const HEART_ICONS = ["💗", "💖", "💕", "🌸", "✨", "🌷", "🎀", "🦋"];

/* =====================================================
   3. APP STATE
   ===================================================== */
function freshState() {
  return { name: "", index: 0, locked: false, meter: 0, giftOpen: false };
}
const state = freshState();
function resetState() { Object.assign(state, freshState()); }

// Put her name into any text that contains {name}
function fill(text) {
  return text.replace(/\{name\}/g, () => state.name);
}

// Frequently used elements
const yesBtn = $("yesBtn");
const noBtn = $("noBtn");
const noSlot = $("noSlot");
const arena = $("arena");
const messageEl = $("message");

/* =====================================================
   4. SCREENS
   ===================================================== */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => { screen.hidden = true; });
  const target = $(id);
  target.hidden = false;
  const focusTarget = target.querySelector("[data-focus]");
  if (focusTarget && id !== "welcomeScreen") focusTarget.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

/* =====================================================
   5. SOUND EFFECTS (made with the browser, no files needed)
   ===================================================== */
let audioCtx = null;
let soundOn = CONFIG.soundOnByDefault;

function getAudio() {
  if (!audioCtx) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) return null;
    try { audioCtx = new AudioClass(); } catch (e) { return null; }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(freq, delay, duration, type = "sine", volume = 0.08) {
  const ctx = getAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

function playSound(name) {
  if (!soundOn) return;
  const sounds = {
    click: [[660, 0, 0.1]],
    yes:   [[523, 0, 0.15], [659, 0.1, 0.15], [784, 0.2, 0.28]],
    win:   [[523, 0, 0.18], [659, 0.15, 0.18], [784, 0.3, 0.18], [1047, 0.45, 0.4]],
    gift:  [[784, 0, 0.12], [988, 0.1, 0.12], [1175, 0.2, 0.12], [1568, 0.3, 0.35]]
  };
  (sounds[name] || []).forEach((note) => tone(...note));
}

function updateSoundButton() {
  const btn = $("soundToggle");
  btn.textContent = soundOn ? "🔊" : "🔇";
  btn.setAttribute("aria-pressed", String(!soundOn));
  btn.setAttribute("aria-label", soundOn ? "Mute sound effects" : "Unmute sound effects");
}

/* =====================================================
   6. THEME (light / dark)
   ===================================================== */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = $("themeToggle");
  btn.textContent = theme === "dark" ? "☀️" : "🌙";
  btn.setAttribute("aria-pressed", String(theme === "dark"));
  try { localStorage.setItem("cute-theme", theme); } catch (e) { /* storage not available: ignore */ }
}

function loadTheme() {
  let saved = "light";
  try { saved = localStorage.getItem("cute-theme") || "light"; } catch (e) { /* ignore */ }
  applyTheme(saved === "dark" ? "dark" : "light");
}

/* =====================================================
   7. BACKGROUND HEARTS AND CELEBRATIONS
   ===================================================== */
function createBackgroundHearts() {
  const container = $("bgHearts");
  for (let i = 0; i < 22; i++) {
    const heart = document.createElement("span");
    const duration = 10 + Math.random() * 12;
    heart.className = "bg-heart";
    heart.textContent = HEART_ICONS[i % HEART_ICONS.length];
    heart.style.setProperty("--x", Math.random() * 100 + "%");
    heart.style.setProperty("--y", Math.random() * 90 + "%");
    heart.style.setProperty("--s", 16 + Math.random() * 26 + "px");
    heart.style.setProperty("--d", duration + "s");
    heart.style.setProperty("--delay", -Math.random() * duration + "s");
    heart.style.setProperty("--sway", Math.random() * 120 - 60 + "px");
    container.appendChild(heart);
  }
}

// Confetti + rising hearts. big = true means a full-screen celebration.
function celebrate(big) {
  if (reduceMotion()) return;
  const layer = $("fxLayer");
  const colors = ["#ff6fa8", "#ffb3d1", "#b58cff", "#ffd36e", "#8fe3cf", "#ffffff"];

  const pieces = big ? 90 : 45;
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement("span");
    const duration = 2.2 + Math.random() * 1.8;
    piece.className = "confetti";
    piece.style.setProperty("--x", Math.random() * 100 + "vw");
    piece.style.setProperty("--dx", Math.random() * 200 - 100 + "px");
    piece.style.setProperty("--r", Math.random() * 900 - 450 + "deg");
    piece.style.setProperty("--t", duration + "s");
    piece.style.setProperty("--c", pick(colors));
    piece.style.animationDelay = Math.random() * 0.4 + "s";
    if (Math.random() < 0.35) piece.style.borderRadius = "50%";
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + 0.6) * 1000);
  }

  let originX = window.innerWidth / 2;
  let originY = window.innerHeight / 2;
  if (!big) {
    const rect = $("questionCard").getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  }

  const hearts = big ? 18 : 12;
  for (let i = 0; i < hearts; i++) {
    const heart = document.createElement("span");
    heart.className = "rise-heart";
    heart.textContent = pick(HEART_ICONS);
    heart.style.left = originX + (Math.random() * 240 - 120) + "px";
    heart.style.top = originY + (Math.random() * 80 - 40) + "px";
    heart.style.fontSize = 20 + Math.random() * 22 + "px";
    heart.style.animationDelay = Math.random() * 0.4 + "s";
    layer.appendChild(heart);
    setTimeout(() => heart.remove(), 2600);
  }
}

function teddyJump() {
  const teddy = $("quizTeddy");
  teddy.classList.remove("happy");
  void teddy.getBoundingClientRect();
  teddy.classList.add("happy");
  setTimeout(() => teddy.classList.remove("happy"), 750);
}

/* =====================================================
   8. WELCOME SCREEN: NAME VALIDATION
   ===================================================== */
function validateName(name) {
  if (name.length === 0) return "Please type your name, cutie! 🎀";
  if (name.length > CONFIG.maxNameLength) return "That's a long name! Please use " + CONFIG.maxNameLength + " letters or fewer 💗";
  if (!/^[\p{L}\p{M}][\p{L}\p{M} '.\-]*$/u.test(name)) return "Please use letters only (spaces, - ' . are fine) 💗";
  return "";
}

$("nameForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("nameInput").value.trim().replace(/\s+/g, " ");
  const problem = validateName(name);
  if (problem) {
    $("nameError").textContent = problem;
    $("nameInput").focus();
    return;
  }
  $("nameError").textContent = "";
  state.name = name;
  playSound("click");
  $("greetingTitle").textContent = "Hey, " + state.name + "! 🥹💗";
  showScreen("greetingScreen");
});

$("readyBtn").addEventListener("click", () => {
  playSound("click");
  startQuiz();
});

/* =====================================================
   9. QUIZ
   ===================================================== */
function setMessage(text) {
  messageEl.textContent = fill(text);
  replayAnimation(messageEl, "pop");
}

function setProgress(answered) {
  const total = CONFIG.questions.length;
  $("progressFill").style.width = (answered / total) * 100 + "%";
  $("progressBar").setAttribute("aria-valuemax", String(total));
  $("progressBar").setAttribute("aria-valuenow", String(answered));
}

function meterLabel(percent) {
  if (percent >= 100) return "MAXIMUM FRIENDSHIP unlocked! 💖";
  if (percent >= 75) return "Soulmate-level friendship 🌈";
  if (percent >= 50) return "Super duper friends 💞";
  if (percent >= 25) return "Becoming besties 🌼";
  return "Just getting started 🌱";
}

function updateMeters() {
  const percent = Math.min(100, Math.round(state.meter));
  document.querySelectorAll(".meter-fill").forEach((el) => { el.style.width = percent + "%"; });
  document.querySelectorAll(".meter-percent").forEach((el) => { el.textContent = percent + "%"; });
  document.querySelectorAll(".meter-label").forEach((el) => { el.textContent = meterLabel(percent); });
  document.querySelectorAll(".meter-track").forEach((el) => { el.setAttribute("aria-valuenow", String(percent)); });
}

function startQuiz() {
  state.index = 0;
  state.meter = 0;
  updateMeters();
  showScreen("quizScreen");
  renderQuestion();
}

function renderQuestion() {
  const total = CONFIG.questions.length;
  state.locked = false;

  $("questionText").textContent = fill(CONFIG.questions[state.index]);
  $("questionCounter").textContent = "Question " + (state.index + 1) + " of " + total;
  setProgress(state.index);

  yesBtn.disabled = false;
  noBtn.disabled = false;
  messageEl.textContent = "";
  replayAnimation($("questionCard"), "swap");

  placeNoAtSlot();
  requestAnimationFrame(placeNoAtSlot);
  $("questionText").focus({ preventScroll: true });
}

function nextQuestion() {
  state.index++;
  if (state.index >= CONFIG.questions.length) {
    showFinal();
  } else {
    renderQuestion();
  }
}

/* ---------- YES button ---------- */
yesBtn.addEventListener("click", () => {
  if (state.locked) return;
  state.locked = true;
  yesBtn.disabled = true;
  noBtn.disabled = true;

  state.meter += 100 / CONFIG.questions.length;
  updateMeters();
  setProgress(state.index + 1);

  setMessage(CONFIG.yesMessages[state.index % CONFIG.yesMessages.length]);
  playSound("yes");
  celebrate(false);
  teddyJump();

  setTimeout(nextQuestion, CONFIG.nextQuestionDelay);
});

/* ---------- NO button ---------- */

function placeNoAtSlot() {
  noBtn.style.left = noSlot.offsetLeft + "px";
  noBtn.style.top = noSlot.offsetTop + "px";
}

function moveNoAwayFrom(clientX, clientY) {
  const bounds = arena.getBoundingClientRect();
  const width = noBtn.offsetWidth;
  const height = noBtn.offsetHeight;
  const maxX = Math.max(0, arena.clientWidth - width);
  const maxY = Math.max(0, arena.clientHeight - height);
  const yesBounds = {
    left: yesBtn.offsetLeft - 12,
    right: yesBtn.offsetLeft + yesBtn.offsetWidth + 12,
    top: yesBtn.offsetTop - 12,
    bottom: yesBtn.offsetTop + yesBtn.offsetHeight + 12
  };
  let bestSpot = null;
  let bestDistance = -1;

  for (let attempt = 0; attempt < 80; attempt++) {
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    const overlapsYes = x < yesBounds.right && x + width > yesBounds.left &&
      y < yesBounds.bottom && y + height > yesBounds.top;
    if (overlapsYes) continue;

    const centerX = bounds.left + x + width / 2;
    const centerY = bounds.top + y + height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    if (distance > bestDistance) {
      bestSpot = { x, y };
      bestDistance = distance;
    }
  }

  if (!bestSpot) return;
  noBtn.style.left = bestSpot.x + "px";
  noBtn.style.top = bestSpot.y + "px";
}

function dodgeNo(clientX, clientY) {
  if (state.locked) return;
  setMessage(pick(CONFIG.noMessages));
  moveNoAwayFrom(clientX, clientY);
}

arena.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse" || state.locked) return;
  const bounds = noBtn.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  if (Math.hypot(event.clientX - centerX, event.clientY - centerY) < 90) {
    dodgeNo(event.clientX, event.clientY);
  }
});

noBtn.addEventListener("click", () => {
  if (state.locked) return;
  const bounds = noBtn.getBoundingClientRect();
  dodgeNo(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
});

window.addEventListener("resize", () => {
  if (!$("quizScreen").hidden) placeNoAtSlot();
});

/* =====================================================
   10. FINAL SCREEN
   ===================================================== */
let lastComplimentIndex = -1;

function fillParagraphs(container, lines, firstClass) {
  container.textContent = "";
  lines.forEach((line, i) => {
    const p = document.createElement("p");
    p.textContent = fill(line);
    if (i === 0 && firstClass) p.className = firstClass;
    container.appendChild(p);
  });
}

function resetGift() {
  state.giftOpen = false;
  $("giftBox").classList.remove("open");
  $("giftBox").setAttribute("aria-expanded", "false");
  $("giftMessage").hidden = true;
  $("giftMessage").textContent = "";
  $("openGiftBtn").disabled = false;
  $("openGiftBtn").textContent = "Open Your Gift 🎁";
  $("complimentBox").hidden = true;
  $("complimentBox").textContent = "";
}

function showFinal() {
  $("finalTitle").textContent = "You Did It, " + state.name + "! 💖";
  fillParagraphs($("finalMessage"), CONFIG.finalMessage, "final-hello");
  resetGift();
  updateMeters();
  showScreen("finalScreen");
  playSound("win");
  celebrate(true);
  setTimeout(() => celebrate(true), 1500);
  setTimeout(() => celebrate(true), 3000);
}

function openGift() {
  if (state.giftOpen) return;
  state.giftOpen = true;
  $("giftBox").classList.add("open");
  $("giftBox").setAttribute("aria-expanded", "true");
  fillParagraphs($("giftMessage"), CONFIG.giftMessage);
  $("giftMessage").hidden = false;
  $("openGiftBtn").disabled = true;
  $("openGiftBtn").textContent = "Gift Opened 🎉";
  playSound("gift");
  celebrate(true);
}

function giveCompliment() {
  let index;
  do {
    index = Math.floor(Math.random() * CONFIG.compliments.length);
  } while (index === lastComplimentIndex && CONFIG.compliments.length > 1);
  lastComplimentIndex = index;

  const box = $("complimentBox");
  box.hidden = false;
  box.textContent = fill(CONFIG.compliments[index]);
  replayAnimation(box, "pop");
  playSound("click");
}

function restart() {
  resetState();
  $("fxLayer").textContent = "";
  $("nameInput").value = "";
  $("nameError").textContent = "";
  updateMeters();
  playSound("click");
  showScreen("welcomeScreen");
  $("nameInput").focus();
}

$("giftBox").addEventListener("click", openGift);
$("openGiftBtn").addEventListener("click", openGift);
$("complimentBtn").addEventListener("click", giveCompliment);
$("playAgainBtn").addEventListener("click", restart);

/* =====================================================
   11. TOP BUTTONS
   ===================================================== */
$("themeToggle").addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  applyTheme(isDark ? "light" : "dark");
  playSound("click");
});

$("soundToggle").addEventListener("click", () => {
  soundOn = !soundOn;
  updateSoundButton();
  if (soundOn) playSound("click");
});

/* =====================================================
   12. START
   ===================================================== */
loadTheme();
updateSoundButton();
createBackgroundHearts();
updateMeters();

const backgroundMusic = document.getElementById("backgroundMusic");
const musicToggle = document.getElementById("musicToggle");
const musicStatus = $("musicStatus");

function updateMusicButton() {
  const isPlaying = !backgroundMusic.paused;
  musicToggle.textContent = isPlaying ? "⏸️" : "🎵";
  musicToggle.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
}

function showMusicStatus(message) {
  musicStatus.textContent = message;
  musicStatus.hidden = !message;
}

async function startBackgroundMusic() {
  try {
    await backgroundMusic.play();
    showMusicStatus("");
    updateMusicButton();
  } catch (error) {
    updateMusicButton();
    if (error.name === "NotAllowedError") {
      showMusicStatus("Tap or press any key to start the music 🎵");
    } else {
      console.error("Could not play background music:", error);
      showMusicStatus("Music couldn't load. Check that music.mp3 is next to index.html.");
    }
  }
}

backgroundMusic.addEventListener("play", updateMusicButton);
backgroundMusic.addEventListener("pause", updateMusicButton);
musicToggle.addEventListener("click", () => {
  if (backgroundMusic.paused) {
    startBackgroundMusic();
  } else {
    backgroundMusic.pause();
    updateMusicButton();
  }
});

function startMusicOnFirstGesture(event) {
  if (event.target instanceof Element && event.target.closest("#musicToggle")) return;
  document.removeEventListener("pointerdown", startMusicOnFirstGesture);
  document.removeEventListener("keydown", startMusicOnFirstGesture);
  if (backgroundMusic.paused) startBackgroundMusic();
}

document.addEventListener("pointerdown", startMusicOnFirstGesture);
document.addEventListener("keydown", startMusicOnFirstGesture);
updateMusicButton();
startBackgroundMusic();