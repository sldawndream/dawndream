# DawnDream Website

A gothic vampire RPG website for Second Life built with Next.js.

---

## How to update your lore

Open the file: `lib/lore.js`

This file contains ALL your lore content. You can:
- Edit the `title`, `subtitle`, and `intro` at the top
- Add new timeline entries to the `entries` array
- Add new eras to the `eras` array

Each entry looks like this:

```js
{
  id: "unique-id",           // No spaces, use dashes
  era: "Era Name",           // Displays above the year
  eraId: "era-id",          // Links to sidebar
  year: "Year 000 — Event", // The year label
  tag: "Tag Name",          // Small label pill
  tagStyle: "origin",       // origin | war | betrayal | rise
  major: true,              // true = bigger dot on timeline
  title: "Entry Title",
  body: [
    "First paragraph text.",
    "Second paragraph text.",
  ],
  quote: {                  // Optional - remove if not needed
    text: "The quote text.",
    author: "Who said it",
  },
  figures: [                // Optional - remove if not needed
    { name: "Name", role: "Role", desc: "Description." },
  ],
},
```

---

## How to run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

---

## How to deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to vercel.com and import the repository
3. Click Deploy — it's live!

Every time you push changes to GitHub, Vercel automatically updates the live site.
