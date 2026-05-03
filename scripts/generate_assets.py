"""
PesaFi Asset Generator
Generates app icons, splash screen, and favicon.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

# Brand colors
BG_DARK = (6, 9, 15)         # #06090F
GREEN = (34, 197, 94)         # #22C55E
GREEN_DARK = (16, 185, 129)   # #10B981
GREEN_TEAL = (13, 148, 136)   # #0D9488
ORANGE = (249, 115, 22)       # #F97316
WHITE = (255, 255, 255)
CARD = (17, 26, 42)           # #111A2A


def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + 2*radius, y0 + 2*radius], fill=fill)
    draw.ellipse([x1 - 2*radius, y0, x1, y0 + 2*radius], fill=fill)
    draw.ellipse([x0, y1 - 2*radius, x0 + 2*radius, y1], fill=fill)
    draw.ellipse([x1 - 2*radius, y1 - 2*radius, x1, y1], fill=fill)


def draw_gradient_rect(img, x0, y0, x1, y1, color_top, color_bottom):
    """Draw a vertical gradient rectangle."""
    draw = ImageDraw.Draw(img)
    height = y1 - y0
    for i in range(height):
        t = i / height
        r = int(color_top[0] + (color_bottom[0] - color_top[0]) * t)
        g = int(color_top[1] + (color_bottom[1] - color_top[1]) * t)
        b = int(color_top[2] + (color_bottom[2] - color_top[2]) * t)
        draw.line([(x0, y0 + i), (x1, y0 + i)], fill=(r, g, b))


def make_icon(size, output_path, bg_color=BG_DARK, round_corners=False):
    """Generate the PesaFi app icon."""
    img = Image.new('RGB', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # Gradient background (top-left to bottom-right: green to teal)
    for i in range(size):
        t = i / size
        r = int(GREEN_DARK[0] + (GREEN_TEAL[0] - GREEN_DARK[0]) * t)
        g = int(GREEN_DARK[1] + (GREEN_TEAL[1] - GREEN_DARK[1]) * t)
        b = int(GREEN_DARK[2] + (GREEN_TEAL[2] - GREEN_DARK[2]) * t)
        draw.line([(0, i), (size, i)], fill=(r, g, b))

    # Subtle dark overlay at bottom
    overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    for i in range(size // 3):
        alpha = int(80 * i / (size // 3))
        ov_draw.line([(0, size - size // 3 + i), (size, size - size // 3 + i)],
                     fill=(0, 0, 0, alpha))
    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

    # "P" lettermark — bold, centered
    center = size // 2
    font_size = int(size * 0.52)

    # Try to load a system bold font, fall back to default
    font = None
    font_paths = [
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/SFNSDisplay.ttf',
        '/System/Library/Fonts/SFNSText.ttf',
        '/System/Library/Fonts/Arial Bold.ttf',
        '/Library/Fonts/Arial Bold.ttf',
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                continue

    letter = 'P'
    if font:
        bbox = draw.textbbox((0, 0), letter, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = center - tw // 2 - bbox[0]
        ty = center - th // 2 - bbox[1] - int(size * 0.02)
    else:
        font = ImageFont.load_default()
        tw, th = draw.textsize(letter, font=font)
        tx = center - tw // 2
        ty = center - th // 2

    # White letter with slight shadow
    shadow_offset = max(2, size // 150)
    draw.text((tx + shadow_offset, ty + shadow_offset), letter, fill=(0, 0, 0, 60), font=font)
    draw.text((tx, ty), letter, fill=WHITE, font=font)

    # Small orange underline accent
    line_w = int(size * 0.22)
    line_h = max(3, size // 90)
    lx = center - line_w // 2
    ly = center + th // 2 + int(size * 0.04)
    radius = line_h // 2
    draw_rounded_rect(draw, (lx, ly, lx + line_w, ly + line_h), radius, ORANGE)

    if round_corners:
        # Apply rounded corners mask (for favicon)
        mask = Image.new('L', (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        corner_r = size // 5
        mask_draw.rounded_rectangle([0, 0, size, size], radius=corner_r, fill=255)
        result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        result.paste(img, mask=mask)
        return result

    return img


def make_splash(width, height, output_path):
    """Generate the splash screen."""
    img = Image.new('RGB', (width, height), BG_DARK)
    draw = ImageDraw.Draw(img)

    center_x = width // 2
    center_y = height // 2

    # Subtle green glow behind the logo
    glow_r = min(width, height) // 3
    for i in range(glow_r, 0, -1):
        alpha = int(40 * (1 - i / glow_r) ** 2)
        color = (GREEN[0], GREEN[1], GREEN[2])
        draw.ellipse([
            center_x - i, center_y - i,
            center_x + i, center_y + i
        ], fill=(*color, alpha) if hasattr(img, 'mode') and img.mode == 'RGBA' else color)

    # Redo with RGBA for glow
    img = Image.new('RGBA', (width, height), (*BG_DARK, 255))
    draw = ImageDraw.Draw(img)

    for i in range(glow_r, 0, -1):
        t = 1 - i / glow_r
        alpha = int(55 * t * t)
        draw.ellipse([
            center_x - i, center_y - i,
            center_x + i, center_y + i
        ], fill=(*GREEN, alpha))

    img = img.convert('RGB')
    draw = ImageDraw.Draw(img)

    # Wordmark "PesaFi"
    font_size = int(width * 0.18)
    font = None
    font_paths = [
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/SFNSDisplay.ttf',
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    word = 'PesaFi'
    bbox = draw.textbbox((0, 0), word, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = center_x - tw // 2 - bbox[0]
    ty = center_y - th // 2 - bbox[1] - int(height * 0.02)

    draw.text((tx, ty), word, fill=GREEN, font=font)

    # Orange underline
    line_w = int(tw * 0.45)
    line_h = max(4, int(height * 0.004))
    lx = center_x - line_w // 2
    ly = ty + th + int(height * 0.015)
    draw_rounded_rect(draw, (lx, ly, lx + line_w, ly + line_h), line_h // 2, ORANGE)

    # Tagline
    tag_font_size = int(width * 0.042)
    tag_font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                tag_font = ImageFont.truetype(fp, tag_font_size)
                break
            except Exception:
                continue
    if tag_font is None:
        tag_font = ImageFont.load_default()

    tagline = 'USDC WALLET FOR AFRICA'
    tbbox = draw.textbbox((0, 0), tagline, font=tag_font)
    ttw = tbbox[2] - tbbox[0]
    tth = tbbox[3] - tbbox[1]
    ttx = center_x - ttw // 2
    tty = ly + line_h + int(height * 0.03)

    draw.text((ttx, tty), tagline, fill=(100, 116, 139), font=tag_font)  # mutedForeground

    img.save(output_path, 'PNG')
    print(f'  ✓ {output_path}  ({width}x{height})')


def make_adaptive_icon(size, output_path):
    """
    Android adaptive icon foreground — logo on transparent background.
    The safe zone is the inner 66% circle, so we center the logo tightly.
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = size // 2
    # Draw the gradient circle (safe zone ≈ 66%)
    safe_r = int(size * 0.33)
    for i in range(safe_r, 0, -1):
        t = 1 - i / safe_r
        r = int(GREEN_DARK[0] + (GREEN_TEAL[0] - GREEN_DARK[0]) * t)
        g_c = int(GREEN_DARK[1] + (GREEN_TEAL[1] - GREEN_DARK[1]) * t)
        b = int(GREEN_DARK[2] + (GREEN_TEAL[2] - GREEN_DARK[2]) * t)
        draw.ellipse([center - i, center - i, center + i, center + i],
                     fill=(r, g_c, b, 255))

    # "P" lettermark
    font_size = int(safe_r * 1.1)
    font = None
    for fp in ['/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/SFNSDisplay.ttf']:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    letter = 'P'
    bbox = draw.textbbox((0, 0), letter, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = center - tw // 2 - bbox[0]
    ty = center - th // 2 - bbox[1] - int(size * 0.01)
    draw.text((tx, ty), letter, fill=WHITE, font=font)

    # Orange accent line
    line_w = int(tw * 0.85)
    line_h = max(3, size // 100)
    lx = center - line_w // 2
    ly = ty + th + int(size * 0.02)
    draw_rounded_rect(draw, (lx, ly, lx + line_w, ly + line_h), line_h // 2, ORANGE)

    img.save(output_path, 'PNG')
    print(f'  ✓ {output_path}  ({size}x{size}, RGBA)')


# ── Generate all assets ──────────────────────────────────────────────────────

out_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'images')
os.makedirs(out_dir, exist_ok=True)

print('Generating PesaFi assets...')

# App icon (1024×1024)
icon = make_icon(1024, os.path.join(out_dir, 'icon.png'))
icon.save(os.path.join(out_dir, 'icon.png'), 'PNG')
print(f'  ✓ assets/images/icon.png  (1024×1024)')

# Android adaptive icon foreground (1024×1024, transparent bg)
make_adaptive_icon(1024, os.path.join(out_dir, 'adaptive-icon.png'))

# Splash screen (1284×2778 — iPhone 14 Pro Max native res, safe for all)
make_splash(1284, 2778, os.path.join(out_dir, 'splash.png'))

# Favicon (64×64, rounded corners for web)
fav = make_icon(64, os.path.join(out_dir, 'favicon.png'), round_corners=True)
fav.save(os.path.join(out_dir, 'favicon.png'), 'PNG')
print(f'  ✓ assets/images/favicon.png  (64×64)')

print('\nAll assets generated successfully.')
