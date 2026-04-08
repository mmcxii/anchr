import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";

export const metadata: Metadata = {
  description:
    "November Sierra builds products with intuitive interfaces designed for people and clean APIs designed for agents.",
  title: "November Sierra — Thoughtful. Intentional. Software.",
};

export type RootLayoutProps = React.PropsWithChildren;

const RootLayout: React.FC<RootLayoutProps> = (props) => {
  const { children } = props;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeScript />
        {children}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
