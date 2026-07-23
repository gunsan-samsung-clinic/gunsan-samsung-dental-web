# 고객 전용 페이지 & 어드민 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 군산 삼성치과 웹사이트에 (1) 고객 전용 혜택/사후관리/상담 페이지와 (2) 병원 직원이 직접 콘텐츠를 관리할 수 있는 어드민 페이지를 추가한다.

**Architecture:** 기존 vanilla HTML/CSS/JS + Firebase(Firestore, Auth) 구조를 그대로 확장한다. 새 정적 페이지 `customer.html`/`admin.html`과 그 전용 스크립트 `customer.js`/`admin.js`를 추가하고, `firestore.rules`로 보안 규칙을 코드화한다. 빌드 도구나 프레임워크는 추가하지 않는다.

**Tech Stack:** HTML/CSS/JavaScript(ES modules), Firebase Firestore + Firebase Auth (CDN `https://www.gstatic.com/firebasejs/12.4.0/...`, 기존 `firebase.js`와 동일 버전), GitHub Pages 배포.

## Global Constraints

- 빌드 도구, 프레임워크, 로우코드 어드민 툴을 새로 도입하지 않는다 (스펙의 "기술 접근 방식" 절).
- 이 저장소에는 테스트 자동화 도구(Node 테스트 러너, Firebase 에뮬레이터 등)가 없고 새로 추가하지 않는다. 각 태스크의 검증은 로컬 정적 서버(`python -m http.server`)로 페이지를 열어 브라우저에서 직접 확인하는 수동 절차로 대체한다. `firestore.rules`는 Firebase 콘솔의 Rules Playground로 수동 검증한다.
- 고객 전용 페이지(`customer.html`)는 로그인 없이 접근 가능하되 `<meta name="robots" content="noindex, nofollow">`를 적용하고, `index.html`에는 이 페이지로 가는 링크를 추가하지 않는다.
- 상담 신청은 Firestore `consultations` 컬렉션에 저장하고 어드민 화면에서만 확인한다. 이메일 등 외부 서비스 연동은 추가하지 않는다.
- 사후관리 안내는 정적 콘텐츠로만 제공하고, 자동 발송 알림(문자/카카오톡/푸시)은 구현하지 않는다.
- 다른 병원 대상 재사용성(멀티테넌트 구조)은 고려하지 않는다.
- 어드민 화면의 모든 라벨/버튼 텍스트는 한글, 전문용어 없이 직관적으로 작성한다. 삭제 동작은 `confirm()`으로 확인받는다.
- 기존 파일(`app.js`, `firebase.js`, `index.html`)의 기존 동작은 변경하지 않는다.

---

### Task 1: Firestore 보안 규칙

**Files:**
- Create: `firestore.rules`

**Interfaces:**
- Produces: `events`/`news`/`reviews`/`benefits`/`aftercare` 컬렉션은 누구나 읽기, 로그인 사용자만 쓰기 가능. `consultations`는 누구나 생성만 가능(정해진 5개 필드), 로그인 사용자만 읽기/수정/삭제 가능. 이후 모든 태스크는 이 규칙을 전제로 Firestore를 읽고 쓴다.

- [ ] **Step 1: `firestore.rules` 작성**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /events/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /news/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /reviews/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /benefits/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /aftercare/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /consultations/{id} {
      allow create: if request.resource.data.keys().hasOnly(['name', 'phone', 'message', 'createdAt', 'status'])
                    && request.resource.data.name is string
                    && request.resource.data.phone is string
                    && request.resource.data.message is string
                    && request.resource.data.status == '신규';
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

- [ ] **Step 2: Firebase 콘솔에 규칙 배포**

Firebase 콘솔(`console.firebase.google.com`) → 프로젝트 `gunsan-samsung-dental-cl-d67b5` → Firestore Database → **규칙(Rules)** 탭 → 위 내용을 그대로 붙여넣고 **게시(Publish)**.

- [ ] **Step 3: Rules Playground로 수동 검증**

같은 화면의 **Playground**에서 아래 6가지를 각각 시뮬레이션하고 결과를 확인한다.

| # | 유형 | 위치 | 인증 | 데이터 | 기대 결과 |
|---|---|---|---|---|---|
| 1 | get | `/databases/(default)/documents/events/e1` | 비인증 | - | **허용** |
| 2 | create | `/databases/(default)/documents/events/e1` | 비인증 | `{"title":"t","content":"c"}` | **거부** |
| 3 | create | `/databases/(default)/documents/events/e1` | 인증(임의 uid) | `{"title":"t","content":"c"}` | **허용** |
| 4 | create | `/databases/(default)/documents/consultations/c1` | 비인증 | `{"name":"홍길동","phone":"010-0000-0000","message":"문의","createdAt":1,"status":"신규"}` | **허용** |
| 5 | get | `/databases/(default)/documents/consultations/c1` | 비인증 | - | **거부** |
| 6 | get | `/databases/(default)/documents/consultations/c1` | 인증(임의 uid) | - | **허용** |

6가지 모두 기대 결과와 일치해야 다음 태스크로 진행한다.

- [ ] **Step 4: 커밋**

```bash
git add firestore.rules
git commit -m "Add Firestore security rules for customer portal collections"
```

---

### Task 2: 어드민 로그인/로그아웃 셸

**Files:**
- Create: `admin.html`
- Create: `admin.js`
- Modify: `style.css` (파일 끝에 추가)

**Interfaces:**
- Consumes: `firebase.js`가 내보내는 `auth`, `db` (기존 파일, 변경 없음).
- Produces: `admin.js`의 `handleDeleteClick(event)`, `reloadTab(collectionName)` — Task 3부터 재사용. DOM에 `#loginSection`, `#adminSection`, `.tab-btn`, `.tab-panel` 구조 — Task 3~6이 그 안에 패널을 추가한다.

- [ ] **Step 1: `admin.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>군산 삼성치과 - 관리자</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<div id="loginSection">
  <h1>관리자 로그인</h1>
  <input type="email" id="loginEmail" placeholder="이메일">
  <input type="password" id="loginPassword" placeholder="비밀번호">
  <button id="loginBtn">로그인</button>
  <p id="loginError" class="error-text"></p>
</div>

<div id="adminSection" class="hidden">
  <header class="admin-header">
    <h1>군산 삼성치과 관리자</h1>
    <button id="logoutBtn">로그아웃</button>
  </header>

  <nav class="admin-tabs">
    <button class="tab-btn active" data-tab="events">이벤트</button>
    <button class="tab-btn" data-tab="news">공지사항</button>
    <button class="tab-btn" data-tab="reviews">후기</button>
    <button class="tab-btn" data-tab="benefits">혜택·쿠폰</button>
    <button class="tab-btn" data-tab="aftercare">사후관리 안내</button>
    <button class="tab-btn" data-tab="consultations">상담 신청함</button>
  </nav>

  <!-- 각 태스크가 아래에 순서대로 tab-panel을 추가한다 -->

</div>

<script type="module" src="admin.js"></script>
</body>
</html>
```

- [ ] **Step 2: `admin.js` 작성 (로그인/로그아웃 + 탭 전환)**

```js
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
```

- [ ] **Step 3: `style.css` 끝에 추가**

```css
/* ===== 관리자 공통 ===== */

.hidden {
  display: none !important;
}

#loginSection {
  max-width: 320px;
  margin: 80px auto;
  padding: 24px;
  text-align: center;
}

#loginSection input {
  display: block;
  width: 100%;
  margin: 8px 0;
  padding: 10px;
  box-sizing: border-box;
}

.error-text {
  color: #c0392b;
  font-size: 14px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #ddd;
}

.admin-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 24px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: #f5f5f5;
  cursor: pointer;
}

.tab-btn.active {
  background: #333;
  color: #fff;
}

.tab-panel {
  padding: 0 24px 40px;
}
```

- [ ] **Step 4: 수동 검증**

```bash
cd "C:\Users\human\Desktop\gunsan-samsung-dental-web"
python -m http.server 5500
```

브라우저에서 `http://localhost:5500/admin.html` 접속.

- 처음에는 로그인 화면만 보이고 관리 화면(`#adminSection`)은 안 보여야 한다.
- 잘못된 이메일/비밀번호 입력 → "로그인에 실패했습니다..." 메시지가 떠야 한다.
- 이미 만들어둔 관리자 계정으로 로그인 → 로그인 화면이 사라지고 상단에 "군산 삼성치과 관리자" 헤더와 6개 탭 버튼이 보여야 한다.
- "이벤트" 외 다른 탭 버튼을 눌러도 지금은 패널이 비어있는 게 정상이다 (Task 3~6에서 채움). 탭 버튼을 누르면 `active` 스타일이 눌린 탭으로 이동해야 한다.
- "로그아웃" 클릭 → 다시 로그인 화면으로 돌아가야 한다.

- [ ] **Step 5: 커밋**

```bash
git add admin.html admin.js style.css
git commit -m "Add admin login shell with Firebase Auth"
```

---

### Task 3: 어드민 - 기존 콘텐츠 관리 (이벤트/공지/후기)

**Files:**
- Modify: `admin.html` (tab-panel 3개 추가)
- Modify: `admin.js` (CRUD 함수 추가, `reloadTab`/`onAuthStateChanged` 수정)
- Modify: `style.css` (목록/폼 스타일 추가)

**Interfaces:**
- Consumes: Task 2의 `handleDeleteClick`, `reloadTab`, `onAuthStateChanged`.
- Produces: `loadEventsAdmin()`, `loadNewsAdmin()`, `loadReviewsAdmin()` — Task 6까지 `reloadTab`에서 계속 참조.

- [ ] **Step 1: `admin.html`의 `<!-- 각 태스크가... -->` 주석을 아래로 교체**

```html
  <section id="tab-events" class="tab-panel">
    <h2>이벤트 관리</h2>
    <form id="eventForm" class="admin-form">
      <input type="text" id="eventTitle" placeholder="이벤트 제목" required>
      <textarea id="eventContent" placeholder="이벤트 내용" required></textarea>
      <button type="submit">이벤트 추가</button>
    </form>
    <div id="eventAdminList" class="admin-list"></div>
  </section>

  <section id="tab-news" class="tab-panel hidden">
    <h2>공지사항 관리</h2>
    <form id="newsForm" class="admin-form">
      <input type="text" id="newsTitle" placeholder="공지 제목" required>
      <textarea id="newsContent" placeholder="공지 내용" required></textarea>
      <button type="submit">공지 추가</button>
    </form>
    <div id="newsAdminList" class="admin-list"></div>
  </section>

  <section id="tab-reviews" class="tab-panel hidden">
    <h2>후기 관리</h2>
    <form id="reviewForm" class="admin-form">
      <input type="text" id="reviewWriter" placeholder="작성자" required>
      <textarea id="reviewContent" placeholder="후기 내용" required></textarea>
      <button type="submit">후기 추가</button>
    </form>
    <div id="reviewAdminList" class="admin-list"></div>
  </section>

  <!-- Task 4가 여기 아래에 혜택·쿠폰 패널을 추가한다 -->
```

- [ ] **Step 2: `admin.js`의 `reloadTab` 함수를 아래로 교체**

```js
function reloadTab(col) {
  if (col === "events") loadEventsAdmin();
  if (col === "news") loadNewsAdmin();
  if (col === "reviews") loadReviewsAdmin();
}
```

- [ ] **Step 3: `admin.js`의 `onAuthStateChanged` 콜백 안, `if (user) {` 블록 마지막 줄(`adminSection.classList.remove("hidden");`) 다음에 추가**

```js
    loadEventsAdmin();
    loadNewsAdmin();
    loadReviewsAdmin();
```

- [ ] **Step 4: `admin.js` 파일 끝에 CRUD 함수 추가**

```js
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
```

- [ ] **Step 5: `style.css` 끝에 추가**

```css
.admin-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 480px;
  margin-bottom: 24px;
}

.admin-form input,
.admin-form textarea {
  padding: 10px;
  font: inherit;
}

.admin-form button[type="submit"] {
  align-self: flex-start;
  padding: 8px 16px;
  cursor: pointer;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 12px;
  border: 1px solid #ddd;
}

.btn-danger {
  background: #c0392b;
  color: #fff;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
}
```

- [ ] **Step 6: 수동 검증**

`python -m http.server 5500`으로 서버를 띄우고 `http://localhost:5500/admin.html`에서 관리자 로그인 후:

- "이벤트" 탭에서 제목/내용 입력 후 "이벤트 추가" → 목록에 바로 나타나야 한다. `http://localhost:5500/index.html`을 새로고침해서 "🎁 이벤트" 섹션에도 같은 항목이 보여야 한다 (기존 `app.js`가 같은 컬렉션을 읽으므로).
- "공지사항", "후기" 탭에서도 각각 추가 → 두 항목 다 목록에 나타나고, `index.html`의 해당 섹션에도 반영되어야 한다.
- 아무 항목이나 "삭제" 클릭 → 확인창이 뜨고, 확인하면 목록에서 사라져야 한다. 취소를 누르면 안 지워져야 한다.

- [ ] **Step 7: 커밋**

```bash
git add admin.html admin.js style.css
git commit -m "Add admin CRUD for events, news, and reviews"
```

---

### Task 4: 어드민 - 혜택·쿠폰 관리

**Files:**
- Modify: `admin.html` (tab-panel 추가)
- Modify: `admin.js` (`reloadTab`/`onAuthStateChanged` 수정, CRUD 함수 추가)
- Modify: `style.css`

**Interfaces:**
- Consumes: Task 2/3의 `handleDeleteClick`, `reloadTab`.
- Produces: `loadBenefitsAdmin()` — Task 7의 고객 페이지가 같은 `benefits` 컬렉션 스키마(`title`, `description`, `startDate`, `endDate`, `active`)를 그대로 읽는다.

- [ ] **Step 1: `admin.html`의 `<!-- Task 4가... -->` 주석을 아래로 교체**

```html
  <section id="tab-benefits" class="tab-panel hidden">
    <h2>혜택·쿠폰 관리</h2>
    <form id="benefitForm" class="admin-form">
      <input type="text" id="benefitTitle" placeholder="혜택 제목" required>
      <textarea id="benefitDescription" placeholder="혜택 설명" required></textarea>
      <label>시작일 <input type="date" id="benefitStart" required></label>
      <label>종료일 <input type="date" id="benefitEnd" required></label>
      <label><input type="checkbox" id="benefitActive" checked> 고객 페이지에 보이기</label>
      <button type="submit">혜택 추가</button>
    </form>
    <div id="benefitAdminList" class="admin-list"></div>
  </section>

  <!-- Task 5가 여기 아래에 사후관리 안내 패널을 추가한다 -->
```

- [ ] **Step 2: `admin.js`의 `reloadTab` 함수를 아래로 교체**

```js
function reloadTab(col) {
  if (col === "events") loadEventsAdmin();
  if (col === "news") loadNewsAdmin();
  if (col === "reviews") loadReviewsAdmin();
  if (col === "benefits") loadBenefitsAdmin();
}
```

- [ ] **Step 3: `admin.js`의 `onAuthStateChanged` 안 `loadReviewsAdmin();` 다음 줄에 추가**

```js
    loadBenefitsAdmin();
```

- [ ] **Step 4: `admin.js` 파일 끝에 추가**

```js
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
  const snapshot = await getDocs(collection(db, "benefits"));
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    benefitAdminList.innerHTML += `
      <div class="list-item">
        <div>
          <h3>${data.title} ${data.active ? "" : "(숨김)"}</h3>
          <p>${data.description}</p>
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
}

async function handleToggleActive(e) {
  const id = e.target.dataset.id;
  const nextActive = e.target.dataset.active !== "true";
  await updateDoc(doc(db, "benefits", id), { active: nextActive });
  loadBenefitsAdmin();
}
```

- [ ] **Step 5: `style.css` 끝에 추가**

```css
.list-item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-toggle {
  background: #f5f5f5;
  border: 1px solid #ccc;
  padding: 6px 12px;
  cursor: pointer;
}

.benefit-period {
  font-size: 13px;
  color: #666;
}
```

- [ ] **Step 6: 수동 검증**

관리자 로그인 후 "혜택·쿠폰" 탭에서:

- 제목/설명/시작일/종료일을 입력하고 "혜택 추가" → 목록에 나타나야 한다.
- "숨기기" 클릭 → 버튼이 "보이기"로 바뀌고 제목 옆에 "(숨김)"이 붙어야 한다. 다시 "보이기" 클릭하면 원래대로 돌아와야 한다.
- "삭제" → 확인 후 목록에서 사라져야 한다.

- [ ] **Step 7: 커밋**

```bash
git add admin.html admin.js style.css
git commit -m "Add admin CRUD for customer benefits/coupons"
```

---

### Task 5: 어드민 - 사후관리 안내 관리

**Files:**
- Modify: `admin.html` (tab-panel 추가)
- Modify: `admin.js` (`reloadTab`/`onAuthStateChanged` 수정, CRUD 함수 추가)

**Interfaces:**
- Consumes: Task 2의 `handleDeleteClick`, `reloadTab`.
- Produces: `loadAftercareAdmin()` — Task 7의 고객 페이지가 같은 `aftercare` 컬렉션 스키마(`procedureName`, `content`, `order`)를 그대로 읽는다.

- [ ] **Step 1: `admin.html`의 `<!-- Task 5가... -->` 주석을 아래로 교체**

```html
  <section id="tab-aftercare" class="tab-panel hidden">
    <h2>사후관리 안내 관리</h2>
    <form id="aftercareForm" class="admin-form">
      <input type="text" id="aftercareProcedure" placeholder="시술명 (예: 임플란트)" required>
      <textarea id="aftercareContent" placeholder="관리 안내 내용" required></textarea>
      <input type="number" id="aftercareOrder" placeholder="표시 순서 (숫자, 작을수록 먼저)" value="0">
      <button type="submit">안내 추가</button>
    </form>
    <div id="aftercareAdminList" class="admin-list"></div>
  </section>

  <!-- Task 6이 여기 아래에 상담 신청함 패널을 추가한다 -->
```

- [ ] **Step 2: `admin.js`의 `reloadTab` 함수를 아래로 교체**

```js
function reloadTab(col) {
  if (col === "events") loadEventsAdmin();
  if (col === "news") loadNewsAdmin();
  if (col === "reviews") loadReviewsAdmin();
  if (col === "benefits") loadBenefitsAdmin();
  if (col === "aftercare") loadAftercareAdmin();
}
```

- [ ] **Step 3: `admin.js`의 `onAuthStateChanged` 안 `loadBenefitsAdmin();` 다음 줄에 추가**

```js
    loadAftercareAdmin();
```

- [ ] **Step 4: `admin.js` 파일 끝에 추가**

```js
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
  const snapshot = await getDocs(collection(db, "aftercare"));
  const items = [];
  snapshot.forEach((docSnap) => items.push({ id: docSnap.id, ...docSnap.data() }));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  items.forEach((data) => {
    aftercareAdminList.innerHTML += `
      <div class="list-item">
        <div><h3>${data.procedureName} (순서 ${data.order})</h3><p>${data.content}</p></div>
        <button class="btn-danger" data-id="${data.id}" data-collection="aftercare">삭제</button>
      </div>
    `;
  });
  aftercareAdminList.querySelectorAll(".btn-danger").forEach((btn) => btn.addEventListener("click", handleDeleteClick));
}
```

- [ ] **Step 5: 수동 검증**

관리자 로그인 후 "사후관리 안내" 탭에서 시술명 2개(예: "임플란트" 순서 0, "스케일링" 순서 1)를 등록 → 목록에 순서대로(임플란트가 위) 나타나야 한다. 삭제도 확인.

- [ ] **Step 6: 커밋**

```bash
git add admin.html admin.js
git commit -m "Add admin CRUD for aftercare guidance content"
```

---

### Task 6: 어드민 - 상담 신청함

**Files:**
- Modify: `admin.html` (tab-panel 추가)
- Modify: `admin.js` (`reloadTab`/`onAuthStateChanged` 수정, 목록/상태변경 함수 추가)

**Interfaces:**
- Consumes: Task 2의 `handleDeleteClick`, `reloadTab`. Task 8에서 고객 페이지가 생성하는 `consultations` 문서(`name`, `phone`, `message`, `createdAt`, `status`)를 읽는다.
- Produces: `loadConsultationsAdmin()`.

- [ ] **Step 1: `admin.html`의 `<!-- Task 6이... -->` 주석을 아래로 교체**

```html
  <section id="tab-consultations" class="tab-panel hidden">
    <h2>상담 신청함</h2>
    <div id="consultationAdminList" class="admin-list"></div>
  </section>
```

- [ ] **Step 2: `admin.js`의 `reloadTab` 함수를 아래로 교체**

```js
function reloadTab(col) {
  if (col === "events") loadEventsAdmin();
  if (col === "news") loadNewsAdmin();
  if (col === "reviews") loadReviewsAdmin();
  if (col === "benefits") loadBenefitsAdmin();
  if (col === "aftercare") loadAftercareAdmin();
  if (col === "consultations") loadConsultationsAdmin();
}
```

- [ ] **Step 3: `admin.js`의 `onAuthStateChanged` 안 `loadAftercareAdmin();` 다음 줄에 추가**

```js
    loadConsultationsAdmin();
```

- [ ] **Step 4: `admin.js` 파일 끝에 추가**

```js
/* ========== 상담 신청함 ========== */

const consultationAdminList = document.getElementById("consultationAdminList");

async function loadConsultationsAdmin() {
  consultationAdminList.innerHTML = "";
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
          <h3>${data.name} (${data.phone})</h3>
          <p>${data.message}</p>
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
}

async function handleMarkChecked(e) {
  const id = e.target.dataset.id;
  await updateDoc(doc(db, "consultations", id), { status: "확인완료" });
  loadConsultationsAdmin();
}
```

- [ ] **Step 5: `style.css` 끝에 추가**

```css
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
  margin-bottom: 4px;
}

.status-new {
  background: #e74c3c;
  color: #fff;
}

.status-done {
  background: #95a5a6;
  color: #fff;
}

.btn-check {
  background: #2c7be5;
  color: #fff;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
}
```

- [ ] **Step 6: 수동 검증**

이 시점에는 아직 고객 페이지(Task 8)가 없으므로, Firebase 콘솔의 Firestore Database 화면에서 `consultations` 컬렉션에 문서를 하나 수동으로 추가한다: `name: "홍길동"`, `phone: "010-1234-5678"`, `message: "상담 문의합니다"`, `createdAt: 1`(숫자), `status: "신규"`.

- 어드민 "상담 신청함" 탭에 방금 추가한 항목이 "신규" 배지와 함께 보여야 한다.
- "확인완료로 표시" 클릭 → 배지가 "확인완료"로 바뀌고 버튼이 사라져야 한다.
- "삭제" → 확인 후 목록에서 사라져야 한다.

- [ ] **Step 7: 커밋**

```bash
git add admin.html admin.js style.css
git commit -m "Add admin consultation inbox"
```

---

### Task 7: 고객 페이지 - 혜택·쿠폰 & 사후관리 안내 표시

**Files:**
- Create: `customer.html`
- Create: `customer.js`
- Modify: `style.css`

**Interfaces:**
- Consumes: Task 4의 `benefits` 스키마(`title`, `description`, `startDate`, `endDate`, `active`), Task 5의 `aftercare` 스키마(`procedureName`, `content`, `order`).
- Produces: `customer.html`에 `#consultForm` 등 상담 폼 요소 — Task 8에서 이 파일에 제출 로직을 추가한다.

- [ ] **Step 1: `customer.html` 작성**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>군산 삼성치과 - 고객 전용</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<header class="customer-header">
  <img src="clinic2.png" alt="군산 삼성치과">
  <h1>찾아주셔서 감사합니다</h1>
  <p>군산 삼성치과를 이용해주신 고객님을 위한 페이지입니다.</p>
</header>

<main>
  <section class="content-card">
    <h2>🎁 고객 전용 혜택</h2>
    <div id="benefitList"></div>
  </section>

  <section class="content-card">
    <h2>🦷 치료 후 관리 안내</h2>
    <div id="aftercareList"></div>
  </section>

  <section class="content-card">
    <h2>💬 상담 신청</h2>
    <form id="consultForm" class="admin-form">
      <input type="text" id="consultName" placeholder="이름" required>
      <input type="tel" id="consultPhone" placeholder="연락처" required>
      <textarea id="consultMessage" placeholder="문의 내용" required></textarea>
      <button type="submit">상담 신청하기</button>
    </form>
    <p id="consultSuccess" class="success-text hidden">접수되었습니다. 병원에서 연락드리겠습니다.</p>
  </section>
</main>

<script type="module" src="customer.js"></script>
</body>
</html>
```

- [ ] **Step 2: `customer.js` 작성 (혜택/사후관리 표시 부분만)**

```js
import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/* ========== 혜택·쿠폰 ========== */

async function loadBenefits() {
  const benefitList = document.getElementById("benefitList");
  benefitList.innerHTML = "";

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
        <h3>${data.title}</h3>
        <p>${data.description}</p>
        <span class="benefit-period">${data.startDate} ~ ${data.endDate}</span>
      </div>
    `;
  });

  if (shown === 0) {
    benefitList.innerHTML = "<p>현재 진행 중인 혜택이 없습니다.</p>";
  }
}

/* ========== 사후관리 안내 ========== */

async function loadAftercare() {
  const aftercareList = document.getElementById("aftercareList");
  aftercareList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "aftercare"));
  const items = [];
  snapshot.forEach((docSnap) => items.push(docSnap.data()));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  items.forEach((data, index) => {
    aftercareList.innerHTML += `
      <div class="accordion-item">
        <button type="button" class="accordion-toggle" data-index="${index}">${data.procedureName}</button>
        <div class="accordion-content hidden" id="aftercare-content-${index}">
          <p>${data.content}</p>
        </div>
      </div>
    `;
  });

  document.querySelectorAll(".accordion-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(`aftercare-content-${btn.dataset.index}`).classList.toggle("hidden");
    });
  });
}

loadBenefits();
loadAftercare();
```

- [ ] **Step 3: `style.css` 끝에 추가**

```css
.customer-header {
  text-align: center;
  padding: 32px 16px;
}

.customer-header img {
  max-width: 120px;
}

.benefit-card {
  border: 1px solid #ddd;
  padding: 16px;
  margin-bottom: 12px;
}

.accordion-item {
  border-bottom: 1px solid #ddd;
}

.accordion-toggle {
  width: 100%;
  text-align: left;
  padding: 12px 0;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.accordion-content {
  padding: 0 0 12px;
}
```

- [ ] **Step 4: 수동 검증**

`http://localhost:5500/customer.html` 접속.

- Task 4에서 등록한 "보이기" 상태의 혜택(시작일~종료일이 오늘 포함)이 카드로 보여야 한다. 만약 "숨김" 처리했거나 기간이 지난 항목이면 안 보여야 한다.
- 혜택이 하나도 없으면 "현재 진행 중인 혜택이 없습니다."가 보여야 한다.
- Task 5에서 등록한 시술명들이 순서대로 목록에 보이고, 클릭하면 안내 내용이 펼쳐지고 다시 클릭하면 접혀야 한다.
- 페이지 소스보기(Ctrl+U)에서 `<meta name="robots" content="noindex, nofollow">`가 있는지 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add customer.html customer.js style.css
git commit -m "Add customer page with benefits and aftercare content"
```

---

### Task 8: 고객 페이지 - 상담 신청 폼

**Files:**
- Modify: `customer.js` (파일 끝에 추가)

**Interfaces:**
- Consumes: Task 7의 `#consultForm`/`#consultSuccess` DOM 요소. Task 1의 `consultations` 쓰기 규칙(정확히 5개 필드).
- Produces: Task 6의 `loadConsultationsAdmin()`이 읽는 `consultations` 문서.

- [ ] **Step 1: `customer.js` 맨 위 import 문을 아래로 교체 (`addDoc` 추가)**

```js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
```

- [ ] **Step 2: `customer.js` 끝에 추가**

```js
/* ========== 상담 신청 ========== */

const consultForm = document.getElementById("consultForm");
const consultSuccess = document.getElementById("consultSuccess");

consultForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("consultName").value.trim();
  const phone = document.getElementById("consultPhone").value.trim();
  const message = document.getElementById("consultMessage").value.trim();
  if (!name || !phone || !message) return;

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
});
```

- [ ] **Step 3: `style.css` 끝에 추가**

```css
.success-text {
  color: #2e7d32;
  font-weight: bold;
}
```

- [ ] **Step 4: 수동 검증**

`http://localhost:5500/customer.html`에서 이름/연락처/문의내용을 입력하고 "상담 신청하기" 클릭.

- 폼이 사라지고 "접수되었습니다. 병원에서 연락드리겠습니다." 문구가 보여야 한다.
- `http://localhost:5500/admin.html`에 관리자로 로그인해서 "상담 신청함" 탭을 열면 방금 제출한 내용이 "신규" 배지와 함께 나타나야 한다.
- 이름/연락처/문의내용 중 하나라도 비운 채 제출을 시도하면 브라우저 기본 필수 입력 경고가 뜨고 제출되지 않아야 한다(`required` 속성).

- [ ] **Step 5: 커밋**

```bash
git add customer.js style.css
git commit -m "Add consultation request form to customer page"
```

---

### Task 9: 사용 설명서 작성

**Files:**
- Create: `docs/사용설명서.md`

**Interfaces:**
- Consumes: Task 2~6에서 완성된 어드민 화면의 실제 탭 이름/버튼 문구.

- [ ] **Step 1: `docs/사용설명서.md` 작성**

```markdown
# 군산 삼성치과 홈페이지 관리 가이드

## 1. 관리자 페이지 접속

1. 주소창에 `https://gunsan-samsung-clinic.github.io/gunsan-samsung-dental-web/admin.html`을 입력합니다.
2. 이메일과 비밀번호를 입력하고 "로그인" 버튼을 누릅니다.

## 2. 이벤트 / 공지사항 / 후기 등록

1. 상단 탭에서 "이벤트", "공지사항", "후기" 중 원하는 것을 클릭합니다.
2. 제목(또는 작성자)과 내용을 입력한 뒤 "추가" 버튼을 누릅니다.
3. 등록한 내용은 바로 아래 목록에 나타나고, 홈페이지(`index.html`)에도 곧바로 반영됩니다.
4. 지우려면 목록에서 해당 항목의 "삭제" 버튼을 누르고, 확인 창에서 "확인"을 누릅니다.

## 3. 혜택·쿠폰 등록

1. "혜택·쿠폰" 탭을 클릭합니다.
2. 혜택 제목, 설명, 시작일, 종료일을 입력합니다.
3. "고객 페이지에 보이기"에 체크가 되어 있으면 바로 고객 전용 페이지에 노출됩니다. 체크를 해제하면 등록만 해두고 숨길 수 있습니다.
4. "혜택 추가"를 누르면 목록에 나타납니다.
5. 나중에 숨기고 싶으면 "숨기기" 버튼을, 다시 보이고 싶으면 "보이기" 버튼을 누릅니다.
6. 기간(시작일~종료일)이 지나면 자동으로 고객 페이지에서 사라집니다. 별도로 지울 필요는 없지만, 정리하고 싶으면 "삭제"를 누르면 됩니다.

## 4. 치료 후 관리 안내 등록

1. "사후관리 안내" 탭을 클릭합니다.
2. 시술명(예: 임플란트), 관리 안내 내용, 표시 순서(작은 숫자가 먼저 보임)를 입력합니다.
3. "안내 추가"를 누르면 등록됩니다. 고객 전용 페이지에서 시술명을 누르면 안내 내용이 펼쳐집니다.

## 5. 상담 신청 확인

1. "상담 신청함" 탭을 클릭하면 고객이 고객 전용 페이지에서 남긴 상담 신청 목록이 보입니다.
2. 새로 온 신청은 빨간색 "신규" 표시가 붙습니다.
3. 전화나 문자로 고객에게 연락을 마쳤으면 "확인완료로 표시"를 눌러주세요. 표시가 회색 "확인완료"로 바뀝니다.
4. 더는 필요 없는 신청 내역은 "삭제"로 지울 수 있습니다.

## 6. 고객 전용 페이지 링크 안내

고객 전용 페이지 주소는 `https://gunsan-samsung-clinic.github.io/gunsan-samsung-dental-web/customer.html` 입니다.
이 주소는 검색에는 노출되지 않으며, 내원하신 고객님께 직접 안내(문자, 안내문, QR코드 등)해 주셔야 합니다.

## 7. 문제가 생겼을 때

- 로그인이 안 될 때: 이메일/비밀번호 철자를 다시 확인해 주세요. 그래도 안 되면 개발 담당자에게 문의해 주세요.
- 화면에 내용이 안 보일 때: 새로고침(F5)을 먼저 해보세요.
- 그 외 오류: 화면을 캡처해서 개발 담당자에게 전달해 주세요.
```

- [ ] **Step 2: 커밋**

```bash
git add docs/사용설명서.md
git commit -m "Add admin usage guide for clinic staff"
```

---

## 완료 후 배포

모든 태스크 완료 후:

```bash
git push origin main
```

GitHub Pages가 자동으로 재배포한다 (기존 배포 방식과 동일, 별도 빌드 단계 없음). 배포 후 실제 공개 URL(`https://gunsan-samsung-clinic.github.io/gunsan-samsung-dental-web/admin.html`, `.../customer.html`)에서 Task 2~8의 수동 검증 항목을 한 번씩 다시 확인한다.
