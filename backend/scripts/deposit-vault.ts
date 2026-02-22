import { ethers, deployments, getNamedAccounts } from "hardhat"
import type { MockUSDC, InflowVault } from "../typechain-types"

async function main() {
    const { deployer } = await getNamedAccounts()

    // 1. Retrieve the newly deployed contract data
    const usdcDeployment = await deployments.get("MockUSDC")
    const vaultDeployment = await deployments.get("InflowVault")

    // 2. Make instance Ethers.js ready to use
    const usdc = await ethers.getContractAt("MockUSDC", usdcDeployment.address) as unknown as MockUSDC
    const vault = await ethers.getContractAt("InflowVault", vaultDeployment.address) as unknown as InflowVault

    // 3. Simulate to Deposit Fund $50,000 USDC
    const depositAmount = ethers.parseUnits("50000", 6)

    console.log("⏳ 1. Minting $50,000 MockUSDC to Investor...")
    const mintTx = await usdc.mint(deployer, depositAmount)
    await mintTx.wait(1)

    console.log("⏳ 2. Approving InflowVault to spend USDC...")
    const approveTx = await usdc.approve(vault.target, depositAmount)
    await approveTx.wait(1)

    console.log("⏳ 3. Depositing USDC into the Vault...")
    const depositTx = await vault.deposit(depositAmount, deployer)
    await depositTx.wait(1)

    console.log("✅ Vault successfully deposited with $50,000.")
    console.log("🚀 Inflow Protocol is now LIQUID and ready to fund real-world invoices!")
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
