const SUPABASE_URL = "https://kkqgjchtfcdjhlyoupwx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_GrL8P4mPEMXFZRhcXdNLpA_52ZfdrrT";

if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );
    console.log("Supabase client initialized");
} else {
    console.error("Supabase library not loaded");
}
