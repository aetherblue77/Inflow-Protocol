export interface NetworkConfigItem {
    name: string
    blockConfirmations?: number
}

export interface NetworkConfigInfo {
    [key: number]: NetworkConfigItem
}

export const networkConfig: NetworkConfigInfo = {
    31337: {
        name: "localhost",
        blockConfirmations: 1,
    },
    11155111: {
        name: "sepolia",
        blockConfirmations: 6,
    },
}

export const developmentChains: string[] = ["hardhat", "localhost"]
