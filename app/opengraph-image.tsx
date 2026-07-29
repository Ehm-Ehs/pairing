import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PairForm - Smart automated balancing. Fair groups. Zero chaos.';
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
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0284C7 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="18" r="3" />
              <path d="M12 9v3m-3 2l-2 2m7-2l2 2" />
            </svg>
          </div>
          <span style={{ fontSize: '64px', fontWeight: '900', letterSpacing: '-1.5px', color: '#FFFFFF' }}>
            PairForm
          </span>
        </div>

        <div
          style={{
            fontSize: '42px',
            fontWeight: '800',
            color: '#F8FAFC',
            textAlign: 'center',
            maxWidth: '950px',
            lineHeight: 1.25,
            marginBottom: '20px',
          }}
        >
          Smart automated balancing. Fair groups. Zero chaos.
        </div>

        <div
          style={{
            fontSize: '22px',
            fontWeight: '500',
            color: '#93C5FD',
            textAlign: 'center',
            maxWidth: '850px',
            lineHeight: 1.5,
          }}
        >
          Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
