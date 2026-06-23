---
slug: luckymas-installer-font
project: luckymas
order: 4
date: 2026-06-23
crumb: the installer font
title: Why the installer ships its own font
subtitle: Inno Setup, MS PGothic metrics, and a faithful 586×364 wizard · 2026-06-23
summary: Inno Setup only lays the wizard out correctly with MS PGothic, so the build bundles it.
card_title: The installer font
card_desc: Why the faithful wizard needs MS PGothic bundled, and how the build delivers it.
---

::: panel
The English installer is re-wrapped from your own `setup.exe` to look exactly like SYGNAS's original: a full-screen blue gradient with the Lucky&#9733;Star art and a pixel-exact wizard. Getting that "pixel-exact" part to hold on a plain English Windows XP turned out to hinge entirely on one font.
:::

## Inno Setup sizes the wizard from the font's metrics

Inno Setup does not hardcode the wizard's dimensions. It computes the wizard window size, the control layout, and the position and scaling of the art panel from the metrics of the **dialog font** named in the active language file (`.isl`). Change the font, and every measurement shifts with it.

SYGNAS's original wizard was laid out in **MS PGothic at 9pt**, which yields the faithful **586&times;364** wizard with the Lucky&#9733;Star image placed and scaled just so. The stock English Inno Setup ships `Default.isl` with **Tahoma 8**, which lays out a noticeably smaller **503-wide** wizard: the art panel ends up a different size and position, and the whole thing stops matching the original.

## A custom language file, and the font to back it

The fix starts with a custom English `.isl` that carries the original's metrics (MS PGothic 9, title font 29, welcome font 12), so the layout math targets the faithful 586&times;364 again:

```text
[Languages]
Name: "en"; MessagesFile: "luckymas-en.isl"   ; MS PGothic 9 -> faithful 586x364
; (the stock compiler:Default.isl = Tahoma 8 -> a smaller 503-wide wizard)
```

But naming a font only helps if that font is actually present, and a clean Windows XP with no East-Asian language pack has **no MS PGothic**. Without it, Inno Setup falls back to a substitute face and the layout collapses back to the wrong size.

## Bundle the font, and load it before the wizard builds

So the installer bundles a **builder-supplied** `msgothic.ttc` and registers it with `AddFontResource` in `InitializeSetup`, which runs **before** the wizard window is constructed. That single call lifts the wizard from 503 back to 586 even on a bare XP:

```text
function InitializeSetup(): Boolean;
begin
  ExtractTemporaryFile('msgothic.ttc');
  AddFontResource(ExpandConstant('{tmp}\msgothic.ttc'));  // wizard -> MS PGothic -> 586x364
  Result := True;
end;
```

The same font is needed a second time, after install: the app draws its mascots' speech bubbles with `CreateFontA("MS PGothic")`, so the post-install step copies the font permanently into the Fonts folder (unless it is already there) and registers it. One bundled font fixes both the wizard layout and the in-app serifs.

::: callout warn
The font is never redistributed: you supply your own `msgothic.ttc` from a licensed Windows or XP copy (`--font auto` finds it), and the build bundles it into your `setup.exe`. The full installer script is [installer/setup.iss](https://github.com/Francesco149/LuckyMasEN/blob/master/installer/setup.iss); the build and font-sourcing guide is [docs/end-user-build.md](https://github.com/Francesco149/LuckyMasEN/blob/master/docs/end-user-build.md).
:::
