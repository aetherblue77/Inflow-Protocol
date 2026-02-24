import { network } from "hardhat"
import * as fs from "fs"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const FRONTEND_CONSTANTS_DIR = "../frontend/src/constants"
const FRONTEND_ADDRESSES_FILE = `${FRONTEND_CONSTANTS_DIR}/contractAddresses.json`
const FRONTEND_ABI_FILE = `${FRONTEND_CONSTANTS_DIR}/abis.json`

const updateFrontend: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    if (process.env.UPDATE_FRONTEND) {
        console.log("📦 Building Bridge: Updating frontend constants...")
        await updateContractData(hre)
    }
}

async function updateContractData(hre: HardhatRuntimeEnvironment) {
    const { deployments } = hre
    const chainId = network.config.chainId?.toString()

    // 1. Take the newly deployed contracts for Inflow Protocol
    const engineDeploy = await deployments.get("FactoringEngine")
    const vaultDeploy = await deployments.get("InflowVault")
    const nftDeploy = await deployments.get("InvoiceNFT")
    const usdcDeploy = await deployments.get("MockUSDC")

    // 2. Make sure constants folder exists before reading/writing
    if (!fs.existsSync(FRONTEND_CONSTANTS_DIR)) {
        fs.mkdirSync(FRONTEND_CONSTANTS_DIR, { recursive: true })
    }

    // 3. Read the old file address (if exist)
    let currentAddresses: any = {}
    if (fs.existsSync(FRONTEND_ADDRESSES_FILE)) {
        currentAddresses = JSON.parse(fs.readFileSync(FRONTEND_ADDRESSES_FILE, "utf8"))
    }

    // 4. Update Address per Network (Localhost & Sepolia/Base)
    if (chainId) {
        if (!currentAddresses[chainId]) {
            currentAddresses[chainId] = {}
        }
        currentAddresses[chainId] = {
            FactoringEngine: engineDeploy.address,
            InflowVault: vaultDeploy.address,
            InvoiceNFT: nftDeploy.address,
            MockUSDC: usdcDeploy.address,
        }
    }

    // 5. Save the addresses to JSON
    fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses, null, 2))

    // 6. Save the ABIs to JSON
    const abis = {
        FactoringEngine: engineDeploy.abi,
        InflowVault: vaultDeploy.abi,
        InvoiceNFT: nftDeploy.abi,
        MOckUSDC: usdcDeploy.abi,
    }
    fs.writeFileSync(FRONTEND_ABI_FILE, JSON.stringify(abis, null, 2))

    console.log("✅ Frontend Contract Data (Addresses & ABIs) successfully updated!")
}

export default updateFrontend
updateFrontend.tags = ["all", "frontend"]
