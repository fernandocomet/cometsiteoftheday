#!/usr/bin/env python3
"""Convierte data/raw-tweets.json (exportado con scripts/scrape-x.js) en data/sites.json.

Uso: python3 scripts/build_data.py

Las entradas que ya existen en sites.json conservan los cambios hechos a mano
(url, note, image, tags). Solo se añaden los tuits nuevos.
"""
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw-tweets.json"
OUT = ROOT / "data" / "sites.json"

TECH = {
    "Three.js": r"three\.?js",
    "GSAP": r"\bgsap\b",
    "Lenis": r"\blenis\b",
    "Webflow": r"webflow",
    "Lottie": r"lottie",
    "Barba.js": r"barba",
    "React": r"\breact\b",
    "Machine Learning": r"machine learning",
    "VR": r"\bvr\b",
}


def clean(text: str) -> str:
    text = re.sub(r"https?://\n", "", text)            # X parte las URLs: "https://\ndominio"
    text = re.sub(r"(\S)\n(\S+)\n…", r"\1\2", text)     # URLs largas partidas en dos líneas
    text = text.replace("…", "")
    return re.sub(r"\s+", " ", text).strip()


def to_site(r: dict) -> dict:
    note = clean(r["t"])
    url = r["l"][0].rstrip("…") if r.get("l") else None
    domain = urlparse(url).netloc.removeprefix("www.") if url else ""
    img = r.get("img")
    return {
        "id": r["u"].rsplit("/", 1)[1],
        "date": r["d"],
        "url": url,
        "domain": domain,
        "note": note,
        "tweet": r["u"],
        "image": img.replace("name=small", "name=medium") if img else None,
        "tags": [k for k, p in TECH.items() if re.search(p, note, re.I)],
    }


def main() -> None:
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    existing = {s["id"]: s for s in json.loads(OUT.read_text(encoding="utf-8"))} if OUT.exists() else {}
    added = 0
    for r in raw:
        s = to_site(r)
        if s["id"] not in existing:
            existing[s["id"]] = s
            added += 1
    sites = sorted(existing.values(), key=lambda s: s["date"], reverse=True)
    OUT.write_text(json.dumps(sites, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(sites)} webs en total ({added} nuevas)")


if __name__ == "__main__":
    main()
