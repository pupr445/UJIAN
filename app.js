// js/app.js — routing & rendering halaman

const appEl = document.getElementById("app");

function navigate(path) {
  window.location.hash = "#" + path;
}

function currentPath() {
  return window.location.hash.replace(/^#/, "") || "/";
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
    <section style="text-align:center; padding: 40px 0 20px;">
      <p class="kategori-eyebrow" style="justify-content:center; display:flex;">Bank Soal &amp; Pembahasan</p>
      <h1>Siap ujian CPNS &amp; UTBK dengan soal yang benar-benar dibahas.</h1>
      <p style="max-width:520px; margin:0 auto 24px;">Ratusan soal TWK, TIU, TKP, Penalaran Umum, dan Pengetahuan Umum — lengkap dengan pembahasan langkah demi langkah, bukan cuma kunci jawaban.</p>
      <a href="#/daftar" class="btn">Mulai Latihan Gratis</a>
    </section>
    <section class="grid grid-3" style="margin-top:48px;">
      <div class="card">
        <h3>Soal Terstruktur</h3>
        <p>Dikelompokkan per subtes, sesuai kisi-kisi ujian resmi.</p>
      </div>
      <div class="card">
        <h3>Pembahasan Lengkap</h3>
        <p>Setiap soal disertai alasan kenapa jawaban itu benar — bukan cuma kuncinya.</p>
      </div>
      <div class="card">
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
    <div class="card" style="max-width:420px; margin:0 auto;">
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
    <div class="card" style="max-width:420px; margin:0 auto;">
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
   DASHBOARD — daftar kategori ujian
   ============================================================ */
async function viewDashboard() {
  appEl.innerHTML = `<p>Memuat kategori...</p>`;
  const kategori = await SoalAPI.getKategori();
  appEl.innerHTML = `
    <h2>Pilih Jenis Ujian</h2>
    <div class="grid grid-2" style="margin-top:18px;">
      ${kategori.map((k) => `
        <a href="#/kategori/${k.kode}" class="card kategori-card">
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
      ${subtes.map((s) => `
        <a href="#/kuis/${s.id}" class="subtes-row">
          <div>
            <strong>${escapeHtml(s.kode)}</strong> — ${escapeHtml(s.nama)}
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
      <div class="exam-ticket" style="margin-top:16px;">
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
        <div class="card pricing-card ${i === 1 ? "featured" : ""}">
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
   AKUN
   ============================================================ */
async function viewAkun() {
  const aktif = await PaymentAPI.getLanggananAktif();
  const profil = Auth.currentProfile;
  appEl.innerHTML = `
    <h2>Akun Saya</h2>
    <div class="card grid grid-2">
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
