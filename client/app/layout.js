import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: {
    default: "Doctor Tracker",
    template: "%s · Doctor Tracker",
  },
  description:
    "A secure administrative workspace for managing doctors, patients and workspace insights.",
};

export const viewport = {
  themeColor: "#157d78",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
