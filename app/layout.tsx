import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Health Sciences Analytics — KPI System",
  description:
    "KPI configuration, faculty management, and performance analytics for the School of Health Sciences.",
  icons: {
    icon: "/shs-logo.png",
    shortcut: "/shs-logo.png",
    apple: "/shs-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={hanken.variable}>
      <body className="font-sans text-body-md text-on-surface antialiased bg-background min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
