"use client";

import { useState } from "react";
import { IconCopy } from "./icons";

export function CopyButton({
  value,
  label,
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-2 text-green-hi hover:text-paper ${className}`}
      aria-label={label ?? "Copy"}
    >
      {label ? <span>{copied ? "Copied" : label}</span> : null}
      <IconCopy />
    </button>
  );
}
