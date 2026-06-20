import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import "@/app/globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["cyrillic", "latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Alenalinery — студія волосся в Умані",
  description: "Студія колористики та догляду за волоссям в Умані.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body className={`${manrope.variable} ${cormorant.variable}`}>{children}</body>
    </html>
  );
}
