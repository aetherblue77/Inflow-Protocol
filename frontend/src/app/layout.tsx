import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/Providers"
import {Navbar} from "@/components/Navbar"
import { AnimatedBackground } from "@/components/AnimatedBackground"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Inflow Protocol",
    description: "Decentralized liquidity and instant cash advances for real-world B2B invoices.",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-transparent text-white antialiased min-h-screen`}>
                <Providers>
                    <AnimatedBackground />
                    <Navbar />
                    <main className="pt-32 min-h-screen relative z-10 px-4 md:px-8 max-w-7xl mx-auto">
                        {children}
                    </main>
                    </Providers>
            </body>
        </html>
    )
}
