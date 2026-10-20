(function () {
  const CFG = window.APP_CONFIG;
  const TOTAL = CFG.TOTAL_PEOPLE;
  const DAYS = CFG.WEEKS * 7;
  const DOW = ["월", "화", "수", "목", "금", "토", "일"];

  const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

  // ---------- 날짜 유틸 ----------
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const TODAY_ISO = iso(today);

  // 오늘부터 DAYS일. 주차는 오늘 기준 7일 단위.
  const dates = Array.from({ length: DAYS }, (_, i) => addDays(today, i));
  const ISO = dates.map(iso);
  const weekOf = (i) => Math.floor(i / 7);
  // 그리드 정렬용: 첫날 요일(월=0) 만큼 앞에 빈칸
  const leadPad = (today.getDay() + 6) % 7;

  // ---------- 상태 ----------
  let me = null;
  let selected = new Set();
  let all = []; // [{name, dates:[]}]

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const vLogin = $("view-login"), vPick = $("view-pick"), vSummary = $("view-summary");
  const nameInput = $("name-input"), saveStatus = $("save-status");

  $("range-label").textContent =
    `${fmt(dates[0])} ~ ${fmt(dates[DAYS - 1])} (${CFG.WEEKS}주)`;

  // 주차 버튼에 날짜 범위 표기 (예: 1주차 10/20~26)
  document.querySelectorAll(".week-btn").forEach((b) => {
    const w = +b.dataset.week, a = dates[w * 7], z = dates[Math.min(w * 7 + 6, DAYS - 1)];
    b.textContent = `${w + 1}주차 ${a.getMonth() + 1}/${a.getDate()}~${z.getMonth() + 1}/${z.getDate()}`;
  });

  function fmt(d) { return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[(d.getDay() + 6) % 7]})`; }

  // ---------- 달력 렌더 ----------
  function dowHeader(container) {
    DOW.forEach((n, i) => {
      const el = document.createElement("div");
      el.className = "dow" + (i === 6 ? " sun" : "");
      el.textContent = n;
      container.appendChild(el);
    });
  }

  function dayCell(d, i) {
    const el = document.createElement("div");
    const dow = (d.getDay() + 6) % 7;
    el.className = "day" + (dow === 6 ? " sun" : "") + (ISO[i] === TODAY_ISO ? " today" : "");
    el.dataset.iso = ISO[i];
    el.dataset.week = weekOf(i);
    el.innerHTML = `<div class="d">${d.getDate()}</div><div class="m">${d.getMonth() + 1}월</div>`;
    return el;
  }

  function renderPick() {
    const c = $("pick-calendar");
    c.innerHTML = "";
    dowHeader(c);
    for (let p = 0; p < leadPad; p++) { const e = document.createElement("div"); e.className = "day pad"; c.appendChild(e); }
    dates.forEach((d, i) => {
      const el = dayCell(d, i);
      if (selected.has(ISO[i])) el.classList.add("on");
      el.addEventListener("click", () => { toggle(ISO[i]); });
      c.appendChild(el);
    });
    updatePickUI();
  }

  function updatePickUI() {
    document.querySelectorAll("#pick-calendar .day[data-iso]").forEach((el) => {
      el.classList.toggle("on", selected.has(el.dataset.iso));
    });
    $("pick-count").textContent = `${selected.size} / ${DAYS}일 선택`;
    $("all-btn").classList.toggle("active", selected.size === DAYS);
    document.querySelectorAll(".week-btn").forEach((b) => {
      const w = +b.dataset.week;
      const full = weekIsos(w).every((x) => selected.has(x));
      b.classList.toggle("active", full);
    });
  }

  const weekIsos = (w) => ISO.filter((_, i) => weekOf(i) === w);

  function toggle(isoStr) {
    selected.has(isoStr) ? selected.delete(isoStr) : selected.add(isoStr);
    updatePickUI();
  }

  $("all-btn").addEventListener("click", () => {
    if (selected.size === DAYS) selected.clear(); else ISO.forEach((x) => selected.add(x));
    updatePickUI();
  });
  document.querySelectorAll(".week-btn").forEach((b) => {
    b.addEventListener("click", () => {
      const ws = weekIsos(+b.dataset.week);
      const full = ws.every((x) => selected.has(x));
      ws.forEach((x) => (full ? selected.delete(x) : selected.add(x)));
      updatePickUI();
    });
  });
  $("clear-btn").addEventListener("click", () => { selected.clear(); updatePickUI(); });

  // ---------- 종합 렌더 ----------
  function renderSummary() {
    const c = $("summary-calendar");
    c.innerHTML = "";
    dowHeader(c);
    for (let p = 0; p < leadPad; p++) { const e = document.createElement("div"); e.className = "day pad"; c.appendChild(e); }

    const byDate = {};
    ISO.forEach((x) => (byDate[x] = []));
    all.forEach((p) => (p.dates || []).forEach((x) => { if (byDate[x]) byDate[x].push(p.name); }));

    const best = [];
    dates.forEach((d, i) => {
      const names = byDate[ISO[i]];
      const n = names.length;
      const el = dayCell(d, i);
      const ratio = TOTAL ? n / TOTAL : 0;
      if (n > 0 && n >= TOTAL) { el.classList.add("full"); best.push(d); }
      else if (n > 0) {
        el.style.background = `rgba(37, 99, 235, ${0.12 + ratio * 0.5})`;
      }
      el.insertAdjacentHTML("beforeend",
        `<div class="cnt">${n}/${TOTAL}</div><div class="names">${names.join(", ")}</div>`);
      el.title = names.length ? names.join(", ") : "아무도 없음";
      c.appendChild(el);
    });

    $("people-count").textContent = `(${all.length}/${TOTAL}명 입력)`;
    $("best-dates").innerHTML = best.length
      ? `<strong>전원 가능:</strong> ${best.map(fmt).join(", ")}`
      : `<span class="muted">아직 전원이 가능한 날짜가 없어요.</span>`;

    $("legend").innerHTML = `
      <span class="sw" style="background:#fff"></span>0명
      <span class="sw" style="background:rgba(37,99,235,.25)"></span>일부
      <span class="sw" style="background:#15803d"></span>전원`;

    $("people-list").innerHTML = "입력한 사람: " +
      (all.length ? all.map((p) => `<span>${esc(p.name)} (${(p.dates || []).length}일)</span>`).join("") : "없음");
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Supabase ----------
  async function loadAll() {
    try {
      const { data, error } = await withTimeout(
        sb.from("availability").select("name, dates").order("updated_at"), 8000);
      if (error) throw error;
      all = data || [];
    } catch (e) {
      console.error(e);
      setStatus("불러오기 실패: " + (e.message || e) + " — config.js 설정을 확인하세요", "err");
    }
    renderSummary();
  }

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("시간 초과")), ms))]);
  }

  async function save() {
    const btn = $("save-btn");
    btn.disabled = true;
    setStatus("저장 중…");
    let error = null;
    try {
      ({ error } = await withTimeout(sb.from("availability").upsert(
        { name: me, dates: [...selected].sort(), updated_at: new Date().toISOString() },
        { onConflict: "name" }
      ), 8000));
    } catch (e) { error = e; }
    btn.disabled = false;
    if (error) { setStatus("저장 실패: " + (error.message || error), "err"); return; }
    setStatus("저장됐어요 ✓", "ok");
    await loadAll();
  }

  function setStatus(msg, cls) {
    saveStatus.textContent = msg;
    saveStatus.className = "status " + (cls || "");
  }

  // ---------- 입장 / 전환 ----------
  async function enter() {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    me = name;
    localStorage.setItem("w2m_name", me);
    $("me-label").textContent = me;

    await loadAll();
    const mine = all.find((p) => p.name === me);
    selected = new Set((mine?.dates || []).filter((x) => ISO.includes(x)));

    vLogin.classList.add("hidden");
    vPick.classList.remove("hidden");
    vSummary.classList.remove("hidden");
    setStatus("");
    renderPick();
  }

  $("enter-btn").addEventListener("click", enter);
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") enter(); });
  $("logout-btn").addEventListener("click", () => {
    me = null; selected = new Set();
    vPick.classList.add("hidden"); vSummary.classList.add("hidden");
    vLogin.classList.remove("hidden");
    nameInput.focus();
  });
  $("save-btn").addEventListener("click", save);
  $("refresh-btn").addEventListener("click", loadAll);

  // 이전 이름 기억
  const remembered = localStorage.getItem("w2m_name");
  if (remembered) nameInput.value = remembered;
  nameInput.focus();

  // 디버그용 (콘솔에서 __w2m.setAll([{name, dates}]) 로 종합 화면 미리보기)
  window.__w2m = { setAll: (d) => { all = d; renderSummary(); } };
})();
