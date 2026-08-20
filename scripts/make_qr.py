#!/usr/bin/env python3
"""สร้าง QR code ของสไลด์สุดท้าย (assets/img/qr-deck.svg)

รันเมื่อ URL ของเว็บเปลี่ยน เช่น ย้าย repo เข้า organization:

    pip3 install segno
    python3 scripts/make_qr.py                       # ใช้ URL ปัจจุบัน
    python3 scripts/make_qr.py https://ใหม่/#cover   # ระบุ URL เอง

สคริปต์จะตรวจว่า path ใน SVG ตรงกับ matrix ต้นฉบับทุกโมดูลก่อนเขียนไฟล์
ถ้าไม่ตรงจะไม่เขียน เพื่อไม่ให้ QR ที่สแกนไม่ได้หลุดขึ้นสไลด์
"""

from __future__ import annotations

import io
import re
import sys
from pathlib import Path

try:
    import segno
except ImportError:
    raise SystemExit("ต้องติดตั้ง segno ก่อน:  pip3 install segno")

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "assets" / "img" / "qr-deck.svg"
DEFAULT_URL = "https://suphakornp.github.io/ap-claude-training-deck/#cover"

BORDER = 4  # quiet zone ตามสเปก QR — น้อยกว่านี้กล้องมือถือจับขอบไม่เจอ
INK = "#131317"  # AP ink


def build_svg(url: str) -> tuple[str, "segno.QRCode"]:
    # error correction H ทนการบดบังได้ราว 30% เหมาะกับสแกนจากที่นั่งในห้องอบรม
    qr = segno.make(url, error="h")
    # ต้องใช้ save() ไม่ใช่ svg_inline() เพราะ svg_inline ตัด xmlns ออก
    # แล้ว SVG ที่โหลดผ่าน <img src="..."> จะไม่ render
    buf = io.BytesIO()
    qr.save(
        buf,
        kind="svg",
        scale=10,
        border=BORDER,
        dark=INK,
        light="#ffffff",
        svgclass=None,
        lineclass=None,
        omitsize=True,  # ให้ CSS คุมขนาดผ่าน viewBox
    )
    return buf.getvalue().decode("utf-8"), qr


def decode_svg_matrix(svg: str, modules: int) -> list[list[int]]:
    """อ่าน path ของโมดูลสีเข้มใน SVG กลับมาเป็น matrix เพื่อตรวจความถูกต้อง"""
    match = re.search(rf'<path[^>]*stroke="{INK}"[^>]*d="([^"]+)"', svg)
    if not match:
        raise SystemExit("ไม่พบ path โมดูลใน SVG ที่สร้างขึ้น")

    size = modules + 2 * BORDER
    grid = [[0] * size for _ in range(size)]
    x = y = 0.0
    for token in re.finditer(r"([Mmh])\s*(-?[\d.]+)(?:[ ,](-?[\d.]+))?", match.group(1)):
        cmd, first, second = token.group(1), float(token.group(2)), token.group(3)
        if cmd == "M":
            x, y = first, float(second)
        elif cmd == "m":
            x += first
            y += float(second)
        else:  # h — เส้นแนวนอนหนึ่งแถวของโมดูลสีเข้ม
            run = int(first)
            row = int(y - 0.5)
            for i in range(run):
                grid[row][int(x) + i] = 1
            x += run
    return grid


def verify(svg: str, qr: "segno.QRCode") -> None:
    modules = qr.symbol_size(border=0)[0]
    grid = decode_svg_matrix(svg, modules)
    reference = [list(row) for row in qr.matrix]

    mismatch = sum(
        grid[r + BORDER][c + BORDER] != reference[r][c]
        for r in range(modules)
        for c in range(modules)
    )
    size = modules + 2 * BORDER
    quiet_zone_dirty = sum(
        grid[r][c]
        for r in range(size)
        for c in range(size)
        if r < BORDER or r >= size - BORDER or c < BORDER or c >= size - BORDER
    )

    if "xmlns" not in svg:
        raise SystemExit("SVG ไม่มี xmlns — โหลดผ่าน <img> จะไม่ render, ไม่เขียนไฟล์")

    if mismatch or quiet_zone_dirty:
        raise SystemExit(
            f"QR ที่สร้างไม่ตรงกับต้นฉบับ (โมดูลต่าง {mismatch}, quiet zone สกปรก "
            f"{quiet_zone_dirty}) — ไม่เขียนไฟล์"
        )
    print(f"  ตรวจแล้ว: {modules}x{modules} modules, error correction {qr.error.upper()}, quiet zone สะอาด")


def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    print(f"URL: {url}")
    svg, qr = build_svg(url)
    verify(svg, qr)
    TARGET.write_text(svg, encoding="utf-8")
    print(f"wrote {TARGET.relative_to(ROOT)} ({TARGET.stat().st_size} bytes)")
    print("อย่าลืมแก้ค่า url ในสไลด์ get-the-deck ที่ content/deck.json ให้ตรงกัน แล้วรัน build_deck_data.py")


if __name__ == "__main__":
    main()
