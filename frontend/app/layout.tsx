import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ScanProvider } from "@/components/scan-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ECDAT — Enterprise Cryptographic Discovery & Analysis Tool",
  description: "Scan repositories, discover cryptographic usage, assess risk, and plan quantum migration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <ScanProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-slate-950">
              {children}
            </main>
          </div>
        </ScanProvider>
      </body>
    </html>
  );
}
