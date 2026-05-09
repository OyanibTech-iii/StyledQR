import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Custom QR Code Generator | Create Beautiful QR Codes",
  description: "Create beautiful, fully customizable QR codes for your brand. Adjust colors, styles, and add your logo in seconds.",
  keywords: ["QR Code Generator", "Custom QR Code", "Brand QR Code", "QR Code Design", "Free QR Code"],
  authors: [{ name: "Pacifico Oyanib" }],
  creator: "Pacifico Oyanib",
  publisher: "Pacifico Oyanib",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://styledqr.onrender.com"), // Replace with your actual domain
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Custom QR Code Generator",
    description: "Create beautiful, fully customizable QR codes for your brand.",
    url: "https://styledqr.onrender.com", // Replace with your actual domain
    siteName: "Custom QR Code Generator",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Custom QR Code Generator Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom QR Code Generator",
    description: "Create beautiful, fully customizable QR codes for your brand.",
    images: ["/web-app-manifest-512x512.png"],
    creator: "@yourtwitterhandle", // Replace with your actual Twitter handle
  },
  verification: {
    google: "a912a27cfea39fbc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
