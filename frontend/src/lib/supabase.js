import {createClient} from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Existing Express deployments can explicitly keep their SQLite account system.
export const legacyAuth = import.meta.env.VITE_AUTH_PROVIDER === 'legacy';
export const supabase = !legacyAuth && url && key
  ? createClient(url,key,{auth:{flowType:'pkce'}})
  : null;
export const googleEnabled = !!supabase && import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';
export const callbackUrl = () => new URL('/auth/callback',window.location.origin).href;

// The provider can be enabled later in the Supabase dashboard without a rebuild.
export async function googleProviderEnabled() {
  if (!supabase) return false;
  try {
    const response = await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key}});
    if (!response.ok) return false;
    return !!(await response.json()).external?.google;
  } catch { return false; }
}
