export function BrandMark({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="aqar-metal" x1="16" y1="12" x2="112" y2="118" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" />
          <stop offset=".24" stopColor="#85878a" />
          <stop offset=".5" stopColor="#e5e6e8" />
          <stop offset=".76" stopColor="#686a6e" />
          <stop offset="1" stopColor="#f5f5f6" />
        </linearGradient>
        <filter id="aqar-glow" x="0" y="0" width="128" height="128" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g stroke="url(#aqar-metal)" strokeLinecap="square" strokeLinejoin="miter" filter="url(#aqar-glow)">
        {/* Abstract skyline above the home roof */}
        <path d="M54 13 77 4v40H54V13Z" strokeWidth="3" />
        <path d="m34 28 13-7v23H34V28Z" strokeWidth="3" />
        <path d="m86 17 12 7v20H86V17Z" strokeWidth="3" />
        {/* Roof / A monogram */}
        <path d="m7 73 48-33 20 14 25-17 21 14" strokeWidth="5" />
        <path d="M13 74h20v39h34" strokeWidth="5" />
        {/* Open Q-shaped path */}
        <path d="M57 57h43c12 0 21 8 21 19s-9 19-21 19H79l34 30" strokeWidth="5" />
        {/* Window panes */}
        <path d="M50 76h9v9h-9zM64 76h9v9h-9zM50 90h9v9h-9zM64 90h9v9h-9z" strokeWidth="2.5" />
      </g>
    </svg>
  );
}