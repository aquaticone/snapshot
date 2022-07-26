import * as dotenv from "dotenv-flow"
dotenv.config()

import { Alchemy, Network } from "alchemy-sdk"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"

yargs(hideBin(process.argv))
  .command("$0", "Take snapshot", () => {}, takeSnapshot)
  .option("contract", {
    alias: "c",
    type: "string",
    array: true,
    description:
      "NFT contract address. Use multiple times to find intersection of holders for multiple NFTs.",
  })
  .demandOption(["c"])
  .parse()

async function takeSnapshot({ contract: contracts }) {
  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_KEY,
    network: Network.ETH_MAINNET,
  })
  const holders = []
  for (let i = 0; i < contracts.length; i++) {
    holders.push((await alchemy.nft.getOwnersForContract(contracts[i])).owners)
  }
  if (holders.length === 0) {
    console.log("No holders found")
    return
  }
  if (holders.length === 1) {
    console.log(holders[0].join("\n"))
    return
  }
  console.log(
    holders
      .reduce((commonHolders, addresses) =>
        commonHolders.filter((address) => addresses.includes(address))
      )
      .join("\n")
  )
}
