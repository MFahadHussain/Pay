import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fahad Hussain - AI Engineer & Developer ",
  description: "AI Engineer & Developer with a passion for building scalable and efficient systems.",
  keywords: ["Software Engineer", "Full Stack Developer", "TypeScript", "Tailwind CSS", "React", "Next.js", "Node.js", "MongoDB", "PostgreSQL", "Docker", "Kubernetes"],
  authors: [{ name: "Fahad Hussain" }],
  twitter: {
    card: "summary_large_image",
    title: "Fahad Hussain - AI Engineer & Developer",
    description: "AI Engineer & Developer with a passion for building scalable and efficient systems.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
