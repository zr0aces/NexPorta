#!/usr/bin/env python3
"""
NexPorta Brand Asset Generator
Extracts logo from nexporta.png:
- Sets door and related elements (door leaf, lintel/canopy, handle, right post, speed lines) to 100% pure neutral white (#FFFFFF) with zero color bleeding
- Preserves the authentic rich orange gradient on the outer shield extracted directly from nexporta.png with multi-pass edge dilation
- Generates all required raster (PNG, ICO) and vector (SVG) brand assets
- Synchronizes deliverables across dashboard/ and frontend/public/ directories
"""

import os
import io
import base64
import numpy as np
from PIL import Image

WORKSPACE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DASHBOARD_DIR = os.path.join(WORKSPACE_DIR, "dashboard")
FRONTEND_PUBLIC_DIR = os.path.join(WORKSPACE_DIR, "frontend", "public")

SRC_IMG = os.path.join(DASHBOARD_DIR, "nexporta.png")
if not os.path.exists(SRC_IMG) and os.path.exists(os.path.join(FRONTEND_PUBLIC_DIR, "nexporta.png")):
    SRC_IMG = os.path.join(FRONTEND_PUBLIC_DIR, "nexporta.png")

BRAND_DARK = (15, 23, 42, 255)
BRAND_WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def extract_and_recolor():
    if not os.path.exists(SRC_IMG):
        raise FileNotFoundError(f"Source image not found: {SRC_IMG}")

    im = Image.open(SRC_IMG)
    arr = np.array(im, dtype=np.float32)

    # 1. Clean background noise & compute alpha channel with anti-aliased threshold
    noise_floor = 6.0
    clean_arr = np.maximum(0.0, arr - noise_floor)
    max_channel = clean_arr.max(axis=2)
    alpha = np.clip(max_channel / (255.0 - noise_floor), 0.0, 1.0)
    alpha = np.where(alpha < 0.02, 0.0, alpha)

    # 2. Exact component definition (Pixel-perfect separation):
    is_white_mask = np.zeros((251, 251), dtype=bool)

    # Center door structure (x in 99..170, y in 90..208):
    is_white_mask[90:209, 99:171] = True

    # Speed lines (x <= 87, y in 122..136, 145..159, 168..182):
    is_white_mask[122:136, :88] = True
    is_white_mask[145:159, :88] = True
    is_white_mask[168:182, :88] = True

    shield_active = (~is_white_mask) & (alpha > 0.02)

    # 3. Unpremultiply exact shield RGB from original image where alpha >= 0.25
    rgb_shield = np.zeros_like(clean_arr)
    mask_high_a = shield_active & (alpha >= 0.25)
    for c in range(3):
        rgb_shield[mask_high_a, c] = np.clip(clean_arr[mask_high_a, c] / alpha[mask_high_a], 0.0, 255.0)

    # Multi-pass color dilation for shield edge antialiasing (avoids dark/white fringes)
    known = mask_high_a.copy()
    for _ in range(8):
        new_known = known.copy()
        pad_known = np.pad(known, 1, mode='constant', constant_values=False)
        pad_rgb = np.pad(rgb_shield, ((1, 1), (1, 1), (0, 0)), mode='edge')
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
            shifted_known = pad_known[1 + dr : 1 + dr + 251, 1 + dc : 1 + dc + 251]
            shifted_rgb = pad_rgb[1 + dr : 1 + dr + 251, 1 + dc : 1 + dc + 251, :]
            fill_mask = (~known) & (~is_white_mask) & shifted_known
            if np.any(fill_mask):
                rgb_shield[fill_mask] = shifted_rgb[fill_mask]
                new_known = new_known | fill_mask
        known = new_known

    # 4. White zone: set all white element pixels to pure white (#FFFFFF)
    rgb_final = rgb_shield.copy()
    rgb_final[is_white_mask] = [255.0, 255.0, 255.0]

    # 5. Build full RGBA image
    rgba = np.zeros((251, 251, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.round(rgb_final).astype(np.uint8)
    rgba[:, :, 3] = np.round(alpha * 255.0).astype(np.uint8)

    extracted_img = Image.fromarray(rgba, 'RGBA')

    # 6. Fit cleanly into 512x512 square canvas with optical padding
    content_box = (12, 33, 229, 242)
    cropped = extracted_img.crop(content_box)
    w, h = cropped.size

    target_size = 512
    padding = 40
    avail = target_size - 2 * padding
    scale = min(avail / w, avail / h)
    new_w, new_h = int(w * scale), int(h * scale)
    scaled = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    icon_512 = Image.new('RGBA', (target_size, target_size), TRANSPARENT)
    offset_x = (target_size - new_w) // 2
    offset_y = (target_size - new_h) // 2
    icon_512.paste(scaled, (offset_x, offset_y), scaled)

    # 7. Create Monochrome Variants
    alpha_mask = np.array(icon_512)[:, :, 3]

    # Monochrome Black (#0F172A)
    mono_black = Image.new('RGBA', (target_size, target_size), BRAND_DARK)
    mono_black_canvas = Image.new('RGBA', (target_size, target_size), TRANSPARENT)
    mono_black_canvas.paste(mono_black, (0, 0), Image.fromarray(alpha_mask, 'L'))

    # Monochrome White (#FFFFFF)
    mono_white = Image.new('RGBA', (target_size, target_size), BRAND_WHITE)
    mono_white_canvas = Image.new('RGBA', (target_size, target_size), TRANSPARENT)
    mono_white_canvas.paste(mono_white, (0, 0), Image.fromarray(alpha_mask, 'L'))

    return icon_512, mono_black_canvas, mono_white_canvas


def generate_svg(png_512, output_path):
    """Generate clean SVG embedding high-res raster data URL."""
    buffered = io.BytesIO()
    png_512.save(buffered, format="PNG", optimize=True)
    img_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,{img_b64}"/>
</svg>
'''
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)


def save_assets_to_dir(target_dir, icon_512, mono_black, mono_white):
    os.makedirs(target_dir, exist_ok=True)
    sizes = [16, 32, 48, 96, 180, 192, 512]
    png_icons = {s: icon_512.resize((s, s), Image.Resampling.LANCZOS) for s in sizes}

    # Save PNG deliverables
    png_icons[16].save(os.path.join(target_dir, "favicon-16x16.png"), "PNG", optimize=True)
    png_icons[32].save(os.path.join(target_dir, "favicon-32x32.png"), "PNG", optimize=True)
    png_icons[96].save(os.path.join(target_dir, "favicon-96x96.png"), "PNG", optimize=True)
    png_icons[180].save(os.path.join(target_dir, "apple-touch-icon.png"), "PNG", optimize=True)
    png_icons[192].save(os.path.join(target_dir, "web-app-manifest-192x192.png"), "PNG", optimize=True)
    png_icons[512].save(os.path.join(target_dir, "web-app-manifest-512x512.png"), "PNG", optimize=True)
    png_icons[512].save(os.path.join(target_dir, "favicon.png"), "PNG", optimize=True)
    png_icons[512].save(os.path.join(target_dir, "logo.png"), "PNG", optimize=True)

    # Multi-resolution ICO (16, 32, 48)
    ico_16 = png_icons[16]
    ico_32 = png_icons[32]
    ico_48 = png_icons[48]
    ico_16.save(
        os.path.join(target_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[ico_32, ico_48]
    )

    # Monochrome variants
    mono_black.save(os.path.join(target_dir, "logo-monochrome-black.png"), "PNG", optimize=True)
    mono_white.save(os.path.join(target_dir, "logo-monochrome-white.png"), "PNG", optimize=True)

    # SVG exports
    generate_svg(icon_512, os.path.join(target_dir, "favicon.svg"))
    generate_svg(icon_512, os.path.join(target_dir, "logo.svg"))
    generate_svg(mono_black, os.path.join(target_dir, "logo-monochrome-black.svg"))
    generate_svg(mono_white, os.path.join(target_dir, "logo-monochrome-white.svg"))


def main():
    print("Extracting logo with authentic shield gradient and pure white door elements...")
    icon_512, mono_black, mono_white = extract_and_recolor()

    print(f"Saving assets to {DASHBOARD_DIR}...")
    save_assets_to_dir(DASHBOARD_DIR, icon_512, mono_black, mono_white)

    print(f"Syncing assets to {FRONTEND_PUBLIC_DIR}...")
    save_assets_to_dir(FRONTEND_PUBLIC_DIR, icon_512, mono_black, mono_white)
    if os.path.exists(SRC_IMG):
        with open(SRC_IMG, 'rb') as f_in:
            with open(os.path.join(FRONTEND_PUBLIC_DIR, "nexporta.png"), 'wb') as f_out:
                f_out.write(f_in.read())

    print("All NexPorta brand assets generated and applied successfully!")


if __name__ == "__main__":
    main()
