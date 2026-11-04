# Deploying the Fish-ID API (api.blueseasfishing.com)

The Node API does **not** run from `public_html/api/` — that directory is a
stale mirror. The real app root is **outside the FTP jail**:

```
/home/sergbcqk/api/          # real app root (node_modules, .env, stderr.log)
/home/sergbcqk/api/server.js # the code that actually runs
```

FTP (deploy-site.py / deploy-zip.py) can only see `/home/sergbcqk/blueseasfishing.com/`,
so API deploys need the PHP bridge:

1. FTP-upload the new `server.js` to `blueseasfishing.com/api/patched-upload.js`
   (inside the jail, with LF line endings).
2. Upload a temporary PHP script to `blueseasfishing.com/tmp/` that:
   - backs up `/home/sergbcqk/api/server.js` (e.g. `server.js.bak-YYYYMMDD`)
   - copies the staged file over it (write to temp + rename)
   - touches `/home/sergbcqk/api/tmp/restart.txt` (Passenger restart signal)
   - deletes itself and the staged file
3. `curl https://www.blueseasfishing.com/tmp/<script>.php`
4. Verify: `curl https://api.blueseasfishing.com/api/health` → must contain
   `"quota_active":true` and a real `seen_ip` (not 127.0.0.1).

Full working example: the 2026-09-23 quota deploy (see git history and
`_api-inspect/patched-real.js` for the patched source).

## Gotchas learned the hard way

- `public_html/api/server.js` is **not** the running code — patching it does
  nothing. Its `package.json` even points to a nonexistent file.
- The real `server.js` differs from the mirror (no express-rate-limit, memory
  multer storage, relaxed CORS). Always diff against a fresh read of
  `/home/sergbcqk/api/server.js` (readable via a temp PHP script) before patching.
- The app runs behind the LiteSpeed proxy: `app.set('trust proxy', 1)` is
  required or every visitor shares the proxy's IP (breaks all per-IP limiting).
- cPanel "Restart" in the Node.js Selector UI also works; `tmp/restart.txt`
  in the app root does the same thing without the panel.

## Premium bypass (added 2026-09-24)

Premium members get unlimited IDs; free accounts 5/day per **account**;
guests 3/day per **IP**. Mechanism: `/api/premium-token.php` (on the www
host, same-origin) mints a 10-minute HMAC token for signed-in users from
`users.status`; the client sends it as `X-BSF-Premium`; the Node API verifies
it with `crypto` and the shared `PREMIUM_TOKEN_SECRET` from the Node `.env`
(single source of truth). Invalid/missing tokens silently fall back to guest
quota. Unit-tested edge cases: tampered, expired, missing header all reject.
E2E-tested live: premium login → token → identify → `quota:{unlimited:true}`.

To rotate the secret: edit `PREMIUM_TOKEN_SECRET` in `/home/sergbcqk/api/.env`
(only place it exists), then restart the Node app.
