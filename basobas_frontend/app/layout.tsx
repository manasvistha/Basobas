import "./globals.css";
import "leaflet/dist/leaflet.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="site-bg">
          <div className="site-content">{children}</div>
        </div>
      </body>
    </html>
  );
}