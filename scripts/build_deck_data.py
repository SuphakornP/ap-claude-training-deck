#!/usr/bin/env python3
"""Build data/deck-data.js from the editable source in content/deck.json.

แก้เนื้อหาที่ content/deck.json แล้วรัน:
    python3 scripts/build_deck_data.py

สคริปต์จะตรวจความครบถ้วนของข้อมูลก่อน แล้วเขียน data/deck-data.js ที่ index.html โหลดตรงๆ
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "content" / "deck.json"
TARGET = ROOT / "data" / "deck-data.js"

TRACK_ORDER = ["construction", "marketing", "finance", "hr", "audit", "risk"]

REQUIRED_TRACK_FIELDS = (
    "id",
    "label",
    "kicker",
    "kickerShort",
    "titleTh",
    "headcount",
    "roles",
    "useCases",
    "prompts",
    "quickGuide",
    "caution",
)


def fail(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    raise SystemExit(1)


def validate(deck: dict) -> None:
    for key in ("meta", "tracks", "slides"):
        if key not in deck:
            fail(f"ขาด key '{key}' ใน {SOURCE.name}")

    ids = [t["id"] for t in deck["tracks"]]
    if ids != TRACK_ORDER:
        fail(f"ลำดับ track ต้องเป็น {TRACK_ORDER} แต่พบ {ids}")

    for track in deck["tracks"]:
        missing = [f for f in REQUIRED_TRACK_FIELDS if f not in track]
        if missing:
            fail(f"track '{track.get('id')}' ขาดฟิลด์ {missing}")
        if len(track["useCases"]) != 3:
            fail(f"track '{track['id']}' ต้องมี use case 3 รายการ พบ {len(track['useCases'])}")
        if len(track["quickGuide"]) != 4:
            fail(f"track '{track['id']}' ต้องมีคู่มือ 4 ขั้น พบ {len(track['quickGuide'])}")
        if not 4 <= len(track["prompts"]) <= 6:
            fail(f"track '{track['id']}' ต้องมี prompt 4-6 ชุด พบ {len(track['prompts'])}")
        for prompt in track["prompts"]:
            if "[" not in prompt["body"]:
                fail(f"prompt '{prompt['label']}' ({track['id']}) ไม่มี [ตัวแปร] ให้ผู้ใช้เติม")

    slide_ids = [s.get("id") for s in deck["slides"]]
    if len(slide_ids) != len(set(slide_ids)):
        fail("slide id ซ้ำกัน")

    track_slides = [s["trackId"] for s in deck["slides"] if s.get("trackId")]
    if track_slides != TRACK_ORDER:
        fail(f"สไลด์สายงานต้องครบและเรียงตาม {TRACK_ORDER} แต่พบ {track_slides}")

    for slide in deck["slides"]:
        for key in ("type", "id", "chapter"):
            if key not in slide:
                fail(f"สไลด์ {slide.get('id', '?')} ขาด key '{key}'")


def main() -> None:
    if not SOURCE.exists():
        fail(f"ไม่พบไฟล์ {SOURCE}")

    deck = json.loads(SOURCE.read_text(encoding="utf-8"))
    validate(deck)

    payload = json.dumps(deck, ensure_ascii=False, indent=2)
    banner = (
        "/* ไฟล์นี้ถูกสร้างอัตโนมัติ — ห้ามแก้ตรงนี้\n"
        "   แก้เนื้อหาที่ content/deck.json แล้วรัน python3 scripts/build_deck_data.py */\n"
    )
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(f"{banner}window.AP_CLAUDE_DECK = {payload};\n", encoding="utf-8")

    prompts = sum(len(t["prompts"]) for t in deck["tracks"])
    cases = sum(len(t["useCases"]) for t in deck["tracks"])
    print(f"wrote {TARGET.relative_to(ROOT)}")
    print(f"  {len(deck['slides'])} สไลด์ · {len(deck['tracks'])} สายงาน · {cases} use case · {prompts} prompt")


if __name__ == "__main__":
    main()
