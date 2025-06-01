import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { AuthProvider } from "@/context/AuthContext"
// import ThemeWrapper from "./ThemeWrapper"

import "@/styles/global.css"
// import { ThemeProvider } from "@/context/ThemeContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SecurityGPT",
  description: "AI-powered dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} h-full `}>
          <AuthProvider>
            <Toaster />
            {children}
          </AuthProvider>
      </body>
    </html>
  )
}
