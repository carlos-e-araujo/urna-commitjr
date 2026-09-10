import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urna Eletrônica - Commit Jr.",
  description: "Sistema de Votação Oficial da Commit Jr.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#d4d4d8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full overflow-hidden bg-urna-bg text-urna-dark antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
