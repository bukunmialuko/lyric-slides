# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Lyric Slides** — the Harvesters Birmingham technical team's tool for turning
the choir's lyrics into ProPresenter slides. Lyrics in (pasted, .txt or Word
.docx), two-line slides and a dated `.txt` per song out. Deployed on Vercel, and
also published as a claude.ai artifact from the same source.

- `src/core/` — split, locate, import, file names. **Framework-free**: no React,
  no DOM.
- `src/components/` — the React shell.
- `src/hooks/` — app state (reducer + saving), media queries, dismiss-on-outside-click.
- `src/services/` — browser adapters: storage, clipboard, file import, downloads.
- `scripts/artifact.mjs` — folds the artifact build into one claude.ai page.

## Commits

- **One-line conventional commits only.** `type(scope): subject` on a single
  line. No body, no footer, no bullet list.
- **Never add `Co-Authored-By`** or any other trailer. Nothing that attributes
  the commit to Claude.
- **Suggest, never apply.** End a response with a proposed commit when there are
  uncommitted changes worth committing. Only run `git commit` when explicitly
  told to.
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `build`, `perf`.
- Subject in imperative mood, lowercase, no trailing period.

**Good:**

```
feat(import): split word documents at their set headings
fix(split): keep lyrics after an inline chorus label
docs: document the vercel deploy
```

**Not allowed:** multi-line messages, bodies, or any `Co-Authored-By` /
generated-with trailer.

## Invariants

These are load-bearing. Breaking one silently degrades the output.

- **`src/core/` imports no React and touches no DOM.** `docx.ts` reads Word files
  with fflate and regular expressions, not `DOMParser`, so the whole core runs in
  Node tests. Browser APIs (`File`, `localStorage`, clipboard, downloads) live in
  `src/services/`.
- **One grammar.** `core/grammar.ts` is the only definition of section labels,
  repeat markers and CAPITAL headings. `split.ts`, `parts.ts` and `title.ts`
  import from it; a second regex for "what a label looks like" would drift.
- **A label line is only a label.** `LABEL_ONLY` must not match anything after the
  name and number. It once matched `Chorus: Holy, holy` and silently dropped the
  lyrics; `split.test.ts` pins this.
- **Splitting never changes a word.** It only moves line breaks, capitalises a
  line's first letter and drops trailing `, ; :`. `locateSlides()` maps each slide
  back to the lyrics by matching words in order, which is what makes clicking a
  slide highlight its source. `split.test.ts` checks the sample hymns survive
  word-for-word and `locate.test.ts` checks every slide maps. Any new rule that
  rewrites words (spelling fixes, expanding "x2" inline) breaks both.
- **Repeated sections share one `slides` array.** `buildSlides` reuses the same
  array object for each repeat, and `locateSlides` relies on that identity to
  point repeats at their first appearance.
- **The output file is ProPresenter's import format.** One blank line between
  slides, UTF-8, Windows `\r\n` line endings and a final newline (`toFileText`),
  because the files are opened in Notepad++ on the church PC.
- **File names are `<Title> - <date>.txt`.** The default date style is
  `sun-18-oct-26`; `sun-oct-26` is kept as an option but gives every Sunday in a
  month the same name, so it is not the default. Characters Windows forbids are
  stripped. `nextSunday(today)` keeps `today` injectable so tests don't rot.
- **Word headings come from formatting first.** A heading is a Word Heading/Title
  style or a font at least 25% bigger than the lyrics. CAPITALS are only the
  fallback when a document has no styled headings, so a lyric typed in capitals
  can't split a well-formatted file. Section names (VERSE, CHORUS) are never song
  titles.
- **Storage key `lyric-splitter-v2` is shared with the claude.ai artifact.**
  Changing the saved shape needs a migration in `services/storage.ts`, not a new
  key, or people lose their running order.
- **Downloads go through `services/download.ts`.** Inside a claude.ai artifact the
  page can't start a download and must use the `downloads` capability; on Vercel
  it is a normal download link. Components never create download links themselves.
- **Never commit the choir's documents or lyrics.** They are usually copyrighted
  songs. Samples and tests use public-domain hymns or invented text; `.gitignore`
  blocks `*.docx`.

## Style

- Harvesters brand, taken from harvestersuk.org: charcoal `#1E1E1E`, light greys,
  one copper accent `#A54E08` (`#E08A3C` in dark mode), Jost for the interface,
  JetBrains Mono for lyrics and file names.
- Slides preview as black 16:9 tiles; the live slide gets a copper outline and a
  `LIVE` tag, like ProPresenter's live view.
- Explanations live behind ⓘ tips, not in paragraphs on the page. Icon buttons
  carry an `aria-label` and a `title`.
- Every colour is a token in `app.css` with light and dark values; no literal
  colours in components.
- Avoid: gradients, glass, emoji, stock illustration, dashboard chrome.

## Checks

```bash
npm test                # vitest — core suites
npm run build           # tsc --noEmit && vite build; must pass before proposing a commit
npm run build:artifact  # single-page build for the claude.ai artifact
```

Install with npm 11 or newer (`npx npm@11 install`): npm 10.9 crashes resolving
vitest's optional peers with `Cannot read properties of null (reading 'edgesOut')`.
