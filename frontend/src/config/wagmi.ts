import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { sepolia } from "wagmi/chains"

export const config = getDefaultConfig({
    appName: "Inflow Protocol",
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "",
    chains: [sepolia],
    ssr: true, // Must true for Next.js App Router
})