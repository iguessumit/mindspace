# Mindspace v3
Personal control-center app (Home, Tasks, Time, Wellbeing, Reports). Single-file HTML, data in localStorage (`mindspace.v3`).

- `index.html` – the built app. Open it in a browser or host it with GitHub Pages.
- `src/` – source: `p1.html` (CSS + markup), `p2–p9*.js` (logic). `p9a.js` is generated from `emb_tasks.html` and `emb_settings.html` by `build_emb.py`.
- `./build.sh` – rebuilds `index.html` from `src/`. After editing `emb_*.html` run `python3 src/build_emb.py` first.
