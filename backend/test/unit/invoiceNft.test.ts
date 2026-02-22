import { ethers } from "hardhat"
import { expect } from "chai"
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import type {InvoiceNFT} from "../../typechain-types"

describe("InvoiceNFT Unit Test", function () {
    async function deployInvoiceNftFixture() {
        const [admin, mockEngine, hacker, client, seller] = await ethers.getSigners()
        const nftFactory = await ethers.getContractFactory("InvoiceNFT")
        const invoiceNFT = (await nftFactory.deploy()) as unknown as InvoiceNFT

        return { invoiceNFT, admin, mockEngine, hacker, client, seller }
    }

    it("Revert if non-owner tries to set Factoring Engine", async function () {
        const { invoiceNFT, hacker, mockEngine } = await loadFixture(deployInvoiceNftFixture)

        await expect(
            invoiceNFT.connect(hacker).setFactoringEngine(mockEngine.address),
        ).to.be.revertedWithCustomError(invoiceNFT, "OwnableUnauthorizedAccount")
    })

    it("Revert if non-engine tries to mark invoice as paid", async function () {
        const { invoiceNFT, mockEngine, admin, hacker, seller, client } =
            await loadFixture(deployInvoiceNftFixture)

        await invoiceNFT.setFactoringEngine(mockEngine.address)
        await invoiceNFT
            .connect(mockEngine)
            .mintInvoice(admin.address, seller.address, "uri", 100, 0, client.address)
        await expect(invoiceNFT.connect(hacker).markAsPaid(0)).to.be.revertedWithCustomError(
            invoiceNFT,
            "InvoiceNFT__CallerNotEngine",
        )
    })

    it("Revert if caller is not engine (Access Control)", async function () {
        const { admin, mockEngine, client, invoiceNFT, seller } =
            await loadFixture(deployInvoiceNftFixture)
        await invoiceNFT.setFactoringEngine(mockEngine.address)
        await expect(
            invoiceNFT
                .connect(admin)
                .mintInvoice(admin.address, seller, "uri", 100, 0, client.address),
        ).to.be.revertedWithCustomError(invoiceNFT, "InvoiceNFT__CallerNotEngine")
    })

    it("Revert if setting engine to zero address", async function () {
        const { admin, invoiceNFT } = await loadFixture(deployInvoiceNftFixture)
        await expect(
            invoiceNFT.setFactoringEngine(ethers.ZeroAddress),
        ).to.be.revertedWithCustomError(invoiceNFT, "InvoiceNFT__InvalidEngineAddress")
    })

    it("Revert if marking an invoice as paid twice", async function () {
        const { admin, mockEngine, invoiceNFT, client, seller } =
            await loadFixture(deployInvoiceNftFixture)
        await invoiceNFT.setFactoringEngine(mockEngine.address)
        await invoiceNFT
            .connect(mockEngine)
            .mintInvoice(admin.address, seller, "uri", 100, 0, client.address)
        await invoiceNFT.connect(mockEngine).markAsPaid(0)
        await expect(invoiceNFT.connect(mockEngine).markAsPaid(0)).to.be.revertedWithCustomError(
            invoiceNFT,
            "InvoiceNFT__InvoiceAlreadyPaid",
        )
    })

    it("Should return correct invoice details (View)", async function () {
        const { admin, mockEngine, client, invoiceNFT, seller } =
            await loadFixture(deployInvoiceNftFixture)
        await invoiceNFT.setFactoringEngine(mockEngine.address)

        const AMOUNT = 5000n
        const URI = "ipfs://test-data"

        await invoiceNFT
            .connect(mockEngine)
            .mintInvoice(admin.address, seller, URI, AMOUNT, 0, client.address)
        const data = await invoiceNFT.getInvoiceDetails(0)

        expect(data.originalSeller).to.equal(seller.address)
        expect(data.clientAddress).to.equal(client.address)
        expect(data.invoiceAmount).to.equal(AMOUNT)
        expect(data.isPaid).to.equal(false)
    })
})
