# Memory Pair Game for Kids 🦊

A self-challenge memory matching game for young children learning English.
Cards hide a letter, number, or animal — flip two, find the pairs, and finish
in as few turns as you can. Kid-friendly on purpose: big cards, a talking
fox mascot, spoken letters with example words ("c for cat!"), star ratings,
and confetti wins.

## How to run

No build step, no dependencies. Any static file server works:

```powershell
# from this folder
python -m http.server 8123
# then open http://127.0.0.1:8123/index.html
```

Double-clicking `index.html` also works, but some browsers restrict
speech/image loading on `file://` URLs — the local server above is
recommended.

## How to play

1. On the start screen pick a card set (`a–z`, `A–Z`, `0–9`, `1–20`,
   `1–100`, animals) and the number of pairs (2–18, default 6).
2. Press **New Game**. Cards deal onto the board (with an optional
   memorise peek first).
3. Click a card — it flips and says its name. Click a second card:
   - **Match** → +1 mark, the pair stays face-up with praise.
   - **No match** → both hide again. Remember them!
4. Finish all pairs to see your turns, star rating, and best score.
   Best scores are kept per card-set × pairs.

## Settings (saved automatically)

Open **⚙️ Settings** on the start screen or during a game. Everything is
stored in `localStorage`, so next visit keeps your choices:

| Setting      | Options                                            |
|--------------|----------------------------------------------------|
| Cards from   | a–z · A–Z · 0–9 · 1–20 · 1–100 · animals           |
| Pairs        | 2–18 (clamped to what the card set allows)         |
| Talking voice (TTS) | on / off                                    |
| Sound effects | on / off                                          |
| Peek at start | 0–30 seconds preview, 0 = no peek                 |

Effective pairs are `min(requested, card-set size, 18)`. E.g. `0–9`
only has 10 symbols, so asking for 12 pairs plays 10 and says so.

## Project structure

```
pairgame/
  index.html        start screen, game HUD, settings/how-to/win dialogs
  css/style.css     kid theme, 3D card flip, animations, self-hosted fonts
  js/config.js      limits, card sets, letter→word table, grid table
  js/settings.js    localStorage persistence (pairgame.settings.v1)
  js/deck.js        sampling, pairing, shuffling, speech text per card
  js/game.js        screens, board layout/fit, turns/marks, win logic
  js/anim.js        confetti + mascot reactions
  js/audio.js       WebAudio sound effects (no audio files)
  js/tts.js         text-to-speech with local + Google engines
  assets/pic/       123 word cartoons (Twemoji + 6 hand-drawn SVGs)
  assets/fonts/     self-hosted woff2 fonts + their license files
```

Notable details:

- **Board auto-fit** — at game start the grid (columns × rows) giving the
  biggest cards for the current window is chosen; resizing mid-game only
  resizes cards, never moves them.
- **Letters use a handwriting font** (Coming Soon, same as the keygame
  project), except lowercase `q` and uppercase `J`, which fall back to
  Comic Neue — those two shapes don't match taught handwriting.
- **Speech never reads emoji** — display text may contain emoji, but the
  voice layer strips pictographs and speaks plain sentences.

## Assets & licenses

- Word cartoons: [Twemoji](https://twemoji.twitter.com/) by Twitter,
  Inc., licensed CC-BY 4.0 (credit also shown on the start screen).
  Six pictures with no emoji equivalent (garden, jam, zoo, xylophone,
  yogurt, jump) are original drawings in this repo.
- Coming Soon font: Apache License 2.0
  (`assets/fonts/LICENSE-coming-soon.txt`).
- Comic Neue font: SIL Open Font License 1.1
  (`assets/fonts/LICENSE-comic-neue.txt`).
- Game code: same folder, free to use and adapt for learning.

## Offline limitations

The game is packaged to run **fully offline** — pictures, fonts, sounds,
and logic are all local files. Two things still touch the network:

1. **Talking voice fallback.** Speech first uses the device's built-in
   voice engine (Windows, macOS, Android, and iOS all ship one), which
   works offline. Only if a device has *no* working local voice does the
   game fall back to Google's speech service, which needs internet —
   without it, the game stays silent but remains fully playable
   (verified: with all Google traffic blocked, gameplay, pictures, fonts,
   and sound effects all work).
2. **First-visit font/asset caching.** Everything is same-origin static
   files, so any browser cache or service-worker setup works out of the
   box; there is no runtime CDN, analytics, or tracking of any kind.

## Browser support

Any recent Chrome, Edge, Firefox, or Safari. Sound effects need a user
gesture first (browser autoplay policy) — the New Game button counts.
