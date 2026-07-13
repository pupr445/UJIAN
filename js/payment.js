// js/tryout.js — mesin tryout: mulai sesi, jawab, submit, lihat hasil

const TryoutAPI = {
  async getSemuaPaket() {
    const { data, error } = await supabaseClient
      .from("paket_tryout")
      .select("*, kategori_ujian(kode, nama), paket_tryout_subtes(*, subtes(kode, nama))")
      .eq("aktif", true);
    if (error) throw error;
    return data;
  },

  async getSemuaKepemilikan() {
    if (!Auth.isLoggedIn()) return [];
    const { data } = await supabaseClient
      .from("kepemilikan_tryout")
      .select("paket_tryout_id")
      .eq("user_id", Auth.currentUser.id);
    return (data ?? []).map((d) => d.paket_tryout_id);
  },

  async getBundleList() {
    const { data, error } = await supabaseClient
      .from("bundle_tryout")
      .select("*, bundle_tryout_paket(*, paket_tryout(id, nama, harga, durasi_menit))")
      .eq("aktif", true);
    if (error) throw error;
    return data;
  },

  // Beli satu paket tryout secara satuan
  async beliTryout(paketTryoutId, gateway) {
    return PaymentAPI.buatCheckoutProduk("tryout", paketTryoutId, gateway);
  },

  // Beli bundle (beberapa paket tryout sekaligus, harga lebih hemat)
  async beliBundle(bundleId, gateway) {
    return PaymentAPI.buatCheckoutProduk("bundle", bundleId, gateway);
  },

  async getPaketByKategori(kategoriId) {
    const { data, error } = await supabaseClient
      .from("paket_tryout")
      .select("*, paket_tryout_subtes(*, subtes(kode, nama))")
      .eq("kategori_id", kategoriId)
      .eq("aktif", true);
    if (error) throw error;
    return data;
  },

  async getPaketById(paketId) {
    const { data, error } = await supabaseClient
      .from("paket_tryout")
      .select("*, paket_tryout_subtes(*, subtes(kode, nama))")
      .eq("id", paketId)
      .single();
    if (error) throw error;
    return data;
  },

  // Sesi yang masih berjalan (kalau ada, supaya user bisa lanjut, bukan mulai baru)
  async getSesiBerlangsung(paketId) {
    if (!Auth.isLoggedIn()) return null;
    const { data } = await supabaseClient
      .from("sesi_tryout")
      .select("*")
      .eq("user_id", Auth.currentUser.id)
      .eq("paket_tryout_id", paketId)
      .eq("status", "berlangsung")
      .gt("batas_waktu", new Date().toISOString())
      .maybeSingle();
    return data;
  },

  // Membuat sesi baru: pilih soal per subtes sesuai komposisi paket, urut sesuai 'urutan'
  async mulaiSesi(paket) {
    const durasiMs = paket.durasi_menit * 60 * 1000;
    const batasWaktu = new Date(Date.now() + durasiMs).toISOString();

    const { data: sesi, error: sesiErr } = await supabaseClient
      .from("sesi_tryout")
      .insert({
        user_id: Auth.currentUser.id,
        paket_tryout_id: paket.id,
        batas_waktu: batasWaktu,
      })
      .select()
      .single();
    if (sesiErr) throw sesiErr;

    let urutanGlobal = 1;
    const baris = [];
    const komposisiUrut = [...paket.paket_tryout_subtes].sort((a, b) => a.urutan - b.urutan);

    for (const komp of komposisiUrut) {
      const { data: soalSubtes, error: soalErr } = await supabaseClient
        .from("soal_tryout_ujian")
        .select("id")
        .eq("subtes_id", komp.subtes_id)
        .order("urutan")
        .limit(komp.jumlah_soal);
      if (soalErr) throw soalErr;

      for (const s of soalSubtes) {
        baris.push({ sesi_id: sesi.id, soal_tryout_id: s.id, urutan: urutanGlobal++ });
      }
    }

    const { error: insertErr } = await supabaseClient.from("sesi_tryout_soal").insert(baris);
    if (insertErr) throw insertErr;

    return sesi;
  },

  async getSesi(sesiId) {
    const { data, error } = await supabaseClient
      .from("sesi_tryout")
      .select("*, paket_tryout(*, paket_tryout_subtes(*, subtes(kode, nama)))")
      .eq("id", sesiId)
      .single();
    if (error) throw error;
    return data;
  },

  // Ambil daftar soal (tanpa jawaban) beserta jawaban user yang sudah tersimpan.
  // Dilakukan 2 langkah (bukan join) karena soal_tryout_ujian adalah VIEW terpisah
  // dari tabel soal_tryout yang dibatasi RLS saat ujian masih berlangsung.
  async getSoalSesi(sesiId) {
    const { data: sesiSoal, error: sesiSoalErr } = await supabaseClient
      .from("sesi_tryout_soal")
      .select("id, urutan, jawaban_user, soal_tryout_id")
      .eq("sesi_id", sesiId)
      .order("urutan");
    if (sesiSoalErr) throw sesiSoalErr;

    const ids = sesiSoal.map((s) => s.soal_tryout_id);
    const { data: soalData, error: soalErr } = await supabaseClient
      .from("soal_tryout_ujian")
      .select("id, subtes_id, pertanyaan, pilihan")
      .in("id", ids);
    if (soalErr) throw soalErr;

    const soalMap = Object.fromEntries(soalData.map((s) => [s.id, s]));
    return sesiSoal.map((s) => ({ ...s, soal_tryout_ujian: soalMap[s.soal_tryout_id] }));
  },

  async simpanJawaban(sesiTryoutSoalId, jawaban) {
    const { error } = await supabaseClient
      .from("sesi_tryout_soal")
      .update({ jawaban_user: jawaban, dijawab_pada: new Date().toISOString() })
      .eq("id", sesiTryoutSoalId);
    if (error) throw error;
  },

  // Memanggil Edge Function untuk menilai sesi (server-side, jawaban tetap rahasia sampai selesai)
  async submitSesi(sesiId) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Silakan login terlebih dahulu");

    const res = await fetch(`${window.APP_CONFIG.SUPABASE_URL}/functions/v1/submit-tryout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sesi_id: sesiId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.error || "Gagal menilai sesi tryout");
    return data;
  },

  // Review lengkap pembahasan (hanya jalan setelah status = 'selesai', dijamin RLS)
  async getReviewSesi(sesiId) {
    const { data, error } = await supabaseClient
      .from("sesi_tryout_soal")
      .select("id, urutan, jawaban_user, skor_didapat, soal_tryout(id, subtes_id, pertanyaan, pilihan, jawaban_benar, skor_pilihan, pembahasan, subtes(kode, nama))")
      .eq("sesi_id", sesiId)
      .order("urutan");
    if (error) throw error;
    return data;
  },

  async getRiwayatSesi() {
    if (!Auth.isLoggedIn()) return [];
    const { data } = await supabaseClient
      .from("sesi_tryout")
      .select("*, paket_tryout(nama)")
      .eq("user_id", Auth.currentUser.id)
      .order("created_at", { ascending: false });
    return data ?? [];
  },
};
