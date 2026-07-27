import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ========== 로그인 / 로그아웃 ========== */

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = "로그인에 실패했습니다. 이메일/비밀번호를 확인하세요.";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add("hidden");
    adminSection.classList.remove("hidden");
    loadEventsAdmin();
    loadReelsAdmin();
    loadNewsAdmin();
    loadReviewsAdmin();
    loadBenefitsAdmin();
    loadAftercareAdmin();
    loadConsultationsAdmin();
    loadQuestionsAdmin();
  } else {
    loginSection.classList.remove("hidden");
    adminSection.classList.add("hidden");
  }
});

/* ========== 탭 전환 ========== */

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
  });
});

/* ========== 공용 삭제 처리 (Task 3부터 각 목록에서 사용) ========== */

function reloadTab(col) {
  if (col === "events") loadEventsAdmin();
  if (col === "reels") loadReelsAdmin();
  if (col === "news") loadNewsAdmin();
  if (col === "reviews") loadReviewsAdmin();
  if (col === "benefits") loadBenefitsAdmin();
  if (col === "aftercare") loadAftercareAdmin();
  if (col === "consultations") loadConsultationsAdmin();
  if (col === "questions") loadQuestionsAdmin();
}

async function handleDeleteClick(e) {
  const id = e.target.dataset.id;
  const col = e.target.dataset.collection;
  if (!confirm("정말 삭제하시겠습니까?")) return;
  await deleteDoc(doc(db, col, id));
  reloadTab(col);
}

/* ========== 이벤트 ========== */

const eventForm = document.getElementById("eventForm");
const eventAdminList = document.getElementById("eventAdminList");

eventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("eventTitle").value.trim();
  const content = document.getElementById("eventContent").value.trim();
  const imageUrl = document.getElementById("eventImageUrl").value.trim();
  if (!title || !content) return;
  await addDoc(collection(db, "events"), { title, content, imageUrl: imageUrl || null });
  eventForm.reset();
  loadEventsAdmin();
});

async function loadEventsAdmin() {
  eventAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "events"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const thumb = data.imageUrl
        ? `<img src="${escapeHtml(data.imageUrl)}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">`
        : "";
      eventAdminList.innerHTML += `
        <div class="list-item">
          <div style="display:flex;gap:12px;align-items:flex-start;">
            ${thumb}
            <div><h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.content)}</p></div>
          </div>
          <button class="btn-danger" data-id="${docSnap.id}" data-collection="events">삭제</button>
        </div>
      `;
    });
    eventAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
  } catch (err) {
    eventAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

/* ========== 릴스 ========== */

const reelForm = document.getElementById("reelForm");
const reelAdminList = document.getElementById("reelAdminList");

reelForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const videoUrl = document.getElementById("reelVideoUrl").value.trim();
  const order = Number(document.getElementById("reelOrder").value) || 0;
  if (!videoUrl) return;

  await addDoc(collection(db, "reels"), { videoUrl, order });
  reelForm.reset();
  loadReelsAdmin();
});

async function loadReelsAdmin() {
  reelAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "reels"));
    const items = [];
    snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    items.forEach((data) => {
      reelAdminList.innerHTML += `
        <div class="list-item">
          <div><h3>${escapeHtml(data.videoUrl)} (순서 ${data.order})</h3></div>
          <button class="btn-danger" data-id="${data.id}" data-collection="reels">삭제</button>
        </div>
      `;
    });
    reelAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
  } catch (err) {
    reelAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

/* ========== 공지사항 ========== */

const newsForm = document.getElementById("newsForm");
const newsAdminList = document.getElementById("newsAdminList");

newsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("newsTitle").value.trim();
  const content = document.getElementById("newsContent").value.trim();
  if (!title || !content) return;
  await addDoc(collection(db, "news"), { title, content });
  newsForm.reset();
  loadNewsAdmin();
});

async function loadNewsAdmin() {
  newsAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "news"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      newsAdminList.innerHTML += `
        <div class="list-item">
          <div><h3>${escapeHtml(data.title)}</h3><p>${escapeHtml(data.content)}</p></div>
          <button class="btn-danger" data-id="${docSnap.id}" data-collection="news">삭제</button>
        </div>
      `;
    });
    newsAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
  } catch (err) {
    newsAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

/* ========== 후기 ========== */

const reviewForm = document.getElementById("reviewForm");
const reviewAdminList = document.getElementById("reviewAdminList");

reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const writer = document.getElementById("reviewWriter").value.trim();
  const content = document.getElementById("reviewContent").value.trim();
  if (!writer || !content) return;
  await addDoc(collection(db, "reviews"), { writer, content, status: "공개" });
  reviewForm.reset();
  loadReviewsAdmin();
});

async function loadReviewsAdmin() {
  reviewAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "reviews"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isPending = data.status === "대기중";
      reviewAdminList.innerHTML += `
        <div class="list-item">
          <div>
            <span class="status-badge ${isPending ? "status-new" : "status-done"}">${isPending ? "대기중" : "공개"}</span>
            <strong>${escapeHtml(data.writer)}</strong>
            <p>${escapeHtml(data.content)}</p>
          </div>
          <div class="list-item-actions">
            ${isPending ? `<button class="btn-check" data-id="${docSnap.id}">공개하기</button>` : ""}
            <button class="btn-danger" data-id="${docSnap.id}" data-collection="reviews">삭제</button>
          </div>
        </div>
      `;
    });
    reviewAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
    reviewAdminList.querySelectorAll(".btn-check").forEach((btn) => btn.addEventListener("click", handlePublishReview));
  } catch (err) {
    reviewAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

async function handlePublishReview(e) {
  const id = e.target.dataset.id;
  await updateDoc(doc(db, "reviews", id), { status: "공개" });
  loadReviewsAdmin();
}

/* ========== 혜택·쿠폰 ========== */

const benefitForm = document.getElementById("benefitForm");
const benefitAdminList = document.getElementById("benefitAdminList");

benefitForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("benefitTitle").value.trim();
  const description = document.getElementById("benefitDescription").value.trim();
  const startDate = document.getElementById("benefitStart").value;
  const endDate = document.getElementById("benefitEnd").value;
  const active = document.getElementById("benefitActive").checked;
  if (!title || !description || !startDate || !endDate) return;

  await addDoc(collection(db, "benefits"), { title, description, startDate, endDate, active });
  benefitForm.reset();
  document.getElementById("benefitActive").checked = true;
  loadBenefitsAdmin();
});

async function loadBenefitsAdmin() {
  benefitAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "benefits"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      benefitAdminList.innerHTML += `
        <div class="list-item">
          <div>
            <h3>${escapeHtml(data.title)} ${data.active ? "" : "(숨김)"}</h3>
            <p>${escapeHtml(data.description)}</p>
            <span class="benefit-period">${data.startDate} ~ ${data.endDate}</span>
          </div>
          <div class="list-item-actions">
            <button class="btn-toggle" data-id="${docSnap.id}" data-active="${data.active}">${data.active ? "숨기기" : "보이기"}</button>
            <button class="btn-danger" data-id="${docSnap.id}" data-collection="benefits">삭제</button>
          </div>
        </div>
      `;
    });
    benefitAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
    benefitAdminList.querySelectorAll(".btn-toggle").forEach((btn) => btn.addEventListener("click", handleToggleActive));
  } catch (err) {
    benefitAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

async function handleToggleActive(e) {
  const id = e.target.dataset.id;
  const nextActive = e.target.dataset.active !== "true";
  await updateDoc(doc(db, "benefits", id), { active: nextActive });
  loadBenefitsAdmin();
}

/* ========== 사후관리 안내 ========== */

const aftercareForm = document.getElementById("aftercareForm");
const aftercareAdminList = document.getElementById("aftercareAdminList");

aftercareForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const procedureName = document.getElementById("aftercareProcedure").value.trim();
  const content = document.getElementById("aftercareContent").value.trim();
  const order = Number(document.getElementById("aftercareOrder").value) || 0;
  if (!procedureName || !content) return;

  await addDoc(collection(db, "aftercare"), { procedureName, content, order });
  aftercareForm.reset();
  loadAftercareAdmin();
});

async function loadAftercareAdmin() {
  aftercareAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "aftercare"));
    const items = [];
    snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    items.forEach((data) => {
      aftercareAdminList.innerHTML += `
        <div class="list-item">
          <div><h3>${escapeHtml(data.procedureName)} (순서 ${data.order})</h3><p>${escapeHtml(data.content)}</p></div>
          <button class="btn-danger" data-id="${data.id}" data-collection="aftercare">삭제</button>
        </div>
      `;
    });
    aftercareAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
  } catch (err) {
    aftercareAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

/* ========== 상담 신청함 ========== */

const consultationAdminList = document.getElementById("consultationAdminList");

async function loadConsultationsAdmin() {
  consultationAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "consultations"));
    const items = [];
    snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
    items.sort((a, b) => b.createdAt - a.createdAt);

    items.forEach((data) => {
      const isChecked = data.status === "확인완료";
      consultationAdminList.innerHTML += `
        <div class="list-item">
          <div>
            <span class="status-badge ${isChecked ? "status-done" : "status-new"}">${isChecked ? "확인완료" : "신규"}</span>
            <h3>${escapeHtml(data.name)} (${escapeHtml(data.phone)})</h3>
            <p>${escapeHtml(data.message)}</p>
          </div>
          <div class="list-item-actions">
            ${isChecked ? "" : `<button class="btn-check" data-id="${data.id}">확인완료로 표시</button>`}
            <button class="btn-danger" data-id="${data.id}" data-collection="consultations">삭제</button>
          </div>
        </div>
      `;
    });

    consultationAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
    consultationAdminList.querySelectorAll(".btn-check").forEach((btn) => btn.addEventListener("click", handleMarkChecked));
  } catch (err) {
    consultationAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

async function handleMarkChecked(e) {
  const id = e.target.dataset.id;
  await updateDoc(doc(db, "consultations", id), { status: "확인완료" });
  loadConsultationsAdmin();
}

/* ========== 질의문답 ========== */

const questionAdminList = document.getElementById("questionAdminList");

async function loadQuestionsAdmin() {
  questionAdminList.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, "questions"));
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isAnswered = data.status === "답변완료";
      questionAdminList.innerHTML += `
        <div class="list-item">
          <div style="flex:1;">
            <span class="status-badge ${isAnswered ? "status-done" : "status-new"}">${isAnswered ? "답변완료" : "대기중"}</span>
            <p><strong>Q.</strong> ${escapeHtml(data.question)}</p>
            ${isAnswered
              ? `<p><strong>A.</strong> ${escapeHtml(data.answer)}</p>`
              : `
                <textarea id="answerInput-${docSnap.id}" placeholder="답변을 입력하세요"></textarea>
                <button class="btn-check" data-id="${docSnap.id}">답변 등록</button>
              `}
          </div>
          <button class="btn-danger" data-id="${docSnap.id}" data-collection="questions">삭제</button>
        </div>
      `;
    });
    questionAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
    questionAdminList.querySelectorAll(".btn-check").forEach((btn) => btn.addEventListener("click", handleAnswerSubmit));
  } catch (err) {
    questionAdminList.innerHTML = "<p>정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>";
  }
}

async function handleAnswerSubmit(e) {
  const id = e.target.dataset.id;
  const answer = document.getElementById(`answerInput-${id}`).value.trim();
  if (!answer) return;
  await updateDoc(doc(db, "questions", id), { answer, status: "답변완료" });
  loadQuestionsAdmin();
}
