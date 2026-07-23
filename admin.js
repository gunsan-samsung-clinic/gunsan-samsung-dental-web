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
  // Task 3~6에서 각 컬렉션 분기를 추가한다
}

async function handleDeleteClick(e) {
  const id = e.target.dataset.id;
  const col = e.target.dataset.collection;
  if (!confirm("정말 삭제하시겠습니까?")) return;
  await deleteDoc(doc(db, col, id));
  reloadTab(col);
}
