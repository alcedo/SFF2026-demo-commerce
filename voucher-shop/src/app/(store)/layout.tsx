import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
