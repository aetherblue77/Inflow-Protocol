# ⚙️ Inflow Protocol: Backend Architecture

Welcome to the core financial engine of Inflow Protocol. This directory contains the entirely decentralized, trustless, and institutional-grade smart contract infrastructure that powers our Real-World Asset (RWA) invoice factoring system.

The backend is strictly designed to handle real-world business logic: securing liquidity, tokenizing invoices, executing instant cash advances, and routing profit yields with absolute mathematical precision.

---

## 🏗️ 1. Smart Contracts (The Core)

All smart contracts are written in Solidity and are heavily optimized for gas efficiency and security. Currently, there are 4 main contracts deployed:

* **`FactoringEngine.sol`**
    * *The Brain.* This is the central controller of the protocol. It handles the business logic: verifying invoice data, pulling funds from the Vault to pay freelancers, calculating the Origination Fee, and mathematically splitting the final yield between the investors and the company's Treasury when a client settles their debt.
* **`InflowVault.sol`**
    * *The Bank.* A decentralized liquidity pool where investors deposit their stablecoins (USDC). The Vault is "dumb but secure"—it strictly holds money and only allows the `FactoringEngine` to withdraw capital when funding a verified invoice.
* **`InvoiceNFT.sol`**
    * *The Proof of Ownership.* Tokenizes real-world B2B invoices into ERC-721 Non-Fungible Tokens (NFTs). This NFT serves as the immutable legal receipt and proof of corporate debt on the blockchain.
* **`MockUSDC.sol`**
    * *The Simulator.* A standard ERC-20 token contract created exclusively for local testing and Testnet environments to simulate real US Dollars (USDC) flowing through the system.

---

## 🚀 2. Deployment Scripts (Infrastructure as Code)

We use automated scripts to ensure our deployment is flawless and reproducible across any EVM network.

* **`01-deploy-inflow-protocol.ts`**
    * This is the master blueprint. It deploys all the contracts in the correct order, wires them together (connecting the Vault and NFT to the Engine), and dynamically sets up the institutional-grade **Treasury Routing** to ensure operational funds and company revenue are strictly isolated from block zero.

---

## 🛡️ 3. Unit Testing (100% Coverage)

Security is not an option; it's a requirement. We have achieved 100% Line, Function, and Branch coverage to ensure every edge case is bulletproof.

* **`factoringEngine.test.ts`**: Verifies all financial mathematics, fee splits, zero-address checks, and ensures the protocol correctly blocks unauthorized access or Reentrancy attacks.
* **`inflowVault.test.ts`**: Tests the liquidity mechanics, ensuring deposits, withdrawals, and access controls work flawlessly so investor funds are never locked or stolen.
* **`invoiceNft.test.ts`**: Ensures only the Engine can mint or update the payment status of an invoice NFT.

---

## 💸 4. Execution Scripts (Real-World Simulation)

To prove the business model is 100% operational, we built 3 execution scripts to simulate the real-world flow of funds on the blockchain:

* **`deposit-vault.ts`**
    * Simulates an investor (Liquidity Provider) injecting USDC capital into the `InflowVault`. This makes the protocol liquid and ready to deploy cash.
* **`fund-invoice.ts`**
    * Simulates the protocol tokenizing an invoice, instantly sending the cash advance (minus the upfront Origination Fee) to the freelancer, and securely routing the company's fee to the Treasury wallet.
* **`settle-invoice.ts`**
    * Simulates the "Payday". A client (or third-party escrow) pays the $10,000 debt. The engine automatically repays the Vault's principal + investor yield, sends the company's profit split to the Treasury, and unlocks the remaining reserve for the freelancer.

---

## 🛠️ Technology Stack & Frameworks

This backend is built using the modern Web3 developer stack:
* **Smart Contract Language:** Solidity (`^0.8.28`)
* **Development Environment:** Hardhat
* **Scripting & Testing:** TypeScript, Ethers.js (v6)
* **Testing Framework:** Mocha & Chai
* **Standard Libraries:** OpenZeppelin Contracts (for ERC20, ERC721, Ownable, and SafeERC20 implementations)