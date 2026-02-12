import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const space = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "700"] });

export const metadata = {
  title: "SANDNCO.LOL | Sector 16 Ops",
  description: "Faridabad's Premier Relationship Arbitration Service",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐱</text></svg>',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#020205] text-gray-200 antialiased`}>
        {children}
      </body>
    </html>
  );
}
