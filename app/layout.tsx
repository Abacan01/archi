import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteRuntimeScript } from "../components/site-runtime-script";

export const metadata: Metadata = {
  title: "JCCHUA & Associates",
  description: "Sustainable residential and commercial architecture by Arch. Joseph C. Chua.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Script id="crypto-randomuuid-polyfill" strategy="beforeInteractive">
          {`(function () {
  if (typeof crypto === "undefined") {
    window.crypto = {};
  }
  if (!crypto.randomUUID) {
    crypto.randomUUID = function () {
      if (crypto.getRandomValues) {
        var bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        var hex = Array.from(bytes, function (b) {
          return b.toString(16).padStart(2, "0");
        });
        return (
          hex[0] + hex[1] + hex[2] + hex[3] + "-" +
          hex[4] + hex[5] + "-" +
          hex[6] + hex[7] + "-" +
          hex[8] + hex[9] + "-" +
          hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
        );
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
  }
})();`}
        </Script>
        {children}
        <SiteRuntimeScript />
      </body>
    </html>
  );
}
