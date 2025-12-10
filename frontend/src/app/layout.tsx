import { Montserrat } from "next/font/google";
import "./global.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NewsCacheProvider } from "@/contexts/NewsCacheContext";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="favicon-32x32.png" type="image/png"></link>
      </head>
      <body className={`${montserrat.className} bg-amber-50`}>
        <AuthProvider>
          <NewsCacheProvider>{children}</NewsCacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
