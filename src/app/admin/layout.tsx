import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel Administrativo | Urna Commit Jr.",
  description: "Controle e apuração de eleições da Commit Jr.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
