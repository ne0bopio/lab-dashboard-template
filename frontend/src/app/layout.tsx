import type { Metadata } from "next";
import "./globals.css";
import { TopNav }   from "@/components/layout/TopNav";
import { LeftRail } from "@/components/layout/LeftRail";
import { StatusBar } from "@/components/layout/StatusBar";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: "THE LAB | Dashboard",
  description: "Lab Dashboard — AI Agent Control Room",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23080b0f'/><text x='50%25' y='55%25' dominant-baseline='central' text-anchor='middle' font-size='20'>⚡</text></svg>" },
  other: { "theme-color": "#080b0f" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* CRT scanline */}
        <div className="scanline-overlay" aria-hidden="true" />

        {/* Hex grid bg */}
        <div className="fixed inset-0 pointer-events-none hex-grid hidden lg:block" style={{ zIndex: 0, opacity: 0.15 }} aria-hidden="true" />

        {/* Ambient glow orbs — desktop only */}
        <div className="fixed pointer-events-none hidden lg:block" style={{ width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,179,71,0.04) 0%, transparent 70%)", top: -200, right: -200, zIndex: 0 }} aria-hidden="true" />
        <div className="fixed pointer-events-none hidden lg:block" style={{ width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,229,255,0.03) 0%, transparent 70%)", bottom: 100, left: 100, zIndex: 0 }} aria-hidden="true" />

        <TopNav />
        <LeftRail />

        {/* Main — responsive padding */}
        <main
          className="relative"
          style={{
            paddingTop:    "3rem",
            paddingBottom: "2rem",
            minHeight:     "100vh",
            zIndex:        1,
          }}
        >
          {/* Left padding only on desktop where left rail shows */}
          <div className="lg:pl-20">
            <Providers>{children}</Providers>
          </div>
        </main>

        <StatusBar />
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
