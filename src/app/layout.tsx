import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BreachMind — AI Threat Emulation & Attack Flow Generator",
  description:
    "BreachMind uses AI to generate MITRE ATT&CK-aligned adversary emulation flows, complete with payloads and blue-team remediation guidance.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} cyber-grid-bg min-h-screen font-sans text-slate-200 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
