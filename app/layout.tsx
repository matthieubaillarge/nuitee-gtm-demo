import type { Metadata } from "next";
import { Inter, Onest } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Connect Activation Console | Nuitee LiteAPI",
  description: "Visualize the activation funnel and lifecycle automation triggers for Connect partners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${onest.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8F8F8]">{children}</body>
    </html>
  );
}
