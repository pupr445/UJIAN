// js/soal.js — akses data bank soal

const SoalAPI = {
  async getKategori() {
    const { data, error } = await supabaseClient
      .from("kategori_ujian")
      .select("*")
      .order("urutan");
    if (error) throw error;
    return data;
  },

  async getKategoriByKode(kode) {
    const { data, error } = await supabaseClient
      .from("kategori_ujian")
      .select("*")
      .eq("kode", kode)
      .single();
    if (error) throw error;
    return data;
  },

  async getSubtes(kategoriId) {
    const { data, error } = await supabaseClient
      .from("subtes")
      .select("*, soal(count)")
      .eq("kategori_id", kategoriId)
      .order("urutan");
    if (error) throw error;
    return data;
  },

  async getSubtesById(id) {
    const { data, error } = await supabaseClient.from("subtes").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  // Mengembalikan hanya soal yang boleh dilihat user (RLS menyaring otomatis).
  // total_soal dihitung terpisah agar user tahu berapa banyak yang terkunci.
  async getSoalUntukSubtes(subtesId) {
    const { data: totalSoalData } = await supabaseClient.rpc("hitung_total_soal", {
      p_subtes_id: subtesId,
    });
    const totalSoal = totalSoalData ?? 0;

    const { data, error } = await supabaseClient
      .from("soal")
      .select("*")
      .eq("subtes_id", subtesId)
      .order("created_at");
    if (error) throw error;

    return { soal: data, totalSoal: totalSoal ?? data.length };
  },

  async catatJawaban(soalId, jawabanUser, isBenar) {
    if (!Auth.isLoggedIn()) return;
    await supabaseClient.from("riwayat_jawaban").insert({
      user_id: Auth.currentUser.id,
      soal_id: soalId,
      jawaban_user: jawabanUser,
      is_benar: isBenar,
    });
  },
};
