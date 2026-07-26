import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "next-themes";


export const metadata: Metadata = {
  title: "Echo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const effective = theme === 'system' || !theme ? system : theme;
                if (effective === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider defaultTheme="system" attribute="class">
          <ConvexClientProvider>
            <TooltipProvider>
                {children}
            </TooltipProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}