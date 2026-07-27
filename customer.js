import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ========== 혜택·쿠폰 ========== */

async function loadBenefits() {
  const benefitList = document.getElementById("benefitList");
  benefitList.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "benefits"));
    const today = new Date().toISOString().slice(0, 10);
    let shown = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.active) return;
      if (data.startDate && data.startDate > today) return;
      if (data.endDate && data.endDate < today) return;

      shown++;
      benefitList.innerHTML += `
        <div class="benefit-card">
          <span class="pill">진행중</span>
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.description)}</p>
          <span class="benefit-period">${data.startDate} ~ ${data.endDate}</span>
        </div>
      `;
    });

    if (shown === 0) {
      benefitList.innerHTML = "<p>현재 진행 중인 혜택이 없습니다.</p>";
    }
  } catch (err) {
    benefitList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

/* ========== 사후관리 안내 ========== */

async function loadAftercare() {
  const aftercareList = document.getElementById("aftercareList");
  aftercareList.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "aftercare"));
    const items = [];
    snapshot.forEach((docSnap) => items.push(docSnap.data()));
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    items.forEach((data, index) => {
      aftercareList.innerHTML += `
        <div class="accordion-item">
          <button type="button" class="accordion-toggle" data-index="${index}">${escapeHtml(data.procedureName)}</button>
          <div class="accordion-content hidden" id="aftercare-content-${index}">
            <p>${escapeHtml(data.content)}</p>
          </div>
        </div>
      `;
    });

    document.querySelectorAll(".accordion-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById(`aftercare-content-${btn.dataset.index}`).classList.toggle("hidden");
      });
    });
  } catch (err) {
    aftercareList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

loadBenefits();
loadAftercare();

/* ========== 상담 신청 ========== */

const consultForm = document.getElementById("consultForm");
const consultSuccess = document.getElementById("consultSuccess");
const consultError = document.getElementById("consultError");

consultForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("consultName").value.trim();
  const phone = document.getElementById("consultPhone").value.trim();
  const message = document.getElementById("consultMessage").value.trim();
  if (!name || !phone || !message) return;

  try {
    consultError.classList.add("hidden");

    await addDoc(collection(db, "consultations"), {
      name,
      phone,
      message,
      createdAt: Date.now(),
      status: "신규",
    });

    consultForm.reset();
    consultForm.classList.add("hidden");
    consultSuccess.classList.remove("hidden");
  } catch (err) {
    consultError.classList.remove("hidden");
    console.error("Consultation submission error:", err);
  }
});
