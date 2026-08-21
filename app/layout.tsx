import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Health Sciences Analytics — KPI System",
  description:
    "KPI configuration, faculty management, and performance analytics for the School of Health Sciences.",
  icons: {
    icon: "/SHSKPIs/shs-logo.png",
    shortcut: "/SHSKPIs/shs-logo.png",
    apple: "/SHSKPIs/shs-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans text-body-md text-on-surface antialiased bg-background min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
