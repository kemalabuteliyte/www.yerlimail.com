/**
 * Eliyte Yerlimail – Cloudflare Worker
 *
 * Routes:
 *   POST /api/auth/login          → Mock auth API (always 401)
 *   postakutusu.yerlimail.com  /*     → Webmail login SPA
 *   www.yerlimail.com      /*     → Static assets via ASSETS binding
 */

export default {
  async fetch(request, env) {
    const url      = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;

    /* ── Mock auth API ─────────────────────────────────────────── */
    if (pathname === '/api/auth/login') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: apiHeaders() });
      }
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      await request.text(); // drain body – credentials intentionally ignored
      return Response.json(
        { success: false, code: 'INVALID_CREDENTIALS', message: 'Kullanıcı adı veya şifre hatalı.' },
        { status: 401, headers: apiHeaders() }
      );
    }

    /* ── Webmail subdomain ──────────────────────────────────────── */
    if (hostname === 'postakutusu.yerlimail.com') {
      return new Response(WEBMAIL_HTML, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex,nofollow',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    /* ── Static assets (www.yerlimail.com) ──────────────────────── */
    return env.ASSETS.fetch(request);
  },
};

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/* ══════════════════════════════════════════════════════════════════
   Webmail login page – fully self-contained SPA
   ══════════════════════════════════════════════════════════════════ */
const WEBMAIL_HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#070d1a">
  <meta name="robots" content="noindex,nofollow">
  <title>Webmail Girişi · Eliyte Yerlimail</title>

  <!-- Inline favicon – no extra round-trip -->
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='1' y='1' width='30' height='30' rx='8' stroke='%232563eb' stroke-width='1.5' fill='none'/%3E%3Cpath d='M6 11l9.2 6.4a1.5 1.5 0 0 0 1.6 0L26 11' stroke='%232563eb' stroke-width='1.6' stroke-linecap='round' fill='none'/%3E%3Cpath d='M6 11h20v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V11z' stroke='%232563eb' stroke-width='1.6' fill='none'/%3E%3C/svg%3E">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Michroma&family=Inter:wght@400;500;600&display=swap">

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:           #070d1a;
      --surface:      #0d1627;
      --surface-2:    #111e35;
      --border:       rgba(255,255,255,0.07);
      --border-focus: rgba(37,99,235,0.6);
      --blue:         #2563eb;
      --blue-dark:    #1d4ed8;
      --gold:         #c89b3c;
      --text:         #f0f4ff;
      --muted:        #8a9cc0;
      --error:        #f87171;
      --error-bg:     rgba(248,113,113,0.08);
      --error-border: rgba(248,113,113,0.25);
    }

    html, body { height: 100%; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100dvh;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Ambient background ─────────────────────────── */
    .bg {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
    }
    .orb-1 {
      width: 640px; height: 640px;
      top: -220px; right: -220px;
      background: radial-gradient(circle, rgba(37,99,235,0.18), transparent 65%);
    }
    .orb-2 {
      width: 500px; height: 500px;
      bottom: -220px; left: -220px;
      background: radial-gradient(circle, rgba(200,155,60,0.12), transparent 65%);
    }
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse at 50% 50%, black 10%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 10%, transparent 70%);
    }

    /* ── Layout ─────────────────────────────────────── */
    .wrap {
      position: relative;
      z-index: 1;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      gap: 20px;
    }

    /* ── Card ───────────────────────────────────────── */
    .card {
      width: 100%;
      max-width: 440px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 44px 40px;
      box-shadow:
        0 0 0 1px rgba(37,99,235,0.06),
        0 32px 80px rgba(0,0,0,0.55),
        0 8px 24px rgba(0,0,0,0.3);
    }

    /* ── Logo ───────────────────────────────────────── */
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
      margin-bottom: 36px;
    }
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #0a2247 0%, #1d4ed8 100%);
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(37,99,235,0.35);
    }
    .logo-icon svg { width: 26px; height: 26px; }

    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1;
      font-family: 'Michroma', sans-serif;
    }
    .logo-name {
      font-size: 1.15rem;
      color: var(--text);
      letter-spacing: 0.05em;
    }
    .logo-sub {
      font-size: 0.6rem;
      color: var(--gold);
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin-top: 5px;
    }

    /* ── Card header ────────────────────────────────── */
    .card-head { margin-bottom: 28px; }
    .card-head h1 {
      font-size: 1.45rem;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.02em;
      margin-bottom: 6px;
    }
    .card-head p { font-size: 0.9rem; color: var(--muted); }

    /* ── Form ───────────────────────────────────────── */
    .field { margin-bottom: 16px; }
    .field-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 7px;
    }
    label {
      display: block;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--muted);
      letter-spacing: 0.01em;
      margin-bottom: 7px;
    }
    .field-head label { margin-bottom: 0; }
    .forgot {
      font-size: 0.8rem;
      color: var(--blue);
      text-decoration: none;
      opacity: 0.75;
      transition: opacity 0.15s;
    }
    .forgot:hover { opacity: 1; text-decoration: underline; }

    .input-wrap { position: relative; }
    .input-icon {
      position: absolute;
      left: 14px; top: 50%;
      transform: translateY(-50%);
      width: 16px; height: 16px;
      color: var(--muted);
      pointer-events: none;
    }
    input {
      width: 100%;
      padding: 12px 44px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      -webkit-appearance: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
    }
    input::placeholder { color: rgba(138,156,192,0.4); }
    input[aria-invalid="true"] {
      border-color: rgba(248,113,113,0.55);
      box-shadow: 0 0 0 3px rgba(248,113,113,0.1);
    }

    .eye-btn {
      position: absolute;
      right: 12px; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      cursor: pointer; padding: 4px;
      color: var(--muted);
      display: flex; align-items: center;
      transition: color 0.15s;
    }
    .eye-btn:hover { color: var(--text); }
    .eye-btn svg { width: 18px; height: 18px; }

    /* ── Error box ──────────────────────────────────── */
    .error {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      background: var(--error-bg);
      border: 1px solid var(--error-border);
      border-radius: 10px;
      color: var(--error);
      font-size: 0.875rem;
      margin-bottom: 16px;
      line-height: 1.45;
    }
    .error svg { flex-shrink: 0; margin-top: 1px; }

    @keyframes shake {
      0%,100% { transform: translateX(0); }
      18%  { transform: translateX(-7px); }
      36%  { transform: translateX(6px); }
      54%  { transform: translateX(-4px); }
      72%  { transform: translateX(3px); }
    }
    .error.shake { animation: shake 0.45s ease; }

    /* ── Submit button ──────────────────────────────── */
    .btn {
      width: 100%;
      padding: 13px;
      margin-top: 4px;
      background: var(--blue);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: 0.01em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      box-shadow: 0 4px 16px rgba(37,99,235,0.38);
      transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    }
    .btn:hover:not(:disabled) {
      background: var(--blue-dark);
      box-shadow: 0 6px 22px rgba(37,99,235,0.48);
    }
    .btn:active:not(:disabled) { transform: scale(0.99); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner {
      display: none;
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
      flex-shrink: 0;
    }
    .btn.loading .spinner { display: block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Footer ─────────────────────────────────────── */
    .card-foot {
      margin-top: 22px;
      text-align: center;
      font-size: 0.85rem;
    }
    .card-foot a { color: var(--muted); text-decoration: none; transition: color 0.15s; }
    .card-foot a:hover { color: var(--text); }

    .page-foot {
      font-size: 0.78rem;
      color: rgba(138,156,192,0.45);
      text-align: center;
    }
    .page-foot a { color: inherit; }
    .page-foot a:hover { color: var(--muted); text-decoration: underline; }

    @media (max-width: 480px) {
      .card { padding: 32px 24px; border-radius: 20px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .error.shake { animation: none; }
      .spinner      { animation: none; }
    }
  </style>
</head>

<body>
  <!-- ambient glow -->
  <div class="bg" aria-hidden="true">
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="grid"></div>
  </div>

  <div class="wrap">
    <div class="card">

      <!-- Logo -->
      <a href="https://www.yerlimail.com" class="logo" aria-label="Eliyte Yerlimail ana sayfa">
        <span class="logo-icon">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="30" height="30" rx="8" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 11l9.2 6.4a1.5 1.5 0 0 0 1.6 0L26 11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M6 11h20v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V11z" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </span>
        <span class="logo-text">
          <span class="logo-name">Eliyte</span>
          <span class="logo-sub">Yerlimail</span>
        </span>
      </a>

      <div class="card-head">
        <h1>Webmail'e Giriş</h1>
        <p>E-posta hesabınıza erişmek için bilgilerinizi girin.</p>
      </div>

      <form id="form" novalidate>

        <!-- Email -->
        <div class="field">
          <label for="email">E-posta Adresi</label>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2 6l8 5 8-5M2 6h16v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6z"
                    stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input type="email" id="email" name="email"
                   placeholder="kullanici@yerlimail.com"
                   autocomplete="email" spellcheck="false">
          </div>
        </div>

        <!-- Password -->
        <div class="field">
          <div class="field-head">
            <label for="password">Şifre</label>
            <a href="mailto:destek@yerlimail.com" class="forgot" tabindex="-1">Şifremi unuttum</a>
          </div>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="3" y="9" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <path d="M7 9V7a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
            <input type="password" id="password" name="password"
                   placeholder="••••••••" autocomplete="current-password">
            <button type="button" class="eye-btn" id="eyeBtn" aria-label="Şifreyi göster">
              <!-- eye open -->
              <svg id="eyeShow" viewBox="0 0 20 20" fill="none">
                <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z"
                      stroke="currentColor" stroke-width="1.4"/>
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/>
              </svg>
              <!-- eye closed -->
              <svg id="eyeHide" viewBox="0 0 20 20" fill="none" style="display:none">
                <path d="M3 3l14 14M11.4 11.5A2.5 2.5 0 0 1 7.4 8M8.5 5.1C9 4.8 9.5 4.5 10 4.5c5 0 8 5.5 8 5.5a17 17 0 0 1-2.5 3.2M4.8 7.3C3.5 8.4 2 10 2 10s3 5.5 8 5.5c1.5 0 2.8-.4 4-1"
                      stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Error -->
        <div class="error" id="errBox" hidden>
          <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4"/>
            <path d="M10 6.5v3.5m0 2.5v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <span id="errMsg"></span>
        </div>

        <button type="submit" class="btn" id="submitBtn">
          <span class="spinner" aria-hidden="true"></span>
          <span id="btnLabel">Giriş Yap</span>
        </button>

      </form>

      <p class="card-foot">
        <a href="https://www.yerlimail.com">← Eliyte Yerlimail'e dön</a>
      </p>
    </div>

    <p class="page-foot">
      © 2026 Eliyte &middot;
      <a href="https://www.yerlimail.com/gizlilik">Gizlilik</a> &middot;
      <a href="https://www.yerlimail.com/kvkk">KVKK</a>
    </p>
  </div>

  <script>
    (() => {
      const form      = document.getElementById('form');
      const emailEl   = document.getElementById('email');
      const passEl    = document.getElementById('password');
      const submitBtn = document.getElementById('submitBtn');
      const btnLabel  = document.getElementById('btnLabel');
      const errBox    = document.getElementById('errBox');
      const errMsg    = document.getElementById('errMsg');
      const eyeBtn    = document.getElementById('eyeBtn');
      const eyeShow   = document.getElementById('eyeShow');
      const eyeHide   = document.getElementById('eyeHide');

      /* ── Password visibility toggle ─── */
      eyeBtn.addEventListener('click', () => {
        const isHidden = passEl.type === 'password';
        passEl.type         = isHidden ? 'text' : 'password';
        eyeShow.style.display = isHidden ? 'none' : '';
        eyeHide.style.display = isHidden ? ''     : 'none';
        eyeBtn.setAttribute('aria-label', isHidden ? 'Şifreyi gizle' : 'Şifreyi göster');
      });

      /* ── Form submit ──────────────────── */
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email    = emailEl.value.trim();
        const password = passEl.value;

        if (!email || !password) {
          showError('Lütfen tüm alanları doldurun.');
          return;
        }

        setLoading(true);

        try {
          /* Real HTTP request to mock API endpoint */
          const res  = await fetch('/api/auth/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            btnLabel.textContent = 'Yönlendiriliyor…';
            /* A real app would redirect: window.location.href = '/inbox'; */
          } else {
            showError(data.message || 'Kullanıcı adı veya şifre hatalı.');
          }
        } catch {
          showError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
        } finally {
          setLoading(false);
        }
      });

      function setLoading(on) {
        submitBtn.disabled = on;
        submitBtn.classList.toggle('loading', on);
        btnLabel.textContent = on ? 'Giriş yapılıyor…' : 'Giriş Yap';
      }

      function showError(msg) {
        errMsg.textContent = msg;
        errBox.hidden = false;
        errBox.classList.remove('shake');
        void errBox.offsetWidth; // reflow → restart animation
        errBox.classList.add('shake');
        emailEl.setAttribute('aria-invalid', 'true');
        passEl.setAttribute('aria-invalid', 'true');
      }

      function clearError() {
        errBox.hidden = true;
        emailEl.removeAttribute('aria-invalid');
        passEl.removeAttribute('aria-invalid');
      }
    })();
  </script>
</body>
</html>`;
