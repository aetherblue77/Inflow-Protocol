import {ethers, deployments} from "hardhat"
import type {FactoringEngine, MockUSDC} from "../typechain-types"

async function main() {
    // Deployer as Client

    console.log("🔥 Initiating RWA Invoice Settlement (Permission Payment)")
    console.log("===========================================================")
    
    const engineDeployment = await deployments.get("FactoringEngine")
    const engine = await ethers.getContractAt("FactoringEngine", engineDeployment.address) as unknown as FactoringEngine

    const usdcDeployment = await deployments.get("MockUSDC")
    const usdc = await ethers.getContractAt("MockUSDC", usdcDeployment.address) as unknown as MockUSDC

    // Get Vault Address & Treasury Address from Contract
    const vaultAddress = await engine.vault()
    const treasuryAddress = await engine.treasury()

    // Target Invoice ID to Settle
    const invoiceId = 0

    // Read Invoice Data from Blockchain
    const invoice = await engine.invoices(invoiceId)
    const freelancerAddress = invoice.issuer
    const totalAmount = invoice.totalAmount // $10,000 mUSDC

    if (invoice.isSettled) {
        console.log("❌ ERROR: Invoice is already settled!")
        return
    }

    console.log("📌 Invoice Data Fetched On-Chain:")
    console.log(`- Freelancer Wallet : ${freelancerAddress}`)
    console.log(`- Debt to Settle : ${ethers.formatUnits(totalAmount, 6)}`)

    // Snapshot Balance before Execution
    const vaultBalanceBefore = await usdc.balanceOf(vaultAddress)
    const treasuryBalanceBefore = await usdc.balanceOf(treasuryAddress)
    const freelancerBalanceBefore = await usdc.balanceOf(freelancerAddress)

    console.log("⏳ Simulating 3rd Party Payment (Approving $10,000 mUSDC)...")
    // Approve Engine to get Money from Client (For this case is Deployer)
    const approveTx = await usdc.approve(engineDeployment.address, totalAmount)
    await approveTx.wait(1)

    console.log("⏳ Executing Settlement & Routing Profit...")
    const settleTx = await engine.settleInvoice(invoiceId)
    const receipt = await settleTx.wait(1)

    // Snapshot Balance after Execution
    const vaultBalanceAfter = await usdc.balanceOf(vaultAddress)
    const treasuryBalanceAfter = await usdc.balanceOf(treasuryAddress)
    const freelancerBalanceAfter = await usdc.balanceOf(freelancerAddress)

    // Count for the Profit
    const vaultProfit = vaultBalanceAfter - vaultBalanceBefore
    const treasuryProfit = treasuryBalanceAfter -treasuryBalanceBefore
    const freelancerReserve = freelancerBalanceAfter - freelancerBalanceBefore

    console.log(`✅ BINGO! Invoice Successfully Settled (Tx: ${receipt?.hash})`)
    console.log("===========================================================")
    console.log(`📊 Inflow Protocol Final Settlement Scoreboard:`)
    console.log(`🏦 Vault Received       : +$${ethers.formatUnits(vaultProfit, 6)} (Principal + Yield)`)
    console.log(`💼 Treasury Received    : +$${ethers.formatUnits(treasuryProfit, 6)} (Yield Split)`)
    console.log(`🎯 Freelancer Received  : +$${ethers.formatUnits(freelancerReserve, 6)} (Reserve Unlocked)`)
    console.log("===========================================================")
    console.log(`🔥 The cycle is complete. RWA Engine is 100% Operational!`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
