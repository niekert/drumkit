import classNames from "classnames"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"

const inter = Inter({ subsets: ["latin"] })
const gtWalsheim = localFont({
  src: "./GTWalsheimPro-BlackOblique.woff2",
  variable: "--font-product",
})

export const metadata: Metadata = {
  title: "DrumKit",
  description: "Browser Drum machine",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${gtWalsheim.variable}`}>
        {children}
      </body>
    </html>
  )
}
