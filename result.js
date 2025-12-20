// =====================================
// FINAL result.js (STABLE + CLEAN)
// =====================================

// Firebase imports
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import {
  getDatabase, ref, onValue, update, get
} from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";


// ------------------------------------
// 🔥 FIREBASE CONFIG
// ------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBwqwNFAlRGPRRSPxLLSpryyDmpuCB6asc",
  authDomain: "inzu-dae68.firebaseapp.com",
  databaseURL: "https://inzu-dae68-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "inzu-dae68",
  storageBucket: "inzu-dae68.firebasestorage.app",
  messagingSenderId: "68573381004",
  appId: "1:68573381004:web:935dc049c5b362141816a9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// ------------------------------------
// 🔐 ADMIN KEY
// ------------------------------------
const ADMIN_KEY = "Sonu0786";


// ------------------------------------
// 🏪 BAZARS LIST
// ------------------------------------
const BAZARS = [
  { id: 'faridabad', name: 'FARIDABAD', open: '18:00' },
  { id: 'gali', name: 'GALI', open: '23:25' },
  { id: 'ghaziabad', name: 'GHAZIABAD', open: '21:25' },
  { id: 'desawar', name: 'DESAWAR', open: '17:00' },
  { id: 'delhi_bazar', name: 'DELHI BAZAR', open: '03:00' },
  { id: 'dehli_nor_yalai', name: 'DEHLI NOR YALAI', open: '18:30' },
  { id: 'noida_bazar', name: 'NOIDA BAZAR', open: '16:30' },
  { id: 'ahmedabad_city', name: 'AHMEDABAD CITY', open: '12:30' },
  { id: 'ram_mandir_5', name: 'RAM MANDIR 5', open: '21:30' },
  { id: 'bazar_kalyan', name: 'BAZAR KALYAN', open: '09:30' },
  { id: 'faridabad_baba', name: 'FARIDABAD BABA', open: '20:30' },
  { id: 'ganesh_matka', name: 'GANESH MATKA', open: '19:30' }
];


// ------------------------------------
// HELPERS
// ------------------------------------
function cleanValue(v) {
  if (!v) return "XX";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && v.value) return String(v.value);
  return "XX";
}
function formatAMPM(time) {
  const [hour, minute] = time.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, "0")} ${ampm}`;
}



// ------------------------------------
// DOM
// ------------------------------------
const bazarsContainer = document.getElementById("bazars");
const adminPanel = document.getElementById("admin-panel");
const adminEditor = document.getElementById("adminEditor");
const adminFields = document.getElementById("adminFields");


// ------------------------------------
// CREATE BAZAR CARDS + LISTENER
// ------------------------------------
BAZARS.forEach(b => {

  const card = document.createElement("article");
  card.className = "bazar-card";

  card.innerHTML = `
    <div>
      <div class="bazar-name" id="name-${b.id}">${b.name}</div>
      <div class="bazar-times">Open: ${formatAMPM(b.open)}</div>
      <div class="timer" id="timer-${b.id}">--:--:--</div> 
    </div>

    <div class="result-wrap">
      <div class="result-title">Result</div>
      <div class="result-row">
        <div class="result-item"
          <span class="result-label">कल</span>
          <div class="result-box" id="yesterday-${b.id}">XX</div>
        </div>
        <div class="result-item">
          <span class="result-label">आज</span>
          <div class="result-box live" id="today-${b.id}">XX</div>
        </div>
      </div>
    </div>
  `;

  bazarsContainer.appendChild(card);

  onValue(ref(db, "results/" + b.id), snap => {
    const data = snap.val() || {};

    const todayVal = cleanValue(data.today);
    const yesterdayVal = cleanValue(data.yesterday);

    const todayEl = document.getElementById("today-" + b.id);
    const yesterdayEl = document.getElementById("yesterday-" + b.id);
    const nameEl = document.getElementById("name-" + b.id);

    if (todayEl) todayEl.textContent = todayVal;
    if (yesterdayEl) yesterdayEl.textContent = yesterdayVal;
    if (nameEl) nameEl.textContent = data.name || b.name;
  });

  startTimer(b);
});


// ------------------------------------
// TIMER
// ------------------------------------

function startTimer(b) {
  const el = document.getElementById("timer-" + b.id);

  function nextTime(time) {
    const [h, m] = time.split(":").map(Number);
    const now = new Date();
    let t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (t < now) t.setDate(t.getDate() + 1);
    return t;
  }

  let target = nextTime(b.open);

  setInterval(() => {
    let diff = target - new Date();
    if (diff <= 0) target = nextTime(b.open);

    diff = target - new Date();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    el.textContent =
      String(h).padStart(2, "0") + ":" +
      String(m).padStart(2, "0") + ":" +
      String(s).padStart(2, "0");
  }, 1000);
}



// ------------------------------------
// ADMIN MODE
// ------------------------------------
if (new URLSearchParams(location.search).get("admin") === ADMIN_KEY) {
  adminPanel.classList.remove("hidden");
  adminEditor.classList.remove("hidden");
  adminFields.style.display = "block";
  loadAdminFields();
}


// ------------------------------------
// ADMIN INPUTS
// ------------------------------------
async function loadAdminFields() {
  adminFields.innerHTML = "";

  const snap = await get(ref(db, "results"));
  const data = snap.exists() ? snap.val() : {};

  BAZARS.forEach(b => {
    const todayVal = cleanValue(data[b.id]?.today);

    const row = document.createElement("div");
    row.className = "admin-row";

    row.innerHTML = `
      <label>${b.name}</label>
      <input id="edit-${b.id}" value="${todayVal}" />
    `;

    adminFields.appendChild(row);
  });
}


// ------------------------------------
// SAVE RESULTS (AUTO SHIFT)
// ------------------------------------
document.getElementById("saveBtn")?.addEventListener("click", async () => {

  const snap = await get(ref(db, "results"));
  const oldData = snap.exists() ? snap.val() : {};

  const updates = {};
  const todayDate = new Date().toISOString().slice(0, 10);

  BAZARS.forEach(b => {
    const input = document.getElementById("edit-" + b.id);
    if (!input) return;

    const newVal = input.value.trim();
    if (!newVal) return;

    const oldToday = cleanValue(oldData[b.id]?.today);
    if (newVal === oldToday) return;

    updates["results/" + b.id] = {
      name: b.name,
      yesterday: {
        value: oldToday,
        date: oldData[b.id]?.today?.date || todayDate
      },
      today: {
        value: newVal,
        date: todayDate
      }
    };
  });

  if (Object.keys(updates).length === 0) {
    alert("❌ No changes detected");
    return;
  }

  await update(ref(db), updates);
  alert("✅ Result updated successfully");
});
