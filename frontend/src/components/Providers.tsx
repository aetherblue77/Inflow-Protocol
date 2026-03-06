"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"
import "@rainbow-me/rainbowkit/styles.css"
import { config } from "../config/wagmi"

const queryClient = new QueryClient()

const baseTheme = darkTheme({
    accentColor: "#0052FF",
    accentColorForeground: "white",
    borderRadius: "large",
    overlayBlur: "small",
})

const inflowTheme = {
    ...baseTheme,
    colors: {
        ...baseTheme.colors,
        modalBackground: "#0B1121",
        modalBorder: "rgba(0, 240, 255, 0.15)",
        modalBackdrop: "rgba(5, 5, 5, 0.7)",

        connectButtonInnerBackground: "#0B1121",
        connectButtonBackground: "#0B1121",
    },
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={inflowTheme}>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
