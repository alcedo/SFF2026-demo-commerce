export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: "text-green-hi border-green/40 bg-[rgba(0,255,153,0.08)]",
    reserved: "text-paper border-line bg-glass-hi",
    sold: "text-green border-line bg-glass-hi",
    used: "text-danger border-[rgba(255,107,122,0.35)] bg-[rgba(255,107,122,0.08)]",
    expired: "text-warning border-[rgba(245,193,92,0.35)] bg-[rgba(245,193,92,0.08)]",
  };
  return (
    <span className={`tag capitalize tracking-[0.12em] ${map[status] ?? "text-muted"}`}>
      {status}
    </span>
  );
}
