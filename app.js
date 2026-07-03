import { db } from "./firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


console.log("2026-삭제테스트");


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

    snapshot.forEach((doc)=>{

        const data = doc.data();

        console.log(data);

        eventList.innerHTML += `

        <div class="event-card">

            <img
            src="event1.png"
            class="event-image">

            <div class="event-text">

                <h3>${data.title}</h3>

                <p>${data.content}</p>

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

            <h3>${data.title}</h3>

            <p>${data.content}</p>

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

        reviewList.innerHTML+=`

        <div class="content-item">

            <strong>${data.writer}</strong>

            <p>${data.content}</p>

        </div>

        `;

    });

}

loadEvents();

loadNews();

loadReviews();



