"use client"

import { motion } from "framer-motion"

export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 z-[-1] flex items-center justify-center overflow-hidden bg-[#050505]">
            {/* Dot Grid */}
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: "radial-gradient(#00F0FF 1.5px, transparent 1.5px)",
                    backgroundSize: "40px 40px",
                }}
            />

            {/* The Inflow Data Stream (Light Beam) */}
            <motion.div
                animate={{
                    x: ["-200%", "200%"],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute top-0 bottom-0 w-[40vw] skew-x-[-45deg] bg-gradient-to-r from-transparent via-[#0052FF]/10 to-transparent sm:w-[800px]"
            />

            {/* Radial Vignette Mask */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: "radial-gradient(circle at center, transparent 10%, #050505 85%)",
                }}
            />
        </div>
    )
}
