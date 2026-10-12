// Folds the artifact build (dist-artifact/) into the page format a claude.ai
// artifact publishes: no doctype/html/head/body wrapper — the host adds its own —
// just the title, font links, inlined styles, markup and inlined script, in order.
import { readFileSync, writeFileSync } from "node:fs";

const dir = "dist-artifact";
const html = readFileSync(`${dir}/index.html`, "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? "";
const read = (href) => readFileSync(`${dir}${href}`, "utf8");

const title = head.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? "<title>Lyric Slides</title>";
const fonts = [...head.matchAll(/<link rel="(?:preconnect|stylesheet)" href="https:[^>]*>/g)].map((m) => m[0]);
const css = [...head.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g)].map((m) => `<style>\n${read(m[1])}\n</style>`);
// Escape "</script" inside the bundle so the inline script can't end early.
const js = [...head.matchAll(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/g)].map(
  (m) => `<script type="module">\n${read(m[1]).replace(/<\/script/gi, "<\\/script")}\n</script>`,
);
if (!css.length || !js.length) throw new Error("artifact build is missing its CSS or JS bundle");

const markup = body.replace(/<script[\s\S]*?<\/script>/g, "").trim();
const page = [title, ...fonts, ...css, markup, ...js].join("\n");
writeFileSync(`${dir}/lyric-slides.html`, page);
console.log(`${dir}/lyric-slides.html  ${(page.length / 1024).toFixed(0)} KB`);
