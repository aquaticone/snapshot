import * as dotenv from "dotenv-flow"
dotenv.config()

import fs from "fs/promises"
import { Alchemy, Network } from "alchemy-sdk"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import path from "path"

yargs(hideBin(process.argv))
  .command("$0", "Take snapshot", () => {}, takeSnapshot)
  .option("contract", {
    alias: "c",
    type: "string",
    array: true,
    description:
      "NFT contract address. Use multiple times to find intersection of holders for multiple NFTs.",
  })
  .option("save", {
    alias: "s",
    type: "boolean",
    description: "Write snapshot result to file in ./snapshots",
  })
  .option("name", {
    alias: "n",
    type: "string",
    description: "Supplemental prefix for filename for easier identification",
  })
  .usage("Usage: $0 -c [contractAddressA] -c [contractAddressB]")
  .demandOption(["c"])
  .parse()

async function takeSnapshot({
  contract: contracts,
  name: filenamePrefix,
  save,
}) {
  const alchemy = new Alchemy({
    apiKey: process.env.ALCHEMY_KEY,
    network: Network.ETH_MAINNET,
  })
  const holders = []

  for (let i = 0; i < contracts.length; i++) {
    holders.push((await alchemy.nft.getOwnersForContract(contracts[i])).owners)
  }

  if (!holders.length) {
    console.log("No holders found")
    return
  }

  const commonHolders =
    holders.length === 1
      ? holders[0]
      : holders.reduce((commonHolders, addresses) =>
          commonHolders.filter((address) => addresses.includes(address))
        )
  const output = commonHolders.join("\n")

  if (save) {
    const filename = getFilename(contracts, filenamePrefix)
    await saveResult(filename, output)
  }

  console.log(
    `${output}\n==========================================\n${commonHolders.length} holders in common`
  )
}

function getFilename(contracts, filenamePrefix) {
  return contracts
    .reduce(
      (parts, contract) => [...parts, contract],
      filenamePrefix
        ? [filenamePrefix, new Date().toISOString()]
        : [new Date().toISOString()]
    )
    .join("_")
}

async function saveResult(filename, content) {
  await fs.writeFile(
    path.join(process.cwd(), "snapshots", filename),
    content,
    "utf-8"
  )
}
