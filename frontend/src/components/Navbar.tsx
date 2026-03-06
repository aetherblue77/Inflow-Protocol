"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { usePathname } from "next/navigation"

export function Navbar() {
    const pathname = usePathname()
    return (
        <>
            {/* THE TOP SHIELD */}
            <div className="pointer-events-none fixed top-0 right-0 left-0 z-40 h-12 bg-gradient-to-b from-[#000000] via-[#000000]/90 to-transparent" />

            {/* NAVBAR CONTAINER */}
            <div className="pointer-events-none fixed top-6 right-0 left-0 z-50 flex justify-center px-4">
                <motion.nav
                    initial={{ y: -1, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="pointer-events-auto relative flex w-full max-w-5xl items-center justify-between rounded-2xl border border-[#00F0FF]/20 bg-[#050505]/80 px-5 py-3 shadow-[0_8px_32px_rgba(0,240,255,0.05)] backdrop-blur-xl"
                >
                    {/* Left: Logo & Brand Identity */}
                    <Link href="/" className="group relative z-10 flex items-center gap-3">
                        <div className="relative h-10 w-10 transform-gpu transition-all duration-500 ease-out will-change-transform group-hover:scale-110">
                            <Image
                                src="/logo.png"
                                alt="Inflow Protocol Logo"
                                fill
                                quality={100}
                                priority
                                className="object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                            />
                        </div>

                        <div className="relative flex items-center">
                            {/* Text Base (White) */}
                            <span className="bg-gradient-to-r from-white to-[#a1a1aa] bg-clip-text text-xl font-bold tracking-[0.15em] text-transparent transition-opacity duration-500 group-hover:opacity-0">
                                INFLOW
                            </span>

                            {/* Text Hover (Neon Cyan & Royal) */}
                            <span className="absolute top-0 left-0 bg-gradient-to-r from-[#00F0FF] to-[#0052FF] bg-clip-text text-xl font-bold tracking-[0.15em] text-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                                INFLOW
                            </span>
                        </div>
                    </Link>

                    {/* Center: Navigation Links */}
                    <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-6 rounded-full border border-white/5 bg-black/30 px-5 py-2 backdrop-blur-md">
                        <Link
                            href="/"
                            className={`text-sm font-semibold transition-colors ${pathname === "/" ? "text-[#00F0FF]" : "text-zinc-500 hover:text-white"}`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/factor"
                            className={`text-sm font-semibold transition-colors ${pathname === "/factor" ? "text-[#00F0FF]" : "text-zinc-500 hover:text-white"}`}
                        >
                            Factor
                        </Link>
                        <Link
                            href="/earn"
                            className={`text-sm font-semibold transition-colors ${pathname === "/earn" ? "text-[#00F0FF]" : "text-zinc-500 hover:text-white"}`}
                        >
                            Earn
                        </Link>
                    </div>

                    {/* Right: Web3 Connect Button */}
                    <div className="relative z-10">
                        <ConnectButton
                            accountStatus={{
                                smallScreen: "avatar",
                                largeScreen: "full",
                            }}
                            chainStatus="icon"
                            showBalance={false}
                        />
                    </div>
                </motion.nav>
            </div>
        </>
    )
}
