"use client"

import React, { useState } from "react"
import { motion, MotionConfig, Variants } from "framer-motion"

// --- MOCK DATA ---
const mockMetrics = {
    limit: 50000,
    active: 12500,
    available: 37500,
}

const mockInvoices = [
    {
        id: "INV-2026-089",
        client: "Nexus Dynamics",
        amount: 10000,
        due: "30 Days",
        status: "Pending Audit",
        ipfsUrl: "https://ipfs.io/ipfs/Qm...",
    },
    {
        id: "INV-2026-092",
        client: "Cyberdyne",
        amount: 5000,
        due: "45 Days",
        status: "Ready to Claim",
        ipfsUrl: "https://ipfs.io/ipfs/Qm...",
    },
    {
        id: "INV-2026-042",
        client: "Aether Labs",
        amount: 2500,
        due: "14 Days",
        status: "Active Loan",
        ipfsUrl: "https://ipfs.io/ipfs/Qm...",
    },
    {
        id: "INV-2025-991",
        client: "Stark Industries",
        amount: 15000,
        due: "Settled",
        status: "Repaid",
        ipfsUrl: "https://ipfs.io/ipfs/Qm...",
    },
]

export default function FactorPage() {
    const [isHoveringDrop, setIsHoveringDrop] = useState(false)
    const [activeTab, setActiveTab] = useState("Pending & Ready")

    // Logic Filter Data base on Tab
    const filteredInvoices = mockInvoices.filter((inv) => {
        if (activeTab === "Pending & Ready")
            return inv.status === "Pending Audit" || inv.status === "Ready to Claim"
        if (activeTab === "Active Loans") return inv.status === "Active Loan"
        if (activeTab === "Repaid") return inv.status === "Repaid"
        return true
    })

    // Animation In
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
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
                        SME{" "}
                        <span className="bg-gradient-to-r from-[#00F0FF] to-[#0052FF] bg-clip-text text-transparent">
                            Portal
                        </span>
                    </h1>
                    <p className="text-sm font-medium text-zinc-400">
                        Mint your unpaid invoices into liquid NFTs.
                    </p>
                </motion.div>

                {/* METRICS ROW */}
                <motion.div
                    variants={itemVariants}
                    className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    {[
                        {
                            label: "Credit Limit",
                            value: `$${mockMetrics.limit.toLocaleString()}`,
                            color: "text-white",
                        },
                        {
                            label: "Active Debt",
                            value: `$${mockMetrics.active.toLocaleString()}`,
                            color: "text-orange-400",
                        },
                        {
                            label: "Available to Borrow",
                            value: `$${mockMetrics.available.toLocaleString()}`,
                            color: "text-[#00F0FF]",
                        },
                    ].map((metric, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-[#050505]/40 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md"
                        >
                            <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                                {metric.label}
                            </span>
                            <span className={`text-2xl font-bold tracking-tight ${metric.color}`}>
                                {metric.value}
                            </span>
                        </div>
                    ))}
                </motion.div>

                {/* MAIN WORKSPACE: Split into Form (Left) & Table (Right) on Desktop */}
                <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* LEFT: FACTORING FORM */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col gap-6 rounded-2xl border border-[#00F0FF]/10 bg-[#050505]/60 p-6 backdrop-blur-xl lg:col-span-1"
                    >
                        <h2 className="text-lg font-bold text-white">Factor New Invoice</h2>

                        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                                    Debtor / Client Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white transition-all outline-none placeholder:text-zinc-600 focus:border-[#00F0FF]/50 focus:bg-black/80 focus:ring-1 focus:ring-[#00F0FF]/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                                        Amount (USD)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="10000"
                                        className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white transition-all outline-none placeholder:text-zinc-600 focus:border-[#00F0FF]/50 focus:bg-black/80 focus:ring-1 focus:ring-[#00F0FF]/50"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                                        Due In
                                    </label>
                                    <select className="w-full appearance-none rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white transition-all outline-none focus:border-[#00F0FF]/50 focus:bg-black/80 focus:ring-1 focus:ring-[#00F0FF]/50">
                                        <option value="15">15 Days</option>
                                        <option value="30">30 Days</option>
                                        <option value="60">60 Days</option>
                                    </select>
                                </div>
                            </div>

                            {/* IPFS Drag & Drop Zone */}
                            <div
                                className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-300 ${isHoveringDrop ? "border-[#00F0FF] bg-[#00F0FF]/5" : "border-white/10 bg-black/30 hover:border-white/30"}`}
                                onMouseEnter={() => setIsHoveringDrop(true)}
                                onMouseLeave={() => setIsHoveringDrop(false)}
                            >
                                <svg
                                    className={`mb-2 h-8 w-8 transition-colors ${isHoveringDrop ? "text-[#00F0FF]" : "text-zinc-500"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span className="text-sm font-medium text-zinc-300">
                                    Upload PDF Invoice
                                </span>
                                <span className="text-xs text-zinc-500">Secured via IPFS</span>
                            </div>

                            <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#0052FF] p-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-[0.98]">
                                Submit for Factoring
                            </button>
                        </form>
                    </motion.div>

                    {/* RIGHT: INVOICE STATE MACHINE TABLE WITH TABS */}
                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#050505]/40 p-6 backdrop-blur-md lg:col-span-2"
                    >
                        {/* Header Table & Filter Dropdown */}
                        <div className="flex flex-col justify-between gap-4 p-6 pb-0 sm:flex-row sm:items-center">
                            <h2 className="text-lg font-bold text-white">Active Ledger</h2>
                            <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-colors hover:text-white">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                    />
                                </svg>
                                Sort: Newest
                            </button>
                        </div>

                        {/* TAB NAVIGATION */}
                        <div className="flex w-full gap-6 border-b border-white/10 px-6 pt-4">
                            {["Pending & Ready", "Active Loans", "Repaid"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative pb-3 text-sm font-bold transition-all ${activeTab === tab ? "text-[#00F0FF]" : "text-zinc-500 hover:text-zinc-300"}`}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute right-0 bottom-[-1px] left-0 h-[2px] bg-[#00F0FF] shadow-[0_0_10px_#00F0FF]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="w-full overflow-x-auto p-6">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="border-b border-white/10 text-xs tracking-wider text-zinc-500 uppercase">
                                    <tr>
                                        <th className="pb-3 font-semibold">Invoice ID</th>
                                        <th className="pb-3 font-semibold">Debtor</th>
                                        <th className="pb-3 text-right font-semibold">Value</th>
                                        <th className="pb-3 text-right font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredInvoices.length > 0 ? (
                                        filteredInvoices.map((inv, idx) => (
                                            <tr
                                                key={idx}
                                                className="transition-colors hover:bg-white/[0.02]"
                                            >
                                                {/* <td className="py-4 font-mono text-zinc-300">
                                                {inv.id}
                                            </td> */}
                                                <td className="py-4 font-mono">
                                                    <a
                                                        href={inv.ipfsUrl || "#"}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group inline-flex items-center gap-1.5 text-[#00F0FF] transition-all hover:text-white hover:underline"
                                                    >
                                                        {inv.id}
                                                        <svg
                                                            className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2.5}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </a>
                                                </td>
                                                <td className="py-4 font-medium text-white">
                                                    {inv.client}
                                                </td>
                                                <td className="py-4 text-right font-mono text-white">
                                                    ${inv.amount.toLocaleString()}
                                                </td>
                                                <td className="flex justify-end py-4 text-right">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${inv.status === "Pending Audit" ? "border border-orange-500/20 bg-orange-500/10 text-orange-500" : ""} ${inv.status === "Ready to Claim" ? "border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]" : ""} ${inv.status === "Active Loan" ? "border border-[#00F0FF]/20 bg-[#00F0FF]/10 text-[#00F0FF]" : ""} ${inv.status === "Repaid" ? "border border-green-500/20 bg-green-500/10 text-green-500" : ""}`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${inv.status === "Pending Audit" ? "bg-orange-500" : ""} ${inv.status === "Ready to Claim" ? "animate-pulse bg-yellow-400 shadow-[0_0_8px_#facc15]" : ""} ${inv.status === "Active Loan" ? "bg-[#00F0FF] shadow-[0_0_5px_#00F0FF]" : ""} ${inv.status === "Repaid" ? "bg-green-500" : ""}`}
                                                        />
                                                        {inv.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-8 text-center font-medium text-zinc-600"
                                            >
                                                No invoices found in this category.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State Ghost (If the data is Empty) */}
                        {/* <div className="flex h-32 flex-col items-center justify-center gap-2 text-zinc-600">
                        <span>No active invoices found.</span>
                    </div> */}
                    </motion.div>
                </div>
            </motion.div>
        </main>
    )
}
