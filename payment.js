// js/payment.js — paket langganan & checkout

const PaymentAPI = {
  async getPaket() {
    const { data, error } = await supabaseClient
      .from("paket_langganan")
      .select("*")
      .eq("aktif", true)
      .order("harga");
    if (error) throw error;
    return data;
  },

  async getLanggananAktif() {
    if (!Auth.isLoggedIn()) return null;
    const { data } = await supabaseClient
      .from("langganan_user")
      .select("*, paket_langganan(*)")
      .eq("user_id", Auth.currentUser.id)
      .eq("status", "aktif")
      .gt("berakhir", new Date().toISOString())
      .order("berakhir", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },

  async getRiwayatTransaksi() {
    if (!Auth.isLoggedIn()) return [];
    const { data } = await supabaseClient
      .from("transaksi")
      .select("*, paket_langganan(nama)")
      .eq("user_id", Auth.currentUser.id)
      .order("created_at", { ascending: false });
    return data ?? [];
  },

  // Memanggil Edge Function 'create-payment' untuk mendapatkan URL checkout
  async buatCheckout(paketId, gateway) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Silakan login terlebih dahulu");

    const res = await fetch(`${window.APP_CONFIG.SUPABASE_URL}/functions/v1/create-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paket_id: paketId, gateway }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.error || "Gagal membuat transaksi");
    return data; // { redirect_url, order_id }
  },
};
