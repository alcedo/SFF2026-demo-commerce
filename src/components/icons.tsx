export function GiftLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <path d="M8 0h28v28L28 36H0V8L8 0Z" fill="#00D37E" />
      <path
        d="M11 9h4.2l2.8 4.6L20.8 9H25l-5.1 7.4L25 24h-4.3l-2.7-4.7L15.2 24H11l5.2-7.6L11 9Z"
        fill="#050505"
      />
    </svg>
  );
}

export function IconBolt() {
  return (
    <span className="icon-well">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M13 2 4 14h7l-1 8 10-14h-7l0-6Z" />
      </svg>
    </span>
  );
}

export function IconClock() {
  return (
    <span className="icon-well">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </svg>
    </span>
  );
}

export function IconShield() {
  return (
    <span className="icon-well">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    </span>
  );
}

export function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-hi" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

export function IconBan() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-hi" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="m7 7 10 10" />
    </svg>
  );
}

export function IconLock() {
  return (
    <span className="icon-well h-14 w-14">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}

export function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function IconCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="m5 12 5 5 9-9" />
    </svg>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`spin-slow ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgba(0,211,126,0.25)" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="#00FF99" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="5" rx="1" />
      <rect x="13" y="10" width="8" height="11" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

export function IconTickets() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V8Z" />
    </svg>
  );
}

export function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.2-1.6l2-1.2-2-3.4-2.2 1A7 7 0 0 0 14 5.2V3h-4v2.2a7 7 0 0 0-2.6 1.6L5.2 5.8l-2 3.4 2 1.2A7 7 0 0 0 5 12c0 .5.1 1.1.2 1.6l-2 1.2 2 3.4 2.2-1A7 7 0 0 0 10 18.8V21h4v-2.2a7 7 0 0 0 2.6-1.6l2.2 1 2-3.4-2-1.2c.1-.5.2-1.1.2-1.6Z" />
    </svg>
  );
}

export function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" />
      <path d="m15 16 5-4-5-4M20 12H10" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-faint" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

export function IconEye({ off = false }: { off?: boolean }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.5-4.4M9.9 5.1A10 10 0 0 1 12 5c5 0 9 4 10 7-0.4 1.1-1.1 2.2-2.1 3.2M6.1 6.1C4.2 7.4 2.8 9.1 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
