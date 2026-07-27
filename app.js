import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


console.log("2026-삭제테스트");

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}


/* =========================
   이벤트 목록
========================= */


async function loadEvents(){

    console.log("이벤트 실행");

    const eventList = document.getElementById("eventList");

    if(!eventList){
        console.log("eventList 없음");
        return;
    }

    eventList.innerHTML = "";

    const snapshot =
    await getDocs(collection(db,"events"));

    console.log("이벤트 개수 :", snapshot.size);

    const events = [];

    snapshot.forEach((doc)=>{
        events.push(doc.data());
    });

    // 이미지 있는 이벤트를 먼저, 글만 있는 이벤트를 그 아래에 보여준다
    const withImage = events.filter((data) => data.imageUrl);
    const textOnly = events.filter((data) => !data.imageUrl);

    [...withImage, ...textOnly].forEach((data) => {

        console.log(data);

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

}
/* =========================
   병원소식 목록
========================= */

async function loadNews(){

    const newsList=document.getElementById("newsList");

    if(!newsList) return;

    newsList.innerHTML="";

    const snapshot=
    await getDocs(collection(db,"news"));

    snapshot.forEach((doc)=>{

        const data=doc.data();

        newsList.innerHTML+=`

        <div class="content-item">

            <h3>${escapeHtml(data.title)}</h3>

            <p>${escapeHtml(data.content)}</p>

        </div>

        `;

    });

}


/* =========================
   후기 목록
========================= */

async function loadReviews(){

    const reviewList=document.getElementById("reviewList");

    if(!reviewList) return;

    reviewList.innerHTML="";

    const snapshot=
    await getDocs(collection(db,"reviews"));

    snapshot.forEach((doc)=>{

        const data=doc.data();

        if(data.status === "대기중") return;

        reviewList.innerHTML+=`

        <div class="content-item">

            <strong>${escapeHtml(data.writer)}</strong>

            <p>${escapeHtml(data.content)}</p>

        </div>

        `;

    });

}

loadEvents();

loadNews();

loadReviews();

/* =========================
   후기 남기기 (공개 홈페이지)
========================= */

const reviewForm = document.getElementById("reviewForm");
const reviewSuccess = document.getElementById("reviewSuccess");
const reviewError = document.getElementById("reviewError");

if (reviewForm) {
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
}



