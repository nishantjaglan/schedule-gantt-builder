import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Schedule & Gantt Builder | FI$Cal Project Planning",
  description: "Professional project scheduling and Gantt chart builder for government IT programmes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
