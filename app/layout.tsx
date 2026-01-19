import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "./components/WalletContextProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ghost Payroll - Privacy-First Payroll on Solana",
  description: "Enterprise payroll with zero-knowledge proofs and encrypted salaries. Built on Solana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <WalletContextProvider>
          <div className="min-h-screen bg-dark-bg">
            {children}
          </div>
        </WalletContextProvider>
      </body>
    </html>
  );
}
