/**
 * Ocean One Dashboard — Supabase Client
 * Publishable (anon) key is safe to be in public code.
 * RLS policies ensure only authenticated sessions can read data.
 */

const SUPABASE_URL = "https://izlaovurdaoalpwiykjc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_a4R4hc-naCOzrHCRCizdOA_0KSwSowy";

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
