import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Dancing_Script } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-signature",
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "GlimmoraTeam",
  description: "AI-Governed Outcome Delivery Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${dancingScript.variable}`}
    >
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
