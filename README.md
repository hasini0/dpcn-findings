# Research Mapping: findings site

Public findings site for DPCN assignment 2 (group 23: Hasini, Bhavya, Eshaan). It covers the research output of SN Bose, Bose Institute, SINP and NCBS from 2016 to 2026. The interactive dashboard lives at https://hasini0.github.io/dpcn_a2/.

Plain HTML, CSS and JS with no build server, so it works as-is on GitHub Pages.

- `index.html` and one page per section, generated from `src/*.html` by `python3 tools/build_pages.py`
- `data/findings.js`: the only data file (about 20 KB), generated from the dashboard's `metrics.json` by `python3 tools/build_data.py ../a2/out/metrics.json`
- Raw OpenAlex data and the network CSVs are not in this repo.

Run locally: `python3 -m http.server 8000` and open http://localhost:8000.
