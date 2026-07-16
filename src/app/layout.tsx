import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/global/Navbar";
import { RoleProvider } from "@/lib/role-context";
import { getRoleCookie } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ComiTrack | Dashboard",
  description: "Gestión de comisiones personales y ventas.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getRoleCookie();
  const initialRole = session;

  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 antialiased`}>
        <RoleProvider initialRole={initialRole}>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </RoleProvider>
      </body>
    </html>
  );
}
