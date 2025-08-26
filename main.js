// ==UserScript==
// @name         NovaX Bypass
// @version      1.0.0
// @description  Universal userscript bypass(no support captcha)
// @author       NovaX
// @homepageURL  https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO
// @updateURL    https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO/main/bacon-bypass.user.js
// @downloadURL  https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO/main/bacon-bypass.user.js

// ---------------------- match list ----------------------
// (keep or extend these matches as you like)
 // @match        *://loot-link.com/s?*
 // @match        *://loot-links.com/s?*
 // @match        *://lootlink.org/s?*
 // @match        *://lootlinks.co/s?*
 // @match        *://lootdest.info/s?*
 // @match        *://lootdest.org/s?*
 // @match        *://lootdest.com/s?*
 // @match        *://links-loot.com/s?*
 // @match        *://linksloot.net/s?*
 // @match        *://linkvertise.com/*/*
 // @match        *://linkvertise.com/?iwantbypass=*
 // @match        *://adfoc.us/*
 // @match        *://go.linkify.ru/*
 // @match        *://boost.ink/*
 // @match        *://bst.gg/*
 // @match        *://blox-script.com/get-key*
 // @match        *://blox-script.com/subscribe*
 // @match        *://link-unlock.com/*
 // @match        *://rekonise.com/*
 // @match        *://rkns.link/*
 // @match        *://mboost.me/*
 // @match        *://sub4unlock.pro/*
 // @match        *://sub4unlock.com/*
 // @match        *://linkunlocker.com/*
 // @match        *://sub2unlock.com/*
 // @match        *://sub2unlock.top/*
 // @match        *://sub2unlock.me/*
 // @match        *://*.sub2get.com/*
 // @match        *://socialwolvez.com/*
 // @match        *://auth.platoboost.com/*
 // @match        *://auth.platoboost.click/*
 // @match        *://auth.platoboost.net/*
 // @match        *://auth.platorelay.com/*
 // @match        *://flux.li/android/external/*
 // @match        *://bstlar.com/*
 // @match        *://mobile.codex.lol/*
 // @match        *://social-unlock.com/*
 // @match        *://spdmteam.com/key-system*
 // @match        *://krnl.cat/checkpoint/*
 // @match        *://ads.luarmor.net/*
 // @match        *://dusarisalary.com/*
 // @match        *://bloggingdaze.com/*
 // @match        *://key.volcano.wtf/*
 // @match        *://keyrblx.com/*
 // @match        *://pandadevelopment.net/getkey?*
 // @match        *://ldnesfspublic.org/*
 // @match        *://tapvietcode.com/*
 // @match        *://paster.so/*
 // @match        *://sub2unlock.io/*
 // @match        *://getkey.farrghii.com/check1.php*
 // @match        *://bypass-linkv2.vercel.app/bypass.html?url=*
 // @match        *://krnl.cat/*

// ---------------------- grants ----------------------
 // @grant        GM_setClipboard
 // @grant        GM_xmlhttpRequest
 // @grant        GM_addStyle
 // @grant        GM_registerMenuCommand
 // @grant        GM_getValue
 // @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  /* ============================
     CONFIG (edit here)
     ============================ */
  function config() {
    return {
      debug: true,
      timer: 0, // seconds to wait before trying auto click (if applicable)
      autoRedirect: true, // automatically try redirect/click
      redirectv2: false, // special fast auto-redirect mode (no button)
      redirectv2Delay: 0, // seconds delay for redirectv2
      useLootlabsV2: true,
      redirectURLButton: ['krnl.cat', 'ads.luarmor.net'],
      cooldownButton: 'default', // 'default' or number in seconds
      autoCopy: true,
      pauseOnCaptcha: true,
      resumeCheckMs: 800,
    };
  }

  /* ============================
     CORE UTILITIES
     ============================ */
  const Core = {
    debug: config().debug,

    log(...args) {
      if (Core.debug) console.log('[BaconBypass]', ...args);
    },

    sleep(ms) {
      return new Promise((r) => setTimeout(r, ms));
    },

    getHost() {
      return location.hostname.replace(/^www\./, '');
    },

    waitFor(selector, timeoutMs = 10000) {
      return new Promise((resolve, reject) => {
        try {
          if (!selector) return reject(new Error('No selector'));
          const el = document.querySelector(selector);
          if (el) return resolve(el);
          const obs = new MutationObserver(() => {
            const e = document.querySelector(selector);
            if (e) {
              obs.disconnect();
              resolve(e);
            }
          });
          obs.observe(document.body, { childList: true, subtree: true });
          if (timeoutMs > 0) {
            setTimeout(() => { try { obs.disconnect(); } catch (e) {} reject(new Error('waitFor timeout')); }, timeoutMs);
          }
        } catch (err) {
          reject(err);
        }
      });
    },

    pollFor(selector, intervalMs = 500, maxMs = 10000) {
      return new Promise((resolve) => {
        const start = Date.now();
        const tick = async () => {
          const el = document.querySelector(selector);
          if (el) return resolve(el);
          if (Date.now() - start > maxMs) return resolve(null);
          setTimeout(tick, intervalMs);
        };
        tick();
      });
    },

    click(el) {
      if (!el) return false;
      try {
        el.focus && el.focus();
        el.dispatchEvent && el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.click && el.click();
        el.dispatchEvent && el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        return true;
      } catch (e) {
        try { el.click(); return true; } catch (err) { return false; }
      }
    },

    async copy(text) {
      try {
        if (typeof GM_setClipboard !== 'undefined') {
          GM_setClipboard(text);
          Core.showBanner('Key copied to clipboard', 1800);
          return true;
        }
      } catch (e) { Core.log('GM_setClipboard error', e); }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          Core.showBanner('Key copied to clipboard', 1800);
          return true;
        }
      } catch (e) { Core.log('navigator.clipboard error', e); }
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        Core.showBanner('Key copied to clipboard', 1800);
        return true;
      } catch (e) { Core.log('fallback copy failed', e); }
      return false;
    },

    showBanner(msg, duration = 2000) {
      try {
        const id = 'baconbypass-banner';
        let el = document.getElementById(id);
        if (!el) {
          el = document.createElement('div');
          el.id = id;
          el.style.position = 'fixed';
          el.style.top = '14px';
          el.style.left = '50%';
          el.style.transform = 'translateX(-50%)';
          el.style.zIndex = 2147483647;
          el.style.padding = '8px 12px';
          el.style.borderRadius = '8px';
          el.style.background = 'rgba(17, 24, 39, 0.85)';
          el.style.color = '#fff';
          el.style.font = '13px/1.2 system-ui, sans-serif';
          el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)';
          document.body.appendChild(el);
        }
        el.textContent = msg;
        setTimeout(() => { try { el.remove(); } catch (e) {} }, duration);
      } catch (e) { Core.log('showBanner error', e); }
    },

    detectCaptcha() {
      try {
        const turnstile = !!document.querySelector('[data-sitekey], iframe[src*="turnstile"], iframe[src*="challenges.cloudflare.com"]');
        const hcaptcha = !!document.querySelector('.h-captcha, iframe[src*="hcaptcha.com"]');
        const recaptcha = !!document.querySelector('.g-recaptcha, iframe[src*="recaptcha"]');
        const cfchallenge = !!document.querySelector('form#challenge-form, #challenge-spinner');
        const tokenInput = document.querySelector('input[name="cf-turnstile-response"]');
        const tokenPresent = tokenInput && tokenInput.value && tokenInput.value.length > 10;
        const found = (turnstile || hcaptcha || recaptcha || cfchallenge) && !tokenPresent;
        if (found) Core.log('Captcha detected');
        return found;
      } catch (e) { return false; }
    },

    addFloatingButton(text = 'Bypass', onClick = () => {}, cooldown = 5) {
      try {
        const id = 'baconbypass-btn';
        if (document.getElementById(id)) return document.getElementById(id);
        const btn = document.createElement('button');
        btn.id = id;
        btn.textContent = text;
        Object.assign(btn.style, {
          position: 'fixed',
          right: '12px',
          bottom: '12px',
          zIndex: 2147483647,
          padding: '10px 14px',
          borderRadius: '10px',
          background: '#0b67ff',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        });
        document.body.appendChild(btn);

        let locked = false;
        btn.addEventListener('click', async () => {
          if (locked) return;
          try { await onClick(); } catch (e) { Core.log('button click error', e); }
          if (cooldown > 0) {
            locked = true;
            const original = btn.textContent;
            let left = cooldown;
            btn.textContent = `${original} (${left}s)`;
            const si = setInterval(() => {
              left -= 1;
              btn.textContent = `${original} (${left}s)`;
              if (left <= 0) {
                clearInterval(si);
                btn.textContent = original;
                locked = false;
              }
            }, 1000);
          }
        });
        return btn;
      } catch (e) { Core.log('addFloatingButton error', e); return null; }
    },
  };

  /* ============================
     SITE MAPPING + HANDLERS
     ============================ */
  const siteMap = [
    { patterns: ['linkvertise.com'], key: 'linkvertise' },
    { patterns: ['ads.luarmor.net', 'luarmor.net'], key: 'luarmor' },
    { patterns: ['krnl.cat'], key: 'krnl' },
    { patterns: ['loot-link.com', 'loot-links.com', 'lootlink.org', 'lootlinks.co', 'lootdest.info', 'lootdest.org', 'lootdest.com', 'links-loot.com', 'linksloot.net'], key: 'lootlabs' },
    { patterns: ['paster.so'], key: 'paster' },
    { patterns: ['sub2unlock.com', 'sub2unlock.io', 'sub2unlock.me', 'sub2unlock.top', 'sub2get.com'], key: 'sub2unlock' },
    { patterns: ['mboost.me', 'socialwolvez.com', 'social-unlock.com'], key: 'mboost' },
    { patterns: ['flux.li'], key: 'fluxli' },
    { patterns: ['tapvietcode.com'], key: 'tapvietcode' },
    { patterns: ['link-unlock.com', 'linkunlocker.com', 'links-loot.com'], key: 'linkunlock' },
    { patterns: ['bst.gg'], key: 'bst' },
  ];

  const handlers = {
    async linkvertise(cfg) {
      Core.showBanner('Bypassing Linkvertise...', 1600);
      try {
        const urlParams = new URLSearchParams(location.search);
        const r = urlParams.get('r');
        if (r) {
          try {
            const target = atob(r);
            Core.log('linkvertise decoded target', target);
            if (cfg.autoRedirect) location.href = target;
            return true;
          } catch (e) { Core.log('base64 decode failed', e); }
        }
        const body = document.body.innerText || '';
        const m = body.match(/"target"\s*:\s*"([^"]+)"/);
        if (m && m[1]) {
          const decoded = decodeURIComponent(m[1]);
          if (cfg.autoRedirect) location.href = decoded;
          return true;
        }
        const anchor = document.querySelector('a[href*="target"], a[data-target], a[href*="redirect"]');
        if (anchor) { if (cfg.autoRedirect) Core.click(anchor); return true; }
      } catch (e) { Core.log('linkvertise handler error', e); }
      return false;
    },

    async luarmor(cfg) {
      Core.showBanner('Luarmor detected', 1500);
      const sel = 'a#continue, button#continue, .continue, a[href*="continue"]';
      const el = document.querySelector(sel);
      if (el) { if (cfg.autoRedirect) Core.click(el); return true; }
      return false;
    },

    async krnl(cfg) {
      Core.showBanner('KRNL flow', 1500);
      try {
        const keySel = 'input#key, input[name="key"], input[name="license"]';
        const btnSel = 'a#go, button#go, a[href*="go"]';
        const keyEl = document.querySelector(keySel);
        if (keyEl) {
          const val = (keyEl.value || keyEl.textContent || '').trim();
          if (val && cfg.autoCopy) await Core.copy(val);
        }
        const go = document.querySelector(btnSel);
        if (go && cfg.autoRedirect) Core.click(go);
        return true;
      } catch (e) { Core.log('krnl handler error', e); }
      return false;
    },

    async lootlabs(cfg) {
      Core.showBanner('Loot-links detected', 1500);
      try {
        const selectors = ['a#proceed, a[href*="proceed"], a[href*="getlink"], .bypass-link, a[targetlink]'];
        for (const s of selectors) {
          const el = document.querySelector(s);
          if (el) { if (cfg.autoRedirect) Core.click(el); return true; }
        }
        const text = document.body.innerText || '';
        const urlMatch = text.match(/https?:\/\/[^\s"']{15,}/);
        if (urlMatch) {
          const found = urlMatch[0];
          if (cfg.autoRedirect) location.href = found;
          return true;
        }
      } catch (e) { Core.log('lootlabs handler error', e); }
      return false;
    },

    async paster(cfg) {
      Core.showBanner('Paster detected', 1500);
      try {
        const codeSel = 'pre code, pre, code';
        const el = document.querySelector(codeSel);
        if (el) {
          const txt = (el.textContent || '').trim();
          if (txt && cfg.autoCopy) await Core.copy(txt);
          return true;
        }
      } catch (e) { Core.log('paster handler error', e); }
      return false;
    },

    async sub2unlock(cfg) {
      Core.showBanner('Sub2Unlock detected', 1500);
      try {
        const unlockSel = 'a.unlock, button.unlock, .unlock, a[href*="unlock"]';
        const el = document.querySelector(unlockSel);
        if (el) { if (cfg.autoRedirect) Core.click(el); return true; }
      } catch (e) { Core.log('sub2unlock handler error', e); }
      return false;
    },

    async mboost(cfg) {
      Core.showBanner('Social unlock / Mboost', 1500);
      try {
        const el = document.querySelector('a[href*="redirect"], button.boost-button, .boost-button');
        if (el) { if (cfg.autoRedirect) Core.click(el); return true; }
      } catch (e) { Core.log('mboost handler error', e); }
      return false;
    },

    async fluxli(cfg) {
      Core.showBanner('Flux.li detected', 1500);
      try {
        const key = document.querySelector('input#key, input[name="key"]');
        if (key && (key.value || key.textContent) && cfg.autoCopy) await Core.copy((key.value || key.textContent).trim());
        const go = document.querySelector('a#continue, button#continue');
        if (go && cfg.autoRedirect) Core.click(go);
        return true;
      } catch (e) { Core.log('fluxli handler error', e); }
      return false;
    },

    async tapvietcode(cfg) {
      Core.showBanner('Tapvietcode detected', 1500);
      try {
        const btn = document.querySelector('a#bypass, .btn-success, a[href*="bypass"]');
        if (btn && cfg.autoRedirect) Core.click(btn);
        return true;
      } catch (e) { Core.log('tapvietcode handler error', e); }
      return false;
    },

    async linkunlock(cfg) {
      Core.showBanner('Link-unlock detected', 1500);
      try {
        const proceed = document.querySelector('a#continue, a.proceed, button#continue, .continue, a.go, button.go');
        if (proceed) { if (cfg.autoRedirect) Core.click(proceed); return true; }
      } catch (e) { Core.log('linkunlock handler error', e); }
      return false;
    },

    async bst(cfg) {
      Core.showBanner('BST detected', 1500);
      try {
        const el = document.querySelector('a[href*="/redirect"], a.redirect, button.redirect');
        if (el) { if (cfg.autoRedirect) Core.click(el); return true; }
      } catch (e) { Core.log('bst handler error', e); }
      return false;
    },

    async default(cfg) {
      Core.showBanner('Default handler: scanning for keys/links', 1500);
      try {
        if (cfg.autoCopy) {
          const el = document.querySelector('input[type="text"], textarea, pre, code');
          if (el) {
            const v = (el.value || el.textContent || '').trim();
            if (v) await Core.copy(v);
          }
        }
      } catch (e) { Core.log('default handler error', e); }
      return false;
    },
  };

  function findMappedHandler(host) {
    host = host.toLowerCase();
    for (const entry of siteMap) {
      for (const p of entry.patterns) {
        if (host.includes(p)) return entry.key;
      }
    }
    return null;
  }

  function getCooldown(cfg) {
    if (cfg.cooldownButton === 'default') return 5;
    const n = Number(cfg.cooldownButton);
    if (!Number.isFinite(n) || n < 0) return 5;
    return Math.floor(n);
  }

  async function mainRun() {
    const cfg = config();
    const host = Core.getHost();
    Core.log('Running for host', host, 'config', cfg);

    if (cfg.pauseOnCaptcha && Core.detectCaptcha()) {
      Core.showBanner('Captcha detected — waiting for manual solve...', 2500);
      const start = Date.now();
      const timeout = 120000;
      while (Date.now() - start < timeout) {
        if (!Core.detectCaptcha()) break;
        const t = document.querySelector('input[name="cf-turnstile-response"]');
        if (t && t.value && t.value.length > 10) break;
        await Core.sleep(cfg.resumeCheckMs);
      }
      Core.showBanner('Resuming after captcha check...', 1500);
      await Core.sleep(cfg.resumeCheckMs);
    }

    const mapped = findMappedHandler(host);
    const cooldown = getCooldown(cfg);
    let executed = false;

    if (mapped && handlers[mapped]) {
      try { executed = await handlers[mapped](cfg); } catch (e) { Core.log('handler execution error', e); }
    }

    if (!executed && cfg.redirectv2 && cfg.autoRedirect) {
      const isButtonHost = cfg.redirectURLButton.some(h => host.includes(h));
      if (!isButtonHost) {
        Core.showBanner('redirectv2: trying auto redirect', 1200);
        const a = document.querySelector('a[href^="http"]');
        if (a) { Core.click(a); executed = true; }
      } else {
        Core.addFloatingButton('Bypass', async () => {
          const a = document.querySelector('a[href^="http"], a[targetlink], a[data-target]');
          if (a) Core.click(a);
        }, cooldown);
        executed = true;
      }
    }

    if (!executed && cfg.autoRedirect) {
      const commonSelectors = ['a#continue', 'button#continue', '.continue', 'a.proceed', 'a.bypass-link', 'a[href*="redirect"]'];
      for (const s of commonSelectors) {
        const el = document.querySelector(s);
        if (el) { Core.log('clicking common selector', s); Core.click(el); executed = true; break; }
      }
    }

    if (!executed) {
      if (cfg.autoCopy) {
        try {
          const candidates = document.querySelectorAll('input[type="text"], textarea, pre, code');
          for (const c of candidates) {
            const v = (c.value || c.textContent || '').trim();
            if (v) { await Core.copy(v); break; }
          }
        } catch (e) { Core.log('autoCopy fallback error', e); }
      }

      Core.addFloatingButton('Bypass (manual)', async () => {
        const anchors = Array.from(document.querySelectorAll('a[href^="http"]'));
        if (anchors.length) {
          const preferred = anchors.find(a => /continue|target|get|proceed|redirect/i.test(a.href + a.textContent));
          const pick = preferred || anchors[0];
          Core.click(pick);
          return;
        }
        Core.showBanner('No obvious link found', 1800);
      }, getCooldown(cfg));
    }
  }

  try {
    if (typeof GM_registerMenuCommand !== 'undefined') {
      GM_registerMenuCommand('Toggle debug', () => {
        const old = GM_getValue('bacon_debug', Core.debug);
        GM_setValue('bacon_debug', !old);
        Core.debug = !old;
        Core.showBanner('Debug: ' + (!old), 1200);
      });
      GM_registerMenuCommand('Toggle autoCopy', () => {
        const old = GM_getValue('bacon_autoCopy', config().autoCopy);
        GM_setValue('bacon_autoCopy', !old);
        Core.showBanner('autoCopy: ' + (!old), 1200);
      });
    }
  } catch (e) { Core.log('menu register error', e); }

  setTimeout(() => {
    try {
      try { const d = GM_getValue ? GM_getValue('bacon_debug', Core.debug) : Core.debug; Core.debug = !!d; } catch (e) {}
      mainRun();
    } catch (err) { Core.log('mainRun error', err); }
  }, 350);

})();
