import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BASE_PATH } from "@/lib/basePath";

export const metadata: Metadata = {
  title: "Health Sciences Analytics — KPI System",
  description:
    "KPI configuration, faculty management, and performance analytics for the School of Health Sciences.",
  icons: {
    icon: `${BASE_PATH}/shs-logo.png`,
    shortcut: `${BASE_PATH}/shs-logo.png`,
    apple: `${BASE_PATH}/shs-logo.png`,
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
