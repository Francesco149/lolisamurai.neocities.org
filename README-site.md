# lolisamurai.neocities.org — content + build system

The site is generated from markdown. **You never edit HTML to add content.** Build with the Nix
flake (this is a NixOS box, there is no global `node`), preview `public/`, then publish.

```sh
nix run            # reads content/ -> writes public/   (alias for `nix run .#build`)
nix run .#publish  # rebuild, then push public/ to Neocities (needs NEOCITIES_API_KEY)
nix develop        # interactive shell with node + the neocities CLI on PATH
```

## What lives where

```
content/
  site.config.json          the home page: kicker, tagline, about, links, footer
  projects/<slug>.md         one project page (frontmatter + body)
  writeups/<slug>.md         one writeup (frontmatter + body)
assets/                      shared images (copied into public/assets/)
build.mjs                    the generator (+ all the styling/layouts)
public/                      GENERATED output (gitignored); nix run writes it, you deploy it
known-good-v1/               frozen snapshot of the original hand-written pages
```

## Add a writeup (no HTML)

Drop a new file in `content/writeups/`. It automatically:
- gets its own styled page,
- appears in the home **Writeups** index,
- appears in its project's **How it works** card grid.

Frontmatter fields:

```
---
slug: my-writeup            # output filename (my-writeup.html); defaults to the file name
project: luckymas           # which project it belongs to
order: 5                    # sort order (home index + prev/next chain)
date: 2026-06-23
crumb: short breadcrumb     # shown in the breadcrumb + prev/next nav
title: The page H1
subtitle: small line under the title
summary: one line shown in the home Writeups index
card_title: short title for the project's card grid
card_desc: one line for the project's card grid
---
```

## Add a project

Add `content/projects/<slug>.md`. Frontmatter drives both the project page header and
its card on the home page (`home_title`, `home_meta`, `home_blurb`, `home_tags`, `thumb`,
`thumb_alt`, `github`, plus `title_html`, `jp`, `tagline`, `buttons`). See
`content/projects/luckymas.md` for the full set.

## Body markdown

Normal markdown plus a few block directives:

| directive | what |
|---|---|
| `## Heading {#id}` | section banner (project) / pink subhead (writeup); optional `{#id}` anchor |
| ` ```sh ... ``` ` | code block (`sh`/`bash`/`bat` highlights `# comments` green) |
| `**bold**` `_italic_` `` `code` `` `[text](url)` | inline; raw `&entities;` pass through |
| `\| a \| b \|` table | feature table (project) / mono hex table (writeup) |
| `- item` | bullet list |
| `::: panel` | white rounded intro card |
| `::: compare` | before/after A/B — equal-width, size-matched columns |
| `::: gallery` | image grid — auto-aligned, size-matched cards |
| `::: writeups` | auto card-grid of this project's writeups |
| `::: callout warn "Title"` | tinted callout (`warn` cream / `ok` green; title optional) |
| `::: small` | one line of fine print |

`::: compare` rows:  `[before] LABEL | image.png | caption | alt`  /  `[after] ...`
`::: gallery` rows:  `image.png | Title | caption | alt`

## Changing the look

Styling and the three page layouts (home / project / writeup) all live in `build.mjs`.
That is the only place you touch HTML, and only when you want a structurally different
project layout.
