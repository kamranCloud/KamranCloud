import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import DeveloperProfile from "@/components/DeveloperProfile";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { BookOpen } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Kamran Cloud | Expert Mathematics & Science Education",
  description: "Join Kamran Cloud, the ultimate educational platform for B.Tech, Intermediate, and Science students. Access high-quality mathematics video lectures, notes, and study materials by Dr. Kamran.",
  keywords: "Kamran Cloud, KamranSir, Mathematics, B.Tech Math, Applied Mathematics, Intermediate Education, Kamran Khan, Video Lectures, Study Notes, Kamran Math",
  authors: [{ name: "Dr. Kamran Khan" }],
  openGraph: {
    title: "Kamran Cloud - Official Learning Platform",
    description: "Access high-quality B.Tech and Intermediate mathematics video lectures, notes, and study materials.",
    url: "https://kamrans-cloud.vercel.app",
    siteName: "Kamran Cloud",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kamran Cloud - Official Learning Platform",
    description: "Access high-quality mathematics video lectures and notes by Dr. Kamran.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          poppins.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {/* JSON-LD Structured Data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                "name": "Kamran Cloud",
                "url": "https://kamrans-cloud.vercel.app",
                "logo": "https://kamrans-cloud.vercel.app/favicon.ico",
                "founder": {
                  "@type": "Person",
                  "name": "Dr. Kamran Khan"
                },
                "sameAs": [],
                "description": "Expert mathematics and science education for B.Tech and Intermediate students."
              })
            }}
          />
          <QueryProvider>
            <AuthProvider>
              <header className="sticky top-0 z-50 w-full border-b bg-background">
                <div className="container h-14 flex items-center justify-between">
                  <Link href="/" className="flex items-center space-x-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">
                      Dr. Kamran&apos;s Cloud
                    </span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <DeveloperProfile />
                  </div>
                </div>
              </header>
              <main>{children}</main>
              <Toaster />
              <SonnerToaster richColors closeButton position="top-right" />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 