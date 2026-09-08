import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pixelDisplay = Press_Start_2P({
  variable: "--font-pixel-display",
  subsets: ["latin"],
  weight: "400",
});

const terminalMono = VT323({
  variable: "--font-terminal",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "MUMBAI // SIGNAL WATCH",
  description: "A news-derived epidemic early warning console for Mumbai.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixelDisplay.variable} ${terminalMono.variable} h-full`}
    >
      <body>{children}</body>
    </html>
  );
}
