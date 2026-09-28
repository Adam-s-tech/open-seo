import { ExternalLink } from "lucide-react";
import { safeHttpUrl } from "@/shared/safe-url";

export function formatUrlForDisplay(value: string): string {
  try {
    const url = new URL(value);
    const hash = url.hash.startsWith("#:~:") ? "" : url.hash;
    const cleaned = `${url.protocol}//${url.host}${url.pathname}${url.search}${hash}`;
    try {
      return decodeURI(cleaned);
    } catch {
      return cleaned;
    }
  } catch {
    return value;
  }
}

export function resolveUrlHref(
  value: string | null | undefined,
  baseDomain?: string,
): string | null {
  if (!value) return null;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    return safeHttpUrl(value);
  }
  if (!baseDomain) return null;
  return safeHttpUrl(
    `https://${baseDomain}${value.startsWith("/") ? value : `/${value}`}`,
  );
}

export function ExternalUrlCell({
  value,
  label,
  baseDomain,
  className = "link link-primary inline-flex items-center gap-1",
}: {
  value: string | null | undefined;
  label: string;
  baseDomain?: string;
  className?: string;
}) {
  const href = resolveUrlHref(value, baseDomain);
  if (!value || !href) {
    return <span className="text-base-content/40">-</span>;
  }

  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      <span className="truncate">{label}</span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}
