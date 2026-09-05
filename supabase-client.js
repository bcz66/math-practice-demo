(() => {
  'use strict';

  /*
  =========================================================
  CalcDaily · Supabase public client
  ---------------------------------------------------------
  只需要填写下面两个公开值：
  1) Project URL
  2) Publishable Key / Anon Key

  注意：
  - 这两个值允许放在浏览器端。
  - 不要把 service_role key 放到这里。
  - DeepSeek API Key 继续只放 Vercel Environment Variables。
  =========================================================
  */

  const SUPABASE_URL = 'https://kokjcqeyjhjxolactlfu.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XZZrp8yUShq-EriAeumhtg_eAq7pWDA';

  function looksConfigured(value) {
    const s = String(value || '').trim();
    return Boolean(
      s &&
      !s.startsWith('YOUR_') &&
      !s.includes('example') &&
      s.length > 10
    );
  }

  const configured =
    looksConfigured(SUPABASE_URL) &&
    looksConfigured(SUPABASE_PUBLISHABLE_KEY) &&
    Boolean(window.supabase?.createClient);

  let client = null;

  if (configured) {
    client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  window.CalcDailySupabase = {
    configured,
    client,
    url: configured ? SUPABASE_URL : null
  };
})();
