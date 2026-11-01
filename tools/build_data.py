"""Build data/findings.js for the findings site from the dashboard's metrics.json.

Usage: python3 tools/build_data.py ../a2/out/metrics.json

Every number on the site comes from metrics.json, except the few pipeline counts
in PIPELINE, which are copied from DECISIONS.md / README.md of the a2 repo.
"""
import json
import sys
from pathlib import Path

INSTS = [  # (metrics key, short id, display name)
    ("SN Bose National Centre", "SNB", "SN Bose"),
    ("Bose Institute Kolkata", "BI", "Bose Institute"),
    ("SINP Kolkata", "SINP", "SINP"),
    ("NCBS Bangalore", "NCBS", "NCBS"),
]
KEY2ID = {k: i for k, i, _ in INSTS}

# Counts stated in DECISIONS.md / README.md (not stored in metrics.json).
PIPELINE = {
    "roster_names": 779,
    "merged_author_rows": 386,
    "duplicate_dois_merged": 31,
    "big_papers_rescued": 42,
    "quartile_estimated_pct": 34,
    "venues": 1899,
}


def pct(a, b, nd=1):
    return round(100 * a / b, nd) if b else 0


def by_scope(fn):
    """{'ALL': fn('ALL'), 'SNB': fn('SN Bose National Centre'), ...}"""
    out = {"ALL": fn("ALL")}
    for k, i, _ in INSTS:
        out[i] = fn(k)
    return out


def main(path):
    m = json.loads(Path(path).read_text())
    per, net, flow = m["per"], m["net"], m["flow"]
    lt10 = m["modes"]["lt10"]
    cmp_all = m["modes"]["all"]["compare"]
    cmp_lt10 = lt10["compare"]

    def lt10_papers(k):
        return lt10["per"][k]["papers"]

    big_share = by_scope(lambda k: pct(per[k]["papers"] - lt10_papers(k), per[k]["papers"]))
    never_cited = by_scope(lambda k: pct(net[k]["cit"]["indeg_hist"].get("0", 0), net[k]["cit"]["nodes"]))
    mncs = {KEY2ID[k]: v["mncs"] for k, v in cmp_all["inst"].items()}
    best_mncs = max(mncs, key=mncs.get)

    D = {
        "insts": [{"id": i, "key": k, "name": n} for k, i, n in INSTS],
        "years": [int(y) for y in per["ALL"]["trend"]],
        "pipeline": PIPELINE,
        "generated_from": m["generated_from"],
        "mega_threshold": m["mega_threshold"],
        "skipped_mega_papers": m["skipped_mega_papers"],
        # Headline stat for each section, per highlight scope.
        "headline": {
            "data": by_scope(lambda k: {"v": f'{per[k]["papers"]:,}',
                                        "c": "papers, every one matched by institution ID" if k == "ALL" else "papers matched by institution ID"}),
            "output": by_scope(lambda k: {"v": f'{per[k]["q1_fraction"]}%', "c": "of journal papers in Q1 journals"}),
            "faculty": by_scope(lambda k: {"v": f'{per[k]["faculty_view"]["share"]}%', "c": "of papers have a verified faculty author"}),
            "teams": by_scope(lambda k: {"v": f"{big_share[KEY2ID.get(k, 'ALL')]}%", "c": "of papers have 10 or more authors"}),
            "collaboration": by_scope(lambda k: {"v": f'{net[k]["auth"]["modularity"]}',
                                                 "c": f'modularity: authors fall into {net[k]["auth"]["communities"]} tight groups'}),
            "citations": by_scope(lambda k: {"v": f"{never_cited[KEY2ID.get(k, 'ALL')]}%",
                                             "c": "of papers never cited by another of our papers" if k == "ALL" else "of papers never cited by the same institute"}),
            "india": by_scope(lambda k: {"v": f'{flow["ratio"] if k == "ALL" else flow["per_inst"][k]["ratio"]}×',
                                         "c": "citations in from Indian institutes per citation out"}),
            "compare": by_scope(lambda k: {"v": f'{mncs[best_mncs] if k == "ALL" else cmp_all["inst"][k]["mncs"]}',
                                           "c": f"field-normalised impact, highest of four ({dict((i, n) for _, i, n in INSTS)[best_mncs]})" if k == "ALL" else "field-normalised citation impact (1.0 = average)"}),
            "explore": by_scope(lambda k: {"v": f'{per[k]["authors_all"]:,}', "c": "authors you can look up in the dashboard"}),
        },
        "output": {
            "trend": by_scope(lambda k: [per[k]["trend"][y] for y in per["ALL"]["trend"]]),
            "quartiles": by_scope(lambda k: per[k]["quartiles"]),
            "q1": by_scope(lambda k: per[k]["q1_fraction"]),
            "papers": by_scope(lambda k: per[k]["papers"]),
            "citations": by_scope(lambda k: per[k]["citations"]),
            "tiers": by_scope(lambda k: per[k]["tier_counts"]),
            "fields": per["ALL"]["fields"],
            "top_journals": per["ALL"]["top_journals"],
            "top_cited": [{k: p[k] for k in ("title", "journal", "year", "cites", "doi", "n_authors")}
                          for p in per["ALL"]["top_cited"][:5]],
        },
        "faculty": {
            "view": by_scope(lambda k: per[k]["faculty_view"]),
            "verified": by_scope(lambda k: per[k]["faculty_verified"]),
            "h_median": by_scope(lambda k: per[k]["h_median"]),
            "h_bins": per["ALL"]["h_bins"],
            "h_hist": per["ALL"]["h_hist"],
        },
        "teams": {
            "big_share": big_share,
            "rows": {KEY2ID[k]: {
                "median_team": cmp_all["inst"][k]["median_team"],
                "papers": [cmp_all["inst"][k]["papers"], cmp_lt10["inst"][k]["papers"]],
                "q1": [cmp_all["inst"][k]["q1"], cmp_lt10["inst"][k]["q1"]],
                "cpp": [cmp_all["inst"][k]["cites_per_paper"], cmp_lt10["inst"][k]["cites_per_paper"]],
                "mncs": [cmp_all["inst"][k]["mncs"], cmp_lt10["inst"][k]["mncs"]],
            } for k, _, _ in INSTS},
            "all_q1": [per["ALL"]["q1_fraction"], lt10["per"]["ALL"]["q1_fraction"]],
            "all_papers": [per["ALL"]["papers"], lt10["per"]["ALL"]["papers"]],
        },
        "collaboration": {
            "auth": by_scope(lambda k: {x: net[k]["auth"][x] for x in
                                        ("nodes", "edges", "isolated", "cross_inst_edges", "components",
                                         "giant_component", "communities", "modularity")}),
            "largest_communities": net["ALL"]["auth"]["largest_communities"],
            "deg_top": [{**r, "inst": KEY2ID[r["inst"]]} for r in net["ALL"]["auth"]["deg_top10"][:8]],
            "btw_top": [{**r, "inst": KEY2ID[r["inst"]]} for r in net["ALL"]["auth"]["btw_top10"][:8]],
            "facnet": by_scope(lambda k: {x: per[k]["facnet"][x] for x in
                                          ("nodes", "edges", "isolated", "giant", "components", "cross_inst", "communities")}),
            "shared": {KEY2ID[a]: {KEY2ID[b]: v for b, v in row.items()} for a, row in cmp_all["shared"].items()},
        },
        "citations": {
            "net": by_scope(lambda k: {x: net[k]["cit"][x] for x in ("nodes", "edges", "isolated")}),
            "never_cited": never_cited,
            "indeg_hist": [net["ALL"]["cit"]["indeg_hist"].get(str(i), 0) for i in range(11)],
            "flow_matrix": {KEY2ID[a]: {KEY2ID[b]: v for b, v in row.items()} for a, row in m["citnet"]["flow_matrix"].items()},
            "pagerank_all": [{"title": r["title"], "doi": r["doi"], "inst": KEY2ID[r["inst"]], "in": r["in"]}
                             for r in net["ALL"]["cit"]["pagerank_top10"][:5]],
            "pagerank_lt10": [{"title": r["title"], "doi": r["doi"], "inst": KEY2ID[r["inst"]], "in": r["in"]}
                              for r in lt10["net"]["ALL"]["cit"]["pagerank_top10"][:5]],
            "total_edges": m["generated_from"]["citation_edges"],
        },
        "india": {
            "flow": by_scope(lambda k: {x: (flow if k == "ALL" else flow["per_inst"][k])[x] for x in ("in", "out", "ratio")}),
            "year_in": flow["year_in"],
            "year_out": flow["year_out"],
            "in_top": flow["in_top10"],
            "out_top": flow["out_top10"],
            "partners": {KEY2ID[k]: v for k, v in m["partner_count"].items()},
            "partner_total": len({c["partner"] for c in m["connections"]}),
            "watch": flow["watch"],
            "top_partners": {i: [{x: c[x] for x in ("partner", "shared", "cites", "cluster")}
                                 for c in sorted((c for c in m["connections"] if c["inst"] == k),
                                                 key=lambda c: -c["shared"])[:5]] for k, i, _ in INSTS},
        },
        "compare": {
            "inst": {KEY2ID[k]: v for k, v in cmp_all["inst"].items()},
            "lt10": {KEY2ID[k]: v for k, v in cmp_lt10["inst"].items()},
            "topic_sim": {KEY2ID[a]: {KEY2ID[b]: v for b, v in row.items()} for a, row in cmp_all["topic_sim"].items()},
        },
        "explore": {"authors": by_scope(lambda k: per[k]["authors_all"])},
    }
    out = Path(__file__).resolve().parent.parent / "data" / "findings.js"
    out.write_text("// Generated by tools/build_data.py from metrics.json. Do not edit by hand.\n"
                   "window.FINDINGS = " + json.dumps(D, separators=(",", ":")) + ";\n")
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "../a2/out/metrics.json")
