// js/auth.js — semua urusan autentikasi

const Auth = {
  currentUser: null,
  currentProfile: null,

  async init() {
    const { data } = await supabaseClient.auth.getSession();
    this.currentUser = data.session?.user ?? null;
    if (this.currentUser) await this.loadProfile();

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      this.currentUser = session?.user ?? null;
      if (this.currentUser) await this.loadProfile();
      else this.currentProfile = null;
      renderTopnav();
      router();
    });
  },

  async loadProfile() {
    const { data } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", this.currentUser.id)
      .single();
    this.currentProfile = data ?? null;
  },

  async register(email, password, namaLengkap) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { nama_lengkap: namaLengkap } },
    });
    if (error) throw error;
    return data;
  },

  async login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    await supabaseClient.auth.signOut();
    navigate("/");
  },

  isLoggedIn() {
    return !!this.currentUser;
  },
};
