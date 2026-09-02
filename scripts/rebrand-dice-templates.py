#!/usr/bin/env python3
"""Replace BODA dice PDF headers with LIJIA logo; keep dice Edge/Margin legend."""

from __future__ import annotations

from pathlib import Path

import fitz  # pymupdf

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'public' / 'images' / 'dice-template'
LOGO = ROOT / 'public' / 'images' / 'logo-2.png'

META = {
    'd4-dice-template.pdf': ('D4 Dice Template', '18mm high'),
    'd6-dice-template.pdf': ('D6 Dice Template', '16mm high'),
    'd8-dice-template.pdf': ('D8 Dice Template', '17mm high'),
    'd10-dice-template.pdf': ('D10 Dice Template', '21mm high'),
    'd12-dice-template.pdf': ('D12 Dice Template', '18mm high'),
    'd20-dice-template.pdf': ('D20 Dice Template', '20mm high'),
}

HEADER_H = 74
LOGO_H = 48
LOGO_W = LOGO_H * (216 / 211)
LOGO_X = 16
LOGO_Y = 12
TITLE_GAP = 8
TITLE_SIZE = 16
SUBTITLE_SIZE = 13
LINE_GAP = 16

# Dice-template legend (not the generator 3-color GUIDE)
EDGE_RGB = (0.0, 0.0, 0.0)
MARGIN_RGB = (0.0, 170 / 255, 170 / 255)  # teal dashed
SWATCH_W = 36
DASH_ON = 4.5
DASH_OFF = 3.1


def draw_dashed(page: fitz.Page, x: float, y: float, rgb: tuple[float, float, float]) -> None:
    cur = x
    end = x + SWATCH_W
    while cur < end:
        seg = min(cur + DASH_ON, end)
        page.draw_line(
            fitz.Point(cur, y),
            fitz.Point(seg, y),
            color=rgb,
            width=1.4,
            overlay=True,
        )
        cur = seg + DASH_OFF


def rebrand(pdf_path: Path, title: str, subtitle: str) -> None:
    doc = fitz.open(pdf_path)
    page = doc[0]
    page_w = page.rect.width

    page.draw_rect(
        fitz.Rect(0, 0, page_w, HEADER_H),
        color=(1, 1, 1),
        fill=(1, 1, 1),
        width=0,
        overlay=True,
    )

    title_w = fitz.get_text_length(title, fontname='hebo', fontsize=TITLE_SIZE)
    sub_w = fitz.get_text_length(subtitle, fontname='helv', fontsize=SUBTITLE_SIZE)
    text_w = max(title_w, sub_w)
    text_h = LINE_GAP + 4
    block_w = LOGO_W + TITLE_GAP + text_w

    legend_w = 120
    max_center = page_w - legend_w - 12
    x0 = max(12.0, min((page_w - block_w) / 2, max_center - block_w))

    page.insert_image(
        fitz.Rect(x0, LOGO_Y, x0 + LOGO_W, LOGO_Y + LOGO_H),
        filename=str(LOGO),
        keep_proportion=True,
        overlay=True,
    )

    tx = x0 + LOGO_W + TITLE_GAP
    ty0 = LOGO_Y + (LOGO_H - text_h) / 2 + TITLE_SIZE - 2
    page.insert_text(
        (tx, ty0),
        title,
        fontname='hebo',
        fontsize=TITLE_SIZE,
        color=(0, 0, 0),
        overlay=True,
    )
    page.insert_text(
        (tx, ty0 + LINE_GAP),
        subtitle,
        fontname='helv',
        fontsize=SUBTITLE_SIZE,
        color=(0, 0, 0),
        overlay=True,
    )

    # Top-right: Edge lines + Margin lines (dice original legend)
    lx = page_w - legend_w
    ey = 28
    page.draw_line(
        fitz.Point(lx, ey),
        fitz.Point(lx + SWATCH_W, ey),
        color=EDGE_RGB,
        width=1.4,
        overlay=True,
    )
    page.insert_text(
        (lx + SWATCH_W + 8, ey + 3.5),
        'Edge lines',
        fontname='hebi',
        fontsize=11,
        color=(0, 0, 0),
        overlay=True,
    )

    my = 44
    draw_dashed(page, lx, my, MARGIN_RGB)
    page.insert_text(
        (lx + SWATCH_W + 8, my + 3.5),
        'Margin lines',
        fontname='hebi',
        fontsize=11,
        color=(0, 0, 0),
        overlay=True,
    )

    tmp = pdf_path.with_suffix('.pdf.tmp')
    doc.save(tmp, garbage=4, deflate=True)
    doc.close()
    tmp.replace(pdf_path)


def main() -> None:
    if not LOGO.exists():
        raise SystemExit(f'Missing logo: {LOGO}')
    for name, meta in META.items():
        path = BASE / name
        if not path.exists():
            raise SystemExit(f'Missing PDF: {path}')
        rebrand(path, *meta)
        print('updated', name)

    merged = fitz.open()
    for name in META:
        src = fitz.open(BASE / name)
        merged.insert_pdf(src)
        src.close()
    out = BASE / 'all-dice-templates.pdf'
    merged.save(out, garbage=4, deflate=True)
    print(f'merged {len(merged)} pages -> {out.name}')
    merged.close()


if __name__ == '__main__':
    main()
