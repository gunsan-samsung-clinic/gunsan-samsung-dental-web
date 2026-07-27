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

/* ========== 이벤트 ========== */

async function loadEvents() {
  const eventList = document.getElementById("eventList");
  eventList.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "events"));
    const events = [];
    snapshot.forEach((docSnap) => events.push(docSnap.data()));

    // 이미지 있는 이벤트를 먼저, 글만 있는 이벤트를 그 아래에 보여준다
    const withImage = events.filter((data) => data.imageUrl);
    const textOnly = events.filter((data) => !data.imageUrl);

    [...withImage, ...textOnly].forEach((data) => {
      const imageTag = data.imageUrl
        ? `<img src="${escapeHtml(data.imageUrl)}" class="event-image">`
        : "";

      eventList.innerHTML += `
        <div class="event-card">
          ${imageTag}
          <div class="event-text">
            <h3>${escapeHtml(data.title)}</h3>
            <p>${escapeHtml(data.content)}</p>
          </div>
        </div>
      `;
    });

    if (events.length === 0) {
      eventList.innerHTML = "<p>현재 진행 중인 이벤트가 없습니다.</p>";
    }
  } catch (err) {
    eventList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
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

/* ========== 질의문답 ========== */

async function loadQuestions() {
  const questionList = document.getElementById("questionList");
  questionList.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "questions"));
    let shown = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status !== "답변완료") return;

      shown++;
      questionList.innerHTML += `
        <div class="content-item">
          <p><strong>Q.</strong> ${escapeHtml(data.question)}</p>
          <p><strong>A.</strong> ${escapeHtml(data.answer)}</p>
        </div>
      `;
    });

    if (shown === 0) {
      questionList.innerHTML = "<p>등록된 질의문답이 없습니다.</p>";
    }
  } catch (err) {
    questionList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

loadEvents();
loadBenefits();
loadAftercare();
loadQuestions();

/* ========== 후기 남기기 ========== */

const reviewForm = document.getElementById("reviewForm");
const reviewSuccess = document.getElementById("reviewSuccess");
const reviewError = document.getElementById("reviewError");

reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const writer = document.getElementById("reviewWriter").value.trim();
  const content = document.getElementById("reviewContent").value.trim();
  if (!writer || !content) return;

  try {
    reviewError.classList.add("hidden");

    await addDoc(collection(db, "reviews"), {
      writer,
      content,
      status: "대기중",
    });

    reviewForm.reset();
    reviewForm.classList.add("hidden");
    reviewSuccess.classList.remove("hidden");
  } catch (err) {
    reviewError.classList.remove("hidden");
    console.error("Review submission error:", err);
  }
});

/* ========== 질문 남기기 ========== */

const questionForm = document.getElementById("questionForm");
const questionSuccess = document.getElementById("questionSuccess");
const questionError = document.getElementById("questionError");

questionForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = document.getElementById("questionText").value.trim();
  if (!question) return;

  try {
    questionError.classList.add("hidden");

    await addDoc(collection(db, "questions"), {
      question,
      status: "대기중",
    });

    questionForm.reset();
    questionForm.classList.add("hidden");
    questionSuccess.classList.remove("hidden");
  } catch (err) {
    questionError.classList.remove("hidden");
    console.error("Question submission error:", err);
  }
});

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
