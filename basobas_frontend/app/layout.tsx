import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Inter, Poppins } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <div className="site-bg">
          <div className="site-content">{children}</div>
        </div>
      </body>
    </html>
  );
}
