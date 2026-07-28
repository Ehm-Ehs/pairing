import { ImageResponse } from 'next/og';
import Logo from '../src/assets/logo';

export const runtime = 'edge';
export const alt = 'PairForm - Random Group & Pair Generator';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer' }}>
          {/* User specifically requested this markup */}
          <Logo className="h-9 w-auto" />
        </div>
        <div style={{
          display: 'flex',
          fontSize: 48,
          fontWeight: 800,
          color: '#1e3a8a',
          marginTop: 40,
          textAlign: 'center',
          fontFamily: 'sans-serif'
        }}>
          Smart group formation for everyone
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
