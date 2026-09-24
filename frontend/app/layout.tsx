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
          <div className="relative flex h-screen overflow-hidden bg-[#0F1113]">
            <Sidebar />
            <main className="ecdat-workspace flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </ScanProvider>
      </body>
    </html>
  );
}
