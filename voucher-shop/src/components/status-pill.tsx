export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: "bg-emerald-50 text-success",
    reserved: "bg-blue-50 text-brand",
    sold: "bg-blue-50 text-brand",
    used: "bg-red-50 text-danger",
    expired: "bg-orange-50 text-warning",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status] ?? "bg-slate-100"}`}
    >
      {status}
    </span>
  );
}
