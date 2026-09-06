"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "@/components/icons";
import { VoucherCard } from "@/components/voucher-card";
import { CATEGORIES } from "@/lib/catalog";
import type { PublicProduct } from "@/lib/order-view";

export function VoucherGrid({ products }: { products: PublicProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        needle.length === 0 ||
        product.name.toLowerCase().includes(needle) ||
        product.brand.toLowerCase().includes(needle);
      const matchesCategory =
        category === "All Categories" || product.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <IconSearch />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vouchers..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          <option>All Categories</option>
          {CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <VoucherCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
