import { run } from "hardhat"

export async function verify(contractAddress: string, args: any[]) {
    console.log("🔍 Starting Verification process...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e: any) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log("❌ Error verifying contract", e)
        }
    }
}
