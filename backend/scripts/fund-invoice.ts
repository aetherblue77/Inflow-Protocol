import {ethers, deployments, network} from "hardhat"
import type {FactoringEngine, MockUSDC} from "../typechain-types"

async function main() {
    
    let freelancerAddress: string
    let clientAddress: string

    if (network.name === "localhost" || network.name === "hardhat") {
        const signers = await ethers.getSigners()
        freelancerAddress = signers[1].address
        clientAddress = signers[2].address
        console.log("[Local Mode] Use dummy address hardhat")
    } else {
        freelancerAddress = process.env.TESTNET_FREELANCER_ADDRESS!.toLowerCase() // Freelancer's Account
        clientAddress = process.env.TESTNET_CLIENT_ADDRESS!.toLowerCase() // Client's Account
        console.log("[Testnet Mode] Use real address")
    }

    console.log("🚀 Initiating RWA Invoice Funding")
    console.log(`========================================================`)

    const engineDeployment = await deployments.get("FactoringEngine")
    const engine = (await ethers.getContractAt("FactoringEngine", engineDeployment.address)) as unknown as FactoringEngine

    const usdcDeployment = await deployments.get("MockUSDC")
    const usdc = (await ethers.getContractAt("MockUSDC", usdcDeployment.address)) as unknown as MockUSDC

    // Get Treasury Address from Contract
    const treasuryAddress = await engine.treasury()

    // Setup Business Parameters ($10,000 Total, $8,000 Advance, $200 Factoring Fee)
    const totalAmount = ethers.parseUnits("10000", 6)
    const advanceAmount = ethers.parseUnits("8000", 6)
    const feeAmount = ethers.parseUnits("200", 6) // 2% Factoring Fee

    // Due Date: 30 Days from this exact second
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const dueTimestamp = currentTimestamp + (30 * 24 * 60 * 60)

    // Mock IPFS metadata representing the real-world PDF Invoice
    const uri = "ipfs://QmSimulationInvoiceDataRWA123456789"

    // Snapshot Balances Before Execution
    const freelancerBalanceBefore = await usdc.balanceOf(freelancerAddress)
    const treasuryBalanceBefore = await usdc.balanceOf(treasuryAddress)
    
    console.log(`⏳ Executing Factoring Engine...`)

    // THE FUND INVOICE FUNCTION
    const tx = await engine.fundInvoice(
        freelancerAddress,
        totalAmount,
        advanceAmount,
        feeAmount,
        dueTimestamp,
        clientAddress,
        uri
    )

    const receipt = await tx.wait(1)

    // Verify Economic Success
    const freelancerBalanceAfter = await usdc.balanceOf(freelancerAddress)
    const treasuryBalanceAfter = await usdc.balanceOf(treasuryAddress)

    const netToFreelancer = freelancerBalanceAfter - freelancerBalanceBefore
    const revenueToTreasury = treasuryBalanceAfter - treasuryBalanceBefore
    
    console.log(`✅ BINGO! Invoice Successfully Funded (Tx: ${receipt?.hash})`)
    console.log(`========================================================`)
    console.log(`📊 Inflow Protocol Financial Scoreboard:`)
    console.log(`💸 Total Invoice Value     : $10,000.00`)
    console.log(`💰 Capital Deployed        : $8,000.00`)
    console.log(`🎯 Received by Freelancer  : $${ethers.formatUnits(netToFreelancer, 6)}`)
    console.log(`🏦 Treasury Revenue        : $${ethers.formatUnits(revenueToTreasury, 6)} (Origination Fee)`)
    console.log(`========================================================`)
    console.log(`🔥 Inflow Protocol just printed real-world yield!`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})