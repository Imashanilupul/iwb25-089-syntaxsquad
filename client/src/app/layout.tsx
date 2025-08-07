import type { Metadata } from "next"
import "../styles/globals.css"
import ContextProvider from "@/components/walletConnect/context"

export const metadata: Metadata = {
  title: "Sri Lanka Transparent Governance Platform",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ContextProvider>
        {children}

        </ContextProvider>

      </body>
    </html>
  )
}
