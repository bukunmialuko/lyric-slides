# Lyric Slides

Turns the choir's lyrics into ProPresenter slides for the Harvesters Birmingham
technical team.

- Paste lyrics, or import a Word `.docx` or `.txt`. Set headings like
  **FIRST PRAISE** or **MIDDLE SET** become separate songs.
- Lines break at commas and punctuation, two lines to a slide.
- Click a slide to see its words highlighted in the lyrics.
- Download one `.txt` per song, named like `First Praise - sun-18-oct-26.txt`,
  ready for Notepad++ and ProPresenter's text import.

## Run it

```bash
npx npm@11 install
npm run dev
```

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New › Project**, import the repository and keep the
   detected settings (Vite, `npm run build`, output `dist`). `vercel.json` sets
   these too.
3. Deploy. Each push to `main` redeploys.

Or from the terminal: `npx vercel` for a preview, `npx vercel --prod` for production.

## Layout

```
src/
  core/        framework-free logic + tests (split, locate, import, file names)
  components/  React shell
  hooks/       state, media queries, dismiss
  services/    storage, clipboard, file import, downloads
scripts/
  artifact.mjs single-page build for the claude.ai artifact
```

See `CLAUDE.md` for the invariants and commit rules.
