export function AgentixMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <path
        d="M8 0h28v28L28 36H0V8L8 0Z"
        fill="#00D37E"
      />
      <path
        d="M11 9h4.2l2.8 4.6L20.8 9H25l-5.1 7.4L25 24h-4.3l-2.7-4.7L15.2 24H11l5.2-7.6L11 9Z"
        fill="#050505"
      />
    </svg>
  );
}

export function PixelMascot({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="20" y="4" width="8" height="16" fill="#00FF99" />
      <rect x="36" y="4" width="8" height="16" fill="#00FF99" />
      <rect x="16" y="16" width="32" height="28" fill="#00D37E" />
      <rect x="20" y="22" width="8" height="8" fill="#050505" />
      <rect x="36" y="22" width="8" height="8" fill="#050505" />
      <rect x="24" y="34" width="16" height="4" fill="#050505" />
      <rect x="12" y="28" width="6" height="10" fill="#00D37E" />
      <rect x="46" y="28" width="6" height="10" fill="#00D37E" />
      <rect x="18" y="44" width="10" height="14" fill="#00D37E" />
      <rect x="36" y="44" width="10" height="14" fill="#00D37E" />
    </svg>
  );
}
