import "./globals.css";

export const metadata = {
  title: "Fault Finders",
  description: "A Chapter 4 troubleshooting adventure: fix faulty PCs, help customers and win two gym badges.",
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1d2824" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Pixelify+Sans:wght@400;500;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
