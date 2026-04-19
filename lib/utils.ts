import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function countryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    IN: "🇮🇳",
    DE: "🇩🇪",
    BR: "🇧🇷",
    PH: "🇵🇭",
    NG: "🇳🇬",
    GB: "🇬🇧",
    CA: "🇨🇦",
    AU: "🇦🇺",
    SG: "🇸🇬",
  };
  return flags[countryCode.toUpperCase()] ?? "🌐";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
