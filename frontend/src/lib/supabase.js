import {createClient} from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Existing Express deployments can explicitly keep their SQLite account system.
export const legacyAuth = import.meta.env.VITE_AUTH_PROVIDER === 'legacy';
export const supabase = !legacyAuth && url && key
  ? createClient(url,key,{auth:{flowType:'pkce'}})
  : null;
export const callbackUrl = () => new URL('/auth/callback',window.location.origin).href;
export const resetPasswordUrl = () => new URL('/reset-password',window.location.origin).href;
