"use client"

import React, { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion, Variants } from "framer-motion"

// --- MOCK DATA ---
const vaultMetrics = {
    tvl: 1250000,
    apy: 12.5,
    volume: 3400000,
}

const backingAssets = [
    {
        id: "INV-2026-089",
        sector: "Software SaaS",
        value: 10000,
        maturity: "14 Days",
        apy: "12.0%",
    },
    { id: "INV-2026-092", sector: "Logistics", value: 25000, maturity: "30 Days", apy: "13.5%" },
    {
        id: "INV-2026-042",
        sector: "Manufacturing",
        value: 50000,
        maturity: "45 Days",
        apy: "11.8%",
    },
    { id: "INV-2026-105", sector: "E-Commerce", value: 15000, maturity: "7 Days", apy: "12.5%" },
]

export default function EarnPage() {
    const [activeTab, setActiveTab] = useState<"Deposit" | "Withdraw">("Deposit")
    const [direction, setDirection] = useState(0) // For animation slide direction
    const [amount, setAmount] = useState("")

    // State for Dropdown ERC-4626
    const [currency, setCurrency] = useState<"USDC" | "iUSDC">("USDC")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    // For Close Dropdown when click outside
    const dropdownRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Logic (Exchange Rate 1 iUSDC = 1.025 USDC)
    const EXCHANGE_RATE = 1.025
    const parsedAmount = parseFloat(amount)

    let outputLabel = ""
    let outputValue = "0.00"
    let actionText = ""
    let descriptionText = ""

    // Logic ERC-4626 (Deposit, Mint, Withdraw, Redeem)
    if (activeTab === "Deposit") {
        actionText = "Approve & Deposit"
        if (currency === "USDC") {
            // 1. DEPOSIT: Input USDC, get iUSDC
            outputLabel = "You will receive (iUSDC)"
            outputValue = (parsedAmount / EXCHANGE_RATE).toFixed(2)
            descriptionText =
                "Deposit USDC to receive yield-bearing iUSDC shares."
        } else {
            // 2. MINT: Input target iUSDC, pay with USDC
            outputLabel = "You need to deposit (USDC)"
            outputValue = (parsedAmount * EXCHANGE_RATE).toFixed(2)
            descriptionText =
                "Provide the exact USDC required to receive your target iUSDC shares."
        }
    } else {
        actionText = "Withdraw Liquidity"
        if (currency === "iUSDC") {
            // 3. REDEEM: Input iUSDC, get USDC
            outputLabel = "You will receive (USDC)"
            outputValue = (parsedAmount * EXCHANGE_RATE).toFixed(2)
            descriptionText =
                "Return your iUSDC shares to withdraw your capital and accrued yield."
        } else {
            // 4. WITHDRAW: Input target USDC, burn iUSDC
            outputLabel = "Shares to be burned (iUSDC)"
            outputValue = (parsedAmount / EXCHANGE_RATE).toFixed(2)
            descriptionText =
                "Burn the required iUSDC shares to withdraw your exact target USDC amount."
        }
    }

    // --- ANIMATION TAB SLIDE ---
    const handleTabSwitch = (newTab: "Deposit" | "Withdraw") => {
        if (newTab === activeTab) return
        setDirection(newTab === "Withdraw" ? 1 : -1)
        setActiveTab(newTab)
        // Otomatically change default currency
        setCurrency(newTab === "Deposit" ? "USDC" : "iUSDC")
        setAmount("")
        setIsDropdownOpen(false)
    }

    const slideVariants = {
        enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 40 : -40, opacity: 0 }),
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } },
    }

    const itemVariants: Variants = {
        hidden: { y: 15, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
    }

    return (
        <main className="relative flex min-h-[100dvh] w-full flex-col items-center overflow-x-hidden px-4 pb-20">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative z-10 flex w-full max-w-6xl flex-col gap-8"
            >
                {/* HEADER SECTION */}
                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                        Liquidity{" "}
                        <span className="bg-gradient-to-r from-[#00F0FF] to-[#0052FF] bg-clip-text text-transparent">
                            Vault
                        </span>
                    </h1>
                    <p className="text-sm font-medium text-zinc-400">
                        Provide USDC liquidity to real-world SMEs and earn sustainable yield.
                    </p>
                </motion.div>

                {/* WORKSPACE GRID: LEFT (Transparency) & RIGHT (Terminal) */}
                <div className="flex flex-col-reverse gap-6 lg:flex-row">
                    {/* LEFT COLUMN: METRICS & TRANSPARENCY (65% Width) */}
                    <div className="flex w-full flex-col gap-6 lg:w-[65%]">
                        {/* PROTOCOL GLOBAL METRICS */}
                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                        >
                            <div className="flex flex-col gap-1 rounded-2xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-6 backdrop-blur-md">
                                <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                                    Current APY
                                </span>
                                <span className="text-3xl font-bold tracking-tight text-[#00F0FF]">
                                    {vaultMetrics.apy}%
                                </span>
                                <span className="mt-1 text-xs text-[#00F0FF]/70">
                                    Real-World Sourced
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-[#050505]/40 p-6 backdrop-blur-md">
                                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                                    Total Value Locked
                                </span>
                                <span className="text-2xl font-bold tracking-tight text-white">
                                    ${vaultMetrics.tvl.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-[#050505]/40 p-6 backdrop-blur-md">
                                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                                    Total Factored
                                </span>
                                <span className="text-2xl font-bold tracking-tight text-zinc-300">
                                    ${vaultMetrics.volume.toLocaleString()}
                                </span>
                            </div>
                        </motion.div>

                        {/* UNDERLYING ASSETS TRANSPARENCY TABLE */}
                        <motion.div
                            variants={itemVariants}
                            className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#050505]/40 backdrop-blur-md"
                        >
                            <div className="border-b border-white/5 p-6">
                                <h2 className="text-lg font-bold text-white">
                                    Active Assets Backing Vault
                                </h2>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Live view of RWA invoices currently generating yield.
                                </p>
                            </div>

                            <div className="w-full overflow-x-auto p-6 pt-0">
                                <table className="mt-4 w-full text-left text-sm text-zinc-400">
                                    <thead className="border-b border-white/5 text-xs tracking-wider text-zinc-500 uppercase">
                                        <tr>
                                            <th className="pb-3 font-semibold">Asset ID</th>
                                            <th className="pb-3 font-semibold">Sector</th>
                                            <th className="pb-3 text-right font-semibold">
                                                Value (USDC)
                                            </th>
                                            <th className="pb-3 text-right font-semibold">
                                                Maturity
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {backingAssets.map((asset, idx) => (
                                            <tr
                                                key={idx}
                                                className="transition-colors hover:bg-white/[0.02]"
                                            >
                                                <td className="py-4 font-mono">
                                                    <span className="inline-flex items-center gap-1.5 text-zinc-300">
                                                        {asset.id}
                                                    </span>
                                                </td>
                                                <td className="py-4 font-medium text-white">
                                                    {asset.sector}
                                                </td>
                                                <td className="py-4 text-right font-mono text-white">
                                                    {asset.value.toLocaleString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-500/20 bg-zinc-500/10 px-2.5 py-1 text-xs font-semibold text-zinc-400">
                                                        {asset.maturity}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>

                    {/* RIGHT COLUMN: ERC-4626 ACTION TERMINAL (35% Width) */}
                    <motion.div
                        variants={itemVariants}
                        className="sticky top-32 w-full lg:w-[35%]"
                    >
                        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#00F0FF]/20 bg-[#050505]/80 p-6 shadow-[0_8px_32px_rgba(0,240,255,0.05)] backdrop-blur-xl">
                            {/* TERMINAL TABS */}
                            <div className="relative z-20 mb-6 flex w-full rounded-xl border border-white/5 bg-black/50 p-1">
                                {["Deposit", "Withdraw"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() =>
                                            handleTabSwitch(tab as "Deposit" | "Withdraw")
                                        }
                                        className={`relative flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                                            activeTab === tab
                                                ? "text-[#00F0FF]"
                                                : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                    >
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="investTabBg"
                                                className="absolute inset-0 rounded-lg bg-[#00F0FF]/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                                            />
                                        )}
                                        <span className="relative z-10">{tab}</span>
                                    </button>
                                ))}
                            </div>

                            {/* SLIDING CONTENT */}
                            <div className="relative min-h-[320px]">
                                <AnimatePresence initial={false} custom={direction} mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        custom={direction}
                                        variants={slideVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="absolute inset-0 flex flex-col gap-4"
                                    >
                                        {/* INPUT SECTION */}
                                        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/50 p-4 transition-all focus-within:border-[#00F0FF]/50 focus-within:bg-black/80">
                                            <div className="flex justify-between text-xs font-semibold text-zinc-400">
                                                <span>
                                                    {activeTab === "Deposit"
                                                        ? "Amount to Input"
                                                        : "Amount to Remove"}
                                                </span>
                                                <span>
                                                    Balance:{" "}
                                                    {currency === "USDC" ? "50,000" : "10,500"}{" "}
                                                    {currency}
                                                </span>
                                            </div>
                                            <div className="relative mt-1 flex items-center justify-between gap-4">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    className="w-full bg-transparent text-3xl font-bold text-white outline-none placeholder:text-zinc-700"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-[#00F0FF] transition-colors hover:bg-white/10">
                                                        MAX
                                                    </button>

                                                    {/* DROPDOWN CURRENCY */}
                                                    <div className="relative" ref={dropdownRef}>
                                                        <button
                                                            onClick={() =>
                                                                setIsDropdownOpen(!isDropdownOpen)
                                                            }
                                                            className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-zinc-800/50 px-3 py-1.5 transition-colors hover:bg-zinc-700/50"
                                                        >
                                                            <div
                                                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${currency === "USDC" ? "bg-blue-500" : "bg-[#00F0FF] text-black"}`}
                                                            >
                                                                {currency === "USDC" ? "$" : "i$"}
                                                            </div>
                                                            <span className="text-sm font-bold text-white">
                                                                {currency}
                                                            </span>
                                                            <svg
                                                                className="h-3 w-3 text-zinc-400"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M19 9l-7 7-7-7"
                                                                />
                                                            </svg>
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        <AnimatePresence>
                                                            {isDropdownOpen && (
                                                                <motion.div
                                                                    initial={{
                                                                        opacity: 0,
                                                                        y: -10,
                                                                    }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    className="absolute top-full right-0 z-50 mt-2 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-xl"
                                                                >
                                                                    {["USDC", "iUSDC"].map(
                                                                        (curr) => (
                                                                            <button
                                                                                key={curr}
                                                                                onClick={() => {
                                                                                    setCurrency(
                                                                                        curr as
                                                                                            | "USDC"
                                                                                            | "iUSDC",
                                                                                    )
                                                                                    setIsDropdownOpen(
                                                                                        false,
                                                                                    )
                                                                                }}
                                                                                className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/10 hover:text-white"
                                                                            >
                                                                                {curr}
                                                                            </button>
                                                                        ),
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ERC-4626 CONVERSION INFO */}
                                        <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">
                                                    Exchange Rate
                                                </span>
                                                <span className="font-mono text-zinc-300">
                                                    1 iUSDC = 1.025 USDC
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">
                                                    {outputLabel}
                                                </span>
                                                <span className="font-mono font-bold text-white">
                                                    {amount ? outputValue : "0.00"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* CTA BUTTON & DESCRIPTION */}
                                        <button className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0052FF] p-4 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-[0.98]">
                                            {actionText}
                                        </button>
                                        <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-500">
                                            {descriptionText}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </main>
    )
}
