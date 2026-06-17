import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

console.log("2026-삭제테스트");

const loginBtn =
document.getElementById("loginBtn");

const logoutBtn =
document.getElementById("logoutBtn");

const eventAdmin =
document.getElementById("eventAdmin");

const newsAdmin =
document.getElementById("newsAdmin");

eventAdmin.style.display = "none";
newsAdmin.style.display = "none";

const adminBtn =
document.getElementById("adminBtn");

const adminLogin =
document.querySelector(".admin-login");

if(adminLogin){
  adminLogin.style.display = "none";
}

if(adminBtn){

  adminBtn.addEventListener("click", () => {

    if(adminLogin.style.display === "none"){

      adminLogin.style.display = "block";

    } else {

      adminLogin.style.display = "none";

    }

  });

}

/* =========================
   이벤트 저장
========================= */

const saveBtn = document.getElementById("saveEvent");

saveBtn.addEventListener("click", async () => {

  const title =
    document.getElementById("eventTitle").value;

  const content =
    document.getElementById("eventContent").value;

  try {

   const image =
document.getElementById("eventImage").value;


await addDoc(
collection(db,"events"),
{
 image,
 title,
 content,
 createdAt:new Date()
}
)
    );

    alert("이벤트 저장 완료");

    loadEvents();

    document.getElementById("eventTitle").value = "";
    document.getElementById("eventContent").value = "";

  } catch (err) {

    console.error(err);

  }

/* =========================
   이벤트 목록
========================= */

async function loadEvents() {

loadEvents();

/* =========================
   병원소식 저장
========================= */

const saveNewsBtn =
  document.getElementById("saveNews");

if (saveNewsBtn) {

  saveNewsBtn.addEventListener("click", async () => {

    const title =
      document.getElementById("newsTitle").value;

    const content =
      document.getElementById("newsContent").value;

    try {

      await addDoc(
        collection(db, "news"),
        {
          title,
          content,
          createdAt: new Date()
        }
      );

      alert("소식 저장 완료");

      loadNews();

      document.getElementById("newsTitle").value = "";
      document.getElementById("newsContent").value = "";

    } catch (err) {

      console.error(err);

    }

  });

}

/* =========================
   병원소식 목록
========================= */

async function loadNews() {

  const newsList =
    document.getElementById("newsList");

  if (!newsList) return;

  newsList.innerHTML = "";

  const querySnapshot =
    await getDocs(collection(db, "news"));

  querySnapshot.forEach((newsDoc) => {

    const data = newsDoc.data();

 console.log(data);
    
    newsList.innerHTML += `
      <div>
        <h4>${data.title}</h4>
        <p>${data.content}</p>
        <hr>
      </div>
    `;

  });

}

loadNews();

/* =========================
   환자 후기 저장
========================= */

const reviewBtn =
  document.getElementById("reviewBtn");

if (reviewBtn) {

  reviewBtn.addEventListener("click", async () => {

    const writer =
      document.getElementById("reviewWriter").value;

    const content =
      document.getElementById("reviewText").value;

    try {

      await addDoc(
        collection(db, "reviews"),
        {
          writer,
          content,
          createdAt: new Date()
        }
      );

      alert("후기 등록 완료");

      loadReviews();

      document.getElementById("reviewWriter").value = "";
      document.getElementById("reviewText").value = "";

    } catch (err) {

      console.error(err);

    }

  });

}

/* =========================
   후기 목록
========================= */

async function loadReviews() {

console.log("후기 불러오기 실행");
  
  const reviewList =
    document.getElementById("reviewList");

  if (!reviewList) return;

  reviewList.innerHTML = "";

const isAdmin = auth.currentUser !== null;
  
  const querySnapshot =
    await getDocs(collection(db, "reviews"));

 let html = "";

querySnapshot.forEach((reviewDoc)=>{

  const data = reviewDoc.data();

  html += `
  <div>
    <strong>${data.writer}</strong>
    <p>${data.content}</p>

    ${isAdmin ? `
    <button onclick="deleteReview('${reviewDoc.id}')">
      삭제
    </button>
    ` : ""}

    <hr>

  </div>
  `;

});

reviewList.innerHTML = html;
}

/* =========================
   환자 메모 저장
========================= */

const memoBtn =
  document.getElementById("memoBtn");

if (memoBtn) {

  memoBtn.addEventListener("click", async () => {

    const writer =
      document.getElementById("memoWriter").value;

    const memo =
      document.getElementById("memoText").value;

    try {

      await addDoc(
        collection(db, "memos"),
        {
          writer,
          memo,
          createdAt: new Date()
        }
      );

      alert("메모 등록 완료");

      loadMemos();

      document.getElementById("memoWriter").value = "";
      document.getElementById("memoText").value = "";

    } catch (err) {

      console.error(err);

    }

  });

}

/* =========================
   메모 목록
========================= */

async function loadMemos() {

console.log("메모 불러오기 실행");
  
  const memoList =
    document.getElementById("memoList");

  if (!memoList) return;

  memoList.innerHTML = "";

const isAdmin = auth.currentUser;
  
  const querySnapshot =
    await getDocs(collection(db, "memos"));

  querySnapshot.forEach((memoDoc) => {

    const data = memoDoc.data();

    memoList.innerHTML += `
  <div>
    <strong>${data.writer}</strong>
    <p>${data.memo}</p>

    ${isAdmin ? `
    <button onclick="deleteMemo('${memoDoc.id}')">
      삭제
    </button>
    ` : ""}

    <hr>
  </div>
`;

  });

}

/* =========================
   로그인
========================= */

loginBtn.addEventListener(
"click",
async () => {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("로그인 성공");

if(adminLogin){
  adminLogin.style.display = "none";
}
    
  } catch(err) {

  alert(err.message);

  console.error(err);

}

});

/* =========================
   로그아웃
========================= */

logoutBtn.addEventListener(
"click",
async () => {

  await signOut(auth);

  alert("로그아웃");

});

/* =========================
   로그인 상태
========================= */



window.deleteReview = async function(id) {

if (!auth.currentUser) {

  alert("관리자만 삭제 가능합니다.");
  return;

}
  
  const ok =
    confirm("정말 삭제하시겠습니까?");

  if (!ok) return;

  try {

    await deleteDoc(
      doc(db, "reviews", id)
    );

    alert("삭제 완료");

    loadReviews();

  } catch (err) {

    console.error(err);

  }

};

window.deleteMemo = async function(id) {

  if (!auth.currentUser) {

    alert("관리자만 삭제 가능합니다.");
    return;

  }

  const ok = confirm("정말 삭제하시겠습니까?");

  if (!ok) return;

  try {

    await deleteDoc(
      doc(db, "memos", id)
    );

    alert("삭제 완료");

    loadMemos();

  } catch (err) {

    console.error(err);

  }

};

onAuthStateChanged(auth, (user) => {

  console.log("===========");
  console.log("현재 사용자:", user);
  console.log("===========");

  if(user){

    console.log("로그인 이메일:", user.email);

    eventAdmin.style.display = "block";
    newsAdmin.style.display = "block";

    if(adminBtn){
      adminBtn.textContent = "관리자 로그인됨";
    }

  } else {

    eventAdmin.style.display = "none";
    newsAdmin.style.display = "none";

    if(adminBtn){
      adminBtn.textContent = "관리자";
    }

  }

  loadReviews();
  loadMemos();

});
