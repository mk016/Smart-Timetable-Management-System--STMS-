import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Chatbot } from "@/components/chatbot";

import "@/app/globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "STMS | Smart Timetable Management System",
  description: "Role-based scheduling, conflict detection, exports and AI-assisted timetable operations."
};

import { Toaster } from "sonner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-canvas font-sans text-ink antialiased">
        {children}
        <Chatbot />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
