/* =====================================================================
   GenRPM — logika aplikasi (tanpa framework, berjalan di peramban)
   ===================================================================== */
(function () {
  "use strict";
  const D = window.GENRPM_DATA;
  // Gabungkan data hasil ekstraksi panduan BSKAP (js/data-panduan.js)
  (function mergePanduan(P) {
    if (!P) return;
    const ordered = P.mapel.concat(D.mapel.filter((m) => !P.mapel.includes(m)));
    D.mapel = ordered.sort((a, b) => rank(a) - rank(b));
    D.buku = D.buku.concat(P.buku);
    Object.keys(P.cp).forEach((k) => { if (!D.cp[k]) D.cp[k] = P.cp[k]; });
    Object.keys(P.materi).forEach((k) => { if (!D.materi[k]) D.materi[k] = P.materi[k]; });
    function rank(m) {
      if (/^Pendidikan Agama/.test(m)) return 0;
      if (/^Pendidikan Pancasila/.test(m)) return 1;
      if (/^(Bahasa|Matematika|Ilmu|Pendidikan Jasmani)/.test(m)) return 2;
      if (/^Seni/.test(m)) return 3;
      if (/^Keterampilan/.test(m)) return 4;
      if (/^PKK/.test(m)) return 5;
      return 6;
    }
  })(window.GENRPM_PANDUAN);
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LS_KEY = "genrpm.form.v1";
  const LS_TPL = "genrpm.template.v1";

  /* ---------------- Kolom isi utama ---------------- */
  const FIELDS = [
    { key: "profil", label: "Peserta Didik (kesiapan, minat, latar belakang, kebutuhan belajar)" },
    { key: "analisisMateri", label: "Materi Pelajaran (jenis pengetahuan, relevansi, tingkat kesulitan, struktur materi, nilai & karakter)" },
    { key: "cp", label: "Capaian Pembelajaran (CP)" },
    { key: "tp", label: "Tujuan Pembelajaran (TP) — per pertemuan bila lebih dari satu" },
    { key: "topik", label: "Topik Pembelajaran" },
    { key: "praktik", label: "Praktik Pedagogis" },
    { key: "kemitraan", label: "Kemitraan Pembelajaran" },
    { key: "lingkungan", label: "Lingkungan Pembelajaran" },
    { key: "digital", label: "Pemanfaatan Digital" },
    { key: "pengalaman", label: "Pengalaman Belajar (Kegiatan Awal – Inti: Memahami, Mengaplikasi, Merefleksi – Penutup)" },
    { key: "asesmen", label: "Asesmen Pembelajaran (awal, proses, akhir)" },
    { key: "lkpd", label: "Lembar Kerja Peserta Didik (LKPD) — dicetak sebagai lampiran" }
  ];
  const IDENTITY_IDS = ["tahun", "mapel", "fase", "kelas", "ketunaan", "guru", "kepsek", "nipGuru", "nipKepsek", "materi", "materiEsensial", "alokasi", "tempatTanggal", "lintas", "murid", "sekolah"];
  const KEEP_AFTER_CLEAR = ["tahun", "mapel", "fase", "kelas", "ketunaan", "guru", "kepsek", "nipGuru", "nipKepsek", "sekolah", "murid", "tempatTanggal"];

  const DEFAULT_TPL = [
    "# Identifikasi",
    "- Peserta Didik = profil",
    "- Materi Pelajaran = analisisMateri",
    "- Dimensi Profil Lulusan = dpl",
    "# Desain Pembelajaran",
    "- Capaian Pembelajaran = cp",
    "- Lintas Disiplin Ilmu = lintas",
    "- Tujuan Pembelajaran = tp",
    "- Topik Pembelajaran = topik",
    "- Praktik Pedagogis = praktik",
    "- Kemitraan Pembelajaran = kemitraan",
    "- Lingkungan Pembelajaran = lingkungan",
    "- Pemanfaatan Digital = digital",
    "# Pengalaman Belajar",
    "- Pengalaman Belajar = pengalaman",
    "# Asesmen Pembelajaran",
    "- Asesmen Pembelajaran = asesmen"
  ].join("\n");

  const DPL_DESC = {
    DPL1: "mensyukuri ciptaan Tuhan Yang Maha Esa melalui kegiatan belajar {materi}",
    DPL2: "peduli dan bertanggung jawab terhadap lingkungan sekitar",
    DPL3: "mengamati, membandingkan, dan menyimpulkan informasi tentang {materi}",
    DPL4: "membuat karya sederhana (poster/kolase/model) sesuai gagasan sendiri",
    DPL5: "bekerja sama dan saling membantu dalam kelompok kecil",
    DPL6: "menyelesaikan tugas sesuai kemampuan dengan bantuan yang makin berkurang",
    DPL7: "menjaga kebersihan, kesehatan, dan keselamatan diri saat praktik",
    DPL8: "menyampaikan hasil belajar secara lisan, tulisan, gambar, atau isyarat"
  };

  let tplStructure = [];        // [{nama, subs:[{label,key}]}]
  let lastModel = null;
  let lastBlob = null;          // berkas .docx terakhir (dipakai untuk unduh, pratinjau, dan cetak)
  let previewReady = Promise.resolve();
  const bookCache = {};        // id -> {pages:[...]}
  const uploadedBooks = [];    // {id, judul, info, file, uploaded:true}

  /* =================================================================
     INISIALISASI
     ================================================================= */
  function init() {
    const um = document.cookie.match(/(?:^|;\s*)genrpm_user=([^;]+)/);
    if (um) { document.getElementById("userName").textContent = decodeURIComponent(um[1]); document.getElementById("userBar").hidden = false; }
    document.querySelector(".btn-out")?.addEventListener("click", () => { try { saveForm(); } catch (e) {} });
    // Tahun ajaran (default tahun berjalan)
    const now = new Date();
    const y = now.getFullYear();
    const cur = now.getMonth() >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
    const years = Array.from(new Set([...D.tahunAjaran, cur])).sort();
    fillSelect($("tahun"), years.map((t) => [t, t]), cur);
    fillSelect($("mapel"), D.mapel.map((m) => [m, m]), D.mapel.includes("Ilmu Pengetahuan Alam (IPA)") ? "Ilmu Pengetahuan Alam (IPA)" : D.mapel[0]);
    fillSelect($("fase"), Object.keys(D.fase).map((k) => [k, D.fase[k].label]), "D");
    fillSelect($("ketunaan"), Object.keys(D.ketunaan).map((k) => [k, k]), Object.keys(D.ketunaan)[0]);
    updateKelas();

    // Kolom isi
    const area = $("fieldArea");
    FIELDS.forEach((f) => {
      const lab = document.createElement("label");
      lab.innerHTML = `${esc(f.label)}<textarea id="f_${f.key}" data-key="${f.key}" rows="${["pengalaman", "asesmen", "lkpd"].includes(f.key) ? 10 : 5}"></textarea>`;
      area.appendChild(lab);
    });

    // DPL
    $("dplList").innerHTML = D.dpl.map((d) => `<label><input type="checkbox" class="dpl" value="${d.kode}"> ${d.kode} ${esc(d.nama.replace(" terhadap Tuhan YME", ""))}</label>`).join("");

    // Template
    const savedTpl = safeGet(LS_TPL);
    if (savedTpl && savedTpl.text) {
      $("tplText").value = savedTpl.text;
      if (savedTpl.mode === "custom") document.querySelector('input[name=tplMode][value=custom]').checked = true;
      else $("tplText").value = DEFAULT_TPL;
    } else {
      $("tplText").value = DEFAULT_TPL;
    }
    applyTemplateMode(false);

    // Pulihkan isian sebelumnya
    restoreForm();
    refreshForMapelFase(false);

    bindEvents();
  }

  function fillSelect(sel, pairs, value) {
    sel.innerHTML = pairs.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");
    if (value != null) sel.value = value;
  }
  function updateKelas() {
    const f = D.fase[$("fase").value];
    const prev = $("kelas").value;
    fillSelect($("kelas"), f.kelas.map((k) => [k, k]), f.kelas.includes(prev) ? prev : f.kelas[0]);
  }
  function dataKey() { return `${$("mapel").value}|${$("fase").value}`; }
  function materiList() { return D.materi[dataKey()] || []; }
  function cpList() { return D.cp[dataKey()] || []; }

  /* =================================================================
     EVENTS
     ================================================================= */
  function bindEvents() {
    $("fase").addEventListener("change", () => { updateKelas(); refreshForMapelFase(true); });
    $("mapel").addEventListener("change", () => refreshForMapelFase(true));
    $("materi").addEventListener("change", onMateriChosen);
    $("materi").addEventListener("input", () => { const m = findMateri($("materi").value); if (m) onMateriChosen(); });

    $("bukuSemua").onclick = () => document.querySelectorAll(".bookChk").forEach((c) => (c.checked = true));
    $("bukuKosong").onclick = () => document.querySelectorAll(".bookChk").forEach((c) => (c.checked = false));
    $("cariBuku").onclick = cariRujukanBuku;
    $("unggahBuku").onchange = onUploadBooks;

    document.querySelectorAll("input[name=tplMode]").forEach((r) => r.addEventListener("change", () => applyTemplateMode(true)));
    $("tplFile").onchange = onTemplateFile;
    $("tplTerapkan").onclick = () => { applyTemplateText(); setStatus("tplStatus", "Struktur template diterapkan."); };
    $("tplReset").onclick = () => { $("tplText").value = DEFAULT_TPL; applyTemplateText(); setStatus("tplStatus", "Kembali ke template bawaan."); };

    document.querySelectorAll("input[name=cpMode]").forEach((r) => r.addEventListener("change", renderCP));

    $("btnDraf").onclick = () => { ensureMateri(); const st = collectState(); ensureDefaultDPL(st); fillFields(buildDraft(collectState())); setStatus("statusIsi", "Draf otomatis selesai. Periksa dan sesuaikan isinya sebelum membuat dokumen."); };
    $("btnInternet").onclick = isiDariInternet;
    $("btnBuat").onclick = buatDokumen;
    $("btnKosong").onclick = () => { if (confirm("Kosongkan semua isian formulir?")) { clearForm(false); setStatus("statusForm", "Formulir dikosongkan."); } };

    $("btnDocx").onclick = unduhDocx;
    $("btnCopy").onclick = salinUntukWord;
    $("btnPrint").onclick = cetakPDF;

    // autosave
    let t;
    document.addEventListener("input", () => { clearTimeout(t); t = setTimeout(saveForm, 600); });
    document.addEventListener("change", () => { clearTimeout(t); t = setTimeout(saveForm, 300); });
  }

  function setStatus(id, msg, isErr) {
    const el = $(id);
    el.textContent = msg || "";
    el.classList.toggle("err", !!isErr);
  }

  /* =================================================================
     MATERI, BUKU, CP/TP
     ================================================================= */
  function refreshForMapelFase(userChanged) {
    const list = materiList();
    $("materiList").innerHTML = list.map((m) => `<option value="${esc(m.judul)}">`).join("");
    const f = D.fase[$("fase").value];
    $("materiLabel").textContent = list.length
      ? `Materi (${list.length} pilihan dari buku ${$("mapel").value} ${f.label.split(" (")[0]})`
      : "Materi (ketik sendiri — belum ada daftar materi untuk pilihan ini)";
    renderBooks(true);
    renderCP();
    if (userChanged) saveForm();
  }

  function findMateri(judul) {
    const j = (judul || "").trim().toLowerCase();
    return materiList().find((m) => m.judul.toLowerCase() === j);
  }
  function onMateriChosen() {
    const m = findMateri($("materi").value);
    if (m) $("materiEsensial").value = m.esensial;
    renderCP(true);
  }

  function allBooks() { return D.buku.concat(uploadedBooks); }
  function renderBooks(resetToRelevant) {
    const checked = new Set(Array.from(document.querySelectorAll(".bookChk:checked")).map((c) => c.value));
    const mapel = $("mapel").value, fase = $("fase").value;
    const first = !document.querySelector(".bookChk") || resetToRelevant;
    const isRel = (b) => (b.mapel === mapel && (!b.fase || b.fase.includes(fase))) || b.uploaded;
    const list = allBooks().slice().sort((a, z) => isRel(z) - isRel(a));
    $("bukuList").innerHTML = list.map((b) => {
      const rel = isRel(b);
      const on = first ? rel : checked.has(b.id);
      return `<label class="book"><input type="checkbox" class="bookChk" value="${esc(b.id)}" ${on ? "checked" : ""}>
        <span><b>${esc(b.judul)}${b.uploaded ? '<span class="tag">unggahan</span>' : ""}${b.md ? '<span class="tag">panduan</span>' : ""}</b><small>${esc(b.info || "")}</small></span></label>`;
    }).join("");
  }

  function renderCP(onlyTextUpdate) {
    const mode = document.querySelector("input[name=cpMode]:checked").value;
    const list = cpList();
    const f = D.fase[$("fase").value];
    if (mode === "manual") {
      $("cpInfo").textContent = "Isi kolom Capaian Pembelajaran (CP) dan Tujuan Pembelajaran (TP) di bawah secara manual.";
      $("cpList").innerHTML = "";
      return;
    }
    if (!list.length) {
      $("cpInfo").textContent = `Belum ada data CP untuk ${$("mapel").value}, ${f.label}. Pilih "Isi manual", gunakan Isi dari Internet, atau tambahkan datanya di js/data.js.`;
      $("cpList").innerHTML = "";
      return;
    }
    $("cpInfo").textContent = `${$("mapel").value}, ${f.label.split(" (")[0]}: centang CP yang dipakai, lalu pilih TP-nya. Memilih akan menggantikan isi kolom CP/TP. Daftar diambil otomatis dari buku/panduan; pilihan TP dirumuskan dari klausa CP — periksa dan sesuaikan.`;
    const materi = $("materi").value.trim() || "materi ini";
    // simpan pilihan lama
    const prevCP = new Set(Array.from(document.querySelectorAll(".cpChk:checked")).map((c) => c.value));
    const prevTP = new Set(Array.from(document.querySelectorAll(".tpChk:checked")).map((c) => c.dataset.id));
    $("cpList").innerHTML = list.map((c, i) => {
      const on = prevCP.has(String(i));
      const tps = c.tp.map((t, j) => {
        const id = `${i}-${j}`;
        const tOn = on && (prevTP.has(id) || (!onlyTextUpdate && prevTP.size === 0 && j === 0) || (onlyTextUpdate && prevTP.has(id)));
        return `<label><input type="checkbox" class="tpChk" data-id="${id}" ${tOn ? "checked" : ""}> ${esc(t.replace(/\{materi\}/g, materi))}</label>`;
      }).join("");
      return `<div class="cp-item"><input type="checkbox" class="cpChk" value="${i}" ${on ? "checked" : ""}>
        <div class="cp-txt"><b>${esc(c.elemen)}</b>${esc(c.teks)}
          <div class="tp-list" ${on ? "" : "hidden"}>${tps}</div></div></div>`;
    }).join("");
    document.querySelectorAll(".cpChk").forEach((chk) => chk.addEventListener("change", () => {
      const box = chk.parentElement.querySelector(".tp-list");
      box.hidden = !chk.checked;
      if (chk.checked && !box.querySelector(".tpChk:checked")) box.querySelector(".tpChk").checked = true;
      if (!chk.checked) box.querySelectorAll(".tpChk").forEach((t) => (t.checked = false));
      syncCPTP();
    }));
    document.querySelectorAll(".tpChk").forEach((t) => t.addEventListener("change", syncCPTP));
    if (onlyTextUpdate && document.querySelector(".cpChk:checked")) syncCPTP();
  }

  function selectedCPTP() {
    const list = cpList();
    const materi = $("materi").value.trim() || "materi ini";
    const cps = [], tps = [];
    document.querySelectorAll(".cpChk:checked").forEach((c) => cps.push(list[+c.value]));
    document.querySelectorAll(".tpChk:checked").forEach((t) => {
      const [i, j] = t.dataset.id.split("-").map(Number);
      tps.push(list[i].tp[j].replace(/\{materi\}/g, materi));
    });
    return { cps, tps };
  }
  function syncCPTP() {
    const { cps, tps } = selectedCPTP();
    if (cps.length) $("f_cp").value = cps.map((c) => `${c.elemen}: ${c.teks}`).join("\n");
    if (tps.length) $("f_tp").value = tps.map((t) => `- ${t}`).join("\n");
    saveForm();
  }

  /* ---------------- Pencarian rujukan di buku PDF ---------------- */
  function onUploadBooks(e) {
    Array.from(e.target.files || []).forEach((file) => {
      const id = "up-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      uploadedBooks.push({ id, judul: file.name.replace(/\.(pdf|md|txt)$/i, ""), info: `${/\.pdf$/i.test(file.name) ? "PDF" : "Teks"} unggahan · ${(file.size / 1048576).toFixed(1)} MB`, file, uploaded: true });
    });
    renderBooks();
    document.querySelectorAll(".bookChk").forEach((c) => { if (c.value.startsWith("up-")) c.checked = true; });
    setStatus("bukuStatus", "Buku ditambahkan. Tekan \"Cari rujukan dari buku\" untuk mencari isi yang relevan dengan materi.");
    e.target.value = "";
  }

  async function loadBookText(b) {
    if (bookCache[b.id]) return bookCache[b.id];
    if (!window.pdfjsLib) throw new Error("Pustaka PDF tidak termuat.");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
    let data;
    if (b.md || (b.file && /\.(md|txt)$/i.test(b.file.name))) {
      const txt = b.file ? await b.file.text() : await fetch(b.md).then((r) => { if (!r.ok) throw new Error(`File panduan tidak ditemukan (${b.md}).`); return r.text(); });
      bookCache[b.id] = { pages: [], labels: [] };
      let head = "Awal dokumen", buf = [];
      const flush = () => { if (buf.join(" ").trim()) { bookCache[b.id].pages.push(buf.join(" ").replace(/\s+/g, " ")); bookCache[b.id].labels.push(head); } buf = []; };
      txt.split(/\r?\n/).forEach((line) => {
        const t = line.trim();
        const isHead = /^#{1,4}\s+\S/.test(t) || /^(-\s*)?([A-E]|\d{1,2}(\.\d+)*\.?)\s+[A-Z][^|]{2,80}[^.;:,]$/.test(t);
        if (isHead && t.length < 100) { flush(); head = t.replace(/^#+\s*|^-\s*/g, ""); }
        if (!t.startsWith("![")) buf.push(t.replace(/\|/g, " "));
        if (buf.length > 40) flush();
      });
      flush();
      return bookCache[b.id];
    }
    if (b.file) data = await b.file.arrayBuffer();
    else {
      const r = await fetch(b.pdf);
      if (!r.ok) throw new Error(`File PDF belum tersedia (${b.pdf}). Taruh PDF buku di folder books/ dengan nama itu, atau gunakan "Tambah buku (PDF)".`);
      data = await r.arrayBuffer();
    }
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const pages = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      pages.push(tc.items.map((it) => it.str).join(" ").replace(/\s+/g, " "));
    }
    bookCache[b.id] = { pages, labels: pages.map((_, i) => `hlm. ${i + 1} (PDF)`) };
    return bookCache[b.id];
  }

  const STOP = new Set("dan yang di ke dari pada untuk dengan atau serta tiap cara pada adalah dalam sebagai ini itu oleh secara".split(" "));
  function searchTerms() {
    const m = $("materi").value + " " + ($("materiEsensial").value.match(/\(([^)]+)\)/g) || []).join(" ");
    return Array.from(new Set(m.toLowerCase().replace(/[^a-z0-9À-ɏ\s-]/gi, " ").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w))));
  }

  async function cariRujukanBuku() {
    const chosen = allBooks().filter((b) => Array.from(document.querySelectorAll(".bookChk:checked")).some((c) => c.value === b.id));
    if (!chosen.length) return setStatus("bukuStatus", "Centang minimal satu buku.", true);
    const terms = searchTerms();
    if (!terms.length) return setStatus("bukuStatus", "Isi Materi terlebih dahulu agar pencarian punya kata kunci.", true);
    setStatus("bukuStatus", "Membaca buku… (pertama kali bisa memakan waktu beberapa detik)");
    const out = [], errs = [];
    for (const b of chosen) {
      try {
        const { pages, labels } = await loadBookText(b);
        pages.forEach((txt, i) => {
          const low = txt.toLowerCase();
          let score = 0, firstHit = -1;
          terms.forEach((t) => { const k = low.split(t).length - 1; score += k; if (k && (firstHit < 0 || low.indexOf(t) < firstHit)) firstHit = low.indexOf(t); });
          if (score) out.push({ b, page: i + 1, label: labels[i], score, snippet: txt.slice(Math.max(0, firstHit - 120), firstHit + 260) });
        });
      } catch (e) { errs.push(`${b.judul}: ${e.message}`); }
    }
    out.sort((a, z) => z.score - a.score);
    const top = out.slice(0, 8);
    const re = new RegExp("(" + terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
    $("bukuHasil").innerHTML = top.map((r, k) => `<div class="res"><b>${esc(r.b.judul)}</b> — ${esc(r.label)}
      <div>…${esc(r.snippet).replace(re, "<mark>$1</mark>")}…</div>
      <button type="button" class="btn" data-k="${k}" style="margin-top:6px;padding:4px 12px">Tambahkan ke Sumber Belajar</button></div>`).join("");
    $("bukuHasil").querySelectorAll("button").forEach((btn) => btn.onclick = () => {
      const r = top[+btn.dataset.k];
      const line = r.b.md ? `- ${r.b.judul} (BSKAP Kemendikdasmen, 2025), bagian “${r.label}”.` : `- Buku ${r.b.judul}, ${r.label}`;
      const f = $("f_sumber");
      if (!f.value.includes(line)) f.value = (f.value.trim() ? f.value.trim() + "\n" : "") + line;
      btn.textContent = "Ditambahkan ✓"; saveForm();
    });
    setStatus("bukuStatus", (top.length ? `${out.length} halaman relevan ditemukan; ditampilkan ${top.length} teratas.` : "Tidak ada halaman yang cocok dengan kata kunci materi.") + (errs.length ? " Catatan: " + errs.join(" | ") : ""), !top.length && errs.length);
  }

  /* =================================================================
     TEMPLATE
     ================================================================= */
  function applyTemplateMode(fromUser) {
    const mode = document.querySelector("input[name=tplMode]:checked").value;
    $("tplCustom").hidden = mode !== "custom";
    if (mode === "default") {
      tplStructure = parseTplText(DEFAULT_TPL);
      $("tplInfo").textContent = "Memakai template Anda: Identifikasi (Profil Murid, 8 Dimensi Profil Lulusan), Desain Pembelajaran, Pengalaman Belajar (Memahami, Mengaplikasi, Merefleksi), dan Asesmen Pembelajaran.";
    } else {
      tplStructure = parseTplText($("tplText").value || DEFAULT_TPL);
      describeTemplate();
    }
    renderCustomFields();
    if (fromUser) saveTpl();
  }
  function applyTemplateText() {
    tplStructure = parseTplText($("tplText").value || DEFAULT_TPL);
    describeTemplate();
    renderCustomFields();
    saveTpl();
  }
  function describeTemplate() {
    $("tplInfo").textContent = "Memakai template Anda: " + tplStructure.map((k) => {
      const subs = k.subs.filter((s) => s.label.toLowerCase() !== k.nama.toLowerCase()).map((s) => s.label);
      return subs.length ? `${k.nama} (${subs.join(", ")})` : k.nama;
    }).join(", ") + ".";
  }
  function saveTpl() {
    try { localStorage.setItem(LS_TPL, JSON.stringify({ mode: document.querySelector("input[name=tplMode]:checked").value, text: $("tplText").value })); } catch (e) {}
  }

  function keyFor(label) {
    const l = label.toLowerCase();
    const rules = [
      [/profil lulusan|dimensi|profil pelajar pancasila|pelajar pancasila/, "dpl"],
      [/profil murid|profil peserta|peserta didik|^murid$|karakteristik (murid|peserta)|target peserta|identifikasi murid|kesiapan/, "profil"],
      [/lkpd|lembar kerja/, "lkpd"],
      [/capaian/, "cp"],
      [/tujuan/, "tp"],
      [/lintas|interdisiplin/, "lintas"],
      [/topik/, "topik"],
      [/materi pelajaran|analisis materi/, "analisisMateri"],
      [/^materi|materi esensial/, "materi"],
      [/praktik pedagog|model pembelajaran|metode|strategi|pendekatan/, "praktik"],
      [/kemitraan/, "kemitraan"],
      [/lingkungan (pembelajaran|belajar)/, "lingkungan"],
      [/digital|teknologi/, "digital"],
      [/pengalaman|memahami|mengaplikasi|kegiatan|langkah|skenario|pendahuluan|sintaks/, "pengalaman"],
      [/asesmen|penilaian/, "asesmen"],
      [/sumber|rujukan|referensi|daftar pustaka/, "sumber"]
    ];
    for (const [re, k] of rules) if (re.test(l)) return k;
    return "custom:" + l.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  }

  function parseTplText(text) {
    const out = [];
    let cur = null;
    text.split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (/^#/.test(line)) { cur = { nama: line.replace(/^#+\s*/, ""), subs: [] }; out.push(cur); return; }
      const sub = line.replace(/^[-*•]\s*/, "");
      if (!cur) { cur = { nama: sub, subs: [] }; out.push(cur); if (!/^[-*•]/.test(line)) return; }
      let label = sub, key = null;
      const m = sub.match(/^(.*?)\s*=\s*([a-z:-]+)\s*$/i);
      if (m) {
        label = m[1].trim(); key = m[2].trim().toLowerCase();
        const known = FIELDS.map((f) => f.key).concat(["dpl", "materi", "lintas", "sumber"]).find((x) => x.toLowerCase() === key);
        if (known) key = known;
      }
      cur.subs.push({ label, key: key || keyFor(label) });
    });
    out.forEach((k) => { if (!k.subs.length) k.subs.push({ label: k.nama, key: keyFor(k.nama) }); });
    return out;
  }

  function renderCustomFields() {
    const prev = {};
    document.querySelectorAll("#customArea textarea").forEach((t) => (prev[t.dataset.key] = t.value));
    const customs = [];
    tplStructure.forEach((k) => k.subs.forEach((s) => { if (s.key.startsWith("custom:") && !customs.some((c) => c.key === s.key)) customs.push(s); }));
    $("customWrap").hidden = !customs.length;
    $("customArea").innerHTML = customs.map((c) => `<label>${esc(c.label)}<textarea rows="4" data-key="${esc(c.key)}" data-label="${esc(c.label)}" id="f_${esc(c.key)}"></textarea></label>`).join("");
    document.querySelectorAll("#customArea textarea").forEach((t) => { if (prev[t.dataset.key]) t.value = prev[t.dataset.key]; });
    const saved = safeGet(LS_KEY);
    if (saved && saved.fields) document.querySelectorAll("#customArea textarea").forEach((t) => { if (!t.value && saved.fields[t.dataset.key]) t.value = saved.fields[t.dataset.key]; });
  }

  async function onTemplateFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      let text;
      if (/\.docx$/i.test(file.name)) {
        const res = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        text = templateFromHtml(res.value);
      } else {
        text = templateFromPlain(await file.text());
      }
      if (!text.trim()) throw new Error("Tidak menemukan komponen/sub-komponen di file tersebut.");
      $("tplText").value = text;
      applyTemplateText();
      const n = tplStructure.reduce((a, k) => a + k.subs.length, 0);
      const c = tplStructure.reduce((a, k) => a + k.subs.filter((s) => s.key.startsWith("custom:")).length, 0);
      setStatus("tplStatus", `Template "${file.name}" terbaca: ${tplStructure.length} komponen, ${n} sub-komponen${c ? ` (${c} menjadi kolom tambahan di bagian 4)` : ""}. Periksa struktur di atas lalu sesuaikan bila perlu.`);
    } catch (err) {
      setStatus("tplStatus", "Gagal membaca template: " + err.message, true);
    }
    e.target.value = "";
  }

  const IDENT_RE = /^(nama|sekolah|satuan|mata pelajaran|mapel|fase|kelas|semester|tahun|alokasi|kebutuhan khusus|ketunaan|penyusun|instansi|jenjang|jumlah|moda|tanggal|guru)/i;
  const KOMP_RE = /identifikasi|desain|pengalaman|asesmen|penilaian|kegiatan|langkah|tujuan|kompetensi|capaian|profil|refleksi|lampiran|pemahaman|pertanyaan|sarana|model|materi|sumber|pengayaan|remedial/i;

  function cleanLabel(s) {
    return s.replace(/\s+/g, " ").replace(/[:：]\s*$/, "").replace(/^\d+[.)]\s*|^[a-z][.)]\s+/i, "").trim();
  }

  function templateFromHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const lines = [];
    const tables = Array.from(doc.querySelectorAll("table")).filter((t) => !t.parentElement.closest("table"));
    tables.forEach((tbl) => {
      const rows = Array.from(tbl.rows);
      const firsts = rows.map((r) => (r.cells[0] ? r.cells[0].textContent.trim() : ""));
      const identLike = firsts.filter((f) => IDENT_RE.test(f)).length;
      const kompLike = firsts.filter((f) => KOMP_RE.test(f)).length;
      if (identLike >= Math.max(2, rows.length * 0.5) && kompLike < 2) return; // tabel identitas → dilewati
      let cur = null;
      rows.forEach((r, ri) => {
        const cells = Array.from(r.cells);
        if (!cells.length) return;
        const c0 = cleanLabel(cells[0].textContent);
        if (ri === 0 && /komponen|no\.?$|^no$/i.test(c0)) return; // baris judul tabel
        if (cells.length === 1) {
          if (c0 && c0.length < 80) { lines.push("# " + c0); cur = c0; }
          return;
        }
        if (c0 && c0 !== cur) { lines.push("# " + c0); cur = c0; }
        const subs = subLabelsFromCell(cells[cells.length > 2 ? 1 : 1]);
        if (cells.length > 2 && !subs.length) { const c1 = cleanLabel(cells[1].textContent); if (c1 && c1.length < 80) subs.push(c1); }
        subs.forEach((s) => lines.push("- " + s));
      });
    });
    if (!lines.some((l) => l.startsWith("- "))) {
      // Tanpa tabel: pakai judul (h1–h3) sebagai komponen dan judul lebih kecil/teks tebal sebagai sub-komponen
      const out = [];
      doc.body.querySelectorAll("h1,h2,h3,h4,p,li").forEach((el) => {
        const tag = el.tagName.toLowerCase();
        const txt = cleanLabel(el.textContent);
        if (!txt || txt.length > 90) return;
        if (tag === "h1" || tag === "h2") out.push("# " + txt);
        else if (tag === "h3" || tag === "h4") out.push((out.length ? "- " : "# ") + txt);
        else {
          const strong = el.querySelector("strong,b");
          if (strong && cleanLabel(strong.textContent).length > 2 && cleanLabel(strong.textContent).length < 70) {
            const s = cleanLabel(strong.textContent);
            if (/^[A-Z0-9 .,&()-]+$/.test(s) && s.length > 3) out.push("# " + s.charAt(0) + s.slice(1).toLowerCase());
            else out.push((out.length ? "- " : "# ") + s);
          }
        }
      });
      return dedupeLines(out).join("\n");
    }
    return dedupeLines(lines).join("\n");
  }

  function subLabelsFromCell(cell) {
    const subs = [];
    const blocks = cell.querySelectorAll("p,li");
    (blocks.length ? Array.from(blocks) : [cell]).forEach((p) => {
      const strong = p.querySelector("strong,b");
      let lab = "";
      if (strong) lab = cleanLabel(strong.textContent);
      if (!lab) { const t = p.textContent.trim(); const m = t.match(/^([^:]{3,60}):/); if (m) lab = cleanLabel(m[1]); }
      if (!lab && p.textContent.trim().length && p.textContent.trim().length <= 50 && blocks.length > 1) lab = cleanLabel(p.textContent);
      if (lab && lab.length >= 3 && lab.length <= 70 && !subs.includes(lab)) subs.push(lab);
    });
    return subs;
  }

  function templateFromPlain(text) {
    if (/^\s*#/m.test(text)) return text; // sudah format GenRPM / markdown
    const out = [];
    text.split(/\r?\n/).forEach((raw) => {
      const l = raw.trim();
      if (!l) return;
      if (/^[-*•]\s+/.test(l)) out.push("- " + cleanLabel(l.replace(/^[-*•]\s+/, "")));
      else if (/^([A-Z]\.|[IVX]+\.)\s+/.test(l) || (/^[A-Z0-9 .,&()-]{4,}$/.test(l))) out.push("# " + cleanLabel(l.replace(/^([A-Z]\.|[IVX]+\.)\s+/, "")));
      else if (l.length <= 70) out.push("- " + cleanLabel(l));
    });
    return out.join("\n");
  }
  function dedupeLines(lines) {
    const out = [];
    lines.forEach((l) => { if (out[out.length - 1] !== l) out.push(l); });
    // hapus komponen kosong berturut-turut
    return out.filter((l, i) => !(l.startsWith("# ") && out[i + 1] && out[i + 1].startsWith("# ") && false));
  }

  /* =================================================================
     STATE & DRAF OTOMATIS
     ================================================================= */
  function collectState() {
    const s = {};
    IDENTITY_IDS.forEach((id) => (s[id] = $(id).value.trim()));
    s.faseLabel = D.fase[s.fase].label;
    s.faseShort = s.faseLabel.split(" (")[0];
    s.jenjang = D.fase[s.fase].jenjang;
    s.k = D.ketunaan[s.ketunaan];
    s.muridList = s.murid.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    s.dpl = Array.from(document.querySelectorAll(".dpl:checked")).map((c) => c.value);
    const { cps, tps } = selectedCPTP();
    s.cpSel = cps; s.tpSel = tps;
    s.books = allBooks().filter((b) => Array.from(document.querySelectorAll(".bookChk:checked")).some((c) => c.value === b.id));
    s.fields = {};
    document.querySelectorAll("textarea[data-key]").forEach((t) => (s.fields[t.dataset.key] = t.value));
    s.customs = Array.from(document.querySelectorAll("#customArea textarea")).map((t) => ({ key: t.dataset.key, label: t.dataset.label }));
    // waktu
    const a = s.alokasi;
    const jp = +(a.match(/(\d+)\s*JP/i) || [])[1] || 2;
    const ptm = a.match(/(\d+)\s*(?:x\s*)?pertemuan/i) || a.match(/x\s*(\d+)/i);
    const pt = ptm ? +ptm[1] : 2;
    const mn = +(a.match(/@?\s*(\d+)\s*menit/i) || [])[1] || (s.fase === "Fondasi" ? 30 : ["A", "B", "C"].includes(s.fase) ? 35 : 40);
    s.jp = jp; s.pertemuan = Math.min(Math.max(pt, 1), 8); s.menit = mn;
    if (!s.alokasi) s.alokasiAuto = `${jp} JP x ${s.pertemuan} pertemuan (@${mn} menit)`;
    // konteks materi
    const mParts = (s.materi || "").split(/\s+[-–]\s+/).map((x) => x.trim()).filter(Boolean);
    s.materiX = mParts.length > 1 ? mParts[0].replace(/\s*\(([^)]*)\)/g, (m0, g) => (g.split(" ").length > 2 ? "" : m0)).trim() : s.materi || "materi ini";
    const pars = (s.materiEsensial.match(/\(([^)]+)\)/g) || []).map((x) => x.slice(1, -1)).filter((x) => /,|\bdan\b/.test(x));
    s.contoh = mParts.length > 1 ? mParts.slice(1) : pars.length ? pars[0].split(/,|\bdan\b/).map((x) => x.trim()).filter(Boolean) : [];
    s.fokus = s.materiEsensial.split(/;|\.\s/).map((x) => x.trim().replace(/\.$/, "")).filter(Boolean);
    return s;
  }

  function ensureDefaultDPL(s) {
    if (!document.querySelector(".dpl:checked")) ["DPL3", "DPL5", "DPL6", "DPL8"].forEach((k) => { const c = document.querySelector(`.dpl[value=${k}]`); if (c) c.checked = true; });
    if (!s.lintas) { const l = suggestLintas(s.mapel); if (l) $("lintas").value = l; }
  }

  function suggestLintas(mapel) {
    if (/IPA|Alam/.test(mapel)) return "Bahasa Indonesia (menyampaikan hasil pengamatan); Seni Rupa (membuat poster/kolase); Matematika (menghitung dan mengelompokkan)";
    if (/Matematika/.test(mapel)) return "IPA (mengukur benda nyata); Bahasa Indonesia (membaca soal cerita); Keterampilan (transaksi jual beli)";
    if (/Bahasa/.test(mapel)) return "Seni Rupa (bercerita dengan gambar); IPS (lingkungan sekitar)";
    if (/IPS|Sosial/.test(mapel)) return "Bahasa Indonesia (bercerita); Pendidikan Pancasila (hidup rukun)";
    if (/PJOK/.test(mapel)) return "IPA (kesehatan tubuh); Matematika (menghitung gerakan)";
    if (/Seni/.test(mapel)) return "Bahasa Indonesia (menceritakan karya); IPA (bahan alam)";
    if (/Keterampilan/.test(mapel)) return "Matematika (menghitung kebutuhan bahan dan biaya); Bahasa Indonesia (menyusun laporan sederhana); Seni Rupa (desain produk)";
    if (/Agama/.test(mapel)) return "Pendidikan Pancasila (hidup rukun); Seni Musik (menyanyikan lagu rohani)";
    if (/^PKK/.test(mapel)) return "Bahasa Indonesia (komunikasi sehari-hari); PJOK (gerak dan kesehatan diri)";
    return "Bahasa Indonesia (menyampaikan gagasan); Seni Rupa (membuat karya)";
  }

  function modelFor(s) {
    if (/IPA|Alam/.test(s.mapel)) return s.pertemuan >= 3 ? "Pembelajaran Berbasis Proyek (PjBL) sederhana dengan inkuiri terbimbing" : "Inkuiri terbimbing (guided inquiry) dengan praktik langsung";
    if (/Matematika/.test(s.mapel)) return "Pembelajaran kontekstual (CTL) dengan benda konkret – semi konkret – abstrak";
    if (/Bahasa/.test(s.mapel)) return "Pembelajaran berbasis teks/genre dengan media gambar";
    if (/Keterampilan|Vokasional/.test(s.mapel)) return "Pembelajaran Berbasis Proyek (PjBL) dengan analisis tugas dan praktik kerja bertahap";
    if (/^Seni/.test(s.mapel)) return "Pembelajaran berbasis praktik/pertunjukan (demonstrasi – imitasi – eksplorasi – unjuk karya)";
    if (/Agama/.test(s.mapel)) return "Pembelajaran kontekstual dengan cerita, keteladanan, dan pembiasaan";
    if (/^PKK/.test(s.mapel)) return "Latihan terstruktur individual (analisis tugas, modelling, prompting bertahap, dan penguatan)";
    return "Pembelajaran Berbasis Masalah (PBL) sederhana dengan pendekatan konkret";
  }
  function arrow(t) { return (t.split("→")[1] || t).trim().replace(/\.$/, ""); }

  /* ---------------- Pembantu draf ---------------- */
  // "Akidah: Mengenali ..." → "mengenali ..."
  function strip(x) {
    if (!x) return "";
    const t = String(x).replace(/^[^:]{3,60}:\s*/, "").trim().replace(/\.$/, "");
    return t ? t.charAt(0).toLowerCase() + t.slice(1) : "";
  }
  function relevansi(mapel, M) {
    if (/IPA|Alam/.test(mapel)) return `membantu murid memahami gejala di sekitarnya serta menjaga kesehatan dan keselamatan diri di rumah dan sekolah melalui ${M}.`;
    if (/Matematika/.test(mapel)) return `dipakai saat berbelanja, menghitung uang dan waktu, serta mengukur benda di rumah.`;
    if (/Bahasa/.test(mapel)) return `dipakai untuk berkomunikasi dan memahami informasi dalam kehidupan sehari-hari.`;
    if (/Agama/.test(mapel)) return `menjadi dasar beribadah dan berperilaku baik di rumah, sekolah, dan masyarakat.`;
    if (/Keterampilan/.test(mapel)) return `menjadi bekal kemandirian, keterampilan kerja, dan peluang wirausaha setelah lulus.`;
    if (/^PKK/.test(mapel)) return `meningkatkan kemandirian murid dalam aktivitas sehari-hari.`;
    if (/^Seni/.test(mapel)) return `menjadi sarana mengekspresikan diri dan menghargai karya/budaya di sekitar.`;
    if (/PJOK/.test(mapel)) return `menjaga kebugaran, kesehatan, dan keselamatan saat bergerak sehari-hari.`;
    if (/IPS|Pancasila/.test(mapel)) return `membantu murid hidup rukun dan berperan di lingkungan keluarga dan masyarakat.`;
    return `berkaitan langsung dengan pengalaman murid sehari-hari di rumah dan sekolah.`;
  }
  function topikKe(i, n, M, contoh) {
    if (n === 1) return M;
    if (i === 0) return `Mengenal ${M}${contoh[0] && contoh[0] !== M ? " (" + contoh.slice(0, 3).join(", ") + ")" : ""}`;
    if (i === n - 1) return `Menyajikan karya/hasil belajar tentang ${M}`;
    return `Mempraktikkan dan mendalami ${M}${contoh[i] && contoh[i] !== M ? " — " + contoh[i] : ""}`;
  }
  function splitPerPertemuan(tps, n) {
    const out = Array.from({ length: n }, () => []);
    if (tps.length >= n) tps.forEach((t, i) => out[Math.min(n - 1, Math.floor((i * n) / tps.length))].push(t));
    else for (let p = 0; p < n; p++) out[p].push(tps[Math.min(tps.length - 1, Math.floor((p * tps.length) / n))]);
    return out;
  }
  function cap(x) { x = String(x || ""); return x.charAt(0).toUpperCase() + x.slice(1); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // Materi & materi esensial tidak boleh kosong saat draf otomatis
  function ensureMateri() {
    const list = materiList(), cps = selectedCPTP().cps;
    let filled = false;
    if (!$("materi").value.trim()) {
      let m = null;
      if (cps.length) m = list.find((x) => x.esensial.toLowerCase().startsWith(cps[0].elemen.toLowerCase() + ":"));
      m = m || list[0];
      const cp = cps[0] || cpList()[0];
      $("materi").value = m ? m.judul : cp ? cp.elemen : `${$("mapel").value} ${D.fase[$("fase").value].label.split(" (")[0]}`;
      filled = true;
    }
    if (!$("materiEsensial").value.trim()) {
      const M = $("materi").value.trim();
      const m = findMateri(M);
      const base = m ? m.esensial.replace(/\.$/, "") : (() => { const cp = cps[0] || cpList()[0]; return cp ? `${cp.elemen}: ${M}` : M; })();
      const parts = M.split(/\s+[-–]\s+/).map((x) => x.trim()).filter(Boolean);
      let short = parts[0].replace(/\s*\([^)]*\)/g, "").trim();
      if (short.split(" ").length > 7) short = short.split(" ").slice(0, 7).join(" ");
      const subs = parts.slice(1);
      const lc = short.charAt(0).toLowerCase() + short.slice(1);
      const b2 = base.replace(/^Elemen\s+/i, "").replace(/\s+[-–]\s+/g, ", ");
      $("materiEsensial").value = subs.length && !/\(/.test(b2)
        ? `${b2.split(":")[0]}: ${short} (${subs.join(", ")}); konsep dan kosakata kunci ${lc}; penerapan ${lc} dalam kehidupan sehari-hari`
        : `${b2}; konsep dan kosakata kunci ${lc}; penerapan ${lc} dalam kehidupan sehari-hari`;
      filled = true;
    }
    if (filled) { renderCP(true); saveForm(); }
    return filled;
  }

  /* ---------------- LKPD bervariasi ---------------- */
  function buildLKPD(s, tpPer, contoh) {
    const M = s.materiX;
    const it = (contoh.length >= 2 ? contoh : [M]).slice(0, 5);
    const items = it.length >= 4 ? it : it.concat(["……………", "……………", "……………", "……………"]).slice(0, 4);
    const isIPA = /IPA|Alam/.test(s.mapel), isMat = /Matematika/.test(s.mapel), isBhs = /Bahasa/.test(s.mapel);
    const isKet = /Keterampilan|^PKK/.test(s.mapel), isSeni = /^Seni/.test(s.mapel), isAgama = /Agama/.test(s.mapel);
    const box = "☐";
    const A = [
      { j: "Tabel Pengamatan", ok: isIPA || isKet || !isMat, p: ["Amati benda/gambar yang disediakan guru.", "Tulis ciri yang kamu lihat, dengar, atau rasakan.", `Beri tanda ✓ bila termasuk ${M}.`],
        b: ["| No | Benda/Gambar | Ciri yang diamati | Termasuk? (✓) |", ...items.map((x, i) => `| ${i + 1} | ${x} | ……………………… | ${box} |`)] },
      { j: "Lengkapi Kalimat", ok: !isSeni, p: ["Baca kata di dalam kotak.", "Pilih kata yang tepat untuk melengkapi kalimat."],
        b: [`| Kotak kata: ${items.filter((x) => x !== "……………").join(" · ") || M} |`, `1. Contoh ${M} yang ada di sekitarku adalah ……………………`, `2. ${cap(items[0])} berguna untuk ……………………`, `3. Hari ini aku belajar tentang ……………………`] },
      { j: "Benar atau Salah", ok: true, p: ["Baca atau dengarkan pernyataan dari guru.", "Lingkari B jika benar, S jika salah. (Guru dapat menyesuaikan pernyataan.)"],
        b: ["| No | Pernyataan | Jawaban |", `| 1 | ${cap(items[0])} berkaitan dengan ${M}. | B / S |`, `| 2 | ${M} dapat kita temui dalam kehidupan sehari-hari. | B / S |`, `| 3 | ${isAgama ? "Perilaku baik membuat orang lain senang." : "Kita boleh bermain-main saat praktik."} | B / S |`, `| 4 | ${items[1] !== "……………" ? cap(items[1]) + " termasuk contoh " + M + "." : "……………………………"} | B / S |`] },
      { j: "Peta Pikiran", ok: !isMat, p: [`Tulis atau gambar hal-hal yang kamu ketahui tentang ${M} di setiap kotak.`],
        b: ["| Contoh | Ciri-ciri | Manfaat |", "| ………………… // ………………… | ………………… // ………………… | ………………… // ………………… |", `| Kotak tengah: ${M.toUpperCase()} | Pengalamanku | Pertanyaanku |`, "| ………………… // ………………… | ………………… // ………………… | ………………… // ………………… |"] },
      { j: "Urutkan Langkah", ok: isIPA || isKet || isAgama || isSeni, p: ["Perhatikan gambar/kalimat langkah kegiatan.", "Tulis angka 1–4 sesuai urutan yang benar."],
        b: ["| Urutan | Langkah kegiatan |", `| ( … ) | Menyiapkan alat dan bahan ${M} |`, "| ( … ) | Merapikan dan membersihkan tempat |", `| ( … ) | Melakukan kegiatan ${M} sesuai contoh guru |`, "| ( … ) | Memeriksa/menunjukkan hasil |"] },
      { j: "Hitung dan Catat", ok: isMat || isIPA || isKet, p: ["Hitung atau ukur benda yang disediakan guru.", "Tulis hasilnya di tabel."],
        b: ["| Benda | Banyak/Ukuran | Satuan | Keterangan |", ...items.map((x) => `| ${x} | ………… | ………… | ………………… |`)] },
      { j: "Teka-teki: Siapakah Aku?", ok: !isKet, p: ["Baca/dengarkan petunjuk.", "Tulis atau tempel gambar jawabannya."],
        b: ["| Petunjuk | Jawaban |", `| Aku berkaitan dengan ${M}. Aku sering kamu lihat di rumah. Siapakah aku? | ………………… |`, `| Aku berguna untuk manusia. Namaku diawali huruf "${(items[0] || "A").charAt(0).toUpperCase()}". | ………………… |`, "| Tulis teka-tekimu sendiri: ………………………………… | ………………… |"] },
      { j: "Rencana Proyek/Karya Mini", ok: isKet || isSeni || isIPA, p: ["Diskusikan bersama kelompok.", "Isi rencana sebelum mulai membuat karya."],
        b: ["| Nama karya | Alat & bahan | Langkah kerja | Pembagian tugas |", "| ………………… | 1. ……… // 2. ……… // 3. ……… | 1. ……… // 2. ……… // 3. ……… | ……………… // ……………… |"] },
      { j: "Wawancara Keluarga", ok: true, p: ["Tanyakan kepada orang tua/anggota keluarga.", "Tulis, gambar, atau rekam jawabannya."],
        b: ["| Pertanyaan | Jawaban keluarga |", `| Di mana kita bisa menemukan ${M} di rumah? | ………………………… |`, `| Apa manfaat ${M} bagi keluarga kita? | ………………………… |`, "| Apa yang bisa aku bantu di rumah? | ………………………… |"] },
      { j: "Cerita Bergambar", ok: isBhs || isAgama || !isMat, p: [`Gambar pengalamanmu tentang ${M} di kotak.`, "Tulis 1–3 kalimat untuk menceritakan gambarmu."],
        b: ["| Gambarku |", "| // // // // |", "| Ceritaku: …………………………………………… // …………………………………………… |"] }
    ];
    const B = [
      { j: "Tarik Garis (Pasangkan)", ok: true, p: ["Lihat gambar di kiri.", "Tarik garis ke kata yang sesuai di kanan (boleh dengan bantuan guru)."],
        b: (() => { const sh = shuffle(items); return ["| Gambar | | Kata |", ...items.map((x, i) => `| (gambar ${x}) | •  ………  • | ${sh[i]} |`)]; })() },
      { j: "Tempel dan Kelompokkan", ok: !isMat, p: ["Gunting gambar yang disediakan guru.", "Tempel gambar ke kelompok yang tepat."],
        b: [`| Termasuk ${M} | Bukan ${M} |`, "| (tempel gambar) // // // | (tempel gambar) // // // |"] },
      { j: "Lingkari Gambar yang Tepat", ok: true, p: [`Lihat gambar-gambar di bawah.`, `Lingkari gambar yang berkaitan dengan ${M}.`],
        b: [`| ${items.map((x) => "(gambar " + x + ")").join(" | ")} |`, "| " + items.map(() => "○").join(" | ") + " |"] },
      { j: "Warnai Gambar", ok: !isMat || isSeni, p: [`Warnai gambar ${items[0] !== "……………" ? items[0] : M} sesuai warna aslinya.`, "Tunjukkan hasilnya kepada guru/teman."],
        b: [`| (Gambar garis ${items[0] !== "……………" ? items[0] : M} untuk diwarnai — disiapkan guru) // // // // |`] },
      { j: "Tunjuk dan Sebutkan", ok: true, p: ["Guru menyebutkan nama benda/gambar.", "Murid menunjuk, menyebut, atau memberi isyarat. Guru memberi tanda ✓."],
        b: ["| Benda/Gambar | Menunjuk | Menyebut/Isyarat |", ...items.map((x) => `| ${x} | ${box} | ${box} |`)] },
      { j: "Baca dan Salin Kata", ok: isBhs || isAgama || isMat || !isKet, p: ["Baca/isyaratkan kata bersama guru.", "Salin kata di garis yang tersedia (boleh dengan menebalkan tulisan guru)."],
        b: items.filter((x) => x !== "……………").slice(0, 4).map((x) => `- ${x.split("").join(" ")}   →   ………………………`).concat(items.every((x) => x === "……………") ? [`- ${M.split("").join(" ")}   →   ………………………`] : []) },
      { j: "Ceklis Langkah Praktik", ok: isKet || isIPA || isSeni || /PJOK/.test(s.mapel), p: ["Lakukan setiap langkah bersama guru.", "Guru/murid memberi tanda ✓ sesuai kemampuan."],
        b: ["| Langkah | Bisa sendiri | Dengan bantuan |", `| 1. Menyiapkan alat dan bahan | ${box} | ${box} |`, `| 2. Mengikuti contoh guru | ${box} | ${box} |`, `| 3. Menyelesaikan kegiatan ${M} | ${box} | ${box} |`, `| 4. Merapikan tempat | ${box} | ${box} |`] },
      { j: "Kolase Sederhana", ok: isSeni || isIPA || !isMat, p: [`Tempel potongan gambar/bahan tentang ${M} di kotak.`, "Ceritakan karyamu kepada guru."],
        b: [`| Kolase ${M} (tempel di sini) // // // // // |`] },
      { j: "Hitung Benda Nyata", ok: isMat, p: ["Hitung benda yang disediakan guru.", "Lingkari angka yang sesuai."],
        b: ["| Benda | Lingkari banyaknya |", ...items.map((x) => `| ${x} | 1  2  3  4  5 |`)] }
    ];
    const poolA = shuffle(A.filter((x) => x.ok)), poolB = shuffle(B.filter((x) => x.ok));
    const out = [];
    for (let p = 0; p < s.pertemuan; p++) {
      const a = poolA[p % poolA.length], b = poolB[p % poolB.length];
      out.push(`## LKPD ${p + 1} — ${M}`);
      out.push(`Nama: ……………………………   Kelas: ${s.kelas}   Tanggal: ………………`);
      out.push(`Mata pelajaran: ${s.mapel} (${s.faseShort})`);
      out.push(`Tujuan: ${(tpPer[p] || []).join(" ") || "Murid memahami " + M + "."}`);
      out.push(`### KEGIATAN 1 — ${a.j.toUpperCase()} (Jalur A)`);
      out.push("Petunjuk:");
      a.p.forEach((x) => out.push(`- ${x}`));
      out.push(...a.b);
      out.push(`### KEGIATAN 2 — ${b.j.toUpperCase()} (Jalur B / dengan bantuan)`);
      out.push("Petunjuk:");
      b.p.forEach((x) => out.push(`- ${x}`));
      out.push(...b.b);
      out.push("### REFLEKSI DIRI");
      out.push("| Aku dapat … | Bisa sendiri 😊 | Dengan bantuan 🙂 | Belum bisa 😟 |");
      out.push(`| Mengerjakan kegiatan tentang ${M} | ${box} | ${box} | ${box} |`);
      out.push(`| Menceritakan hasil kerjaku | ${box} | ${box} | ${box} |`);
      out.push("Paraf guru: …………   Paraf orang tua: …………");
    }
    return out.join("\n");
  }

  function buildDraft(s) {
    const k = s.k, M = s.materiX;
    const contoh = s.contoh.length ? s.contoh : [M];
    const contohTxt = s.contoh.length ? s.contoh.join(", ") : M;
    const fokus1 = strip(s.fokus[0]) || `konsep ${M}`;
    const fokus2 = strip(s.fokus.find((x) => /^penerapan/i.test(x)) || s.fokus[1]) || `contoh ${M} di lingkungan sekitar`;
    const isIPA = /IPA|Alam/.test(s.mapel);
    const d = {};

    d.profil = [
      `Murid ${s.faseLabel} (kelas ${s.kelas}) mata pelajaran ${s.mapel}. ${k.deskripsi}`,
      s.muridList.length ? `Jumlah murid: ${s.muridList.length} orang (${s.muridList.join(", ")}).` : null,
      `Jalur A: ${k.jalurA}`,
      `Jalur B: ${k.jalurB}`,
      `Kebutuhan komunikasi bersama: ${k.komunikasi}`,
      `Kesiapan belajar: diketahui melalui asesmen awal (tanya jawab, menunjuk gambar, atau mengamati benda nyata) tentang ${M}.`
    ].filter(Boolean).join("\n");

    const cpData = cpList();
    const elMateri = ((s.materiEsensial.match(/^([^:]{3,60}):/) || [])[1] || "").toLowerCase();
    const cpUse = cpData.find((c) => elMateri && c.elemen.toLowerCase() === elMateri) || cpData[0];
    if (s.cpSel.length) d.cp = s.cpSel.map((c) => `${c.elemen}: ${c.teks}`).join("\n");
    else if (cpData.length) d.cp = `${cpUse.elemen}: ${cpUse.teks}`;
    else d.cp = `CP ${s.mapel} ${s.faseLabel} sesuai keputusan CP yang berlaku (salin teks resmi dari buku/dokumen CP).`;

    let tps = s.tpSel.slice();
    if (!tps.length && cpData.length) tps = [cpUse.tp[0], cpUse.tp[1] || cpUse.tp[0], (cpData.find((c) => /Komunikasi/i.test(c.elemen)) || cpUse).tp[0]].map((t) => t.replace(/\{materi\}/g, M));
    if (!tps.length) tps = [`Murid mampu menjelaskan ${fokus1} dengan bahasa/cara sendiri.`, `Murid mampu menunjukkan atau mengelompokkan contoh ${M} di lingkungan sekitar.`, `Murid mampu menyajikan hasil belajar ${M} secara lisan, gambar, atau isyarat.`];
    tps = Array.from(new Set(tps));
    if (!s.tpSel.length) {
      const extra = [`Murid mampu mempraktikkan/menerapkan ${M} dalam kegiatan sederhana dengan bantuan yang makin berkurang.`, `Murid mampu menyajikan hasil belajar tentang ${M} secara lisan, tulisan, gambar, atau isyarat.`];
      while (tps.length < Math.min(s.pertemuan, 5) && extra.length) { const x = extra.shift(); if (!tps.includes(x)) tps.push(x); }
    }
    const tpPer = splitPerPertemuan(tps, s.pertemuan);
    d.tp = tps.map((t) => `- ${t}`).join("\n") + (s.pertemuan > 1
      ? "\n## Tujuan pembelajaran per pertemuan\n" + tpPer.map((list, i) => `Pertemuan ${i + 1}: ${list.join(" ")}`).join("\n")
      : "");

    // Analisis materi pelajaran
    const ml = materiList();
    const mi = ml.findIndex((x) => x.judul.toLowerCase() === (s.materi || "").toLowerCase());
    const prev = mi > 0 ? ml[mi - 1].judul : null, next = mi >= 0 && mi < ml.length - 1 ? ml[mi + 1].judul : null;
    const prosedural = /Keterampilan|^PKK|Seni|PJOK/.test(s.mapel) ? `langkah kerja/praktik ${M} secara bertahap` : isIPA ? `langkah mengamati, mencoba, dan mencatat hasil tentang ${M}` : `langkah mengamati, mengelompokkan, dan menyajikan ${M}`;
    const dplNama = (s.dpl.length ? s.dpl : ["DPL3", "DPL5", "DPL6", "DPL8"]).map((x) => ((D.dpl.find((y) => y.kode === x) || {}).nama || x).replace(" terhadap Tuhan YME", ""));
    d.analisisMateri = [
      `Materi: ${M}`,
      `Materi esensial: ${s.materiEsensial || fokus1}`,
      `Jenis pengetahuan: faktual (nama, contoh, dan kosakata kunci ${M}); konseptual (${fokus1}); prosedural (${prosedural}); metakognitif (menyadari cara belajar dan kesulitan yang dialami).`,
      `Relevansi dengan kehidupan nyata: ${relevansi(s.mapel, M)}`,
      `Tingkat kesulitan: sedang bagi murid Jalur A (${arrow(k.jalurA)}); disederhanakan bagi murid Jalur B (${arrow(k.jalurB)}).`,
      "Struktur materi:",
      prev ? `-- Prasyarat: ${prev}` : `-- Prasyarat: pengalaman murid sehari-hari yang berkaitan dengan ${M}`,
      `-- Inti: ${fokus1}${s.fokus[1] ? "; " + strip(s.fokus[1]) : ""}`,
      `-- Penerapan: ${fokus2}`,
      next ? `-- Lanjutan: ${next}` : `-- Lanjutan: pendalaman dan penerapan ${M} dalam proyek/kegiatan sehari-hari`,
      `Integrasi nilai dan karakter: ${dplNama.join(", ")}.`
    ].join("\n");

    // Topik pembelajaran
    d.topik = s.pertemuan > 1
      ? [`${M}`, ...Array.from({ length: s.pertemuan }, (_, i) => `- Pertemuan ${i + 1}: ${topikKe(i, s.pertemuan, M, contoh)}`)].join("\n")
      : `${M}\n- Fokus: ${fokus1}`;

    d.praktik = [
      `Model: ${modelFor(s)}.`,
      "Pendekatan: Pembelajaran Mendalam — berkesadaran (mindful), bermakna (meaningful), dan menggembirakan (joyful).",
      "Metode: demonstrasi, tanya jawab, praktik langsung" + (isIPA ? "/percobaan sederhana" : "") + ", diskusi kelompok kecil, dan presentasi hasil.",
      "Strategi diferensiasi:",
      `- Konten: Jalur A → ${arrow(k.jalurA)}; Jalur B → ${arrow(k.jalurB)}.`,
      "- Proses: bimbingan bertahap (modelling → praktik terbimbing → mandiri) dengan tugas berdurasi pendek.",
      "- Produk: murid memilih cara menunjukkan pemahaman (lisan, gambar, menempel, isyarat, atau praktik).",
      "Akomodasi khusus:",
      ...k.akomodasi.map((x) => `- ${x}`)
    ].join("\n");

    d.kemitraan = [
      `- Orang tua/wali: mendampingi murid mengamati ${contohTxt} di rumah dan mengirimkan foto/cerita singkat ke guru.`,
      "- Guru Pendamping Khusus (GPK)/asisten guru: mendampingi murid Jalur B selama kegiatan inti.",
      isIPA ? "- Warga sekolah (penjaga kebun/laboran): membantu menyiapkan benda nyata dan area praktik." : "- Warga sekolah: membantu menyiapkan benda nyata dan area praktik.",
      `- Narasumber lokal (opsional): tokoh/pelaku di lingkungan sekitar yang berkaitan dengan ${M}.`
    ].join("\n");

    d.lingkungan = [
      `Ruang fisik: kelas dengan meja kelompok kecil, sudut belajar/area tenang, jalur bebas hambatan${isIPA ? ", serta halaman/kebun sekolah untuk pengamatan langsung" : ""}.`,
      "Ruang virtual: grup kelas bersama orang tua untuk berbagi foto hasil pengamatan dan video pembelajaran.",
      "Budaya belajar: aman bertanya, saling menghargai, rutinitas dan jadwal visual yang jelas, serta apresiasi setiap kemajuan."
    ].join("\n");

    d.digital = [...k.digital.map((x) => `- ${x}`), `- Video pendek tentang ${M} (pilih yang bertakarir/berbahasa sederhana).`, "- Dokumentasi foto/video hasil kerja murid sebagai portofolio digital."].join("\n");

    // ---- Pengalaman belajar per pertemuan (Awal – Inti – Penutup)
    const total = s.jp * s.menit;
    const t = (p) => Math.max(5, Math.round((total * p) / 5) * 5);
    const pick = (arr, i) => arr[i % arr.length];
    const praktikIni = isIPA ? `percobaan/pengamatan sederhana tentang ${M} dengan panduan langkah bergambar`
      : /Keterampilan|^PKK/.test(s.mapel) ? `praktik kerja ${M} secara bertahap (analisis tugas) dengan alat dan bahan nyata`
      : /Matematika/.test(s.mapel) ? `menghitung/mengukur benda nyata terkait ${M} (konkret → gambar → simbol)`
      : /^Seni/.test(s.mapel) ? `eksplorasi dan latihan berkarya ${M} meniru contoh guru lalu mengembangkan sendiri`
      : `kegiatan praktik ${M} menggunakan benda nyata dan kartu bergambar`;
    const lines = [];
    for (let p = 1; p <= s.pertemuan; p++) {
      const first = p === 1, last = p === s.pertemuan && s.pertemuan > 1;
      const cx = contoh[(p - 1) % contoh.length];
      lines.push(`## Pertemuan ${p} (${s.jp} JP × ${s.menit} menit = ${total} menit)`);
      if (s.pertemuan > 1) lines.push(`Fokus: ${topikKe(p - 1, s.pertemuan, M, contoh)}`);
      lines.push(`### KEGIATAN AWAL (Berkesadaran, Menggembirakan) · ${t(0.1)} menit`);
      lines.push("- Orientasi: salam, doa, cek kehadiran dan kesiapan murid; guru menunjukkan jadwal visual kegiatan hari ini.");
      lines.push(first ? `- Apersepsi: guru menunjukkan benda nyata/gambar ${cx} dan bertanya, "Pernahkah kamu melihat ini? Di mana?"` : "- Apersepsi: murid mengingat kembali kegiatan pertemuan sebelumnya dengan bantuan foto/hasil karya.");
      lines.push("- Motivasi: " + pick(["lagu/tepuk semangat yang berkaitan dengan materi", "permainan tebak benda dalam kotak misteri", "cerita pendek bergambar yang dekat dengan kehidupan murid", "video singkat yang menarik (1–2 menit)"], p - 1) + ".");
      lines.push("- Guru menyampaikan tujuan pembelajaran hari ini dengan kalimat sederhana, gambar, dan/atau isyarat.");
      lines.push(`### KEGIATAN INTI · ${t(0.25) + t(0.4) + t(0.1)} menit`);
      lines.push(`Memahami (Berkesadaran, Bermakna) – ${t(0.25)} menit:`);
      if (first) {
        lines.push(`- Murid mengamati benda nyata/gambar/video tentang ${M}${s.contoh.length ? ` (${contohTxt})` : ""} menggunakan panca indra yang berfungsi.`);
        lines.push(`- Guru menjelaskan ${fokus1} dengan contoh konkret dan kosakata kunci.`);
      } else {
        lines.push(`- ${pick(["Permainan tebak gambar/kartu", "Kuis lisan berhadiah stiker", "Menyusun ulang kartu urutan"], p)} untuk mengulang konsep kunci ${M}.`);
        lines.push(`- Guru dan murid mendalami ${last ? fokus2 : strip(s.fokus[1]) || fokus2} melalui tanya jawab dan contoh nyata.`);
      }
      lines.push(`-- Jalur A: ${arrow(k.jalurA)}.`);
      lines.push(`-- Jalur B: ${arrow(k.jalurB)}.`);
      lines.push(`Mengaplikasi (Bermakna, Menggembirakan) – ${t(0.4)} menit:`);
      if (last) {
        lines.push(`- Murid menyelesaikan produk sederhana (poster/kolase/foto berlabel/karya) tentang ${M}.`);
        lines.push("- Galeri berjalan: murid menyajikan hasil karya kepada teman secara lisan, gambar, atau isyarat.");
      } else if (first) {
        lines.push(`- Dalam kelompok kecil, murid mengerjakan LKPD ${p}: mengelompokkan/memasangkan kartu atau benda ${contohTxt}.`);
        lines.push("-- Jalur A: mengerjakan Kegiatan 1 pada LKPD secara mandiri/berpasangan.");
        lines.push("-- Jalur B: mengerjakan Kegiatan 2 pada LKPD dengan benda nyata dan bantuan GPK.");
      } else {
        lines.push(`- Murid melakukan ${praktikIni}.`);
        lines.push(`- Murid mencatat/menempel hasil kegiatan pada LKPD ${p} sesuai jalurnya.`);
      }
      lines.push(`Merefleksi (Berkesadaran) – ${t(0.1)} menit:`);
      lines.push("- Murid menunjuk emotikon yang menggambarkan perasaannya setelah belajar.");
      lines.push('- Pertanyaan refleksi: "Apa yang kamu pelajari hari ini?" dan "Bagian mana yang paling kamu sukai/sulit?"');
      lines.push(`### KEGIATAN PENUTUP (Bermakna, Menggembirakan) · ${t(0.15)} menit`);
      lines.push("- Umpan balik konstruktif: guru memberi pujian spesifik dan saran perbaikan kepada setiap murid/kelompok.");
      lines.push(last ? "- Menyimpulkan seluruh rangkaian pembelajaran bersama murid dengan bantuan gambar/hasil karya." : "- Menyimpulkan pembelajaran hari ini bersama murid dengan bantuan gambar/kartu kata.");
      lines.push(p < s.pertemuan ? "- Perencanaan berikutnya: murid diajak memilih kegiatan/bahan untuk pertemuan selanjutnya; tugas ringan bersama orang tua." : "- Perencanaan berikutnya: murid menyampaikan hal yang ingin dipelajari lebih lanjut; apresiasi hasil karya.");
      lines.push("- Doa dan salam penutup.");
    }
    d.pengalaman = lines.join("\n");

    d.asesmen = [
      "Asesmen pada Awal Pembelajaran:",
      `- Diagnostik kognitif: tanya jawab/menunjuk gambar untuk mengetahui pengetahuan awal murid tentang ${M}.`,
      "- Diagnostik non-kognitif: mengamati minat, kondisi emosi, dan kesiapan belajar (assessment for learning).",
      "Asesmen pada Proses Pembelajaran:",
      "- Observasi keterlibatan, ketepatan, dan kemandirian murid selama kegiatan (lembar observasi pada lampiran).",
      "- Penilaian diri dengan emotikon pada LKPD dan umpan balik langsung secara lisan/isyarat/gambar (assessment as learning).",
      "Asesmen pada Akhir Pembelajaran:",
      `- Unjuk kerja: murid menunjukkan/menyebutkan/mempraktikkan ${contohTxt} dengan tepat (assessment of learning).`,
      `- Produk: LKPD dan poster/kolase/karya tentang ${M}; dikumpulkan sebagai portofolio.`,
      `Akomodasi asesmen: ${k.akomodasi[k.akomodasi.length - 1]}.`,
      "## Rubrik Penilaian",
      "| Kriteria | 4 (Sangat Baik) | 3 (Baik) | 2 (Cukup) | 1 (Perlu Bimbingan) |",
      `| Pemahaman ${M} | Menjelaskan/menunjukkan dengan tepat secara mandiri | Tepat dengan sedikit bantuan | Sebagian tepat dengan bantuan | Belum tepat meski dibantu |`,
      "| Praktik/mengerjakan LKPD | Semua benar dan mandiri | Sebagian besar benar | Separuh benar dengan bantuan | Membutuhkan bimbingan penuh |",
      "| Komunikasi hasil | Jelas dan runtut (lisan/isyarat/gambar) | Cukup jelas | Kurang jelas, perlu dipancing | Belum dapat menyampaikan |",
      "| Kemandirian & kerja sama | Aktif dan membantu teman | Aktif bila diajak | Perlu dorongan | Belum terlibat |"
    ].join("\n");

    d.lkpd = buildLKPD(s, tpPer, contoh);

    d.sumber = [
      ...s.books.map((b) => b.md ? `- Badan Standar, Kurikulum, dan Asesmen Pendidikan. (2025). ${b.judul} (${b.info.replace(" · Panduan BSKAP 2025", "")}). Kemendikdasmen.` : `- Buku ${b.judul}${b.info ? ` (${b.info})` : ""}.`),
      `- Benda nyata di lingkungan sekolah dan rumah (${contohTxt}).`,
      `- Video pembelajaran tentang ${M} (bertakarir/berbahasa sederhana).`,
      "- Kartu gambar dan kartu kata buatan guru."
    ].join("\n");

    // komponen tambahan dari template
    s.customs.forEach((c) => (d[c.key] = draftCustom(c.label, s, d)));
    return d;
  }

  function draftCustom(label, s, d) {
    const l = label.toLowerCase(), M = s.materiX, contohTxt = s.contoh.length ? s.contoh.join(", ") : M;
    if (/kompetensi awal|prasyarat|pengetahuan awal/.test(l)) return `- Murid sudah mengenal benda-benda di sekitarnya yang berkaitan dengan ${M}.\n- Murid dapat mengikuti instruksi sederhana satu-dua langkah.`;
    if (/sarana|prasarana|alat|bahan|media/.test(l)) return `- Benda nyata: ${contohTxt}\n- Kartu gambar dan kartu kata\n- Lembar kerja bergambar\n- Laptop/LCD atau gawai untuk video\n- Kertas manila, lem, gunting, spidol`;
    if (/pemahaman bermakna/.test(l)) return `- ${s.fokus[0] ? s.fokus[0].charAt(0).toUpperCase() + s.fokus[0].slice(1) : M} dapat ditemui dan dimanfaatkan dalam kehidupan sehari-hari.`;
    if (/pemantik/.test(l)) return `- Pernahkah kamu melihat ${s.contoh[0] || M}? Di mana?\n- Menurutmu, bagaimana ${M} terjadi?\n- Apa manfaatnya bagi kita sehari-hari?`;
    if (/pengayaan|remedial|tindak lanjut/.test(l)) return `Pengayaan: murid yang sudah mencapai TP membuat poster/cerita bergambar tentang ${M} untuk dibagikan ke kelas.\nRemedial: pengulangan dengan benda nyata dan bimbingan individual untuk murid yang belum mencapai TP.`;
    if (/refleksi guru|refleksi pendidik/.test(l)) return "- Apakah semua murid terlibat aktif sesuai jalurnya?\n- Akomodasi mana yang paling membantu dan mana yang perlu diubah?\n- Apa yang perlu diperbaiki pada pertemuan berikutnya?";
    if (/refleksi/.test(l)) return "- Murid: menunjuk emotikon perasaan dan menyebutkan satu hal yang dipelajari.\n- Guru: mencatat keberhasilan dan hambatan tiap murid untuk perbaikan pembelajaran.";
    if (/glosarium|kosakata/.test(l)) return (s.contoh.length ? s.contoh : [M]).map((c) => `- ${c}: (tuliskan arti sederhana + gambar/isyarat)`).join("\n");
    if (/lkpd|lembar kerja/.test(l)) return `## Lembar Kerja: ${M}\n- Petunjuk bergambar 1–3 langkah\n- Kegiatan: tempel/pasangkan gambar ${contohTxt} sesuai kelompoknya\n- Kolom gambar/tulisan hasil pengamatan`;
    if (/daftar pustaka/.test(l)) return d.sumber;
    if (/lampiran/.test(l)) return "- Lembar observasi (terlampir)\n- Rubrik penilaian\n- Lembar kerja murid";
    return `- (Isi sesuai template: ${label})`;
  }

  /* ---------------- Mengisi kolom ---------------- */
  function fillFields(obj, opts) {
    opts = opts || {};
    const targets = Array.from(document.querySelectorAll("textarea[data-key]")).filter((t) => obj[t.dataset.key] != null && String(obj[t.dataset.key]).trim());
    const filled = targets.filter((t) => t.value.trim() && t.value.trim() !== String(obj[t.dataset.key]).trim());
    let overwrite = true;
    if (filled.length && !opts.onlyEmpty) overwrite = confirm(`${filled.length} kolom sudah berisi teks.\n\nOK = timpa semua kolom\nBatal = hanya isi kolom yang masih kosong`);
    if (opts.onlyEmpty) overwrite = false;
    targets.forEach((t) => { if (overwrite || !t.value.trim()) t.value = String(obj[t.dataset.key]).trim(); });
    if (obj.materiEsensial && !$("materiEsensial").value.trim()) $("materiEsensial").value = obj.materiEsensial;
    if (obj.lintasMapel && !$("lintas").value.trim()) $("lintas").value = obj.lintasMapel;
    saveForm();
  }

  /* =================================================================
     ISI DARI INTERNET
     ================================================================= */
  async function isiDariInternet() {
    const btn = $("btnInternet");
    ensureMateri();
    const st0 = collectState();
    ensureDefaultDPL(st0);
    const s = collectState();
    btn.disabled = true;
    setStatus("statusIsi", "Mencari rujukan di internet (Wikipedia bahasa Indonesia)…");
    try {
      const n = await isiDariWikipedia(s);
      setStatus("statusIsi", `Selesai: draf diisi dan ${n} rujukan daring ditambahkan ke Sumber Belajar. Periksa kembali isinya sebelum dipakai.`);
    } catch (e) {
      fillFields(buildDraft(s));
      setStatus("statusIsi", "Rujukan internet tidak didapat (" + e.message + "). Kolom diisi dengan Draf Otomatis.", true);
    } finally {
      btn.disabled = false;
    }
  }

  async function isiDariWikipedia(s) {
    const base = "https://id.wikipedia.org/w/api.php?format=json&origin=*";
    const queries = Array.from(new Set([s.materi, s.materiX, `${s.materiX} ${s.mapel.replace(/\s*\(.*\)/, "")}`].filter(Boolean)));
    let hits = [];
    for (const q of queries) {
      const sr = await fetch(`${base}&action=query&list=search&srlimit=3&srsearch=${encodeURIComponent(q)}`).then((r) => r.json());
      hits = ((sr.query && sr.query.search) || []).slice(0, 3);
      if (hits.length) break;
    }
    const tgl = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const q = encodeURIComponent(s.materiX);
    const cari = [
      `- Video pembelajaran: YouTube — https://www.youtube.com/results?search_query=${encodeURIComponent(s.materiX + " untuk anak")}`,
      `- Gambar/media: Google Gambar — https://www.google.com/search?tbm=isch&q=${q}`,
      `- Rumah Belajar Kemendikdasmen — https://belajar.id (cari: ${s.materiX})`
    ];
    const d = buildDraft(s);
    let pages = [];
    if (hits.length) {
      const ex = await fetch(`${base}&action=query&prop=extracts|info&inprop=url&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(hits.map((h) => h.title).join("|"))}`).then((r) => r.json());
      pages = Object.values((ex.query && ex.query.pages) || {}).filter((p) => p.fullurl);
    }
    if (!pages.length) throw new Error("tidak ada artikel yang cocok");
    const ref = pages.map((p) => `- Wikipedia bahasa Indonesia. “${p.title}”. ${p.fullurl} (diakses ${tgl}).`);
    const ringkas = pages.filter((p) => p.extract).map((p) => `${p.title}: ${p.extract.split(/(?<=\.)\s/).slice(0, 3).join(" ")}`);
    d.sumber = [d.sumber, "## Rujukan daring", ...ref, "## Pencarian media pendukung", ...cari, ringkas.length ? "## Ringkasan bacaan guru" : null, ...ringkas].filter(Boolean).join("\n");
    d.digital = d.digital + "\n" + pages.map((p) => `- Bacaan daring untuk guru: ${p.title} (Wikipedia) — ${p.fullurl}`).join("\n");
    if (ringkas.length) d.analisisMateri = d.analisisMateri + `\nRingkasan konsep (sumber daring): ${ringkas[0].replace(/^[^:]+:\s*/, "")}`;
    fillFields(d);
    return pages.length;
  }

  /* =================================================================
     MODEL DOKUMEN
     ================================================================= */
  function buildModel(s) {
    const F = s.fields;
    const dash = (v) => (v && v.trim() ? v.trim() : "-");
    const identity = [
      ["Nama Penyusun", dash(s.guru)],
      ["Nama Sekolah", dash(s.sekolah)],
      ["Mata Pelajaran", s.mapel],
      ["Fase / Kelas", `${s.faseLabel} / ${s.kelas}`],
      ["Tahun Ajaran", s.tahun],
      ["Materi", dash(s.materi)],
      ["Materi Esensial", dash(s.materiEsensial)],
      ["Kaitan Lintas Mata Pelajaran", dash(s.lintas)],
      ["Alokasi Waktu", dash(s.alokasi)],
      ["Kebutuhan Khusus (Ketunaan)", s.ketunaan]
    ];
    const contentFor = (key) => {
      if (key === "dpl") {
        const list = s.dpl.length ? s.dpl : ["DPL3", "DPL5", "DPL6", "DPL8"];
        return list.map((k) => { const d = D.dpl.find((x) => x.kode === k); return `- ${d.nama}: ${DPL_DESC[k].replace(/\{materi\}/g, s.materiX)}.`; }).join("\n");
      }
      if (key === "materi") return `Materi: ${dash(s.materi)}\nMateri esensial: ${dash(s.materiEsensial)}`;
      if (key === "lintas") return s.lintas ? s.lintas.split(/;\s*/).map((x) => `- ${x}`).join("\n") : "-";
      if (F[key] && F[key].trim()) return F[key];
      if (key === "analisisMateri") return `Materi: ${dash(s.materi)}\nMateri esensial: ${dash(s.materiEsensial)}`;
      if (key === "topik") return dash(s.materi);
      return "-";
    };
    const komponen = tplStructure.map((k) => ({
      nama: k.nama,
      subs: k.subs.map((sb) => ({ label: sb.label.toLowerCase() === k.nama.toLowerCase() ? "" : sb.label, blocks: parseMarkup(contentFor(sb.key)) }))
    }));
    const usesSumber = tplStructure.some((k) => k.subs.some((x) => x.key === "sumber"));
    const after = [];
    if (!usesSumber && F.sumber && F.sumber.trim()) after.push({ heading: "Sumber Belajar / Rujukan", blocks: parseMarkup(F.sumber) });

    const names = s.muridList.length ? s.muridList : ["", "", "", "", ""];
    const obs = ["| No | Nama Murid | Pemahaman | Praktik | Komunikasi | Kemandirian | Catatan |"].concat(names.map((n, i) => `| ${i + 1} | ${n} |  |  |  |  |  |`)).join("\n");
    const lampiran = [{
      heading: `Lampiran: Lembar Observasi — ${s.materi || "Materi"}`,
      blocks: parseMarkup(`Kelas: ${s.kelas}    Tanggal: ……………………\n${obs}\nKeterangan skor: 4 = mandiri & tepat; 3 = tepat dengan sedikit bantuan; 2 = sebagian tepat dengan bantuan; 1 = perlu bimbingan penuh.`)
    }];
    const usesLkpd = tplStructure.some((k) => k.subs.some((x) => x.key === "lkpd"));
    if (!usesLkpd && F.lkpd && F.lkpd.trim()) {
      const parts = [];
      F.lkpd.split(/\r?\n/).forEach((l) => { if (/^##\s*LKPD/i.test(l.trim()) || !parts.length) parts.push([]); parts[parts.length - 1].push(l); });
      parts.forEach((ls) => {
        const headLine = /^##\s*LKPD/i.test((ls[0] || "").trim()) ? ls.shift().trim().replace(/^##\s*/, "") : "Lembar Kerja Peserta Didik";
        lampiran.push({ heading: `Lampiran: ${headLine.replace(/^LKPD/i, "Lembar Kerja Peserta Didik (LKPD)")}`, blocks: parseMarkup(ls.join("\n")) });
      });
    }
    return {
      title: "RENCANA PEMBELAJARAN MENDALAM (RPM)",
      identity, komponen, after, lampiran,
      ttd: { kepsek: s.kepsek, guru: s.guru, nipK: s.nipKepsek, nipG: s.nipGuru, tempat: s.tempatTanggal, mapel: s.mapel }
    };
  }

  /* ---------------- Parser format khusus ---------------- */
  function parseMarkup(text) {
    const blocks = [];
    let table = null;
    (text || "").split(/\r?\n/).forEach((raw) => {
      const line = raw.trim();
      if (/^\|.*\|$/.test(line)) {
        if (/^\|[\s:|-]+\|$/.test(line)) return; // baris pemisah markdown
        const cells = line.slice(1, -1).split("|").map((c) => c.trim());
        if (!table) { table = { t: "table", rows: [] }; blocks.push(table); }
        table.rows.push(cells);
        return;
      }
      table = null;
      if (!line) return;
      if (/^###\s*/.test(line)) blocks.push({ t: "band", runs: runs(line.replace(/^###\s*/, ""), false) });
      else if (/^##\s*(Pertemuan|LKPD)\b/i.test(line)) blocks.push({ t: "hp", runs: runs(line.replace(/^##\s*/, ""), false) });
      else if (/^##\s*/.test(line)) blocks.push({ t: "h", runs: runs(line.replace(/^##\s*/, ""), false) });
      else if (/^--\s+/.test(line)) blocks.push({ t: "li2", runs: runs(line.replace(/^--\s+/, ""), true) });
      else if (/^[-•*]\s+/.test(line)) blocks.push({ t: "li", runs: runs(line.replace(/^[-•*]\s+/, ""), true) });
      else blocks.push({ t: "p", runs: runs(line, true) });
    });
    return blocks;
  }
  // Mengubah teks menjadi potongan {text,bold}; mendukung "Label: isi" dan **tebal**
  function runs(text, detectLabel) {
    const out = [];
    let rest = text;
    if (detectLabel) {
      const m = rest.match(/^([^:|]{2,70}?):(\s+|$)(.*)$/);
      if (m && /[A-Za-z]/.test(m[1]) && !/https?$/i.test(m[1]) && !/\d$/.test(m[1]) && m[1].split(" ").length <= 9) {
        out.push({ text: m[1] + ":", bold: true });
        rest = m[3] ? " " + m[3] : "";
      }
    }
    rest.split(/(\*\*[^*]+\*\*)/).forEach((part) => {
      if (!part) return;
      if (/^\*\*[^*]+\*\*$/.test(part)) out.push({ text: part.slice(2, -2), bold: true });
      else out.push({ text: part, bold: false });
    });
    return out;
  }

  /* ---------------- Render HTML (pratinjau & salin) ---------------- */
  function runsHTML(r) { return r.map((x) => (x.bold ? `<b>${esc(x.text)}</b>` : esc(x.text))).join(""); }
  function blocksHTML(blocks, inline) {
    const st = inline ? { tbl: 'style="border-collapse:collapse;width:100%;margin:6px 0"', td: 'style="border:1px solid #333;padding:4px 6px;vertical-align:top;font-size:10pt"', th: 'style="border:1px solid #333;padding:4px 6px;vertical-align:top;font-size:10pt;background:#eef3f8;font-weight:bold"' } : { tbl: 'class="inner"', td: "", th: "" };
    let html = "", i = 0;
    while (i < blocks.length) {
      const b = blocks[i];
      if (b.t === "li" || b.t === "li2") {
        html += "<ul>";
        while (i < blocks.length && (blocks[i].t === "li" || blocks[i].t === "li2")) {
          if (blocks[i].t === "li") {
            html += `<li>${runsHTML(blocks[i].runs)}`;
            i++;
            if (i < blocks.length && blocks[i].t === "li2") {
              html += "<ul>";
              while (i < blocks.length && blocks[i].t === "li2") { html += `<li>${runsHTML(blocks[i].runs)}</li>`; i++; }
              html += "</ul>";
            }
            html += "</li>";
          } else {
            html += `<li style="list-style:circle;margin-left:20px">${runsHTML(blocks[i].runs)}</li>`; i++;
          }
        }
        html += "</ul>";
        continue;
      }
      if (b.t === "h") html += `<p class="sublabel" style="font-weight:bold;margin:10px 0 4px">${runsHTML(b.runs)}</p>`;
      else if (b.t === "hp") html += `<p class="hp" style="font-weight:bold;font-size:12pt;color:#1F4E79;border-bottom:1.5px solid #1F4E79;margin:14px 0 6px;padding-bottom:2px">${runsHTML(b.runs)}</p>`;
      else if (b.t === "band") html += `<p class="band" style="font-weight:bold;background:#D9E7F5;border-left:5px solid #2E6FA6;padding:4px 8px;margin:10px 0 6px">${runsHTML(b.runs)}</p>`;
      else if (b.t === "p") html += `<p>${runsHTML(b.runs)}</p>`;
      else if (b.t === "table") {
        html += `<table ${st.tbl}>` + b.rows.map((r, ri) => "<tr>" + r.map((c) => `<td ${ri === 0 ? st.th : st.td}>${c.split("//").map((x) => runsHTML(runs(x.trim(), false))).join("<br>")}</td>`).join("") + "</tr>").join("") + "</table>";
      }
      i++;
    }
    return html;
  }

  function modelHTML(m, inline) {
    const T = inline ? 'style="border-collapse:collapse;width:100%;margin:0 0 16px;font-family:Arial;font-size:11pt"' : "";
    const TD = inline ? 'style="border:1px solid #333;padding:6px 8px;vertical-align:top"' : "";
    const TDL = inline ? 'style="border:1px solid #333;padding:6px 8px;vertical-align:top;font-weight:bold;background:#f7f7f7;width:28%"' : "";
    const TH = inline ? 'style="border:1px solid #333;padding:6px 8px;background:#2E6FA6;color:#fff;text-align:left"' : "";
    let h = `<h1 ${inline ? 'style="text-align:center;font-family:Arial;font-size:16pt"' : ""}>${esc(m.title)}</h1>`;
    h += `<table class="id-tbl" ${T}>` + m.identity.map(([a, b]) => `<tr><td ${TDL}>${esc(a)}</td><td ${TD}>${esc(b)}</td></tr>`).join("") + "</table>";
    h += `<table class="main-tbl" ${T}><tr><th ${TH}>Komponen Utama</th><th ${TH}>Sub-Komponen &amp; Instruksi Pengisian</th></tr>`;
    m.komponen.forEach((k) => {
      h += `<tr><td ${TDL}>${esc(k.nama)}</td><td ${TD}>` + k.subs.map((s) => (s.label ? `<p class="sublabel" style="font-weight:bold;margin:8px 0 4px">${esc(s.label)}:</p>` : "") + blocksHTML(s.blocks, inline)).join("") + "</td></tr>";
    });
    h += "</table>";
    m.after.forEach((a) => { h += `<h4>${esc(a.heading)}</h4>` + blocksHTML(a.blocks, inline); });
    const t = m.ttd;
    const nip = (x) => (x ? `NIP. ${esc(x)}` : "NIP. ……………………");
    h += `<table class="ttd" style="width:100%;border:none;margin-top:28px"><tr>
      <td style="border:none;text-align:center;width:50%">Mengetahui,<br>Kepala Sekolah<br><br><br><br><b><u>${esc(t.kepsek || "……………………")}</u></b><br>${nip(t.nipK)}</td>
      <td style="border:none;text-align:center;width:50%">${esc(t.tempat || "……………, ……………")}<br>Guru Mata Pelajaran<br><br><br><br><b><u>${esc(t.guru || "……………………")}</u></b><br>${nip(t.nipG)}</td></tr></table>`;
    m.lampiran.forEach((a) => { h += `<div class="page-break" style="page-break-before:always"></div><h4>${esc(a.heading)}</h4>` + blocksHTML(a.blocks, inline); });
    return h;
  }

  /* =================================================================
     BUAT DOKUMEN
     ================================================================= */
  function buatDokumen() {
    ensureMateri();
    let s = collectState();
    ensureDefaultDPL(s);
    s = collectState();
    const draft = buildDraft(s);
    let auto = 0;
    document.querySelectorAll("textarea[data-key]").forEach((t) => {
      if (!t.value.trim() && draft[t.dataset.key]) { t.value = draft[t.dataset.key]; auto++; }
    });
    s = collectState();
    if (!s.alokasi) s.alokasi = s.alokasiAuto;
    lastModel = buildModel(s);
    lastModel.fileName = `RPM_${(s.mapel.match(/\(([^)]+)\)/) || [, s.mapel])[1].replace(/[^\w-]+/g, "_")}_${s.kelas}_${(s.materi || "materi").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_")}`.slice(0, 90);
    $("docPreview").classList.remove("docx-mode");
    $("docPreview").innerHTML = modelHTML(lastModel, false);
    $("hasil").hidden = false;
    lastBlob = null;
    previewReady = renderDocxPreview();
    const msg = "Dokumen siap diunduh." + (auto ? ` (${auto} kolom kosong diisi otomatis.)` : "");
    if ($("autoClear").checked) {
      clearForm(true);
      setStatus("statusForm", msg + " Formulir sudah dikosongkan untuk dokumen berikutnya.");
      setStatus("statusHasil", msg + " Formulir sudah dikosongkan untuk dokumen berikutnya.");
    } else {
      setStatus("statusForm", msg);
      setStatus("statusHasil", msg);
    }
    $("hasil").scrollIntoView({ behavior: "smooth" });
  }

  function clearForm(keepIdentity) {
    IDENTITY_IDS.forEach((id) => {
      if (keepIdentity && KEEP_AFTER_CLEAR.includes(id)) return;
      if ($(id).tagName === "SELECT") return;
      $(id).value = "";
    });
    document.querySelectorAll("textarea[data-key]").forEach((t) => (t.value = ""));
    document.querySelectorAll(".dpl,.cpChk,.tpChk").forEach((c) => (c.checked = false));
    document.querySelectorAll(".tp-list").forEach((b) => (b.hidden = true));
    $("bukuHasil").innerHTML = "";
    setStatus("bukuStatus", "");
    saveForm();
  }

  /* ---------------- Pratinjau = file .docx yang sama ---------------- */
  async function getBlob() {
    if (!lastBlob) lastBlob = await docx.Packer.toBlob(modelDocx(lastModel));
    return lastBlob;
  }
  async function renderDocxPreview() {
    if (!window.docxPreview || !window.docxPreview.renderAsync) return false;
    try {
      const blob = await getBlob();
      const box = $("docPreview");
      const tmp = document.createElement("div");
      await window.docxPreview.renderAsync(blob, tmp, null, { className: "docx", inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true, ignoreWidth: false, ignoreHeight: false, useBase64URL: true });
      // Baris judul tabel (tableHeader di Word) diulang di setiap halaman cetak
      tmp.querySelectorAll("table").forEach((tb) => {
        const first = tb.rows[0];
        if (!first || tb.tHead || first.parentElement.closest("table") !== tb) return;
        const bg = (first.cells[0] && (first.cells[0].style.backgroundColor || "")).replace(/\s/g, "");
        if (/46,111,166|2e6fa6|238,243,248|eef3f8/i.test(bg)) { const th = tb.createTHead(); tb.insertBefore(th, first.parentElement === tb ? first : first.parentElement); th.appendChild(first); }
      });
      box.innerHTML = "";
      while (tmp.firstChild) box.appendChild(tmp.firstChild);
      box.classList.add("docx-mode");
      return true;
    } catch (e) {
      console.warn("Pratinjau docx gagal, memakai pratinjau HTML:", e);
      return false;
    }
  }
  async function cetakPDF() {
    if (!lastModel) return;
    setStatus("statusHasil", "Menyiapkan tampilan cetak dari file Word…");
    await previewReady;
    if (!$("docPreview").classList.contains("docx-mode")) await renderDocxPreview();
    setStatus("statusHasil", "Pilih \"Simpan sebagai PDF\" pada jendela cetak. Atur: Ukuran kertas A4, Margin Default, centang \"Grafik latar belakang\".");
    setTimeout(() => window.print(), 150);
  }

  /* ---------------- Unduh .docx ---------------- */
  async function unduhDocx() {
    if (!lastModel) return;
    try {
      const blob = await getBlob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (lastModel.fileName || "RPM") + ".docx";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus("statusHasil", "File Word diunduh.");
    } catch (e) {
      setStatus("statusHasil", "Gagal membuat file Word: " + e.message, true);
    }
  }

  function modelDocx(m) {
    const X = docx;
    const FULL = 9638; // lebar isi A4 dengan margin 2 cm (twip)
    const border = { style: X.BorderStyle.SINGLE, size: 4, color: "333333" };
    const borders = { top: border, bottom: border, left: border, right: border };
    const none = { style: X.BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
    const margins = { top: 80, bottom: 80, left: 110, right: 110 };
    const tr = (r, extra) => r.map((x) => new X.TextRun(Object.assign({ text: x.text, bold: x.bold }, extra || {})));

    function blocksDocx(blocks, width) {
      const out = [];
      blocks.forEach((b) => {
        if (b.t === "h") out.push(new X.Paragraph({ children: tr(b.runs, { bold: true }), spacing: { before: 120, after: 60 } }));
        else if (b.t === "hp") out.push(new X.Paragraph({ keepNext: true, children: tr(b.runs, { bold: true, size: 24, color: "1F4E79" }), spacing: { before: 240, after: 80 },
          border: { bottom: { style: X.BorderStyle.SINGLE, size: 12, color: "1F4E79", space: 2 } } }));
        else if (b.t === "band") out.push(new X.Paragraph({ keepNext: true, children: tr(b.runs, { bold: true }), spacing: { before: 160, after: 80 },
          shading: { fill: "D9E7F5", type: X.ShadingType.CLEAR, color: "auto" },
          border: { left: { style: X.BorderStyle.SINGLE, size: 36, color: "2E6FA6", space: 4 } }, indent: { left: 80 } }));
        else if (b.t === "p") out.push(new X.Paragraph({ children: tr(b.runs), spacing: { after: 60 } }));
        else if (b.t === "li") out.push(new X.Paragraph({ children: tr(b.runs), numbering: { reference: "bul", level: 0 }, spacing: { after: 40 } }));
        else if (b.t === "li2") out.push(new X.Paragraph({ children: tr(b.runs), numbering: { reference: "bul", level: 1 }, spacing: { after: 40 } }));
        else if (b.t === "table") {
          const n = Math.max(...b.rows.map((r) => r.length));
          const wt = Array.from({ length: n }, (_, ci) => Math.min(38, Math.max(4, ...b.rows.map((r) => Math.max(...String(r[ci] || "").split("//").map((x) => x.trim().length)) * 0.8))));
          const sum = wt.reduce((a, c) => a + c, 0);
          const ws = wt.map((x) => Math.floor((width * x) / sum));
          out.push(new X.Table({
            width: { size: ws.reduce((a, c) => a + c, 0), type: X.WidthType.DXA },
            columnWidths: ws,
            rows: b.rows.map((r, ri) => new X.TableRow({
              tableHeader: ri === 0,
              children: Array.from({ length: n }, (_, ci) => new X.TableCell({
                borders, margins: { top: 40, bottom: 40, left: 70, right: 70 },
                width: { size: ws[ci], type: X.WidthType.DXA },
                shading: ri === 0 ? { fill: "EEF3F8", type: X.ShadingType.CLEAR, color: "auto" } : undefined,
                children: (r[ci] || "").split("//").map((piece) => new X.Paragraph({ children: tr(runs(piece.trim(), false), { size: 20, bold: ri === 0 || undefined }) }))
              }))
            }))
          }));
          out.push(new X.Paragraph({ children: [] }));
        }
      });
      if (!out.length) out.push(new X.Paragraph({ text: "-" }));
      return out;
    }

    const idW = [2800, FULL - 2800];
    const idTable = new X.Table({
      width: { size: FULL, type: X.WidthType.DXA }, columnWidths: idW,
      rows: m.identity.map(([a, b]) => new X.TableRow({ children: [
        new X.TableCell({ borders, margins, width: { size: idW[0], type: X.WidthType.DXA }, shading: { fill: "F7F7F7", type: X.ShadingType.CLEAR, color: "auto" }, children: [new X.Paragraph({ children: [new X.TextRun({ text: a, bold: true })] })] }),
        new X.TableCell({ borders, margins, width: { size: idW[1], type: X.WidthType.DXA }, children: [new X.Paragraph({ text: b })] })
      ] }))
    });

    const mW = [2200, FULL - 2200];
    const head = new X.TableRow({ tableHeader: true, children: ["Komponen Utama", "Sub-Komponen & Instruksi Pengisian"].map((t, i) => new X.TableCell({
      borders, margins, width: { size: mW[i], type: X.WidthType.DXA },
      shading: { fill: "2E6FA6", type: X.ShadingType.CLEAR, color: "auto" },
      children: [new X.Paragraph({ children: [new X.TextRun({ text: t, bold: true, color: "FFFFFF" })] })]
    })) });
    const mainRows = m.komponen.map((k) => {
      const kids = [];
      k.subs.forEach((s) => {
        if (s.label) kids.push(new X.Paragraph({ children: [new X.TextRun({ text: s.label + ":", bold: true })], spacing: { before: 100, after: 40 } }));
        kids.push(...blocksDocx(s.blocks, mW[1] - 260));
      });
      return new X.TableRow({ children: [
        new X.TableCell({ borders, margins, width: { size: mW[0], type: X.WidthType.DXA }, shading: { fill: "F7F7F7", type: X.ShadingType.CLEAR, color: "auto" }, children: [new X.Paragraph({ children: [new X.TextRun({ text: k.nama, bold: true })] })] }),
        new X.TableCell({ borders, margins, width: { size: mW[1], type: X.WidthType.DXA }, children: kids })
      ] });
    });
    const mainTable = new X.Table({ width: { size: FULL, type: X.WidthType.DXA }, columnWidths: mW, rows: [head, ...mainRows] });

    const t = m.ttd;
    const ttdCell = (lines) => new X.TableCell({ borders: { top: none, bottom: none, left: none, right: none }, width: { size: FULL / 2, type: X.WidthType.DXA },
      children: lines.map((l) => new X.Paragraph({ alignment: X.AlignmentType.CENTER, children: [new X.TextRun({ text: l.text, bold: !!l.b, underline: l.b ? {} : undefined })] })) });
    const ttd = new X.Table({ width: { size: FULL, type: X.WidthType.DXA }, columnWidths: [FULL / 2, FULL / 2], borders: noBorders, rows: [new X.TableRow({ children: [
      ttdCell([{ text: "Mengetahui," }, { text: "Kepala Sekolah" }, { text: "" }, { text: "" }, { text: "" }, { text: t.kepsek || "……………………", b: 1 }, { text: t.nipK ? "NIP. " + t.nipK : "NIP. ……………………" }]),
      ttdCell([{ text: t.tempat || "……………, ……………" }, { text: "Guru Mata Pelajaran" }, { text: "" }, { text: "" }, { text: "" }, { text: t.guru || "……………………", b: 1 }, { text: t.nipG ? "NIP. " + t.nipG : "NIP. ……………………" }])
    ] })] });

    const children = [
      new X.Paragraph({ alignment: X.AlignmentType.CENTER, spacing: { after: 240 }, children: [new X.TextRun({ text: m.title, bold: true, size: 32 })] }),
      idTable,
      new X.Paragraph({ children: [] }),
      mainTable
    ];
    m.after.forEach((a) => { children.push(new X.Paragraph({ spacing: { before: 240, after: 80 }, children: [new X.TextRun({ text: a.heading, bold: true, size: 24 })] }), ...blocksDocx(a.blocks, FULL)); });
    children.push(new X.Paragraph({ children: [], spacing: { after: 240 } }), ttd);
    m.lampiran.forEach((a) => { children.push(new X.Paragraph({ pageBreakBefore: true, spacing: { after: 120 }, children: [new X.TextRun({ text: a.heading, bold: true, size: 24 })] }), ...blocksDocx(a.blocks, FULL)); });

    return new X.Document({
      creator: "GenRPM",
      title: m.title,
      styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
      numbering: { config: [{ reference: "bul", levels: [
        { level: 0, format: X.LevelFormat.BULLET, text: "•", alignment: X.AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } },
        { level: 1, format: X.LevelFormat.BULLET, text: "◦", alignment: X.AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 240 } } } }
      ] }] },
      sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children }]
    });
  }

  /* ---------------- Salin untuk Word ---------------- */
  async function salinUntukWord() {
    if (!lastModel) return;
    const html = `<html><body style="font-family:Arial;font-size:11pt">${modelHTML(lastModel, true)}</body></html>`;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([$("docPreview").innerText], { type: "text/plain" }) })]);
      } else {
        const r = document.createRange(); r.selectNodeContents($("docPreview"));
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        document.execCommand("copy"); sel.removeAllRanges();
      }
      setStatus("statusHasil", "Tersalin. Tempel (Ctrl+V) di Microsoft Word atau Google Docs.");
    } catch (e) {
      setStatus("statusHasil", "Gagal menyalin otomatis: " + e.message + ". Blok teks pratinjau lalu salin manual.", true);
    }
  }

  /* =================================================================
     SIMPAN / PULIHKAN
     ================================================================= */
  function safeGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function saveForm() {
    const s = { ids: {}, fields: {}, dpl: [], cpMode: document.querySelector("input[name=cpMode]:checked").value };
    IDENTITY_IDS.forEach((id) => (s.ids[id] = $(id).value));
    document.querySelectorAll("textarea[data-key]").forEach((t) => (s.fields[t.dataset.key] = t.value));
    s.dpl = Array.from(document.querySelectorAll(".dpl:checked")).map((c) => c.value);
    s.autoClear = $("autoClear").checked;
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function restoreForm() {
    const s = safeGet(LS_KEY);
    if (!s) return;
    ["tahun", "mapel", "fase"].forEach((id) => { if (s.ids[id] && Array.from($(id).options).some((o) => o.value === s.ids[id])) $(id).value = s.ids[id]; });
    updateKelas();
    IDENTITY_IDS.forEach((id) => {
      if (["tahun", "mapel", "fase"].includes(id) || s.ids[id] == null) return;
      if ($(id).tagName === "SELECT" && !Array.from($(id).options).some((o) => o.value === s.ids[id])) return;
      $(id).value = s.ids[id];
    });
    document.querySelectorAll("textarea[data-key]").forEach((t) => { if (s.fields[t.dataset.key]) t.value = s.fields[t.dataset.key]; });
    (s.dpl || []).forEach((k) => { const c = document.querySelector(`.dpl[value=${k}]`); if (c) c.checked = true; });
    if (s.cpMode) { const r = document.querySelector(`input[name=cpMode][value=${s.cpMode}]`); if (r) r.checked = true; }
    if (typeof s.autoClear === "boolean") $("autoClear").checked = s.autoClear;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
