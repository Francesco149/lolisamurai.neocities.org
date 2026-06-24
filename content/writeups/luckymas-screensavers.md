---
slug: luckymas-screensavers
project: luckymas
order: 5
date: 2026-06-24
crumb: the screensavers
title: The screensavers that never ran, and the apology that already fixed them
subtitle: Four dead-on-arrival screensavers, and how SYGNAS's own 2007 re-release brings them back &middot; 2026-06-24
summary: The disc's four screensavers were gutted stubs; SYGNAS's own apology re-release brings them back.
card_title: The screensavers
card_desc: Why all four were dead on arrival, and how SYGNAS's 2007 apology release restores them.
---

::: panel
The disc has four screensavers. None of them ever ran, on any machine, and for a long time the assumption (mine included) was that it was a locale problem. It was not. They were shipped broken, and the people who broke them shipped the fix a few weeks later, as a public apology.
:::

## One binary, four names, no content

The four `.scr` files are byte-identical (SHA-256 `6b430059...`, 203264 bytes each): a single commercial engine, **ScreenTime For Flash**, shipped under four filenames. A working ScreenTime screensaver is three things: the engine, a `saver.dat` content package that holds the Flash movie, and the Flash Player 8 ActiveX control. The disc shipped only the engine. `innoextract` of the disc's `setup.exe` lists 164 files and not one `.dat`, and the ~135 KB packed engine has nowhere to hide a movie. So on launch the engine builds a path to its content, does not find it, sets an error flag, and exits in about two seconds, before it ever creates the Flash control. In the Display Properties preview pane you get a small Japanese "this screensaver is broken" notice; run fullscreen, it just quits.

## It was never the locale

The tidy theory was that a 2007 Japanese screensaver wanted a Japanese system. Decompiling the engine's init and then testing on real hardware killed that theory cleanly: it dies identically across English and Japanese locales, English and Japanese filenames, and even with the clock rolled back to 2007, while a stock Windows screensaver launched the same way runs fine. The engine never gets far enough to care about any of that. It is missing the box of content that is supposed to sit next to it, full stop. This is a SYGNAS packaging defect, not a locale issue and not something our patch caused.

## The fix shipped as an apology, on 2008-01-09

SYGNAS knew, and said so in public. The disc sold at Comiket 73 on the last day of 2007; nine days later, on 2008-01-09, they added a &#12473;&#12463;&#12522;&#12540;&#12531;&#12475;&#12540;&#12496;&#12540;&#28961;&#26009;&#37197;&#24067; ("free screensaver distribution") block to the [&#12425;&#12365;&#9734;&#12510;&#12473; special site](http://web.archive.org/web/20090917224409/http://sygnas.jp/doujin/luckymaster/), at the very address the launcher still carries as its mutex string, `sygnas.jp/doujin/luckymaster/`. The notice reads:

::: small
&#21454;&#37682;&#12375;&#12390;&#12356;&#12383;&#12473;&#12463;&#12522;&#12540;&#12531;&#12475;&#12540;&#12496;&#12540;&#12364;&#27491;&#24120;&#12395;&#21205;&#20316;&#12375;&#12394;&#12356;&#12371;&#12392;&#12364;&#21028;&#26126;&#12375;&#12414;&#12375;&#12383;&#12290;&#30342;&#27096;&#12395;&#12399;&#12372;&#36855;&#24785;&#12434;&#12362;&#12363;&#12369;&#12375;&#12390;&#26412;&#24403;&#12395;&#30003;&#12375;&#35379;&#12354;&#12426;&#12414;&#12379;&#12435;&#12290;&#12362;&#35435;&#12403;&#12398;&#24847;&#21619;&#12434;&#36796;&#12417;&#12390;&#21454;&#37682;&#12375;&#12390;&#12356;&#12427;&#12473;&#12463;&#12522;&#12540;&#12531;&#12475;&#12540;&#12496;&#12540;&#12434;&#28961;&#26009;&#37197;&#24067;&#12356;&#12383;&#12375;&#12414;&#12377;&#12290;

"It has come to light that the included screensavers do not operate correctly. We sincerely apologize for the inconvenience. As a token of apology, we are distributing the included screensavers free of charge."
:::

They posted all four as ZIPs, on two mirrors (sygnas.jp itself and a clic-clac.jp backup), each holding one standalone installer that bundles the engine, an actual Flash movie, and Flash Player 8. The site is long gone, but the Internet Archive kept it, and one clic-clac.jp mirror is still archived: the `chibi_setup.exe` pulled from it is byte-for-byte the file this patch pins by SHA-256, so the restored content is provably SYGNAS's own apology release. The four installers are downloaded at build time and, like every other SYGNAS byte, never committed here.

## The engine looks for its content right beside itself

The decompiled init builds its working directory from its own filename: a screensaver at `system32\NAME.scr` reads its content from `system32\NAME dir\`. That one fact makes the whole thing simple. The engine inside the apology installers is byte-identical to the disc's, so the disc already shipped a perfectly good engine; it was only ever missing the folder next to it. Rename the `.scr` to its English Display-Properties name and the engine looks in the matching English `dir` with no patching at all. I confirmed it live: an English-named `.scr` next to an English-named content folder runs the same Flash movie the Japanese one would.

## A filename that would have broken on English XP

`saver.dat` is a tiny descriptor, and it names the movie file in a fixed field at offset 312, which the engine then opens through the ANSI file API. A Japanese filename there works on a Japanese box and turns to mojibake (and a file-not-found) on an English one: the exact locale trap the rest of the patch is built to avoid. So the restore renames the movie to a plain `saver.swf` and rewrites that one field in `saver.dat` to match, leaving everything on disk pure ASCII. (The installer also stamps six bytes into `saver.dat` at offset 388 during setup; those turned out to be runtime state, and shipping them as zero works fine.)

## Flash 8, three layers deep

The screensaver draws through the Flash 8 ActiveX, so `Flash8.ocx` has to be present and registered. It is buried: LZX-compressed inside `Data1.cab`, which is itself a stream inside the bundled MSI (an OLE compound document), which is inside the InstallShield installer. A flat byte-carve gets a corrupt cab, because the cab stream is fragmented across the compound document's allocation sectors. A small pure-Python compound-file reader walks the FAT, reassembles the stream, and then `cabextract` unpacks the OCX; the English installer drops it in `system32\Macromed\Flash` and `regsvr32`'s it. Without that registration the engine throws the same "broken" notice, since it cannot create the control.

## Extract, never run

Everything is carved, not executed. Each content file lives verbatim and contiguous in the apology installer, so the build slices it out by offset and length and checks it against its own SHA-256; the installer itself is pinned, which keeps the offsets stable. We do not silently run the GUI installers; we extract their payload and merge it into the English installer reproducibly. The result was validated end to end under wine and then live on a real **English-locale** Windows XP box: a clean wipe, an install of the built `setup.exe`, and all four screensavers previewing and running fullscreen, on the locale where the cp932 filenames would have failed.

::: callout warn
The full teardown (the Unicorn-based ASPack unpacker, the Ghidra trace to the missing-content exit, and the live test matrix) is in [docs/screensaver-re.md](https://github.com/Francesco149/LuckyMasEN/blob/master/docs/screensaver-re.md), and the extract-and-merge tool, with the per-installer offset table, is [tools/screensaver_restore.py](https://github.com/Francesco149/LuckyMasEN/blob/master/tools/screensaver_restore.py).
:::
