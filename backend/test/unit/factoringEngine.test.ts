import { expect } from "chai"
import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import type {MockUSDC, InflowVault, InvoiceNFT, FactoringEngine} from "../../typechain-types"

describe("Factoring Engine RWA System", function () {
    // --- 1. FIXTURE SETUP (setup only once) ---
    async function deployInflowSystemFixture() {
        const [admin, investor, freelancer, client, treasury, hacker] = await ethers.getSigners()
        const mockUSDCFactory = await ethers.getContractFactory("MockUSDC")
        const usdc = (await mockUSDCFactory.deploy()) as unknown as MockUSDC

        const nftFactory = await ethers.getContractFactory("InvoiceNFT")
        const invoiceNFT = (await nftFactory.deploy()) as unknown as InvoiceNFT

        const vaultFactory = await ethers.getContractFactory("InflowVault")
        const vault = (await vaultFactory.deploy(await usdc.getAddress())) as unknown as InflowVault

        const engineFactory = await ethers.getContractFactory("FactoringEngine")

        // Check Constructor Zero Address
        await expect(
            engineFactory.deploy(
                await usdc.getAddress(),
                await invoiceNFT.getAddress(),
                await vault.getAddress(),
                ethers.ZeroAddress, // Error Trigger
            ),
        ).to.be.revertedWithCustomError(engineFactory, "FactoringEngine__InvalidTreasuryAddress")

        const engine = (await engineFactory.deploy(
            await usdc.getAddress(),
            await invoiceNFT.getAddress(),
            await vault.getAddress(),
            treasury.address,
        )) as unknown as FactoringEngine

        // SETUP: Link Contracts
        await invoiceNFT.setFactoringEngine(await engine.getAddress())
        await vault.setFactoringEngine(await engine.getAddress())

        // SETUP: Constants Data
        const DECIMALS = 18n
        const ONE_USDC = 10n ** DECIMALS

        // Scenario Invoice $1,000
        const TOTAL_INVOICE = 1000n * ONE_USDC
        const ADVANCE_AMOUNT = 800n * ONE_USDC // 80%
        const FEE_AMOUNT = 20n * ONE_USDC // 2%
        const DUE_TIMESTAMP = 1735689600
        const IPFS_URI = "ipfs://QmYourInvoiceMetadata"

        // Config base on Contract
        const ORIGINATION_FEE_BPS = 100n // 1%
        const INVESTOR_SHARE_BPS = 5000n // 50%
        const MAX_UTILIZATION_BPS = 8000n // 80%

        // SETUP FUNDING: Investor Funding
        // Mint 10,000 USDC to Investor
        await usdc.mint(investor.address, 10000n * ONE_USDC)
        // Investor Approve Vault
        await usdc.connect(investor).approve(await vault.getAddress(), 10000n * ONE_USDC)
        // Investor Deposit 5,000 USDC
        await vault.connect(investor).deposit(5000n * ONE_USDC, investor.address)

        // Return all variables
        return {
            usdc,
            invoiceNFT,
            vault,
            engine,
            admin,
            investor,
            freelancer,
            client,
            treasury,
            hacker,
            TOTAL_INVOICE,
            ADVANCE_AMOUNT,
            FEE_AMOUNT,
            DUE_TIMESTAMP,
            IPFS_URI,
            ONE_USDC,
            ORIGINATION_FEE_BPS,
            INVESTOR_SHARE_BPS,
            MAX_UTILIZATION_BPS,
        }
    }

    // --- 2. TEST CASES ---
    describe("Business Logic & Cashflow", function () {
        it("Should deduct Upfront Fee (1%) correctly upon funding", async function () {
            const {
                engine,
                usdc,
                admin,
                freelancer,
                treasury,
                client,
                TOTAL_INVOICE,
                ADVANCE_AMOUNT,
                FEE_AMOUNT,
                DUE_TIMESTAMP,
                IPFS_URI,
                ORIGINATION_FEE_BPS,
            } = await loadFixture(deployInflowSystemFixture)

            // 1. Calculate Expected Fee
            // Fee = 800 * 1% = 8 USDC
            const expectedUpfrontFee = (ADVANCE_AMOUNT * ORIGINATION_FEE_BPS) / 10000n
            // Net = 800 - 8 = 792 USDC
            const expectedNetToFreelancer = ADVANCE_AMOUNT - expectedUpfrontFee

            // 2. Execute Funding
            await engine
                .connect(admin)
                .fundInvoice(
                    freelancer.address,
                    TOTAL_INVOICE,
                    ADVANCE_AMOUNT,
                    FEE_AMOUNT,
                    DUE_TIMESTAMP,
                    client.address,
                    IPFS_URI,
                )

            // 3. Verify Balances
            // Freelancer must receive 792 USDC
            expect(await usdc.balanceOf(freelancer.address)).to.equal(expectedNetToFreelancer)
            // Treasury must receive 8 USDC (FIRST CASHFLOW!)
            expect(await usdc.balanceOf(treasury.address)).to.equal(expectedUpfrontFee)
        })

        it("Should execute funding even if Upfront Fee is Zero (Small Advance)", async function () {
            const { engine, usdc, admin, freelancer, client, DUE_TIMESTAMP, IPFS_URI } =
                await loadFixture(deployInflowSystemFixture)

            const TINY_ADVANCE = 90n // 90 Wei. Fee = 90 * 1% = 0.9 -> 0
            const TOTAL = 1000n
            const FEE = 10n

            // Make sure not revert
            await expect(
                engine
                    .connect(admin)
                    .fundInvoice(
                        freelancer.address,
                        TOTAL,
                        TINY_ADVANCE,
                        FEE,
                        DUE_TIMESTAMP,
                        client.address,
                        IPFS_URI,
                    ),
            ).to.emit(engine, "InvoiceFunded")
        })

        it("Should maintain Vault Share Price (totalAssets) during lending", async function () {
            const {
                engine,
                vault,
                admin,
                freelancer,
                client,
                TOTAL_INVOICE,
                ADVANCE_AMOUNT,
                FEE_AMOUNT,
                DUE_TIMESTAMP,
                IPFS_URI,
                ONE_USDC,
            } = await loadFixture(deployInflowSystemFixture)

            const initialAssets = await vault.totalAssets()
            expect(initialAssets).to.equal(5000n * ONE_USDC)

            // Fund Invoice (Outflow 800 from Vault)
            await engine
                .connect(admin)
                .fundInvoice(
                    freelancer.address,
                    TOTAL_INVOICE,
                    ADVANCE_AMOUNT,
                    FEE_AMOUNT,
                    DUE_TIMESTAMP,
                    client.address,
                    IPFS_URI,
                )

            // Check Total Assets (Should still be 5,000)
            // Because 4,200 Cash + 800 Liabilites
            const currentAssets = await vault.totalAssets()
            expect(currentAssets).to.equal(5000n * ONE_USDC)
        })

        it("Should split Backend Profit (50:50) correctly upon settlement", async function () {
            const {
                engine,
                vault,
                usdc,
                admin,
                freelancer,
                client,
                treasury,
                TOTAL_INVOICE,
                ADVANCE_AMOUNT,
                FEE_AMOUNT,
                DUE_TIMESTAMP,
                IPFS_URI,
                ONE_USDC,
                INVESTOR_SHARE_BPS,
            } = await loadFixture(deployInflowSystemFixture)

            // Fund First
            await engine
                .connect(admin)
                .fundInvoice(
                    freelancer.address,
                    TOTAL_INVOICE,
                    ADVANCE_AMOUNT,
                    FEE_AMOUNT,
                    DUE_TIMESTAMP,
                    client.address,
                    IPFS_URI,
                )

            // Client Pay
            await usdc.mint(client.address, TOTAL_INVOICE)
            await usdc.connect(client).approve(await engine.getAddress(), TOTAL_INVOICE)

            // Note Treasury balance before settlement
            const treasuryBefore = await usdc.balanceOf(treasury.address)

            // Execute Settlement
            await engine.connect(client).settleInvoice(0)

            // Verify Split Logic
            // Total Fee = 20 USDC
            // Investor Share = 20 * 50% = 10 USDC
            const investorShare = (FEE_AMOUNT * INVESTOR_SHARE_BPS) / 10000n
            // Company Share = 10 USDC
            const companyShare = FEE_AMOUNT - investorShare

            expect(await vault.totalAssets()).to.equal(5000n * ONE_USDC + investorShare)
            expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + companyShare)
        })

        it("Should settle correctly even if Company Profit is Zero", async function () {
            const { engine, usdc, admin, freelancer, client, ONE_USDC, DUE_TIMESTAMP, IPFS_URI } =
                await loadFixture(deployInflowSystemFixture)

            // Funding with 0 Fee
            const TOTAL = 1000n * ONE_USDC
            const ADVANCE = 800n * ONE_USDC
            const ZERO_FEE = 0n

            await engine
                .connect(admin)
                .fundInvoice(
                    freelancer.address,
                    TOTAL,
                    ADVANCE,
                    ZERO_FEE,
                    DUE_TIMESTAMP,
                    client.address,
                    IPFS_URI,
                )

            await usdc.mint(client.address, TOTAL)
            await usdc.connect(client).approve(await engine.getAddress(), TOTAL)

            await expect(engine.connect(client).settleInvoice(0)).to.not.be.reverted
        })

        it("Should settle correctly even if Reserve Amount is Zero", async function () {
            const { engine, usdc, admin, freelancer, client, ONE_USDC, DUE_TIMESTAMP, IPFS_URI } =
                await loadFixture(deployInflowSystemFixture)

            const ADVANCE = 800n * ONE_USDC
            const FEE = 200n * ONE_USDC
            const TOTAL = ADVANCE + FEE // 1000 USDC. Reserve = 1000 - (800 + 20) = 0

            await engine
                .connect(admin)
                .fundInvoice(
                    freelancer.address,
                    TOTAL,
                    ADVANCE,
                    FEE,
                    DUE_TIMESTAMP,
                    client.address,
                    IPFS_URI,
                )

            await usdc.mint(client.address, TOTAL)
            await usdc.connect(client).approve(await engine.getAddress(), TOTAL)

            // Settle. Reserve 0.
            // Branch If (reserveAmount > 0) will be skipped (False).
            await expect(engine.connect(client).settleInvoice(0)).to.not.be.reverted
        })
    })

    describe("Security & Edge Cases", function () {
        it("Revert if utilization exceeds 80% (Liquidity Guard)", async function () {
            const {
                engine,
                admin,
                freelancer,
                client,
                FEE_AMOUNT,
                DUE_TIMESTAMP,
                IPFS_URI,
                ONE_USDC,
            } = await loadFixture(deployInflowSystemFixture)

            // Vault Balance: 5,000 USDC
            // Max Lending (80%): 4,000 USDC
            const DUMMY_INVOICE = 10000n * ONE_USDC
            const DUMMY_ADVANCE = 4100n * ONE_USDC // request 4,100 (More than 4,000)

            await expect(
                engine
                    .connect(admin)
                    .fundInvoice(
                        freelancer.address,
                        DUMMY_INVOICE,
                        DUMMY_ADVANCE,
                        FEE_AMOUNT,
                        DUE_TIMESTAMP,
                        client.address,
                        IPFS_URI,
                    ),
            ).to.be.revertedWithCustomError(engine, "FactoringEngine__UtilizationLimitExceeded")
        })

        it("Revert if treasury address is Zero (Constructor Check)", async function () {
            const { usdc, invoiceNFT, vault } = await loadFixture(deployInflowSystemFixture)
            const engineFactory = await ethers.getContractFactory("FactoringEngine")

            await expect(
                engineFactory.deploy(
                    await usdc.getAddress(),
                    await invoiceNFT.getAddress(),
                    await vault.getAddress(),
                    ethers.ZeroAddress,
                ),
            ).to.be.revertedWithCustomError(
                engineFactory,
                "FactoringEngine__InvalidTreasuryAddress",
            )
        })

        it("Revert if non-admin tries to fund invoice", async function () {
            const {
                engine,
                freelancer,
                client,
                hacker,
                TOTAL_INVOICE,
                ADVANCE_AMOUNT,
                FEE_AMOUNT,
                DUE_TIMESTAMP,
                IPFS_URI,
            } = await loadFixture(deployInflowSystemFixture)

            await expect(
                engine
                    .connect(hacker)
                    .fundInvoice(
                        freelancer.address,
                        TOTAL_INVOICE,
                        ADVANCE_AMOUNT,
                        FEE_AMOUNT,
                        DUE_TIMESTAMP,
                        client.address,
                        IPFS_URI,
                    ),
            ).to.be.revertedWithCustomError(engine, "OwnableUnauthorizedAccount")
        })

        it("Revert if Advance + Fee > Total Amount", async function () {
            const { engine, admin, freelancer, client, DUE_TIMESTAMP, IPFS_URI, ONE_USDC } =
                await loadFixture(deployInflowSystemFixture)

            const TOTAL = 1000n * ONE_USDC
            const ADVANCE_AMOUNT = 900n * ONE_USDC
            const FEE = 101n * ONE_USDC

            await expect(
                engine
                    .connect(admin)
                    .fundInvoice(
                        freelancer.address,
                        TOTAL,
                        ADVANCE_AMOUNT,
                        FEE,
                        DUE_TIMESTAMP,
                        client.address,
                        IPFS_URI,
                    ),
            ).to.be.revertedWithCustomError(engine, "FactoringEngine__InvalidAmount")
        })

        it("Revert if trying to settle an invoice twice", async function () {
            const {
                engine,
                usdc,
                admin,
                freelancer,
                client,
                TOTAL_INVOICE,
                ADVANCE_AMOUNT,
                FEE_AMOUNT,
                DUE_TIMESTAMP,
                IPFS_URI,
            } = await loadFixture(deployInflowSystemFixture)

            await engine
                .connect(admin)
                .fundInvoice(
                    freelancer.address,
                    TOTAL_INVOICE,
                    ADVANCE_AMOUNT,
                    FEE_AMOUNT,
                    DUE_TIMESTAMP,
                    client.address,
                    IPFS_URI,
                )

            await usdc.mint(client.address, TOTAL_INVOICE)
            await usdc.connect(client).approve(await engine.getAddress(), TOTAL_INVOICE)
            await engine.connect(client).settleInvoice(0)

            await expect(engine.connect(client).settleInvoice(0)).to.be.revertedWithCustomError(
                engine,
                "FactoringEngine__InvoiceAlreadySettled",
            )
        })

        it("Revert if trying to settle non-existent invoice", async function () {
            const { engine, client } = await loadFixture(deployInflowSystemFixture)

            await expect(engine.connect(client).settleInvoice(999)).to.be.revertedWithCustomError(
                engine,
                "FactoringEngine__InvoiceNotFound",
            )
        })
    })

    describe("Configuration & Emergency", function () {
        it("Should allow admin to update Treasury address", async function () {
            const { engine, admin, hacker } = await loadFixture(deployInflowSystemFixture)
            const newTreasury = hacker.address
            await expect(engine.connect(admin).setTreasury(newTreasury))
                .to.emit(engine, "TreasuryUpdated")
                .withArgs(newTreasury)

            expect(await engine.treasury()).to.equal(newTreasury)
        })

        it("Revert if Hacker tries to set treasury", async function () {
            const { engine, hacker } = await loadFixture(deployInflowSystemFixture)
            await expect(
                engine.connect(hacker).setTreasury(hacker.address),
            ).to.be.revertedWithCustomError(engine, "OwnableUnauthorizedAccount")
        })

        it("Revert if setting treasury to zero address", async function () {
            const { engine, admin } = await loadFixture(deployInflowSystemFixture)

            await expect(
                engine.connect(admin).setTreasury(ethers.ZeroAddress),
            ).to.be.revertedWithCustomError(engine, "FactoringEngine__InvalidTreasuryAddress")
        })

        it("Should allow admin to rescue stuck funds", async function () {
            const { engine, usdc, admin, ONE_USDC } = await loadFixture(deployInflowSystemFixture)

            const STUCK_AMOUNT = 500n * ONE_USDC
            await usdc.mint(await engine.getAddress(), STUCK_AMOUNT)

            const adminBalanceBefore = await usdc.balanceOf(admin.address)
            await engine.connect(admin).rescueFunds(await usdc.getAddress(), STUCK_AMOUNT)
            const adminBalanceAfter = await usdc.balanceOf(admin.address)

            expect(adminBalanceAfter - adminBalanceBefore).to.equal(STUCK_AMOUNT)
        })

        it("Revert if Hacker tries to rescue funds", async function () {
            const { engine, hacker, usdc, ONE_USDC } = await loadFixture(deployInflowSystemFixture)
            await expect(
                engine.connect(hacker).rescueFunds(await usdc.getAddress(), 100n * ONE_USDC),
            ).to.be.revertedWithCustomError(engine, "OwnableUnauthorizedAccount")
        })
    })
})
