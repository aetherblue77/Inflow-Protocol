import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { network, ethers } from "hardhat"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../utils/verify"

const deployInflowProtocol: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre
    const { deploy, log, execute } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId!
    log("-------------------------------------------------------------")
    log("🚀 Deploying Inflow Protocol to:", network.name.toUpperCase())
    log("-------------------------------------------------------------")

    const waitBlockConfirmations = networkConfig[chainId]?.blockConfirmations || 1

    let usdcAddress: string

    // --- 0. DYNAMIC TREASURY ROUTING ---
    let treasuryAddress: string
    if (developmentChains.includes(network.name)) {
        const signers = await ethers.getSigners()
        treasuryAddress = signers[4].address // Account 5 for Treasury
        log(`🏦 [Local] Treasury routed to Account 5: ${treasuryAddress}`)
    } else {
        treasuryAddress = process.env.TESTNET_TREASURY_ADDRESS!.toLowerCase()
        log(`🏦 [Testnet/Mainnet] Treasury routed to: ${treasuryAddress}`)
    }

    // --- 1. DEPLOY MOCK USDC ---
    if (developmentChains.includes(network.name) || chainId === 11155111) {
        // Sepolia / Local
        log("✅ Deploying MockUSDC...")
        const mockUsdcArgs: any[] = []
        const mockUsdc = await deploy("MockUSDC", {
            from: deployer,
            args: mockUsdcArgs,
            log: true,
            waitConfirmations: waitBlockConfirmations,
        })
        usdcAddress = mockUsdc.address

        if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
            log("Verifying MockUSDC...")
            await verify(mockUsdc.address, mockUsdcArgs)
        }
    } else {
        // If Deploying to Mainnet, use the real USDC address
        usdcAddress = process.env.MAINNET_USDC_ADDRESS!.toLowerCase()
    }

    log("-------------------------------------------------------------")

    // --- 2. DEPLOY INFLOW VAULT ---
    log("✅ Deploying InflowVault...")
    const vaultArgs = [usdcAddress]
    const vault = await deploy("InflowVault", {
        from: deployer,
        args: vaultArgs,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying InflowVault...")
        await verify(vault.address, vaultArgs)
    }

    log("-------------------------------------------------------------")

    // --- 3. DEPLOY INVOICE NFT ---
    log("✅ Deploying InvoiceNFT...")
    const nftArgs: any[] = []
    const invoiceNft = await deploy("InvoiceNFT", {
        from: deployer,
        args: nftArgs,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying InvoiceNFT...")
        await verify(invoiceNft.address, nftArgs)
    }

    log("-------------------------------------------------------------")

    // --- 4. DEPLOY FACTORING ENGINE ---
    log("✅ Deploying FactoringEngine...")
    const engineArgs: any[] = [usdcAddress, invoiceNft.address, vault.address, treasuryAddress]
    const engine = await deploy("FactoringEngine", {
        from: deployer,
        args: engineArgs,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying FactoringEngine...")
        await verify(engine.address, engineArgs)
    }

    log("-------------------------------------------------------------")

    // --- 5. WIRING (Connect System) ---
    log("✅ Wiring the ecosystem (Connecting Vault & InvoiceNFT to Engine)...")
    await execute(
        "InflowVault",
        {
            from: deployer,
            log: true,
        },
        "setFactoringEngine",
        engine.address,
    )

    await execute(
        "InvoiceNFT",
        {
            from: deployer,
            log: true,
        },
        "setFactoringEngine",
        engine.address,
    )

    log("-------------------------------------------------------------")
    log("✅ Inflow Protocol Backend Deployed and Wired Successfully!")
    log("-------------------------------------------------------------")
}

export default deployInflowProtocol
deployInflowProtocol.tags = ["all", "inflow"]
