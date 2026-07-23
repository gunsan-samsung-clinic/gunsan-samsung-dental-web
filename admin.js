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
    loadNewsAdmin();
    loadReviewsAdmin();
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
  if (col === "news") loadNewsAdmin();
  if (col === "reviews") loadReviewsAdmin();
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
  if (!title || !content) return;
  await addDoc(collection(db, "events"), { title, content });
  eventForm.reset();
  loadEventsAdmin();
});

async function loadEventsAdmin() {
  eventAdminList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "events"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    eventAdminList.innerHTML += `
      <div class="list-item">
        <div><h3>${data.title}</h3><p>${data.content}</p></div>
        <button class="btn-danger" data-id="${docSnap.id}" data-collection="events">삭제</button>
      </div>
    `;
  });
  eventAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
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
  const snapshot = await getDocs(collection(db, "news"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    newsAdminList.innerHTML += `
      <div class="list-item">
        <div><h3>${data.title}</h3><p>${data.content}</p></div>
        <button class="btn-danger" data-id="${docSnap.id}" data-collection="news">삭제</button>
      </div>
    `;
  });
  newsAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
}

/* ========== 후기 ========== */

const reviewForm = document.getElementById("reviewForm");
const reviewAdminList = document.getElementById("reviewAdminList");

reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const writer = document.getElementById("reviewWriter").value.trim();
  const content = document.getElementById("reviewContent").value.trim();
  if (!writer || !content) return;
  await addDoc(collection(db, "reviews"), { writer, content });
  reviewForm.reset();
  loadReviewsAdmin();
});

async function loadReviewsAdmin() {
  reviewAdminList.innerHTML = "";
  const snapshot = await getDocs(collection(db, "reviews"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    reviewAdminList.innerHTML += `
      <div class="list-item">
        <div><strong>${data.writer}</strong><p>${data.content}</p></div>
        <button class="btn-danger" data-id="${docSnap.id}" data-collection="reviews">삭제</button>
      </div>
    `;
  });
  reviewAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
}
