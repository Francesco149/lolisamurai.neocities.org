---
slug: luckymas-re
project: luckymas
order: 3
date: 2026-06-23
crumb: field notes
title: The one-line bug, layered windows, and other field notes
subtitle: The smaller discoveries that made the translation actually work · 2026-06-23
summary: The smaller discoveries that made the translation actually work.
card_title: Field notes
card_desc: The one-line event bug, layered-window screenshots, locale safety, and other discoveries.
---

::: panel
A translation is mostly a thousand small fights with a 19-year-old binary. These are the ones worth writing down: a bug we caused and then had to understand, a screenshot trick, and the rules that keep Japanese-era software from turning into garbage on an English machine.
:::

## The one-line event bug

The first version of the fake calendar feed gave every event an empty link. On the real month grid, all of a day's events collapsed onto a single row, and clicking one opened the install folder instead of an event. Decompiling `gcal.exe`'s drawing code explained both at once: each drawn event becomes a hit object whose row is assigned by hashing the event's `href`, and whose click action is `ShellExecuteW("open", href)`. With every `href` empty, every event hashed to row 0, and the click ran `ShellExecuteW("")`, which resolves to the current directory. Emitting a unique per-event `<id>` and an alternate `<link href>` from the feed fixed both the layout and the click in one change. The original software was fine; our feed was lazy.

## You cannot screenshot a layered window with BitBlt

The mascots are per-pixel-alpha **layered windows**, composited by the desktop rather than painted into a normal HDC. The usual headless capture (`nircmd savescreenshotfull`, a GDI BitBlt) grabbed them as **bare desktop**, with the character missing. The fix is to capture the composited framebuffer the way a person does: `PrtScn` to the clipboard, then save the clipboard image. Every screenshot of a mascot on this site went through that path.

## Locale safety: how text becomes garbage

The app reads most of its text through ANSI APIs (`GetPrivateProfileStringA`, `DrawTextA`), which interpret bytes through the system code page. On a non-Japanese box, any non-ASCII byte mojibakes. So the patch follows strict rules by surface:

- **App-read text must be pure ASCII.** Speech, INI titles and the like use `Lucky*Star`, never `Lucky&#9733;Star`. A build-time assertion fails if any byte above `0x7E` survives.
- **Notepad-only text is UTF-8 with a BOM.** XP Notepad honours the BOM on any locale, so the readme keeps `&#9734; &times; &#9632; &#9675;`.
- **HTML is UTF-8** via its `<meta charset>`; PE-resource strings are Unicode and render anywhere.
- **The star convention:** product names get an ASCII `*` (`Lucky*Mas`), decorative tics in speech bubbles get a `~`.

## Do not let your library rebuild the PE

Translating the Unicode menu and dialog strings meant editing PE resources. Using a library's high-level `write()` to repackage the executable rebuilt the whole PE, added a section and 114 KB, and the result **crashed on XP**, even though every resource leaf was byte-identical. The structural rebuild was the culprit. The fix is a **surgical** patcher: rewrite only the changed menu/dialog blobs (in place, or appended into the resource section's alignment slack), then fix just that entry's offset and size plus a few PE header fields. Result: file size unchanged, a few hundred bytes differ, every other byte (all the other dialogs, imports and relocations) identical, and no collateral breakage.

## strings(1) cannot see Shift-JIS

A lot of Japanese is not in resources at all; it is hardcoded literals drawn at runtime by `AppendMenuA`, `DrawTextA` and friends. Standard `strings -e s` cannot see cp932 (the lead bytes are above `0x7F`, so a Japanese run looks like noise), and `-e l` floods you with resource data and no section context. A custom scanner segments the PE into NUL-terminated cp932 and UTF-16 runs, keeps only real kana and kanji, and reports each string with its **section**, **occurrence count** (a byte-patch needs a unique match) and offset. That is what found the pin-arrow tooltip, the folder-picker titles, and the calculator's converter strings.

## Everything is reproducible, and nothing is redistributed

All of this runs through one declarative manifest and one engine that mirrors your own installed tree, applies each op in a fixed order, and writes an audit of everything it patched and everything it deliberately deferred. Two builds are hash-identical. Crucially, git holds only the recipe: the patch sources, the tools, and the manifest. It never contains a single SYGNAS byte. You run the build against your own copy of the disc, exactly the fan-translation model.

::: callout warn
This is the short version. The full running RE log (every session, the Ghidra addresses, the dead ends) is in [docs/re-notes.md](https://github.com/Francesco149/LuckyMasEN/blob/master/docs/re-notes.md), and the patch pipeline is documented in [docs/patch-system.md](https://github.com/Francesco149/LuckyMasEN/blob/master/docs/patch-system.md).
:::
