# CCMA Study App

A personal flashcard + spaced repetition study app for the Certified Clinical Medical Assistant exam. Runs entirely in the browser — no server, all progress stored in `localStorage`.

## Quick Start (local dev)

```bash
npm install
npm run dev        # starts at http://localhost:5173/ccma-study/
```

## Adding / Updating Study Cards

1. Paste your notes into `source-data.txt` in the project root (plain text, any messy format).
2. Run the parser:
   ```bash
   npm run parse
   # or: npx tsx scripts/parse.ts source-data.txt
   ```
3. Check the console output — it shows how many cards were parsed and category breakdown.
4. Restart or rebuild the app. The parser outputs to `src/data/cards.json`.

**Re-running the parser is safe** — your manual edits made in the Card Editor are stored as a localStorage overlay and are never overwritten by the parser.

### What the parser handles

| Line format | Result |
|---|---|
| `Term – definition` (em/en dash or hyphen) | `term` card |
| `Term: definition` (title-case key) | `term` card |
| Multi-line definitions (indented continuation) | merged into previous card |
| `NLMEB – Never let monkeys eat bananas` | `mnemonic` card |
| Anything else | `note` card |

Category is inferred automatically from keywords. Fix mis-categorized cards in the **Editor** tab.

## Study Modes

| Mode | What it does |
|---|---|
| **Flashcards** | Classic flip cards. Space=flip, arrows=navigate. Mark "Got It" / "Still Learning". |
| **Spaced Repetition** | SM-2 algorithm (same as Anki). Cards scheduled based on recall difficulty. Rate: Again / Hard / Good / Easy. |
| **Multiple Choice** | 4-option quiz, distractors pulled from same category for relevance. |
| **Typed Answer** | Type the term from the definition, fuzzy-matched (minor typos ok). |
| **Matching** | Tap pairs to match terms with definitions. |
| **Exam Sim** | 25-question timed mock exam (30 min), score report by category. |

### How Spaced Repetition Works (SM-2)

Each card tracks ease factor (EF), interval (days), and due date:

- **Again**: reset to 1 day, lower EF — card failed recall
- **Hard**: interval × 1.2, slightly lower EF
- **Good**: normal SM-2 progression (interval × EF after first two reps)
- **Easy**: interval × EF × 1.3 bonus, raise EF

EF starts at 2.5, minimum 1.3. The longer you consistently recall a card correctly, the longer it stays off your queue.

## Card Editor

Go to the **Editor** tab to fix mis-parsed cards, add new cards, or change categories. Changes are saved as a localStorage overlay on top of `cards.json` — re-running the parser never wipes them.

## Progress Backup

Dashboard → **Export Progress** saves all SR state, mastery, quiz history, and editor overlays to a JSON file. **Import Progress** restores it.

## GitHub Pages Deployment

### One-time setup

1. Push this repo to GitHub (repo name: `ccma-study`).
2. Go to **Settings → Pages → Source** → select **"GitHub Actions"**.
3. Every push to `main` auto-deploys.

Your app will be live at `https://<your-username>.github.io/ccma-study/`

> If your repo has a different name, update `base` in `vite.config.ts` to match.

### Manual deploy trigger

```bash
git add -A && git commit -m "update" && git push
```
