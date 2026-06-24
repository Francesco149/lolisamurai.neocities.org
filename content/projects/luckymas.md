---
slug: luckymas
name: Lucky*Mas EN
title_html: Lucky<span style="color:#f5b400;">&#9733;</span>Mas <span style="color:#8fae1f;">EN</span>
jp: &#12425;&#12365;&#9734;&#12510;&#12473;
tagline: English fan-translation + a one-command patcher for SYGNAS's 2007 desktop-accessory disc.
date: 2026-06-23
home_title: Lucky*Mas EN
home_meta: fan-translation + reverse engineering · 2026
home_blurb: A full English patch for SYGNAS's 2007 _Lucky&#9733;Star &times; THE iDOLM@STER_ desktop-accessory disc. Talking desktop mascots, a calendar companion, themed calculators, wallpapers and screensavers, all in English on real Windows XP, with the dead Google Calendar revived locally and no Google account needed. Ships only a tool + a delta that you apply to your own copy of the disc.
home_tags: ["Win32 RE", "LZSS codecs", "Schannel TLS", "Inno Setup"]
thumb: assets/mail-miki.png
thumb_alt: A Lucky*Mas mascot announcing new mail
github: https://github.com/Francesco149/LuckyMasEN
buttons: [{"label":"View on GitHub &raquo;","url":"https://github.com/Francesco149/LuckyMasEN","preset":"dark"},{"label":"Build your own disc","url":"#build","preset":"green"},{"label":"Read the writeups","url":"#deepdives","preset":"white"}]
---

::: panel
**Lucky&#9733;Mas** (SGNS-0009, Comiket 73) is a doujin _Lucky&#9733;Star &times; THE iDOLM@STER_ desktop-accessory pack by the circle **SYGNAS**: an in-house animation engine called **MinkIt** that hijacks XP's file-copy progress animation and swaps in a random hand-drawn character instead (a genuinely cool hack), a calendar mascot that logs into Google Calendar and reads your day out loud, themed calculators, 84 wallpapers and 4 screensavers. The disc is out of print and the circle's site is long gone.

This project makes all of it English and keeps it running on **real Windows XP**, with the calendar mascot revived by a tiny local fake-Google server so you need **no Google account and no internet**. It ships only a tool and a patch delta that apply to **your own copy** of the disc. No SYGNAS file is ever redistributed.
:::

## The installer, before & after

The English wizard is re-wrapped from your own `setup.exe`, faithful to SYGNAS's original full-screen blue Inno Setup wizard down to the pixel-exact 586&times;364 art panel. The bundled MS PGothic font is what lets it render correctly even on an XP with no East-Asian language pack.

::: compare
[before] BEFORE · Japanese original | assets/installer-before.png | SYGNAS's original wizard: title and body in Japanese (&#12425;&#12365;&#9734;&#12510;&#12473;), needs a JP locale to render. | Original Japanese installer wizard
[after] AFTER · English patch | assets/installer-after.png | Same layout and art, fully English, rendering on an XP with no language pack via the bundled font. | English installer wizard
:::

## The wallpaper picker, before & after

An HTML picker that opens in Internet Explorer, detects your monitor size and lists 84 wallpapers (14 artists &times; resolutions). The translation covers the picker UI, the JPG filenames, and even the baked section-header art.

::: compare
[before] BEFORE · Japanese original | assets/wallpaper-before.png | &#22721;&#32025;&#12360;&#12425;&#12403; in IE: instructions and the &#22721;&#32025;&#19968;&#35239; header all in Japanese. | Original Japanese wallpaper picker
[after] AFTER · English patch | assets/wallpaper-after.png | "How to set your wallpaper", the monitor-size box and the "Wallpaper list" header, all English. | English wallpaper picker
:::

## The translation, in action

::: gallery
assets/gcal-schedule.png | Today's schedule | Miki reads the day out loud, served entirely from the local fake-Google server. No account, no internet. | Miki reading the day's schedule
assets/gcal-none.png | No plans! | The empty-calendar bubble, fired on the manual right-click calendar check. | Kagami with an empty calendar
assets/minkit-desktop.png | MinkIt copy animations | Instead of XP's standard file-copy animation, MinkIt swaps in a random hand-drawn character. Its Settings and Preview dialogs are Englished too. | MinkIt copy animation and settings
assets/mail-miki.png | You've got mail | The mail-check bubble over POP3, served by the same local server as a working fake mailbox. | Miki announcing new mail
assets/calc-imas.png | Themed calculators | The skinned calculator with its baked button labels (Calc / Convert / Tax+ / Tax-) re-drawn in English. | Lucky Star themed calculator
assets/calc-convert.png | Unit conversions | A grab-bag of ad-hoc utilities for doujin authors and hobby gamedevs: fps to ms, ms to fps, BPM, and page-count to printed thickness across paper weights. | The unit-conversion tool
assets/gcal-calendar.png | The month grid | gcal's full calendar window, reading events from localhost. Fixing this view uncovered a fun little bug. | The month-grid calendar with an event detail
assets/settings.png | Launcher settings | The mascot launcher's config dialog, with every menu, label and tooltip translated in the PE resources. | The launcher settings dialog
:::

## The screensavers, brought back

The disc shipped its four screensavers broken: gutted Flash engines with no content, dead on every locale. SYGNAS released working versions as a public apology weeks later, on 2008-01-09, so the patch sources that content and merges it back in, with the filenames made ASCII-safe so they run on any locale. These shots are from a real **English** XP. The full story is in [the screensavers writeup](luckymas-screensavers.html).

::: gallery
assets/screensaver-chibi.png | Chibi Characters | 2D chibi mascots walk across the screen leaving coloured trails. | The Chibi Characters screensaver running fullscreen
assets/screensaver-imas3d.png | iM@S 3D | A busy 3D scene of iDOLM@STER idols walking and crossing paths over the 765 Production wings. | The iM@S 3D screensaver running fullscreen
assets/screensaver-imas-comic.png | iM@S 4-koma | A slow cutscene told one manga panel at a time. | The iM@S comic screensaver showing a manga panel
assets/screensaver-luckystar-comic.png | Lucky*Star 4-koma | The Lucky*Star version of the same slow manga-panel cutscene. | The Lucky Star comic screensaver showing a manga panel
:::

## What's on the disc, and how to use it

| What | Detail |
| --- | --- |
| Desktop mascots | MinkIt hijacks XP's file-copy progress animation and swaps in a hand-drawn character (Konata, Kagami, Chihaya, Makoto, Yayoi) instead of the standard bar (a cool hack). Copy or move files in Explorer to play one; right-click the tray icon, open Options, and pick the character or enable it per file operation. The frames live in `.mink` containers. |
| The launcher | A desktop mascot (22 characters, ~220 dialogue lines, all translated) with speech bubbles. Click her on the chest to open the app launcher (yes, really; an old anime gag): the left half is the main menu (calculators, calendar, copy-animation, wallpaper, Display Properties), the right half a separate second menu, empty by default for your own shortcuts. Right-click her instead for calendar check, mail check and Settings. Both menus and the mascot are set in `launcher\Launch.ini`. |
| The talking calendar | Originally logged into Google Calendar (long dead); a native local fake-Google server revives it with no account and no internet. She speaks at startup, or right-click her and pick calendar check to hear the day read aloud; the Google Calendar entry opens the full month grid. Your own events go in `gcal-xp\gcalsrv.lua`, which hot-reloads on save. |
| Mail check | A "you've got mail" bubble over POP3, served by the same local server as a real, readable mailbox. It fires at startup, or right-click and pick mail check; the bubble opens your mail client (Outlook Express by default). Edit the inbox in the same `gcalsrv.lua`. |
| Themed calculators | Launch iM@S Calculator or Lucky*Star Calculator from the launcher menu; both are skinned, with script strings and baked-in button labels translated. A doujin unit converter sits alongside them, doing BPM to ms, ms to fps frames, page-count to paper thickness, and tax. |
| Wallpapers | 84 wallpapers (14 artists by resolution) behind an HTML picker. Launch Wallpaper from the menu, then click a thumbnail to set it. Filenames, UI and the baked header art all Englished. |
| Screensavers | Four (iM@S 3D, iM@S Comic, Lucky*Star Comic, Chibi Characters), renamed to their English Display-Properties names. The disc shipped these broken, with no content; the patch restores them from SYGNAS's own 2007 apology release (see the writeup). Set one from Control Panel, then Display, then Screen Saver, and pick a Lucky*Mas entry. |

## Build your own English disc {#build}

You own the disc; this turns it into an English one. Give it your `setup.exe` and your own copy of MS PGothic, and out comes a drop-in English ISO. One engine drives it on Windows, Linux (Nix) or anywhere with Python.

```sh
# Windows (runs Inno Setup natively, no wine):
build.bat --setup D:\setup.exe --font auto

# Linux (Nix):
nix run github:Francesco149/LuckyMasEN#iso -- --setup ~/setup.exe --font auto

# anywhere with Python + innoextract (+ wine on Linux):
python tools/make_iso.py --setup ~/setup.exe --font auto
```

::: small
The freeware build tools are auto-downloaded, version-pinned and SHA-256-verified; the Windows bundle pre-seeds them so it builds offline. Pre-built bundles are attached to the [nightly release](https://github.com/Francesco149/LuckyMasEN/releases/tag/nightly). Full guide: [docs/end-user-build.md](https://github.com/Francesco149/LuckyMasEN/blob/master/docs/end-user-build.md).
:::

## How it works (the writeups) {#deepdives}

::: writeups
:::

::: callout warn "&#9733; Get the original &amp; credit the authors"
The disc is out of print; this patch applies to **your own copy**, which you can find second-hand on [Suruga-ya](https://www.suruga-ya.jp/product/detail/186014567). Every character, frame and line of original software is &copy; SYGNAS. The creator (SYGNAS / &#12480;&#12480;) is now a professional web developer at [x.com/sygnas](https://x.com/sygnas). This is an unofficial fan project, not affiliated with or endorsed by SYGNAS, made only to keep their work alive on modern machines.

Support this reverse-engineering &amp; preservation work at [ko-fi.com/lolisamurai](https://ko-fi.com/lolisamurai).
:::
