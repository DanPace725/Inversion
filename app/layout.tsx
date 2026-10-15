import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inversion · Reflection Studio",
  description: "From handwritten reflections to shared understanding. A private retreat facilitator workspace.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
