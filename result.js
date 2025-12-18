// =====================================
// FINAL result.js (CLEAN + AUTO SHIFT)
// =====================================

// Firebase imports
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import {
  getDatabase, ref, onValue, update, get
} from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";


// ------------------------------------
// 🔥 FIREBASE CONFIG (APNI REAL KEYS DALO)
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
// 🔐 ADMIN KEY (URL BASED)
// ------------------------------------
const ADMIN_KEY = "Sonu0786";


// ------------------------------------
// 🏪 BAZAR LIST (tumhari list)
// ------------------------------------
const BAZARS = [
  { id: 'khaja_garib', name: 'KHAJA GARIB', open: '09:30' },
  { id: 'khaja_garib_nawaz', name: 'KHAJA GARIB NAWAZ', open: '10:30' },
  { id: 'dehli_baba', name: 'DEHLI BABA', open: '11:45' },
  { id: 'baba_ka_gali', name: 'BABA KA GALI', open: '11:45' },
  { id: 'azmer_sharif', name: 'AZMER SHARIF', open: '12:30' },
  { id: 'dehli_nor_yalai', name: 'DEHLI NOR YALAI', open: '18:30' },
  { id: 'noida_bazar', name: 'NOIDA BAZAR', open: '16:30' },
  { id: 'ahmedabad_city', name: 'AHMEDABAD CITY', open: '12:30' },
  { id: 'ram_mandir_5', name: 'RAM MANDIR 5', open: '15:00' },
  { id: 'east_dehli', name: 'EAST DEHLI', open: '09:30' },
  { id: 'faridabad_baba', name: 'FARIDABAD BABA', open: '11:00' },
  { id: 'ganesh_matka', name: 'GANESH MATKA', open: '10:00' }
];


// ------------------------------------
// DOM
// ------------------------------------
const bazarsContainer = document.getElementById("bazars");
const adminPanel = document.getElementById("admin-panel");
const adminEditor = document.getElementById("adminEditor");
const adminFields = document.getElementById("adminFields");


// ------------------------------------
// 🧱 CREATE BAZAR CARDS
// ------------------------------------
BAZARS.forEach(b => {

  const card = document.createElement("article");
  card.className = "bazar-card";

  card.innerHTML = `
    <div>
      <div class="bazar-name" id="name-${b.id}">${b.name}</div>
      <div class="bazar-times">Open: ${b.open}</div>
      <div class="timer" id="timer-${b.id}">--:--:--</div>
    </div>

    <div class="result-wrap">
      <div class="result-title">Result</div>
      <div class="result-row">
        <div class="result-item">
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

  // 🔥 Firebase listener
  onValue(ref(db, "results/" + b.id), snap => {
    const data = snap.val() || {};
    document.getElementById("today-" + b.id).textContent = data.today || "XX";
    document.getElementById("yesterday-" + b.id).textContent = data.yesterday || "XX";
    if (data.name) {
      document.getElementById("name-" + b.id).textContent = data.name;
    }
  });

  startTimer(b);
});


// ------------------------------------
// ⏱ TIMER
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
    if (diff <= 0) {
      target = nextTime(b.open);
      diff = target - new Date();
    }
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
// 🔓 ADMIN MODE (?admin=Sonu0786)
// ------------------------------------
if (new URLSearchParams(location.search).get("admin") === ADMIN_KEY) {
  adminPanel.classList.remove("hidden");
  adminEditor.classList.remove("hidden");
  adminEditor.classList.remove("hidden");
  adminFields.style.display = "block";
  loadAdminFields();
}


// ------------------------------------
// 🛠 ADMIN INPUTS (ONLY TODAY)
// ------------------------------------
async function loadAdminFields() {
  adminFields.innerHTML = "";

  const snap = await get(ref(db, "results"));
  const data = snap.exists() ? snap.val() : {};

  BAZARS.forEach(b => {
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <strong>${b.name}</strong>
      <input id="t-${b.id}" placeholder="Today Result"
        value="${data[b.id]?.today || ""}">
    `;
    adminFields.appendChild(row);
  });
}


// ------------------------------------
// 💾 SAVE (AUTO SHIFT)
// ------------------------------------
document.getElementById("saveBtn")?.addEventListener("click", async () => {

  const snap = await get(ref(db, "results"));
  const oldData = snap.exists() ? snap.val() : {};

  const updates = {};
  const todayDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  BAZARS.forEach(b => {

    const input = document.getElementById("edit-" + b.id);
    if (!input) return;

    const newTodayValue = input.value.trim();
    if (!newTodayValue) return; // ⛔ empty → skip

    const oldToday = oldData[b.id]?.today?.value || "XX";

    // ⛔ SAME VALUE → DO NOTHING
    if (newTodayValue === oldToday) return;

    const oldTodayFull = oldData[b.id]?.today || {
      value: "XX",
      date: "N/A"
    };

    updates["results/" + b.id] = {
      name: b.name,

      // ✅ ONLY THIS BAZAR'S yesterday updates
      yesterday: {
        value: oldTodayFull.value,
        date: oldTodayFull.date
      },

      today: {
        value: newTodayValue,
        date: todayDate
      }
    };
  });

  // ⛔ Nothing changed
  if (Object.keys(updates).length === 0) {
    alert("ℹ️ No changes detected");
    return;
  }

  await update(ref(db), updates);

  alert("✅ Selected bazar updated. Yesterday shifted safely.");
});
