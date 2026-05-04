import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#7c5af0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* left ring */}
          <rect x="5" y="11" width="8" height="6" rx="3" stroke="white" strokeWidth="2" fill="none" />
          {/* right ring */}
          <rect x="15" y="11" width="8" height="6" rx="3" stroke="white" strokeWidth="2" fill="none" />
          {/* overlap connector */}
          <line x1="13" y1="14" x2="15" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  )
}
