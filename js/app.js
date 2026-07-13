// js/app.js — routing & rendering halaman

const appEl = document.getElementById("app");

function navigate(path) {
  window.location.hash = "#" + path;
}

function currentPath() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  return hash.split("?")[0]; // buang query string (mis. ?status=selesai) dari path
}

window.addEventListener("hashchange", router);

async function router() {
  const path = currentPath();
  renderTopnav();

  try {
    if (path === "/") return viewBeranda();
    if (path === "/masuk") return viewMasuk();
    if (path === "/daftar") return viewDaftar();
    if (path === "/dashboard") return requireLogin(viewDashboard);
    if (path.startsWith("/kategori/")) return requireLogin(() => viewKategori(path.split("/")[2]));
    if (path.startsWith("/kuis/")) return requireLogin(() => viewKuis(path.split("/")[2]));
    if (path === "/langganan") return requireLogin(viewLangganan);
    if (path === "/tryout") return requireLogin(viewTryoutList);
    if (path === "/tryout/bundle") return requireLogin(viewBundleList);
    if (path.startsWith("/tryout/paket/")) return requireLogin(() => viewTryoutDetail(path.split("/")[3]));
    if (path.startsWith("/tryout/sesi/")) return requireLogin(() => viewTryoutSesi(path.split("/")[3]));
    if (path.startsWith("/tryout/hasil/")) return requireLogin(() => viewTryoutHasil(path.split("/")[3]));
    if (path === "/akun") return requireLogin(viewAkun);
    return view404();
  } catch (err) {
    console.error(err);
    appEl.innerHTML = `<div class="empty-state"><h3>Terjadi kesalahan</h3><p>${escapeHtml(err.message || String(err))}</p></div>`;
  }
}

function requireLogin(renderFn) {
  if (!Auth.isLoggedIn()) {
    navigate("/masuk");
    return;
  }
  return renderFn();
}

function renderTopnav() {
  const nav = document.getElementById("topnav");
  const path = currentPath();
  const link = (href, label) => `<a href="#${href}" class="${path === href ? "active" : ""}">${label}</a>`;

  if (Auth.isLoggedIn()) {
    nav.innerHTML = `
      ${link("/dashboard", "Bank Soal")}
      ${link("/tryout", "Tryout")}
      ${link("/langganan", "Langganan")}
      ${link("/akun", "Akun")}
      <button id="btn-logout">Keluar</button>
    `;
    document.getElementById("btn-logout").onclick = () => Auth.logout();
  } else {
    nav.innerHTML = `
      ${link("/masuk", "Masuk")}
      <a href="#/daftar" class="btn-nav-cta">Daftar Gratis</a>
    `;
  }
}

/* ============================================================
   BERANDA
   ============================================================ */
function viewBeranda() {
  appEl.innerHTML = `
    <section class="hero fade-in">
      <p class="kategori-eyebrow">✦ Bank Soal &amp; Pembahasan</p>
      <h1>Siap ujian CPNS &amp; UTBK dengan soal yang benar-benar dibahas.</h1>
      <p>Ratusan soal TWK, TIU, TKP, Penalaran Umum, dan Pengetahuan Umum — lengkap dengan pembahasan langkah demi langkah, bukan cuma kunci jawaban.</p>
      <a href="#/daftar" class="btn">Mulai Latihan Gratis →</a>
    </section>
    <section class="grid grid-3 feature-strip">
      <div class="card feature-card fade-in fade-in-delay-1">
        <div class="icon-badge">📚</div>
        <h3>Soal Terstruktur</h3>
        <p>Dikelompokkan per subtes, sesuai kisi-kisi ujian resmi.</p>
      </div>
      <div class="card feature-card fade-in fade-in-delay-2">
        <div class="icon-badge">💡</div>
        <h3>Pembahasan Lengkap</h3>
        <p>Setiap soal disertai alasan kenapa jawaban itu benar — bukan cuma kuncinya.</p>
      </div>
      <div class="card feature-card fade-in fade-in-delay-3">
        <div class="icon-badge">🚀</div>
        <h3>Akses Fleksibel</h3>
        <p>Coba soal gratis dulu, upgrade ke premium kapan saja lewat Midtrans atau Xendit.</p>
      </div>
    </section>
  `;
}

/* ============================================================
   MASUK / DAFTAR
   ============================================================ */
function viewMasuk() {
  appEl.innerHTML = `
    <div class="card fade-in" style="max-width:420px; margin:0 auto;">
      <h2>Masuk</h2>
      <form id="form-masuk">
        <div class="field"><label>Email</label><input type="email" name="email" required /></div>
        <div class="field"><label>Kata sandi</label><input type="password" name="password" required /></div>
        <button class="btn btn-block" type="submit">Masuk</button>
      </form>
      <p class="hint" style="margin-top:14px; text-align:center;">Belum punya akun? <a href="#/daftar" style="text-decoration:underline;">Daftar di sini</a></p>
    </div>
  `;
  document.getElementById("form-masuk").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = "Memproses...";
    try {
      await Auth.login(fd.get("email"), fd.get("password"));
      showToast("Berhasil masuk");
      navigate("/dashboard");
    } catch (err) {
      showToast(err.message || "Gagal masuk");
    } finally {
      btn.disabled = false; btn.textContent = "Masuk";
    }
  });
}

function viewDaftar() {
  appEl.innerHTML = `
    <div class="card fade-in" style="max-width:420px; margin:0 auto;">
      <h2>Buat Akun</h2>
      <form id="form-daftar">
        <div class="field"><label>Nama lengkap</label><input type="text" name="nama" required /></div>
        <div class="field"><label>Email</label><input type="email" name="email" required /></div>
        <div class="field"><label>Kata sandi</label><input type="password" name="password" minlength="6" required /></div>
        <button class="btn btn-block" type="submit">Daftar</button>
      </form>
      <p class="hint" style="margin-top:14px; text-align:center;">Sudah punya akun? <a href="#/masuk" style="text-decoration:underline;">Masuk di sini</a></p>
    </div>
  `;
  document.getElementById("form-daftar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector("button");
    btn.disabled = true; btn.textContent = "Memproses...";
    try {
      await Auth.register(fd.get("email"), fd.get("password"), fd.get("nama"));
      showToast("Akun dibuat. Silakan cek email untuk verifikasi (jika diaktifkan).");
      navigate("/masuk");
    } catch (err) {
      showToast(err.message || "Gagal mendaftar");
    } finally {
      btn.disabled = false; btn.textContent = "Daftar";
    }
  });
}

/* ============================================================
   IKON — tumpukan tiket tryout dengan pita (dipakai di kartu tryout)
   ============================================================ */
function svgTryoutIcon() {
  return `
  <svg viewBox="0 0 100 100" width="56" height="56" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
    <defs>
      <linearGradient id="tix1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--primary-soft)"/>
        <stop offset="1" stop-color="#ffffff"/>
      </linearGradient>
      <linearGradient id="tixRibbon" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#FB923C"/>
        <stop offset="1" stop-color="var(--accent)"/>
      </linearGradient>
    </defs>
    <!-- tiket belakang -->
    <g transform="rotate(-14 50 52)">
      <rect x="21" y="20" width="46" height="60" rx="9" fill="url(#tix1)" stroke="var(--line)" stroke-width="2"/>
    </g>
    <!-- tiket tengah -->
    <g transform="rotate(-3 50 52)">
      <rect x="24" y="16" width="46" height="60" rx="9" fill="#ffffff" stroke="var(--line)" stroke-width="2"/>
      <rect x="24" y="16" width="46" height="14" rx="9" fill="var(--primary-soft)"/>
    </g>
    <!-- tiket depan -->
    <g transform="rotate(9 50 52)">
      <rect x="27" y="12" width="46" height="60" rx="9" fill="#ffffff" stroke="var(--line)" stroke-width="2.4"/>
      <rect x="27" y="12" width="46" height="15" rx="9" fill="var(--primary)"/>
      <circle cx="27" cy="42" r="4.5" fill="var(--paper)" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="73" cy="42" r="4.5" fill="var(--paper)" stroke="var(--line)" stroke-width="1.5"/>
      <line x1="34" y1="42" x2="66" y2="42" stroke="var(--line)" stroke-width="1.5" stroke-dasharray="3 3"/>
      <rect x="34" y="50" width="30" height="4.5" rx="2.2" fill="var(--line)"/>
      <rect x="34" y="59" width="22" height="4.5" rx="2.2" fill="var(--line)"/>
    </g>
    <!-- pita -->
    <g transform="rotate(-12 50 58)">
      <rect x="6" y="49" width="88" height="20" fill="url(#tixRibbon)"/>
      <polygon points="6,49 6,69 -3,59" fill="#C2650A"/>
      <polygon points="94,49 94,69 103,59" fill="#C2650A"/>
      <text x="50" y="63" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" font-size="12.5" fill="#ffffff" letter-spacing="1">TRYOUT</text>
    </g>
    <!-- percikan -->
    <circle cx="86" cy="20" r="3.5" fill="var(--teal)"/>
    <circle cx="14" cy="30" r="2.5" fill="var(--accent)"/>
    <path d="M79 78 l2.6 5.4 5.4 2.6 -5.4 2.6 -2.6 5.4 -2.6 -5.4 -5.4 -2.6 5.4 -2.6 z" fill="var(--primary)"/>
  </svg>`;
}

/* ============================================================
   DASHBOARD — daftar kategori ujian
   ============================================================ */
async function viewDashboard() {
  appEl.innerHTML = `<p>Memuat kategori...</p>`;
  const kategori = await SoalAPI.getKategori();
  appEl.innerHTML = `
    <h2>Pilih Jenis Ujian</h2>
    <div class="grid grid-2" style="margin-top:18px;">
      ${kategori.map((k, i) => `
        <a href="#/kategori/${k.kode}" class="card kategori-card fade-in fade-in-delay-${i + 1}">
          <div class="kategori-icon">${escapeHtml(k.kode.slice(0, 2))}</div>
          <p class="kategori-eyebrow">${escapeHtml(k.kode)}</p>
          <h3>${escapeHtml(k.nama)}</h3>
          <p>${escapeHtml(k.deskripsi || "")}</p>
        </a>
      `).join("")}
    </div>
  `;
}

async function viewKategori(kode) {
  appEl.innerHTML = `<p>Memuat subtes...</p>`;
  const kategori = await SoalAPI.getKategoriByKode(kode);
  const subtes = await SoalAPI.getSubtes(kategori.id);
  appEl.innerHTML = `
    <a href="#/dashboard" class="hint">&larr; Kembali ke kategori</a>
    <h2 style="margin-top:12px;">${escapeHtml(kategori.nama)}</h2>
    <p>${escapeHtml(kategori.deskripsi || "")}</p>
    <div style="margin-top:20px;">
      ${subtes.map((s, i) => `
        <a href="#/kuis/${s.id}" class="subtes-row fade-in fade-in-delay-${Math.min(i + 1, 3)}">
          <div class="subtes-row-left">
            <span class="subtes-dot"></span>
            <div><strong>${escapeHtml(s.kode)}</strong> — ${escapeHtml(s.nama)}</div>
          </div>
          <span class="subtes-count">${s.soal?.[0]?.count ?? 0} soal &rarr;</span>
        </a>
      `).join("") || `<div class="empty-state"><h3>Belum ada subtes</h3></div>`}
    </div>
  `;
}

/* ============================================================
   KUIS — pengerjaan soal + pembahasan
   ============================================================ */
async function viewKuis(subtesId) {
  appEl.innerHTML = `<p>Memuat soal...</p>`;
  const [subtes, { soal, totalSoal }] = await Promise.all([
    SoalAPI.getSubtesById(subtesId),
    SoalAPI.getSoalUntukSubtes(subtesId),
  ]);

  let index = 0;
  let dijawab = null; // kode pilihan yang dipilih pada soal aktif

  function render() {
    if (soal.length === 0) {
      appEl.innerHTML = `
        <a href="#/dashboard" class="hint">&larr; Kembali</a>
        <div class="empty-state" style="margin-top:20px;">
          <h3>Belum ada soal gratis di subtes ini</h3>
          <p>Total ${totalSoal} soal tersedia untuk pengguna premium.</p>
          <a href="#/langganan" class="btn">Lihat Paket Langganan</a>
        </div>
      `;
      return;
    }

    const s = soal[index];
    const terkunci = totalSoal > soal.length && index === soal.length - 1;
    dijawab = null;

    appEl.innerHTML = `
      <a href="#/kategori/${subtes.kode === 'PU' || subtes.kode === 'PPU' ? 'UTBK' : 'CPNS'}" class="hint">&larr; Kembali</a>
      <div class="exam-ticket fade-in" style="margin-top:16px;">
        <div class="exam-meta">
          <span>${escapeHtml(subtes.nama)}</span>
          <span class="mono">Soal ${index + 1} / ${soal.length}${totalSoal > soal.length ? ` (dari ${totalSoal})` : ""}</span>
        </div>
        <div class="exam-progress"><div class="exam-progress-bar" style="width:${((index + 1) / soal.length) * 100}%"></div></div>
        ${s.is_premium ? '<span class="tag tag-premium">Premium</span>' : '<span class="tag tag-free">Gratis</span>'}
        <p class="pertanyaan" style="margin-top:14px;">${escapeHtml(s.pertanyaan)}</p>
        <div class="pilihan-list" id="pilihan-list">
          ${s.pilihan.map((p) => `
            <div class="pilihan-item" data-kode="${p.kode}">
              <span class="pilihan-bubble">${p.kode}</span>
              <span class="pilihan-teks">${escapeHtml(p.teks)}</span>
            </div>
          `).join("")}
        </div>
        <div id="pembahasan-area"></div>
        <div style="display:flex; justify-content:space-between; margin-top:22px;">
          <button class="btn btn-outline btn-sm" id="btn-prev" ${index === 0 ? "disabled" : ""}>&larr; Sebelumnya</button>
          <button class="btn btn-sm" id="btn-next" ${index === soal.length - 1 ? "disabled" : ""}>Berikutnya &rarr;</button>
        </div>
      </div>
      ${totalSoal > soal.length ? `
        <div class="locked-box" style="margin-top:20px;">
          <h3>${totalSoal - soal.length} soal lagi terkunci</h3>
          <p>Upgrade ke premium untuk membuka semua soal di subtes ini.</p>
          <a href="#/langganan" class="btn">Upgrade Sekarang</a>
        </div>
      ` : ""}
    `;

    document.querySelectorAll(".pilihan-item").forEach((el) => {
      el.addEventListener("click", () => {
        if (dijawab) return; // sudah dijawab, kunci pilihan
        dijawab = el.dataset.kode;
        const benar = dijawab === s.jawaban_benar;
        document.querySelectorAll(".pilihan-item").forEach((it) => {
          if (it.dataset.kode === s.jawaban_benar) it.classList.add("benar");
          else if (it.dataset.kode === dijawab) it.classList.add("salah");
        });
        document.getElementById("pembahasan-area").innerHTML = `
          <div class="pembahasan-box">
            <p class="pembahasan-label">Pembahasan</p>
            <p>${escapeHtml(s.pembahasan)}</p>
          </div>
        `;
        SoalAPI.catatJawaban(s.id, dijawab, benar);
      });
    });

    document.getElementById("btn-prev").onclick = () => { index--; render(); };
    document.getElementById("btn-next").onclick = () => { index++; render(); };
  }

  render();
}

/* ============================================================
   LANGGANAN — paket & checkout
   ============================================================ */
async function viewLangganan() {
  appEl.innerHTML = `<p>Memuat paket...</p>`;
  const [paket, aktif] = await Promise.all([PaymentAPI.getPaket(), PaymentAPI.getLanggananAktif()]);

  appEl.innerHTML = `
    <h2>Paket Langganan</h2>
    ${aktif ? `
      <div class="card" style="margin-bottom:24px;">
        <span class="status-badge status-aktif">Aktif</span>
        <p style="margin-top:10px;">Kamu berlangganan <strong>${escapeHtml(aktif.paket_langganan.nama)}</strong>, berlaku sampai <strong>${formatTanggal(aktif.berakhir)}</strong>.</p>
      </div>
    ` : `<p>Buka semua soal premium dengan berlangganan salah satu paket berikut.</p>`}

    <div class="grid grid-3" style="margin-top:8px;">
      ${paket.map((p, i) => `
        <div class="card pricing-card fade-in fade-in-delay-${Math.min(i + 1, 3)} ${i === 1 ? "featured" : ""}">
          ${i === 1 ? '<span class="tag tag-premium pricing-badge">Paling Hemat</span>' : ""}
          <h3>${escapeHtml(p.nama)}</h3>
          <div class="harga">${formatRupiah(p.harga)}<br/><small>${p.durasi_hari} hari akses</small></div>
          <p>${escapeHtml(p.deskripsi || "")}</p>
          <form class="form-beli" data-paket-id="${p.id}">
            <div class="gateway-choice">
              <label><input type="radio" name="gateway_${p.id}" value="midtrans" checked /><span>Midtrans</span></label>
              <label><input type="radio" name="gateway_${p.id}" value="xendit" /><span>Xendit</span></label>
            </div>
            <button class="btn btn-block" type="submit">Pilih Paket</button>
          </form>
        </div>
      `).join("")}
    </div>

    <h3 style="margin-top:36px;">Riwayat Transaksi</h3>
    <div id="riwayat-transaksi"><p>Memuat...</p></div>
  `;

  document.querySelectorAll(".form-beli").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const paketId = form.dataset.paketId;
      const gateway = new FormData(form).get(`gateway_${paketId}`);
      const btn = form.querySelector("button");
      btn.disabled = true; btn.textContent = "Menyiapkan pembayaran...";
      try {
        const { redirect_url } = await PaymentAPI.buatCheckout(paketId, gateway);
        window.location.href = redirect_url;
      } catch (err) {
        showToast(err.message || "Gagal membuat transaksi");
        btn.disabled = false; btn.textContent = "Pilih Paket";
      }
    });
  });

  renderRiwayatTransaksi();
}

async function renderRiwayatTransaksi() {
  const el = document.getElementById("riwayat-transaksi");
  const riwayat = await PaymentAPI.getRiwayatTransaksi();
  if (!el) return; // user sudah pindah halaman
  if (riwayat.length === 0) {
    el.innerHTML = `<p class="hint">Belum ada transaksi.</p>`;
    return;
  }
  const statusClass = { paid: "status-aktif", pending: "status-pending", failed: "status-gagal", expired: "status-gagal" };
  const statusLabel = { paid: "Lunas", pending: "Menunggu", failed: "Gagal", expired: "Kedaluwarsa" };
  el.innerHTML = `
    <div class="card">
      ${riwayat.map((t) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px 0; border-bottom:1px solid var(--line);">
          <div>
            <strong>${escapeHtml(t.paket_langganan?.nama || "-")}</strong>
            <div class="hint mono">${escapeHtml(t.gateway_order_id)} · ${formatTanggal(t.created_at)}</div>
          </div>
          <span class="status-badge ${statusClass[t.status] || ""}">${statusLabel[t.status] || t.status}</span>
        </div>
      `).join("")}
    </div>
  `;
}

/* ============================================================
   TRYOUT — daftar paket (produk: bisa dibeli satuan atau lewat langganan)
   ============================================================ */
async function viewTryoutList() {
  appEl.innerHTML = `<p>Memuat paket tryout...</p>`;
  const [paketList, aktif, dimiliki] = await Promise.all([
    TryoutAPI.getSemuaPaket(),
    PaymentAPI.getLanggananAktif(),
    TryoutAPI.getSemuaKepemilikan(),
  ]);

  appEl.innerHTML = `
    <h2>Tryout — Simulasi Ujian Real</h2>
    <p>Kerjakan soal asli sejumlah ujian sesungguhnya, dengan waktu terbatas dan passing grade resmi. Hasil dan pembahasan lengkap muncul setelah selesai atau waktu habis.</p>
    <div style="display:flex; gap:12px; margin: 16px 0 24px;">
      <a href="#/tryout/bundle" class="btn btn-outline btn-sm">Lihat Paket Bundle (Lebih Hemat)</a>
    </div>
    <div class="grid grid-2">
      ${paketList.map((p, i) => {
        const totalSoal = p.paket_tryout_subtes.reduce((sum, k) => sum + k.jumlah_soal, 0);
        const punya = aktif || dimiliki.includes(p.id);
        return `
        <a href="#/tryout/paket/${p.id}" class="card kategori-card fade-in fade-in-delay-${Math.min(i + 1, 3)}">
          ${svgTryoutIcon()}
          <p class="kategori-eyebrow" style="margin-top:10px;">${escapeHtml(p.kategori_ujian?.kode || "")}</p>
          <h3>${escapeHtml(p.nama)}</h3>
          <p>${escapeHtml(p.deskripsi || "")}</p>
          <p class="hint mono">${totalSoal} soal &middot; ${p.durasi_menit} menit</p>
          ${punya
            ? `<span class="tag tag-free" style="margin-top:8px;">Sudah Dimiliki</span>`
            : `<span class="tag tag-premium" style="margin-top:8px;">${formatRupiah(p.harga)}</span>`}
        </a>
      `;
      }).join("") || `<div class="empty-state"><h3>Belum ada paket tryout</h3></div>`}
    </div>
  `;
}

async function viewBundleList() {
  appEl.innerHTML = `<p>Memuat paket bundle...</p>`;
  const bundles = await TryoutAPI.getBundleList();

  appEl.innerHTML = `
    <a href="#/tryout" class="hint">&larr; Kembali ke daftar tryout</a>
    <h2 style="margin-top:12px;">Bundle Tryout</h2>
    <p>Beli beberapa paket tryout sekaligus dengan harga lebih hemat dibanding beli satuan.</p>
    <div class="grid grid-2" style="margin-top:16px;">
      ${bundles.map((b, i) => `
        <div class="card pricing-card fade-in fade-in-delay-${Math.min(i + 1, 3)}" style="text-align:left;">
          ${svgTryoutIcon()}
          <h3 style="margin-top:10px;">${escapeHtml(b.nama)}</h3>
          <p>${escapeHtml(b.deskripsi || "")}</p>
          <ul style="margin:0 0 16px; padding-left:20px; color:var(--ink-soft); font-size:.9rem;">
            ${b.bundle_tryout_paket.map((it) => `<li>${escapeHtml(it.paket_tryout.nama)}</li>`).join("")}
          </ul>
          <div class="harga" style="text-align:left;">${formatRupiah(b.harga)}</div>
          <form class="form-beli-bundle" data-bundle-id="${b.id}">
            <div class="gateway-choice">
              <label><input type="radio" name="gw_bundle_${b.id}" value="midtrans" checked /><span>Midtrans</span></label>
              <label><input type="radio" name="gw_bundle_${b.id}" value="xendit" /><span>Xendit</span></label>
            </div>
            <button class="btn btn-block" type="submit">Beli Bundle</button>
          </form>
        </div>
      `).join("") || `<div class="empty-state"><h3>Belum ada bundle tersedia</h3></div>`}
    </div>
  `;

  document.querySelectorAll(".form-beli-bundle").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const bundleId = form.dataset.bundleId;
      const gateway = new FormData(form).get(`gw_bundle_${bundleId}`);
      const btn = form.querySelector("button");
      btn.disabled = true; btn.textContent = "Menyiapkan pembayaran...";
      try {
        const { redirect_url } = await TryoutAPI.beliBundle(bundleId, gateway);
        window.location.href = redirect_url;
      } catch (err) {
        showToast(err.message || "Gagal membuat transaksi");
        btn.disabled = false; btn.textContent = "Beli Bundle";
      }
    });
  });
}

async function viewTryoutDetail(paketId) {
  appEl.innerHTML = `<p>Memuat detail paket...</p>`;
  const [paket, aktif, dimiliki, sesiBerlangsung] = await Promise.all([
    TryoutAPI.getPaketById(paketId),
    PaymentAPI.getLanggananAktif(),
    TryoutAPI.getSemuaKepemilikan(),
    TryoutAPI.getSesiBerlangsung(paketId),
  ]);
  const komposisi = [...paket.paket_tryout_subtes].sort((a, b) => a.urutan - b.urutan);
  const totalSoal = komposisi.reduce((sum, k) => sum + k.jumlah_soal, 0);
  const punya = !!aktif || dimiliki.includes(paket.id);

  appEl.innerHTML = `
    <a href="#/tryout" class="hint">&larr; Kembali ke daftar tryout</a>
    <div class="card fade-in" style="margin-top:16px;">
      <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
        ${svgTryoutIcon()}
        <div style="flex:1; min-width:220px;">
          <p class="kategori-eyebrow">${escapeHtml(paket.kategori_ujian?.kode || "")}</p>
          <h2 style="margin-bottom:6px;">${escapeHtml(paket.nama)}</h2>
          <p>${escapeHtml(paket.deskripsi || "")}</p>
        </div>
      </div>
      <div class="grid grid-3" style="margin:20px 0;">
        <div><p class="hint">Total Soal</p><h3>${totalSoal}</h3></div>
        <div><p class="hint">Durasi</p><h3>${paket.durasi_menit} menit</h3></div>
        <div><p class="hint">Subtes</p><h3>${komposisi.length}</h3></div>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
        <thead><tr style="text-align:left; border-bottom:1.5px solid var(--line);">
          <th style="padding:8px 4px;">Subtes</th><th style="padding:8px 4px;">Jumlah Soal</th><th style="padding:8px 4px;">Skor Maks</th><th style="padding:8px 4px;">Passing Grade</th>
        </tr></thead>
        <tbody>
          ${komposisi.map((k) => `
            <tr style="border-bottom:1px solid var(--line);">
              <td style="padding:8px 4px;"><strong>${escapeHtml(k.subtes.kode)}</strong> — ${escapeHtml(k.subtes.nama)}</td>
              <td style="padding:8px 4px;">${k.jumlah_soal}</td>
              <td style="padding:8px 4px;">${k.skor_maks}</td>
              <td style="padding:8px 4px;">${k.passing_grade != null ? `&ge; ${k.passing_grade}` : "Tidak ada (rangking)"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${punya
        ? (sesiBerlangsung
            ? `<a href="#/tryout/sesi/${sesiBerlangsung.id}" class="btn btn-block">Lanjutkan Tryout yang Sedang Berjalan</a>`
            : `<button id="btn-mulai-tryout" class="btn btn-block">Mulai Tryout Sekarang</button>`)
        : `
          <div class="card" style="background:var(--primary-soft); border:none;">
            <p class="hint" style="margin-bottom:2px;">Harga paket ini</p>
            <div class="harga" style="margin:0 0 14px;">${formatRupiah(paket.harga)}</div>
            <p class="hint">Sudah punya langganan aktif juga otomatis membuka tryout ini. <a href="#/langganan" style="text-decoration:underline;">Lihat paket langganan</a>.</p>
            <form id="form-beli-tryout">
              <div class="gateway-choice">
                <label><input type="radio" name="gw_tryout" value="midtrans" checked /><span>Midtrans</span></label>
                <label><input type="radio" name="gw_tryout" value="xendit" /><span>Xendit</span></label>
              </div>
              <button class="btn btn-block" type="submit">Beli Tryout Ini</button>
            </form>
          </div>
        `
      }
    </div>
  `;

  const btnMulai = document.getElementById("btn-mulai-tryout");
  if (btnMulai) {
    btnMulai.onclick = async () => {
      btnMulai.disabled = true;
      btnMulai.textContent = "Menyiapkan soal...";
      try {
        const sesi = await TryoutAPI.mulaiSesi(paket);
        navigate(`/tryout/sesi/${sesi.id}`);
      } catch (err) {
        showToast(err.message || "Gagal memulai tryout");
        btnMulai.disabled = false;
        btnMulai.textContent = "Mulai Tryout Sekarang";
      }
    };
  }

  const formBeli = document.getElementById("form-beli-tryout");
  if (formBeli) {
    formBeli.addEventListener("submit", async (e) => {
      e.preventDefault();
      const gateway = new FormData(formBeli).get("gw_tryout");
      const btn = formBeli.querySelector("button");
      btn.disabled = true; btn.textContent = "Menyiapkan pembayaran...";
      try {
        const { redirect_url } = await TryoutAPI.beliTryout(paket.id, gateway);
        window.location.href = redirect_url;
      } catch (err) {
        showToast(err.message || "Gagal membuat transaksi");
        btn.disabled = false; btn.textContent = "Beli Tryout Ini";
      }
    });
  }
}

/* ============================================================
   TRYOUT — pengerjaan (timer real, navigasi antar soal)
   ============================================================ */
let _tryoutTimerHandle = null;

async function viewTryoutSesi(sesiId) {
  appEl.innerHTML = `<p>Memuat soal tryout...</p>`;
  if (_tryoutTimerHandle) clearInterval(_tryoutTimerHandle);

  const sesi = await TryoutAPI.getSesi(sesiId);
  if (sesi.status !== "berlangsung") {
    navigate(`/tryout/hasil/${sesiId}`);
    return;
  }
  const soalList = await TryoutAPI.getSoalSesi(sesiId);
  const komposisi = [...sesi.paket_tryout.paket_tryout_subtes].sort((a, b) => a.urutan - b.urutan);

  let index = 0;
  let sudahSubmit = false;

  function labelSubtes(subtesId) {
    const k = komposisi.find((x) => x.subtes_id === subtesId);
    return k ? k.subtes.kode : "";
  }

  async function submitSesiSekarang(otomatis) {
    if (sudahSubmit) return;
    sudahSubmit = true;
    if (_tryoutTimerHandle) clearInterval(_tryoutTimerHandle);
    try {
      await TryoutAPI.submitSesi(sesiId);
      if (otomatis) showToast("Waktu habis — jawaban otomatis dikumpulkan");
      navigate(`/tryout/hasil/${sesiId}`);
    } catch (err) {
      showToast(err.message || "Gagal mengumpulkan jawaban");
      sudahSubmit = false;
    }
  }

  function render() {
    const s = soalList[index];
    const soal = s.soal_tryout_ujian;
    const dijawabCount = soalList.filter((x) => x.jawaban_user).length;

    appEl.innerHTML = `
      <div class="card fade-in" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <p class="hint" style="margin:0;">${escapeHtml(sesi.paket_tryout.nama)}</p>
          <p class="mono" style="margin:0; color:var(--primary); font-weight:700;">${dijawabCount} / ${soalList.length} terjawab</p>
        </div>
        <div id="timer-display" class="mono" style="font-size:1.3rem; font-weight:700; color:var(--red);">--:--:--</div>
        <button id="btn-selesai-ujian" class="btn btn-outline btn-sm">Selesai Ujian</button>
      </div>

      <div class="card fade-in" style="margin-bottom:16px;">
        <p class="hint" style="margin-bottom:8px;">Navigasi Soal</p>
        <div id="qnav-grid" style="display:flex; flex-wrap:wrap; gap:6px;">
          ${soalList.map((x, i) => `
            <button class="qnav-btn ${i === index ? "qnav-current" : x.jawaban_user ? "qnav-answered" : ""}" data-index="${i}">${i + 1}</button>
          `).join("")}
        </div>
      </div>

      <div class="exam-ticket fade-in">
        <div class="exam-meta">
          <span>${escapeHtml(labelSubtes(soal.subtes_id))}</span>
          <span class="mono">Soal ${index + 1} / ${soalList.length}</span>
        </div>
        <div class="exam-progress"><div class="exam-progress-bar" style="width:${((index + 1) / soalList.length) * 100}%"></div></div>
        <p class="pertanyaan">${escapeHtml(soal.pertanyaan)}</p>
        <div class="pilihan-list" id="pilihan-list">
          ${soal.pilihan.map((p) => `
            <div class="pilihan-item ${s.jawaban_user === p.kode ? "selected" : ""}" data-kode="${p.kode}">
              <span class="pilihan-bubble">${p.kode}</span>
              <span class="pilihan-teks">${escapeHtml(p.teks)}</span>
            </div>
          `).join("")}
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:22px;">
          <button class="btn btn-outline btn-sm" id="btn-prev" ${index === 0 ? "disabled" : ""}>&larr; Sebelumnya</button>
          <button class="btn btn-sm" id="btn-next" ${index === soalList.length - 1 ? "disabled" : ""}>Berikutnya &rarr;</button>
        </div>
      </div>
    `;

    document.querySelectorAll(".pilihan-item").forEach((el) => {
      el.addEventListener("click", async () => {
        const kode = el.dataset.kode;
        s.jawaban_user = kode;
        document.querySelectorAll(".pilihan-item").forEach((it) => it.classList.toggle("selected", it.dataset.kode === kode));
        document.querySelector(`.qnav-btn[data-index="${index}"]`).classList.add("qnav-answered");
        try {
          await TryoutAPI.simpanJawaban(s.id, kode);
        } catch (err) {
          showToast("Gagal menyimpan jawaban, coba lagi");
        }
      });
    });

    document.querySelectorAll(".qnav-btn").forEach((btn) => {
      btn.addEventListener("click", () => { index = Number(btn.dataset.index); render(); });
    });

    document.getElementById("btn-prev").onclick = () => { index--; render(); };
    document.getElementById("btn-next").onclick = () => { index++; render(); };
    document.getElementById("btn-selesai-ujian").onclick = () => {
      const belumJawab = soalList.length - soalList.filter((x) => x.jawaban_user).length;
      const pesan = belumJawab > 0
        ? `Masih ada ${belumJawab} soal belum dijawab. Yakin ingin menyelesaikan ujian sekarang?`
        : "Yakin ingin menyelesaikan ujian sekarang? Jawaban tidak dapat diubah lagi setelah ini.";
      if (confirm(pesan)) submitSesiSekarang(false);
    };

    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const el = document.getElementById("timer-display");
    if (!el) return;
    const sisaMs = new Date(sesi.batas_waktu).getTime() - Date.now();
    if (sisaMs <= 0) {
      el.textContent = "00:00:00";
      submitSesiSekarang(true);
      return;
    }
    const totalDetik = Math.floor(sisaMs / 1000);
    const jam = String(Math.floor(totalDetik / 3600)).padStart(2, "0");
    const menit = String(Math.floor((totalDetik % 3600) / 60)).padStart(2, "0");
    const detik = String(totalDetik % 60).padStart(2, "0");
    el.textContent = `${jam}:${menit}:${detik}`;
    if (sisaMs < 5 * 60 * 1000) el.style.color = "var(--red)";
  }

  render();
  _tryoutTimerHandle = setInterval(updateTimerDisplay, 1000);
}

/* ============================================================
   TRYOUT — hasil & pembahasan
   ============================================================ */
async function viewTryoutHasil(sesiId) {
  appEl.innerHTML = `<p>Memuat hasil...</p>`;
  const sesi = await TryoutAPI.getSesi(sesiId);

  if (sesi.status === "berlangsung") {
    appEl.innerHTML = `<div class="empty-state"><h3>Sesi ini belum diselesaikan</h3><a href="#/tryout/sesi/${sesiId}" class="btn" style="margin-top:12px;">Lanjutkan Mengerjakan</a></div>`;
    return;
  }

  const komposisi = [...sesi.paket_tryout.paket_tryout_subtes].sort((a, b) => a.urutan - b.urutan);
  const review = await TryoutAPI.getReviewSesi(sesiId);

  const adaPassingGrade = komposisi.some((k) => k.passing_grade != null);

  appEl.innerHTML = `
    <div class="card fade-in" style="text-align:center; margin-bottom:20px;">
      <p class="kategori-eyebrow" style="justify-content:center;">Hasil Tryout</p>
      <h2>${escapeHtml(sesi.paket_tryout.nama)}</h2>
      <div class="harga" style="color:var(--primary);">${sesi.skor_total ?? 0}</div>
      ${adaPassingGrade
        ? `<span class="status-badge ${sesi.lulus ? "status-aktif" : "status-gagal"}" style="font-size:.9rem; padding:8px 18px;">${sesi.lulus ? "MEMENUHI PASSING GRADE" : "BELUM MEMENUHI PASSING GRADE"}</span>`
        : `<p class="hint">Skor bersifat rangking, tidak ada passing grade tetap.</p>`}
    </div>

    <div class="grid grid-3" style="margin-bottom:28px;">
      ${komposisi.map((k, i) => {
        const s = (sesi.skor_per_subtes || {})[k.subtes_id] || { skor: 0, maks: k.skor_maks };
        return `
        <div class="card fade-in fade-in-delay-${Math.min(i + 1, 3)}">
          <p class="hint">${escapeHtml(k.subtes.kode)} — ${escapeHtml(k.subtes.nama)}</p>
          <h3 style="color:var(--primary);">${s.skor} <span class="hint" style="font-size:.9rem; font-weight:400;">/ ${s.maks}</span></h3>
          ${k.passing_grade != null ? `<span class="status-badge ${s.skor >= k.passing_grade ? "status-aktif" : "status-gagal"}">${s.skor >= k.passing_grade ? "Lulus" : "Belum lulus"} (min. ${k.passing_grade})</span>` : ""}
        </div>
      `;
      }).join("")}
    </div>

    <h3>Pembahasan Lengkap</h3>
    <div id="review-list" style="margin-top:16px;">
      ${review.map((r, i) => {
        const soal = r.soal_tryout;
        const benar = soal.skor_pilihan ? null : r.jawaban_user === soal.jawaban_benar;
        return `
        <div class="exam-ticket fade-in" style="margin-bottom:20px;">
          <div class="exam-meta">
            <span>${escapeHtml(soal.subtes.kode)}</span>
            <span class="mono">Soal ${i + 1} &middot; Skor: ${r.skor_didapat ?? 0}</span>
          </div>
          <p class="pertanyaan">${escapeHtml(soal.pertanyaan)}</p>
          <div class="pilihan-list">
            ${soal.pilihan.map((p) => {
              let cls = "";
              if (soal.skor_pilihan) {
                if (p.kode === r.jawaban_user) cls = "selected";
              } else {
                if (p.kode === soal.jawaban_benar) cls = "benar";
                else if (p.kode === r.jawaban_user) cls = "salah";
              }
              return `
              <div class="pilihan-item ${cls}">
                <span class="pilihan-bubble">${p.kode}</span>
                <span class="pilihan-teks">${escapeHtml(p.teks)}${p.kode === r.jawaban_user ? " <em>(jawaban Anda)</em>" : ""}</span>
              </div>
            `;
            }).join("")}
          </div>
          <div class="pembahasan-box">
            <p class="pembahasan-label">Pembahasan</p>
            <p>${escapeHtml(soal.pembahasan)}</p>
          </div>
        </div>
      `;
      }).join("")}
    </div>
  `;
}

/* ============================================================
   AKUN
   ============================================================ */
async function viewAkun() {
  const aktif = await PaymentAPI.getLanggananAktif();
  const profil = Auth.currentProfile;
  appEl.innerHTML = `
    <h2>Akun Saya</h2>
    <div class="card fade-in grid grid-2">
      <div>
        <p class="hint">Nama</p>
        <p style="color:var(--ink); font-weight:600;">${escapeHtml(profil?.nama_lengkap || "-")}</p>
      </div>
      <div>
        <p class="hint">Email</p>
        <p style="color:var(--ink); font-weight:600;">${escapeHtml(Auth.currentUser.email)}</p>
      </div>
      <div>
        <p class="hint">Status Langganan</p>
        ${aktif
          ? `<span class="status-badge status-aktif">Premium hingga ${formatTanggal(aktif.berakhir)}</span>`
          : `<span class="status-badge status-berakhir">Belum berlangganan</span>`}
      </div>
    </div>
    ${!aktif ? `<a href="#/langganan" class="btn" style="margin-top:20px;">Upgrade ke Premium</a>` : ""}
  `;
}

function view404() {
  appEl.innerHTML = `<div class="empty-state"><h3>Halaman tidak ditemukan</h3><a href="#/" class="btn" style="margin-top:12px;">Kembali ke Beranda</a></div>`;
}

/* ============================================================
   BOOTSTRAP
   ============================================================ */
(async function bootstrap() {
  await Auth.init();
  renderTopnav();
  router();
})();
