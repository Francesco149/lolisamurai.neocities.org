---
slug: luckymas-formats
project: luckymas
order: 2
date: 2026-06-23
crumb: container formats
title: Three LZSS codecs hiding in one doujin disc
subtitle: MINK · ACZ (.Xvi) · PACKDATA (.pak), reverse-engineered from the 2007 disc · 2026-06-23
summary: MINK, ACZ and PACKDATA: the SYGNAS container formats, cracked.
card_title: The container formats
card_desc: MINK, ACZ and PACKDATA, and the three different LZSS codecs hiding inside one disc.
---

::: panel
SYGNAS shipped their own file formats on the Lucky&#9733;Mas disc, all built in native MSVC-2005 C/C++. The scope doc that started this project feared they were an undocumented dead end. They are not: all three are simple little-endian chunk directories, and every text-bearing chunk turned out to be compressed with an LZSS variant. The fun part is that there are **three different** LZSS codecs, one per format, and the famous `0xFF` byte that begins each compressed blob is the same red herring in all of them.
:::

## MINK: the mascot animation containers

The `.mink` files (`<char>_copy.mink`, `<char>_dl.mink`, around 4.8 MB each) hold the MinkIt engine's copy/download animations. The header is a 16-byte record followed by a chunk directory; each entry is an 8-byte NUL-padded name, an absolute offset, and a size.

| chunk | what |
| --- | --- |
| info | per-character metadata, LZSS-compressed (Title, Author, Pattern, Interval) |
| a0 | sprite / atlas stream (around 3.0 MB) · codec still open |
| m0 | mask / per-pixel alpha stream (around 1.85 MB) · codec still open |

The `info` chunk decompresses to a tiny cp932 INI. An earlier note guessed it was a fixed codec table; decompiling `MinkIt.dll` proved it is genuinely per-character, read by `GetExtraInfo` which scans for `Title=` and `Author=`. The English patch rewrites just `Title=` and leaves `a0`/`m0` byte-identical. The sprite codec (header `38 47 03 01 ...`, identical across every file) is the one hard task left, but it carries no text, so it does not gate the translation.

## ACZ: the launcher's character assets (.Xvi)

23 `.Xvi` files, magic `ACZ\0`, a 32-byte directory record per entry carrying a name, offset, stored size, uncompressed size, and a tag whose low byte flags stored vs compressed. A character decomposes into two stored PNG frames plus a compressed `Ini` blob.

That `Ini` blob is the whole point: it decompresses to the character's speech config, the `[POS]` sprite and bubble layout, and a `[Msg]` block of `Serif*` dialogue lines (with `\n` breaks and `<%VAR%>` templates like `<%SCHEDULE%>`). Decoding all of them extracts the launcher's entire text surface: **22 characters, around 220 dialogue lines**, as editable Shift-JIS INI.

## PACKDATA: the calculator assets (.pak)

Magic `PACKDATA`, a 44-byte directory record per file, 115 members: 111 PNGs (stored) and **4 Squirrel `.nut` scripts** (compressed). `calmain.nut` holds the unit-conversion tool's display strings; the calculator button labels are baked into the PNG skins, so they were re-drawn rather than edited as text.

## The three codecs (and the 0xFF red herring)

Every compressed blob starts with `0xFF`, which looks like a format marker but is not. It is simply the first control/flag byte: the ring buffer starts effectively empty, so the opening 8 tokens are all literals, so the first flag byte is always all-ones. Past that, the three codecs genuinely differ.

```text
ACZ Ini   = canonical Okumura LZSS
            ring N=4096, max match F=18, THRESHOLD=2,
            ring pre-filled with 0x20, flag bit SET = literal.
            byte-exact on all 22 launcher files.

PAK .nut  = a different LZSS. control bits read MSB-first,
            bit SET = literal. match token is 2 bytes:
              length   = (b0 & 0x0F) + 2          (2..17)
              distance = ((b0>>4) | (b1<<4)) + 1  (12-bit window)
            the distance low nibble sits in b0's HIGH nibble,
            which is why a single contiguous bit-split misses it.
            overlap-capable (RLE).

.mink info = MinkIt's own bit LZSS. bits MSB-first.
             0 = literal (next 8 bits = a byte)
             1 = back-ref (8-bit distance, then 4-bit length)
             256-byte window, fields raw (no +threshold).
             terminates on source-EOF, not a count.
```

The `.nut` distance split was the puzzle: a brute force over one cut point and both byte orders found nothing, because the field is non-contiguous. Working three back-reference samples by hand (`0xa0 / 0x60 / 0x10` decoding to distances `11 / 7 / 2`) gave away the `(b0>>4)+1` relationship. The `.mink` codec was recovered the harder way, by decompiling the decoder and bit-reader in `MinkIt.dll` and porting them byte-for-byte.

::: callout warn
All three codecs round-trip byte-exact on the owner's own originals (encode then decode equals identity), and each has a self-test. The only un-round-tripped piece is the textless `.mink` sprite stream, which is stored verbatim. Full field tables, offsets and the decoder pseudocode are in [docs/mink-format.md](https://github.com/Francesco149/LuckyMasEN/blob/master/docs/mink-format.md); the unpacker and repacker are [sygnas_unpack.py](https://github.com/Francesco149/LuckyMasEN/blob/master/tools/sygnas_unpack.py) and [sygnas_repack.py](https://github.com/Francesco149/LuckyMasEN/blob/master/tools/sygnas_repack.py).
:::
