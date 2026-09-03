import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Severity } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function severityColor(severity: Severity): {
  text: string;
  bg: string;
  border: string;
  glow: string;
  dot: string;
} {
  switch (severity) {
    case "Critical":
      return {
        text: "text-[#ff5c85]",
        bg: "bg-[#ff3366]/10",
        border: "border-[#ff3366]/50",
        glow: "shadow-neon-critical",
        dot: "bg-[#ff3366]",
      };
    case "High":
      return {
        text: "text-[#ffab5e]",
        bg: "bg-[#ff9d3d]/10",
        border: "border-[#ff9d3d]/50",
        glow: "shadow-neon-high",
        dot: "bg-[#ff9d3d]",
      };
    case "Medium":
      return {
        text: "text-[#ffe27a]",
        bg: "bg-[#ffd23f]/10",
        border: "border-[#ffd23f]/50",
        glow: "shadow-neon-medium",
        dot: "bg-[#ffd23f]",
      };
    default:
      return {
        text: "text-[#7bf1a8]",
        bg: "bg-[#4ade80]/10",
        border: "border-[#4ade80]/50",
        glow: "",
        dot: "bg-[#4ade80]",
      };
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
