import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'Merc — home goods, bags and everyday essentials';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const font = await readFile(
    join(process.cwd(), 'node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff'),
  );

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '64px 72px',
        backgroundColor: '#213f32',
        color: '#f7f5eb',
        fontFamily: 'DM Sans',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 36, letterSpacing: -2 }}>merc.</span>
        <span style={{ fontSize: 19, letterSpacing: 2 }}>ADDIS ABABA · ETB</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 960 }}>
        <span style={{ fontSize: 74, lineHeight: 1.08, letterSpacing: -4 }}>
          Home goods, bags & everyday essentials.
        </span>
        <span style={{ fontSize: 25, marginTop: 28, color: '#c9d9cd' }}>
          Shop Merc · Prices in Ethiopian birr
        </span>
      </div>
      <div style={{ height: 2, width: '100%', backgroundColor: '#9fbaa6' }} />
    </div>,
    { ...size, fonts: [{ name: 'DM Sans', data: font, weight: 700, style: 'normal' }] },
  );
}
