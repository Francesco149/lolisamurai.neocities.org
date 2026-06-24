---
slug: luckymas-gcal
project: luckymas
order: 1
date: 2026-06-23
crumb: reviving the calendar
title: Reviving a dead 2007 calendar with no Google account
subtitle: A native XP-local fake-Google server, speaking the box's own 2007 TLS stack · 2026-06-23
summary: A native fake-Google server that speaks XP's own 2007 TLS stack.
card_title: Reviving the calendar
card_desc: A native XP-local fake-Google server that speaks the box's own 2007 TLS stack.
---

::: panel
The mascot logs into Google Calendar and notifies you about mail and events. In 2026 that is doubly dead: Google's 2007 ClientLogin and GData feeds are gone, and the client wants a Google account you would have to invent. The goal was to make the bubble fire again with **no account and no internet**, on real Windows XP. The path there was mostly about getting one 19-year-old TLS handshake to complete.
:::

## The protocol correction: ClientLogin is HTTPS

The first recon pass read the binaries' strings and concluded everything was plain `http://` with no certificates. That was half wrong. When the client submitted credentials it failed with WinINet error `12157` (`ERROR_INTERNET_SECURITY_CHANNEL_ERROR`): it was opening a **TLS** connection for `/accounts/ClientLogin` and the handshake failed. The scheme is not a literal string in the binary; WinINet picks it at runtime via a flag and port (`INTERNET_FLAG_SECURE`, 443), so a strings scan could never see it. The real shape is period-correct Google 2007: **HTTPS login, plain-HTTP feeds**.

## The pivot: build the server natively on XP

Modern machines cannot easily speak XP-era TLS (TLS 1.0, RSA key exchange, AES-CBC or 3DES), and coercing a modern stack down to it is painful. The insight that made everything click: if the server runs **natively on the XP box itself**, then the server (Schannel) and the client (WinINet) are the **same 2007 stack**. The handshake becomes period-accurate by construction. No modern-TLS coercion, no separate always-on host; XP's `hosts` file just points the relevant name at `127.0.0.1`.

The result is one self-contained Win32 EXE (i686, XP subsystem 5.1, around 300 KB, statically linked so it imports only XP system DLLs):

```text
:80   HTTP/1.0  (Winsock)   GData feeds: allcalendars + event feed
:443  HTTPS     (Schannel)  /accounts/ClientLogin  ->  Auth=...
:110  POP3      (Winsock)   a working fake mailbox (STAT/LIST/RETR/TOP)
```

C owns the transport (sockets, the Schannel handshake, POP3 framing, the embedded cert). All the request logic lives in embedded **Lua**: routing, the Atom feed builders, the ClientLogin and POP3 responses. An external `gcalsrv.lua` overrides the embedded copy and hot-reloads on save, so changing the served events and mail is a script edit, not a rebuild.

## The gotchas that ate the hours

The architecture was the easy part. XP's age punished every modern default:

- **PKCS#12 must use XP-legacy PBE.** OpenSSL 3.x defaults to PBES2 / AES-256 / SHA-256, which XP's `PFXImportCertStore` simply cannot parse. The embedded cert had to be made with `-legacy -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES -macalg sha1`.
- **The OpenSSL SECLEVEL colon.** To even serve TLS 1.0 you must drop the security level with a colon-separated token: `...:@SECLEVEL=0`. Without the colon the level stays at 1 and the server rejects XP's ClientHello with a `protocol_version` alert that looks exactly like "TLS 1.0 unsupported". That cost about an hour.
- **The protected-root modal.** Installing a self-signed cert into XP's Root store via the normal store provider pops XP's "install this root?" confirmation dialog, which blocked the single-threaded startup before the listeners even bound. Writing the cert through the **registry store provider** (`CERT_STORE_PROV_REG`, plain registry I/O into the machine root key) trusts it with no UI at all.
- **Keysets and sessions.** Run headless as LocalSystem, the user keyset import fails with `NTE_BAD_KEYSET`; the fix is to fall back to `CRYPT_MACHINE_KEYSET` so it works both interactively and as SYSTEM.

## Keeping real Google alive too

Redirecting `www.google.com` in the `hosts` file would blackhole real Google browsing. So instead a `binpatch` rewrites the wide host string inside both `gcal.exe` and `gcalcore.dll` from `www.google.com` to `localhost` (in place, NUL-padded, size unchanged so the PE stays valid), the embedded cert is regenerated as `CN=localhost`, and the `hosts` line is dropped. The calendar reaches the local server; the rest of the internet is untouched.

::: callout ok
**Proven on real Windows XP SP3.** A genuine WinINet client completes the Schannel handshake, trusts the embedded cert, and gets `Auth=` back from ClientLogin; the HTTP Atom feeds and POP3 all verified live; and the mascot's `SerifCallenderSchedule` and `SerifCallenderNone` bubbles render the served events. Full session log, the Ghidra trail, and every bug above in detail: [tools/gcal-xp/README.md](https://github.com/Francesco149/LuckyMasEN/blob/master/tools/gcal-xp/README.md) and [docs/re-notes.md](https://github.com/Francesco149/LuckyMasEN/blob/master/docs/re-notes.md).
:::
