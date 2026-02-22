import { expect } from "chai"
import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import type { MockUSDC, InflowVault } from "../../typechain-types"

describe("InflowVault Unit Test", function () {
    async function deployVaultFixture() {
        const [admin, investor, hacker, mockEngine] = await ethers.getSigners()
        const mockUSDCFactory = await ethers.getContractFactory("MockUSDC")
        const usdc = (await mockUSDCFactory.deploy()) as unknown as MockUSDC

        const vaultFactory = await ethers.getContractFactory("InflowVault")
        const vault = (await vaultFactory.deploy(await usdc.getAddress())) as unknown as InflowVault

        // Setup initial Fund (Investor deposit 1,000 USDC)
        const ONE_USDC = 10n ** 18n
        const DEPOSIT_AMOUNT = 1000n * ONE_USDC

        await usdc.mint(investor.address, DEPOSIT_AMOUNT)
        await usdc.connect(investor).approve(await vault.getAddress(), DEPOSIT_AMOUNT)
        await vault.connect(investor).deposit(DEPOSIT_AMOUNT, investor.address)

        return { vault, usdc, admin, investor, hacker, mockEngine, ONE_USDC, DEPOSIT_AMOUNT }
    }

    describe("Access Control & Engine Connection", function () {
        it("Should allow admin to set Factoring Engine", async function () {
            const { vault, mockEngine } = await loadFixture(deployVaultFixture)
            await expect(vault.setFactoringEngine(mockEngine.address))
                .to.emit(vault, "EnginedUpdated")
                .withArgs(mockEngine.address)

            expect(await vault.s_factoringEngine()).to.equal(mockEngine.address)
        })

        it("Revert if non-owner tries to set Factoring Engine", async function () {
            const { vault, hacker, mockEngine } = await loadFixture(deployVaultFixture)
            await expect(
                vault.connect(hacker).setFactoringEngine(mockEngine.address),
            ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount")
        })

        it("Revert if setting Engine to Zero Address", async function () {
            const { vault, admin } = await loadFixture(deployVaultFixture)
            await expect(
                vault.connect(admin).setFactoringEngine(ethers.ZeroAddress),
            ).to.be.revertedWithCustomError(vault, "InflowVault__InvalidEngineAddress")
        })

        it("Revert if non-engine tries to borrow money", async function () {
            const { hacker, vault, ONE_USDC } = await loadFixture(deployVaultFixture)
            await expect(
                vault.connect(hacker).lendToEngine(100n * ONE_USDC),
            ).to.be.revertedWithCustomError(vault, "InflowVault__CallerNotEngine")
        })

        it("Revert if non-engine tries to repay", async function () {
            const { hacker, vault, ONE_USDC } = await loadFixture(deployVaultFixture)
            await expect(
                vault.connect(hacker).repayFromEngine(100n * ONE_USDC, 0),
            ).to.be.revertedWithCustomError(vault, "InflowVault__CallerNotEngine")
        })
    })

    describe("Pausable Mechanism (Emergency)", function () {
        it("Should allow owner to Pause and Unpause", async function () {
            const { vault, admin } = await loadFixture(deployVaultFixture)

            await vault.connect(admin).pause()
            expect(await vault.paused()).to.equal(true)

            await vault.connect(admin).unpause()
            expect(await vault.paused()).to.equal(false)
        })

        it("Revert if hacker tries to Pause", async function () {
            const { vault, hacker } = await loadFixture(deployVaultFixture)

            await expect(vault.connect(hacker).pause()).to.be.revertedWithCustomError(
                vault,
                "OwnableUnauthorizedAccount",
            )
        })

        it("Revert if hacker tries to Unpause", async function () {
            const { vault, hacker } = await loadFixture(deployVaultFixture)

            await expect(vault.connect(hacker).unpause()).to.be.revertedWithCustomError(
                vault,
                "OwnableUnauthorizedAccount",
            )
        })

        it("Revert core functions (Deposit/Withdraw/Redeem/Mint) when Paused", async function () {
            const { vault, admin, investor, ONE_USDC } = await loadFixture(deployVaultFixture)

            await vault.connect(admin).pause()

            // Investor try to Deposit -> Revert
            await expect(
                vault.connect(investor).deposit(100n * ONE_USDC, investor.address),
            ).to.be.revertedWithCustomError(vault, "EnforcedPause")

            // Investor try to Withdraw -> Revert
            await expect(
                vault
                    .connect(investor)
                    .withdraw(100n * ONE_USDC, investor.address, investor.address),
            ).to.be.revertedWithCustomError(vault, "EnforcedPause")

            // Investor try to Redeem -> Revert
            await expect(
                vault
                    .connect(investor)
                    .redeem(100n * ONE_USDC, investor.address, investor.address),
            ).to.be.revertedWithCustomError(vault, "EnforcedPause")

            // Investor try to Mint -> Revert
            await expect(
                vault.connect(investor).mint(100n * ONE_USDC, investor.address),
            ).to.be.revertedWithCustomError(vault, "EnforcedPause")
        })

        it("Revert if Engine tries to Repay when paused", async function () {
            const { vault, admin, mockEngine, usdc, ONE_USDC } =
                await loadFixture(deployVaultFixture)

            await vault.setFactoringEngine(mockEngine.address)
            await vault.connect(mockEngine).lendToEngine(100n * ONE_USDC)
            await usdc.connect(mockEngine).approve(await vault.getAddress(), 100n * ONE_USDC)
            await vault.connect(admin).pause()
            await expect(
                vault.connect(mockEngine).repayFromEngine(100n * ONE_USDC, 0),
            ).to.be.revertedWithCustomError(vault, "EnforcedPause")
        })
    })

    describe("Core ERC4626 Functionality", function () {
        it("Should allow withdraw and redeem when Not Paused", async function () {
            const { vault, investor, DEPOSIT_AMOUNT } = await loadFixture(deployVaultFixture)

            // Withdraw 50% of total assets
            // This will trigger: return super.withdraw(...)
            const withdrawAmount = DEPOSIT_AMOUNT / 2n
            await expect(
                vault
                    .connect(investor)
                    .withdraw(withdrawAmount, investor.address, investor.address),
            ).to.emit(vault, "Withdraw")

            // Redeem the remaining shares
            // This will trigger: return super.redeem(...)
            const remainingShares = await vault.balanceOf(investor.address)
            await expect(
                vault
                    .connect(investor)
                    .redeem(remainingShares, investor.address, investor.address),
            ).to.emit(vault, "Withdraw")
        })

        it("Should allow mint when not paused", async function () {
            const { vault, investor, usdc, ONE_USDC } = await loadFixture(deployVaultFixture)

            const mintAmount = 100n * ONE_USDC
            await usdc.mint(investor.address, mintAmount)
            await usdc.connect(investor).approve(await vault.getAddress(), mintAmount)

            await expect(vault.connect(investor).mint(mintAmount, investor.address)).to.emit(
                vault,
                "Deposit",
            )
        })
    })

    describe("Liquidity & Financial Logic", async function () {
        it("Revert if Engine tries to borrow more than available cash", async function () {
            const { vault, admin, ONE_USDC, DEPOSIT_AMOUNT } =
                await loadFixture(deployVaultFixture)

            // Setup: Admin pretend to be Engine for can bypass limit 80%
            await vault.setFactoringEngine(admin.address)

            // Vault has 1000 USDC
            // Admin try to borrow 1001 USDC -> Revert
            const exessiveAmount = DEPOSIT_AMOUNT * (1n * ONE_USDC)
            await expect(
                vault.connect(admin).lendToEngine(exessiveAmount),
            ).to.be.revertedWithCustomError(vault, "InflowVault__InsufficientLiquidity")
        })
    })
})
