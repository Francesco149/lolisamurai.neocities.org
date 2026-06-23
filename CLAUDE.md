# CLAUDE.md — lolisamurai.neocities.org

Orientation for working on this site. Read it fully before editing.

## What this is

A single-column, early-2000s-style personal site (think vgperson's) hosted on Neocities.
The home page is a **project index** first, a small **writeups** index, a short **about**, and
**links** (GitHub `Francesco149`, Twitch `lolisamurai`, Ko-fi `lolisamurai`). Each project has
its own page themed to match the project, plus dense technical writeups. The flagship project is
**Lucky\*Mas EN** (an English fan-translation + reverse-engineering of a 2007 SYGNAS doujin disc).

The site is **generated from markdown** (see the runbook). Do not hand-edit the HTML in `public/`.

## Writing style (match this exactly)

- **Voice:** first person, plain, a little nostalgic, never breathless. Someone who lived the
  early-2000s weeb internet and quietly preserves it. Confident but not boastful.
- **NO em dashes.** Ever. This is a hard rule (em dashes are not how people typed in 2003). Use a
  comma, a period, parentheses, or "and". This applies to en dashes in prose too; a plain hyphen or
  the word "to" for ranges.
- **Dense but insightful.** Every sentence earns its place. State the finding, then the mechanism,
  then the consequence. No filler, no padding, no "in this article we will". A good test: can you
  delete words and keep the meaning? Then delete them.
- **Technical writeups go deep but stay short.** A couple of screens max. When the full detail does
  not fit, **link to the GitHub source** (`docs/*.md`, `tools/*.py`, `installer/*.iss`) rather than
  bloating the page. Concrete specifics over hand-waving: real offsets, real error codes, real API
  names (`AddFontResource`, `ERROR_INTERNET_SECURITY_CHANNEL_ERROR`, `586x364`).
- **Lead with the interesting thing.** Each writeup section is a discovery: the bug, the gotcha, the
  insight. Title sections like findings, not like a textbook chapter.
- **Star convention:** product/franchise names use an ASCII `*` (`Lucky*Mas`, `Lucky*Star`); the
  decorative gold star glyph `&#9733;` is fine in headings/banners. In prose, write Japanese as
  HTML entities (`&#12425;&#12365;&#9734;&#12510;&#12473;`) so the source stays ASCII-clean.
- **Credit the original authors** (SYGNAS) generously and clearly; always frame the work as
  preservation of someone else's labor of love, never as ownership. Keep the "your own copy / no
  redistribution" framing on anything about obtaining the disc.
- **No AI slop.** No gratuitous emoji, no gradient-heavy decoration, no invented stats, no rounded
  accent-border callout spam. The candy theme on the Lucky\*Mas pages is intentional and matches the
  disc's own art; keep it tasteful.
- **Tone of the about/links copy** is set in `content/site.config.json`. The Ko-fi blurb must keep
  the specifics: donations fund the AI subscriptions for this preservation work; ~240 EUR is roughly
  one month of intense multi-project work on a Claude Max 20x subscription; software/games named in
  donations are considered as next targets.

## Repo layout

```
content/
  site.config.json          home page data (kicker, tagline, about[], links[], footer)
  projects/<slug>.md         a project page (frontmatter + markdown body)
  writeups/<slug>.md         a writeup (frontmatter + markdown body)
assets/                      shared images (copied verbatim into public/assets/)
build.mjs                    the generator: markdown + directives + the 3 layouts + ALL styling
flake.nix                    pins Node + the Neocities CLI; `nix run` builds, `nix run .#publish` deploys
public/                      GENERATED (gitignored). rebuilt by `nix run`. deploy this, never hand-edit.
known-good-v1/               frozen snapshot of the first hand-written version (reference only)
README-site.md               short author-facing reference for the content format
```

## Runbook

### Edit content

- **Fix copy / links / about / footer:** edit `content/site.config.json`.
- **Edit a project or writeup:** edit the matching `.md` in `content/`.
- **Add a writeup (no HTML):** drop a new `content/writeups/<slug>.md`. It auto-appears in the home
  Writeups index, gets its own page, and joins its project's "How it works" card grid. Order is the
  `order:` frontmatter field (also drives the prev/next chain). Required frontmatter: `slug`,
  `project`, `order`, `date`, `crumb`, `title`, `subtitle`, `summary`, `card_title`, `card_desc`.
- **Add a project:** add `content/projects/<slug>.md`. Its frontmatter feeds both the project page
  header (`title_html`, `jp`, `tagline`, `buttons`) and its home card (`home_title`, `home_meta`,
  `home_blurb`, `home_tags`, `thumb`, `thumb_alt`, `github`). Copy `luckymas.md` as a template.
- **Add an image:** put it in `assets/`, reference it as `assets/name.png` in markdown.

### Body directives (on top of normal markdown)

`## Heading {#id}` (banner in projects, pink subhead in writeups) · ` ```sh ` code fence
(`sh`/`bash`/`bat` highlights `#` comments) · `**bold**` `_italic_` `` `code` `` `[text](url)` ·
markdown tables · `- lists` · `::: panel` · `::: compare` (before/after A/B) · `::: gallery`
(auto-aligned image grid) · `::: writeups` (auto card grid of the project's writeups) ·
`::: callout warn|ok "Title"` · `::: small`.

`::: compare` rows: `[before] LABEL | image.png | caption | alt` and `[after] ...`
`::: gallery` rows: `image.png | Title | caption | alt`

### Build

This is a NixOS box: there is no global `node`. Build through the flake (it pins Node and the
Neocities CLI). Do not call `node` directly. Run from the repo root:

```sh
nix run               # content/ -> public/ ; also copies assets/ -> public/assets/
                      # (alias for `nix run .#build`)
```

Need a shell with the toolchain on PATH (to run `node build.mjs` repeatedly, etc.)? `nix develop`.
The build has no npm dependencies (Node 18+), and output is deterministic. Always rebuild before
previewing or publishing.

### Preview, then hand off (do NOT publish yourself)

**You never push to Neocities.** Publishing is the user's call and uses their API key. After you
build, give the user the following and stop:

1. **A Windows-accessible `file://` link to the built site**, so they can paste it straight into a
   browser on the Windows side of WSL. Build it as
   `file://///wsl.localhost/<distro>/<repo-path>/public/index.html` (forward slashes, and note the
   `file://///` prefix), where `<distro>` is `$WSL_DISTRO_NAME` and `<repo-path>` is `pwd` verbatim
   (already forward-slashed, so no conversion). On this box:

   ```
   file://///wsl.localhost/NixOS/opt/src/lolisamurai.neocities.org/public/index.html
   ```

   (older Windows builds use `file://///wsl$/NixOS/...` instead). Links are relative, so the page
   opens fine over `file://`, no server needed.

2. **The same `file://` link for every page you changed**, e.g. the page edited this session:

   ```
   file://///wsl.localhost/NixOS/opt/src/lolisamurai.neocities.org/public/luckymas.html
   ```

3. **A copy-paste publish command** for the user to run once they are happy. It rebuilds, then
   pushes `public/` to the site root with `--prune` (which deletes remote files no longer present
   locally), preserving subpaths (`public/assets/x.png` -> `/assets/x.png`):

   ```sh
   export NEOCITIES_API_KEY=...   # once: neocities.org -> Settings -> Manage Site -> API key
   nix run .#publish              # rebuilds, then `neocities push --prune public`
   ```

   (Already logged in via `neocities` interactively? The key is optional; the saved
   `~/.neocities/config` is used.)

## Guardrails

- Build with the flake (`nix run`), never bare `node` (there is no global node on this box).
- Never publish. Do not run `neocities push` or `nix run .#publish` yourself: build, hand the user
  the preview links and the publish command (see above), and stop.
- Never hand-edit `public/` (it is gitignored and overwritten on every build).
- Never reintroduce em dashes.
- Keep all app/source-derived facts accurate to the LuckyMasEN repo; when in doubt, link the repo
  doc rather than guessing.
- Styling and layouts live only in `build.mjs`. Touch HTML only there, and only to add a genuinely
  new layout.
