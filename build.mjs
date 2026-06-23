/*
 * build.mjs — static site generator for lolisamurai.neocities.org
 * --------------------------------------------------------------------------
 * Turns the markdown in content/ into the static HTML in public/.
 * Build via the Nix flake (no global node on NixOS):  nix run   (alias: nix run .#build)
 * Inside `nix develop` you can also run it directly:  node build.mjs   (needs Node 18+)
 *
 * You DO NOT edit HTML to add content. You edit:
 *   content/site.config.json      the home page (intro, links, about, footer)
 *   content/projects/<slug>.md    one project page  (frontmatter + body)
 *   content/writeups/<slug>.md    one writeup page   (frontmatter + body)
 * Drop a new writeup .md in content/writeups/ and it auto-appears in the home
 * "Writeups" index AND in its project's "How it works" card grid. Sorting is by
 * the `order:` field in each writeup's frontmatter.
 *
 * Body markdown understands a few block directives on top of normal markdown
 * (## headings, paragraphs, - lists, | tables |, ``` code fences, **bold**,
 *  _italic_, `code`, [links](url), and raw &entities;):
 *
 *   ::: panel                     a white rounded intro card (markdown inside)
 *   :::
 *
 *   ::: compare                   a before/after A/B with auto equal-width, size-matched columns
 *   [before] LABEL | image.png | caption | alt-text
 *   [after]  LABEL | image.png | caption | alt-text
 *   :::
 *
 *   ::: gallery                   an auto-aligned, size-matched image grid
 *   image.png | Title | caption | alt-text
 *   image.png | Title | caption | alt-text
 *   :::
 *
 *   ::: writeups                  auto card-grid of this project's writeups
 *   :::
 *
 *   ::: callout warn "Optional title"   a tinted callout (kind: warn | ok)
 *   markdown ...
 *   :::
 *
 *   ::: small                     one line of fine print
 *   text ...
 *   :::
 *
 * Heading anchors:  ## Build it {#build}   ->  <... id="build">
 * The styling lives in this file (headStyleFor + the render* helpers). To give a
 * project a structurally different look, add a layout here — that is the only
 * time you touch HTML.
 * --------------------------------------------------------------------------
 */

/* ===================== PURE CORE (no imports below) ===================== */

function parseDoc(text){
  text = text.replace(/\r\n/g, '\n');
  let meta = {}, body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    body = m[2];
    for (const line of m[1].split('\n')) {
      if (!line.trim() || /^\s*#/.test(line)) continue;
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const k = line.slice(0, idx).trim();
      let v = line.slice(idx + 1).trim();
      if (v.startsWith('[') || v.startsWith('{')) { try { v = JSON.parse(v); } catch (e) {} }
      else if (/^\d+$/.test(v)) v = parseInt(v, 10);
      meta[k] = v;
    }
  }
  return { meta, body: body.replace(/^\n+/, '') };
}

function escCode(s){ return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function inlineMd(s){
  if (s == null) return '';
  s = String(s);
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => { const i = codes.length; codes.push('<code>' + escCode(c) + '</code>'); return '\u0000C' + i + '\u0000'; });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/_([^_]+)_/g, '<i>$1</i>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/&(?!#?\w+;)/g, '&amp;');
  s = s.replace(/\u0000C(\d+)\u0000/g, (m, i) => codes[+i]);
  return s;
}

function attr(s){ return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

function splitParas(lines){
  const paras = []; let cur = [];
  for (const l of lines) { if (/^\s*$/.test(l)) { if (cur.length) { paras.push(cur.join(' ')); cur = []; } } else cur.push(l); }
  if (cur.length) paras.push(cur.join(' '));
  return paras;
}

function renderHeading(text, layout){
  let id = '';
  text = text.replace(/\s*\{#([\w-]+)\}\s*$/, (m, d) => { id = d; return ''; }).trim();
  if (layout === 'writeup') return '<h3><span class="s">&#9733;</span> ' + inlineMd(text) + '</h3>';
  return '<div' + (id ? ' id="' + id + '"' : '') + ' style="margin:26px 0 0; background:linear-gradient(#b6d84a,#9ec22e); border:1px solid #86a826; border-radius:8px; padding:8px 16px; color:#d6388a; font-weight:bold; font-style:italic; font-size:19px; text-shadow:0 1px 0 #fff;">&#9733; ' + inlineMd(text) + '</div>';
}

function renderPara(text, layout){
  if (layout === 'writeup') return '<p>' + inlineMd(text) + '</p>';
  return '<p style="margin:10px 2px 0; font-size:12.5px; color:#6b5560;">' + inlineMd(text) + '</p>';
}

function renderCode(code, lang, layout){
  let html = escCode(code);
  if (/^(sh|bash|bat|cmd)$/.test(lang)) {
    html = html.split('\n').map(ln => ln.replace(/^(\s*#.*)$/, '<span style="color:#8fae4f;">$1</span>')).join('\n');
  }
  if (layout === 'writeup') return '<pre><code>' + html + '</code></pre>';
  return '<pre style="background:#241c20; color:#f3e3ec; border-radius:8px; padding:14px 16px; margin-top:12px; overflow-x:auto; font-family:\'Courier New\', monospace; font-size:12px; line-height:1.7;">' + html + '</pre>';
}

function parseTable(buf){
  const rows = buf.map(l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim()));
  const header = rows[0];
  const body = rows.slice(2);
  return { header, body };
}

function renderTable(buf, layout){
  const { header, body } = parseTable(buf);
  if (layout === 'writeup') {
    const th = header.map(h => '<th>' + inlineMd(h) + '</th>').join('');
    const tr = body.map(r => '<tr>' + r.map(c => '<td>' + inlineMd(c) + '</td>').join('') + '</tr>').join('');
    return '<table class="hex"><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table>';
  }
  // project feature table: header ignored, alternating rows, last row borderless
  const rowsHtml = body.map((r, idx) => {
    const even = idx % 2 === 0;
    const last = idx === body.length - 1;
    const bcolor = even ? '#f0c6dc' : '#f6dceb';
    const border = last ? '' : ' border-bottom:1px solid ' + bcolor + ';';
    const w = idx === 0 ? ' width:38%;' : '';
    const trStyle = even ? ' style="background:#fdeaf2;"' : '';
    return '<tr' + trStyle + '><td style="padding:8px 12px; font-weight:bold; color:#c5337f;' + w + border + '">' + inlineMd(r[0]) + '</td><td style="padding:8px 12px;' + border + ' color:#4a3f43;">' + inlineMd(r[1]) + '</td></tr>';
  }).join('');
  return '<div style="background:#fff; border:1px solid #f0c6dc; border-radius:8px; margin-top:12px; overflow:hidden;"><table style="width:100%; border-collapse:collapse; font-size:12px;"><tbody>' + rowsHtml + '</tbody></table></div>';
}

function renderList(items, layout){
  const lis = items.map((it, idx) => {
    const last = idx === items.length - 1;
    return '<li' + (last ? '' : ' style="margin-bottom:7px;"') + '>' + inlineMd(it) + '</li>';
  }).join('');
  return '<ul style="margin:0 0 11px; padding-left:20px;">' + lis + '</ul>';
}

function renderDirective(head, buf, layout, ctx){
  const m = head.match(/^(\S+)\s*(.*)$/);
  if (!m) return '';
  const name = m[1];
  const rest = m[2] || '';

  if (name === 'panel') {
    const paras = splitParas(buf);
    const inner = paras.map((p, idx) => '<p style="margin:' + (idx === paras.length - 1 ? '0' : '0 0 10px') + ';">' + inlineMd(p) + '</p>').join('');
    return '<div style="background:#fff; border:1px solid #f0c6dc; border-radius:8px; padding:16px 18px; margin-top:14px;">' + inner + '</div>';
  }

  if (name === 'compare') {
    const cards = buf.filter(l => l.trim()).map(l => {
      const mm = l.match(/^\s*\[(before|after)\]\s*(.*)$/);
      if (!mm) return '';
      const parts = mm[2].split('|').map(s => s.trim());
      const label = parts[0] || '', img = parts[1] || '', note = parts[2] || '', alt = parts[3] || label;
      const before = mm[1] === 'before';
      const border = before ? '#f0c6dc' : '#cfe39a';
      const bar = before ? '#b5562a' : '#6fa01e';
      return '<div style="flex:1 1 380px; background:#fff; border:1px solid ' + border + '; border-radius:8px; overflow:hidden;">'
        + '<div style="background:' + bar + '; color:#fff; padding:5px 12px; font-weight:bold; font-size:12px; letter-spacing:1px;">' + inlineMd(label) + '</div>'
        + '<a href="' + img + '" target="_blank" rel="noopener" title="Open full image" style="display:block; line-height:0;"><img src="' + img + '" alt="' + attr(alt) + '" style="display:block; width:100%; height:auto; border-top:1px solid ' + border + ';" /></a>'
        + '<div style="padding:8px 12px; font-size:11.5px; color:#6b5560;">' + inlineMd(note) + '</div></div>';
    }).join('');
    return '<div style="display:flex; gap:16px; flex-wrap:wrap; margin-top:12px;">' + cards + '</div>';
  }

  if (name === 'gallery') {
    const cards = buf.filter(l => l.trim()).map(l => {
      const parts = l.split('|').map(s => s.trim());
      const img = parts[0] || '', title = parts[1] || '', cap = parts[2] || '', alt = parts[3] || title;
      return '<div style="flex:1 1 280px; background:#fff; border:1px solid #f0c6dc; border-radius:8px; overflow:hidden;">'
        + '<a href="' + img + '" target="_blank" rel="noopener" title="Open full image" style="display:block; line-height:0;"><img src="' + img + '" alt="' + attr(alt) + '" style="display:block; width:100%; height:auto;" /></a>'
        + '<div style="padding:8px 12px;"><b style="color:#c5337f;">' + inlineMd(title) + '</b><div style="font-size:11.5px; color:#6b5560;">' + inlineMd(cap) + '</div></div></div>';
    }).join('');
    return '<div style="display:flex; gap:14px; flex-wrap:wrap; margin-top:12px;">' + cards + '</div>';
  }

  if (name === 'writeups') {
    const cards = (ctx.projectWriteups || []).map(w => '<a href="' + w.slug + '.html" style="flex:1 1 250px; text-decoration:none; background:#fff; border:1px solid #f0c6dc; border-radius:8px; padding:13px 15px; color:#3a2f33;">'
      + '<div style="font-weight:bold; color:#c5337f; font-size:13.5px;">' + inlineMd(w.card_title) + ' &raquo;</div>'
      + '<div style="font-size:11.5px; color:#6b5560; margin-top:3px;">' + inlineMd(w.card_desc) + '</div></a>').join('');
    return '<div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:12px;">' + cards + '</div>';
  }

  if (name === 'callout') {
    const km = rest.match(/^(\w+)\s*(?:"([^"]*)")?/) || [];
    const kind = km[1] || 'warn';
    const title = km[2] || '';
    const st = kind === 'ok'
      ? { bg: '#eef7e2', border: '#b9d986', text: '#4c5a30', titleC: '#4c5a30' }
      : { bg: '#fff7e9', border: '#e8c98a', text: '#6b5a3a', titleC: '#c47f1a' };
    const paras = splitParas(buf);
    const titleHtml = title ? '<div style="font-weight:bold; color:' + st.titleC + '; font-size:14px; margin-bottom:6px;">' + inlineMd(title) + '</div>' : '';
    const inner = paras.map((p, idx) => {
      const last = idx === paras.length - 1;
      const mb = (paras.length > 1 && !last) ? '0 0 8px' : '0';
      return '<p style="margin:' + mb + '; font-size:12px; color:' + st.text + ';">' + inlineMd(p) + '</p>';
    }).join('');
    return '<div style="background:' + st.bg + '; border:1px solid ' + st.border + '; border-radius:8px; padding:' + (title ? '14px 16px' : '13px 16px') + '; margin-top:' + (title ? '24px' : '22px') + ';">' + titleHtml + inner + '</div>';
  }

  if (name === 'small') {
    return '<p style="margin:10px 2px 0; font-size:11.5px; color:#8a7680;">' + inlineMd(buf.join(' ').trim()) + '</p>';
  }

  return '';
}

function renderBlocks(md, layout, ctx){
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim();
      i++; const buf = [];
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(renderCode(buf.join('\n'), lang, layout));
      continue;
    }
    if (/^:::/.test(line)) {
      const headTxt = line.replace(/^:::/, '').trim();
      i++; const buf = [];
      while (i < lines.length && lines[i].trim() !== ':::') { buf.push(lines[i]); i++; }
      i++;
      out.push(renderDirective(headTxt, buf, layout, ctx));
      continue;
    }
    if (/^##\s+/.test(line)) { out.push(renderHeading(line.replace(/^##\s+/, ''), layout)); i++; continue; }
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && /^[\s:|-]+$/.test(lines[i + 1])) {
      const buf = [line]; i++;
      buf.push(lines[i]); i++;
      while (i < lines.length && lines[i].includes('|')) { buf.push(lines[i]); i++; }
      out.push(renderTable(buf, layout));
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^[-*]\s+/, '')); i++; }
      out.push(renderList(buf, layout));
      continue;
    }
    const buf = [line]; i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(##\s|```|:::|[-*]\s)/.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(renderPara(buf.join(' '), layout));
  }
  return out.join('\n');
}

function headStyleFor(layout){
  const home = "  html, body { margin: 0; padding: 0; }\n  body {\n    background-color: #e9e6dd;\n    background-image:\n      repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 4px);\n    font-family: Verdana, Geneva, Tahoma, sans-serif;\n    color: #2c2a26;\n    font-size: 13px;\n    line-height: 1.65;\n  }\n  a { color: #2f5aa8; }\n  a:visited { color: #6f4a96; }\n  a:hover { color: #c0392b; }";
  const pink = "  html, body { margin: 0; padding: 0; }\n  body {\n    background-color: #fbeef3;\n    background-image:\n      radial-gradient(circle at 12px 12px, rgba(214,56,138,0.06) 1.5px, transparent 1.6px),\n      radial-gradient(circle at 36px 36px, rgba(158,194,46,0.07) 1.5px, transparent 1.6px);\n    background-size: 48px 48px;\n    font-family: Verdana, Geneva, Tahoma, sans-serif;\n    color: #3a2f33;\n    font-size: 13px;\n    line-height: LINEH;\n  }\n  a { color: #c5337f; }\n  a:visited { color: #9a3f8f; }\n  a:hover { color: #6b8f12; }";
  if (layout === 'home') return home;
  if (layout === 'project') return pink.replace('LINEH', '1.65');
  return pink.replace('LINEH', '1.7')
    + "\n  code { font-family: 'Courier New', monospace; background:#fbe6f0; border:1px solid #f3cfe1; border-radius:3px; padding:0 4px; font-size:11.5px; color:#a52a73; }"
    + "\n  pre { background:#241c20; color:#f3e3ec; border-radius:8px; padding:14px 16px; overflow-x:auto; font-family:'Courier New', monospace; font-size:11.5px; line-height:1.65; }"
    + "\n  pre code { background:none; border:none; padding:0; color:inherit; }"
    + "\n  h3 { color:#c5337f; font-size:16px; margin:26px 0 4px; }"
    + "\n  h3 .s { color:#8fae1f; }"
    + "\n  p { margin:0 0 11px; }"
    + "\n  table.hex { width:100%; border-collapse:collapse; font-family:'Courier New', monospace; font-size:11.5px; background:#fff; }"
    + "\n  table.hex td, table.hex th { border:1px solid #f0c6dc; padding:4px 8px; text-align:left; }"
    + "\n  table.hex th { background:#fdeaf2; color:#c5337f; }";
}

function pageDoc(title, layout, bodyInner){
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>' + title + '</title>\n<style>\n' + headStyleFor(layout) + '\n</style>\n</head>\n<body>\n' + bodyInner + '\n</body>\n</html>\n';
}

function renderHome(config, writeups, projects){
  const firstSlug = projects[0] ? projects[0].meta.slug : 'index';
  const navItems = [
    { label: 'home', href: 'index.html', active: true },
    { label: 'projects', href: firstSlug + '.html' },
    { label: 'writeups', href: '#blog' },
    { label: 'about', href: '#about' },
    { label: 'links', href: '#links' }
  ];
  const nav = '<div style="display:flex; gap:2px; margin-top:8px; font-size:12px;">' + navItems.map(n => n.active
    ? '<a href="' + n.href + '" style="flex:1; text-align:center; background:#3a4a6b; color:#fff; text-decoration:none; padding:6px 0; border:1px solid #2a3550;">' + n.label + '</a>'
    : '<a href="' + n.href + '" style="flex:1; text-align:center; background:#e7e2d4; color:#2c2a26; text-decoration:none; padding:6px 0; border:1px solid #c7bfa9;">' + n.label + '</a>').join('') + '</div>';

  const header = '<div style="background:#fbfaf4; border:1px solid #c7bfa9; border-bottom:3px double #c7bfa9; padding:18px 22px 16px;">'
    + '<div style="font-size:11px; letter-spacing:2px; color:#9a8f76; text-transform:uppercase;">' + inlineMd(config.kicker) + '</div>'
    + '<h1 style="margin:4px 0 2px; font-size:30px; letter-spacing:1px; color:#1f1d1a; font-weight:bold;">' + config.title + '<span style="color:#c0392b;">' + config.domain + '</span></h1>'
    + '<div style="font-size:12.5px; color:#5b554a;">' + inlineMd(config.tagline) + '</div></div>';

  const pcards = projects.map(p => {
    const x = p.meta;
    const tags = (x.home_tags || []).map(t => '<span style="background:#f0ebdd; border:1px solid #d8cfb6; padding:2px 7px; color:#6b6149;">' + inlineMd(t) + '</span>').join('');
    return '<div style="display:flex; gap:14px; background:#fbfaf4; border:1px solid #c7bfa9; padding:14px; margin-top:12px;">'
      + '<a href="' + x.slug + '.html" style="flex:0 0 auto; line-height:0;"><img src="' + x.thumb + '" alt="' + attr(x.thumb_alt) + '" width="220" style="display:block; width:220px; height:auto; border:1px solid #b9b09a;" /></a>'
      + '<div style="flex:1; min-width:0;">'
      + '<div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;"><a href="' + x.slug + '.html" style="font-size:16px; font-weight:bold; text-decoration:none; color:#2f5aa8;">' + inlineMd(x.home_title) + '</a><span style="font-size:11px; color:#7a7058;">' + inlineMd(x.home_meta) + '</span></div>'
      + '<p style="margin:6px 0 8px; font-size:12.5px; color:#3f3a32;">' + inlineMd(x.home_blurb) + '</p>'
      + '<div style="display:flex; gap:5px; flex-wrap:wrap; font-size:10.5px;">' + tags + '<a href="' + x.github + '" style="margin-left:auto; text-decoration:none;">github &raquo;</a></div>'
      + '</div></div>';
  }).join('');
  const projNote = config.projects_note ? '<p style="font-size:11.5px; color:#8a8068; margin:10px 2px 0;">' + inlineMd(config.projects_note) + '</p>' : '';
  const projectsSection = '<div style="margin-top:20px;"><div style="display:flex; align-items:baseline; gap:8px; border-bottom:2px solid #c7bfa9; padding-bottom:3px;"><h2 style="margin:0; font-size:17px; color:#1f1d1a;">Projects</h2><span style="font-size:11px; color:#9a8f76;">' + inlineMd(config.projects_subtitle || '') + '</span></div>' + pcards + projNote + '</div>';

  const witems = writeups.map(w => {
    const x = w.meta;
    return '<li style="display:flex; gap:10px; padding:7px 0; border-bottom:1px dotted #cfc7b2;"><span style="flex:0 0 78px; font-size:11px; color:#9a8f76; font-family:\'Courier New\', monospace;">' + x.date + '</span><span style="flex:1;"><a href="' + x.slug + '.html" style="text-decoration:none;">' + inlineMd(x.title) + '</a><br /><span style="font-size:11.5px; color:#6b6452;">' + inlineMd(x.summary) + '</span></span></li>';
  }).join('');
  const writeupsSection = '<div id="blog" style="margin-top:26px;"><div style="display:flex; align-items:baseline; gap:8px; border-bottom:2px solid #c7bfa9; padding-bottom:3px;"><h2 style="margin:0; font-size:17px; color:#1f1d1a;">Writeups</h2><span style="font-size:11px; color:#9a8f76;">' + inlineMd(config.writeups_subtitle || '') + '</span></div><ul style="list-style:none; margin:12px 0 0; padding:0;">' + witems + '</ul></div>';

  const aboutParas = (config.about || []).map((p, idx) => {
    const last = idx === config.about.length - 1;
    return '<p style="margin:' + (last ? '0' : '0 0 10px') + '; font-size:12.5px;' + (last ? ' color:#5b554a;' : '') + '">' + inlineMd(p) + '</p>';
  }).join('');
  const aboutSection = '<div id="about" style="margin-top:26px;"><div style="border-bottom:2px solid #c7bfa9; padding-bottom:3px;"><h2 style="margin:0; font-size:17px; color:#1f1d1a;">About me</h2></div><div style="background:#fbfaf4; border:1px solid #c7bfa9; padding:14px 16px; margin-top:12px;">' + aboutParas + '</div></div>';

  const lcards = (config.links || []).map(l => {
    if (l.preset === 'kofi') return '<a href="' + l.url + '" style="flex:1 1 100%; text-decoration:none; background:#fff7e9; border:1px solid #e8c98a; padding:11px 13px; color:#2c2a26;"><div style="font-weight:bold; color:' + l.titleColor + '; font-size:13px;">' + inlineMd(l.title) + '</div><div style="font-size:11.5px; color:#6b6452; margin-top:2px;">' + inlineMd(l.desc) + '</div></a>';
    return '<a href="' + l.url + '" style="flex:1 1 200px; text-decoration:none; background:#fbfaf4; border:1px solid #c7bfa9; padding:11px 13px; color:#2c2a26;"><div style="font-weight:bold; color:' + l.titleColor + '; font-size:13px;">' + inlineMd(l.title) + '</div><div style="font-size:11.5px; color:#6b6452;">' + inlineMd(l.desc) + '</div></a>';
  }).join('');
  const linksSection = '<div id="links" style="margin-top:26px;"><div style="border-bottom:2px solid #c7bfa9; padding-bottom:3px;"><h2 style="margin:0; font-size:17px; color:#1f1d1a;">Links</h2></div><div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:12px;">' + lcards + '</div></div>';

  const footer = '<div style="margin-top:30px; padding-top:12px; border-top:1px solid #c7bfa9; font-size:11px; color:#9a8f76; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;"><span>' + inlineMd(config.footer_left) + '</span><span>last updated ' + config.updated + '</span></div>';

  const inner = '<div style="max-width: 700px; margin: 0 auto; padding: 22px 14px 60px;">\n' + header + '\n' + nav + '\n' + projectsSection + '\n' + writeupsSection + '\n' + aboutSection + '\n' + linksSection + '\n' + footer + '\n</div>';
  return pageDoc(config.title + config.domain, 'home', inner);
}

function renderProject(p, config, projectWriteups){
  const x = p.meta;
  const buttons = (x.buttons || []).map(b => {
    let s;
    if (b.preset === 'dark') s = 'background:#24292f; color:#fff;';
    else if (b.preset === 'green') s = 'background:#9ec22e; color:#fff; text-shadow:0 1px 0 rgba(0,0,0,0.15);';
    else s = 'background:#fff; color:#c5337f; border:1px solid #e9a6c8;';
    return '<a href="' + b.url + '" style="text-decoration:none; ' + s + ' padding:7px 14px; border-radius:6px; font-size:12.5px; font-weight:bold;">' + inlineMd(b.label) + '</a>';
  }).join('');
  const header = '<div style="background:linear-gradient(#ffffff,#fdeaf2); border:2px solid #e9a6c8; border-radius:10px; padding:18px 22px;">'
    + '<div style="display:flex; align-items:baseline; gap:12px; flex-wrap:wrap;"><h1 style="margin:0; font-size:34px; font-style:italic; color:#d6388a; text-shadow:1px 1px 0 #fff, 2px 2px 0 #f4c5dd;">' + x.title_html + '</h1><span lang="ja" style="font-size:18px; color:#b06; font-weight:bold;">' + (x.jp || '') + '</span></div>'
    + '<div style="font-size:13px; color:#6b5560; margin-top:4px;">' + inlineMd(x.tagline || '') + '</div>'
    + '<div style="display:flex; gap:8px; margin-top:12px; flex-wrap:wrap;">' + buttons + '</div></div>';
  const crumb = '<div style="font-size:11.5px; color:#a98; margin-bottom:8px;"><a href="index.html" style="text-decoration:none;">home</a> &nbsp;&rsaquo;&nbsp; <span style="color:#7a6f73;">projects</span> &nbsp;&rsaquo;&nbsp; <span style="color:#3a2f33;">' + x.name + '</span></div>';
  const body = renderBlocks(p.body, 'project', { projectWriteups });
  const footer = '<div style="margin-top:26px; padding-top:12px; border-top:1px solid #f0c6dc; font-size:11px; color:#b58aa0; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px;"><span><a href="index.html" style="text-decoration:none;">&laquo; back home</a></span><span>last updated ' + (x.date || config.updated) + '</span></div>';
  const inner = '<div style="max-width: 900px; margin: 0 auto; padding: 22px 14px 60px;">\n' + crumb + '\n' + header + '\n' + body + '\n' + footer + '\n</div>';
  return pageDoc(x.name, 'project', inner);
}

function renderWriteup(w, allWriteups, config, projects){
  const x = w.meta;
  const proj = projects.find(p => p.meta.slug === x.project) || { meta: { slug: x.project, name: x.project_name || '' } };
  const sibs = allWriteups.filter(s => s.meta.project === x.project).sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0));
  const idx = sibs.findIndex(s => s.meta.slug === x.slug);
  const prev = idx > 0 ? sibs[idx - 1] : null;
  const next = idx >= 0 && idx < sibs.length - 1 ? sibs[idx + 1] : null;
  const crumb = '<div style="font-size:11.5px; color:#a98; margin-bottom:8px;"><a href="index.html" style="text-decoration:none;">home</a> &rsaquo; <a href="' + proj.meta.slug + '.html" style="text-decoration:none;">' + proj.meta.name + '</a> &rsaquo; <span style="color:#3a2f33;">' + x.crumb + '</span></div>';
  const header = '<div style="background:linear-gradient(#ffffff,#fdeaf2); border:2px solid #e9a6c8; border-radius:10px; padding:16px 20px;"><h1 style="margin:0; font-size:25px; color:#d6388a; font-style:italic; text-shadow:1px 1px 0 #fff;">' + inlineMd(x.title) + '</h1><div style="font-size:12px; color:#6b5560; margin-top:4px;">' + inlineMd(x.subtitle || '') + '</div></div>';
  const body = renderBlocks(w.body, 'writeup', {});
  const leftN = prev ? '<a href="' + prev.meta.slug + '.html" style="text-decoration:none;">&laquo; ' + inlineMd(prev.meta.crumb) + '</a>' : '<a href="' + proj.meta.slug + '.html" style="text-decoration:none;">&laquo; back to the project</a>';
  const rightN = next ? '<a href="' + next.meta.slug + '.html" style="text-decoration:none;">next: ' + inlineMd(next.meta.crumb) + ' &raquo;</a>' : '<a href="' + proj.meta.slug + '.html" style="text-decoration:none;">back to the project &raquo;</a>';
  const nav = '<div style="margin-top:24px; display:flex; justify-content:space-between; font-size:12px;">' + leftN + rightN + '</div>';
  const inner = '<div style="max-width: 760px; margin: 0 auto; padding: 22px 16px 60px;">\n' + crumb + '\n' + header + '\n' + body + '\n' + nav + '\n</div>';
  return pageDoc(x.title, 'writeup', inner);
}

async function buildSite(io){
  const config = JSON.parse(await io.read('content/site.config.json'));

  const wnames = (await io.list('content/writeups')).filter(n => n.endsWith('.md'));
  let writeups = [];
  for (const n of wnames) {
    const d = parseDoc(await io.read('content/writeups/' + n));
    d.meta.slug = d.meta.slug || n.replace(/\.md$/, '');
    writeups.push(d);
  }
  writeups.sort((a, b) => (a.meta.order || 0) - (b.meta.order || 0));

  const pnames = (await io.list('content/projects')).filter(n => n.endsWith('.md'));
  const projects = [];
  for (const n of pnames) {
    const d = parseDoc(await io.read('content/projects/' + n));
    d.meta.slug = d.meta.slug || n.replace(/\.md$/, '');
    projects.push(d);
  }

  // expose slug onto writeup cards for the project grid
  const wmetas = writeups.map(w => Object.assign({}, w.meta));

  await io.write('public/index.html', renderHome(config, wmetas.map(m => ({ meta: m })), projects));

  for (const p of projects) {
    const pw = wmetas.filter(m => m.project === p.meta.slug);
    await io.write('public/' + p.meta.slug + '.html', renderProject(p, config, pw));
  }
  for (const w of writeups) {
    await io.write('public/' + w.meta.slug + '.html', renderWriteup(w, writeups, config, projects));
  }

  const assets = await io.list('assets');
  for (const a of assets) { await io.copyBinary('assets/' + a, 'public/assets/' + a); }

  return { pages: projects.length + writeups.length + 1, assets: assets.length };
}

/* === NODE ENTRYPOINT === */
import { readFile, writeFile, readdir, mkdir, copyFile } from 'node:fs/promises';
import { dirname } from 'node:path';
const nodeIo = {
  read: (p) => readFile(p, 'utf8'),
  write: async (p, s) => { await mkdir(dirname(p), { recursive: true }); await writeFile(p, s); },
  list: (d) => readdir(d),
  copyBinary: async (s, d) => { await mkdir(dirname(d), { recursive: true }); await copyFile(s, d); }
};
const r = await buildSite(nodeIo);
console.log('Built ' + r.pages + ' pages, copied ' + r.assets + ' assets -> public/');
