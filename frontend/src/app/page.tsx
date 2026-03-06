"use client"

import { motion, Variants } from "framer-motion"
import Link from "next/link"

export default function Home() {
    // Variable to set the animation emergence element sequentially
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 },
        },
    }

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
    }

    return (
        <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden px-4">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center mt-20"
            >
                {/* Trust Lable (Micro-copy) */}
                <motion.div variants={itemVariants} className="mb-4">
                    <span className="rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/5 px-4 py-1.5 text-xs font-bold tracking-widest text-[#00F0FF] uppercase">
                        Institutional-Grade RWA
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    variants={itemVariants}
                    className="mb-4 text-4xl sm:text-6xl lg:text-7xl leading-[1.1] font-black tracking-tight text-white"
                >
                    Instant Liquidity for <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-[#00F0FF] to-[#0052FF] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]">
                        Real-World Assets
                    </span>
                </motion.h1>

                {/* Sub-headline */}
                <motion.p
                    variants={itemVariants}
                    className="mb-8 max-w-2xl text-lg font-medium text-zinc-400 sm:text-xl"
                >
                    Turn your unpaid B2B invoices into instant cash flow. Provide liquidity to earn
                    premium, uncorrelated yields. Powered by EVM Smart Contracts.
                </motion.p>

                {/* The Dual CTA (Call to Action) */}
                <motion.div
                    variants={itemVariants}
                    className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
                >
                    {/* Button 1: For Borrow */}
                    <Link href="/factor" className="w-full sm:w-auto">
                        <button className="group relative flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0052FF] px-8 py-3.5 text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] active:scale-95">
                            <span>Factor Invoices</span>
                            <svg
                                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </button>
                    </Link>

                    {/* Button 2: For Investor / Liquidity Provider */}
                    <Link href="/earn" className="w-full sm:w-auto">
                        <button className="group flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#050505]/50 px-8 py-3.5 text-lg font-bold text-zinc-300 backdrop-blur-md transition-all duration-300 hover:border-[#00F0FF]/50 hover:bg-[#00F0FF]/10 hover:text-white active:scale-95">
                            <span>Provide Liquidity</span>
                        </button>
                    </Link>
                </motion.div>

                {/* Security & Compliance Micro-copy */}
                <motion.div
                    variants={itemVariants}
                    className="mt-8 flex items-center gap-6 text-sm font-medium text-zinc-500"
                >
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                        ERC-4626 Vault
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                        Non-Custodial
                    </div>
                </motion.div>
            </motion.div>
        </main>
    )
}
