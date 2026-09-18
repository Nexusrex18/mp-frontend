import * as fs from 'fs';
import * as path from 'path';

async function syncAbis() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const configUrl = `${apiBaseUrl}/web3/config`;

  console.log(`\n========================================`);
  console.log(`[sync-abis] Fetching Web3 configuration from ${configUrl}...`);
  console.log(`========================================\n`);

  let res: Response;
  try {
    res = await fetch(configUrl);
  } catch (err: any) {
    console.error(`\n❌ [sync-abis] FATAL: Could not connect to backend at ${configUrl}.`);
    console.error(`Make sure the backend server is running on port 3001 before building frontend.\n`);
    console.error(err);
    process.exit(1);
  }

  if (!res.ok) {
    console.error(`\n❌ [sync-abis] FATAL: Server returned HTTP ${res.status}: ${res.statusText}`);
    const text = await res.text();
    console.error(`Response body: ${text}\n`);
    process.exit(1);
  }

  const data = await res.json();
  if (!data || !data.contracts) {
    console.error(`\n❌ [sync-abis] FATAL: Invalid response from /web3/config — missing 'contracts' dictionary.`);
    console.error(data);
    process.exit(1);
  }

  const abisDir = path.resolve(process.cwd(), 'lib/web3/abis');
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  const addresses: Record<string, string> = {};

  for (const [contractName, contractData] of Object.entries<any>(data.contracts)) {
    if (!contractData.address || !contractData.abi) {
      console.warn(`⚠️ [sync-abis] Contract ${contractName} is missing address or abi. Skipping.`);
      continue;
    }

    const abiFilePath = path.join(abisDir, `${contractName}.json`);
    fs.writeFileSync(abiFilePath, JSON.stringify(contractData.abi, null, 2), 'utf-8');
    addresses[contractName] = contractData.address;
    console.log(`✓ Synchronized ABI: lib/web3/abis/${contractName}.json (${contractData.abi.length} items)`);
  }

  const addressesFilePath = path.resolve(process.cwd(), 'lib/web3/addresses.json');
  fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2), 'utf-8');
  console.log(`✓ Synchronized Addresses: lib/web3/addresses.json`);

  console.log(`\n========================================`);
  console.log(`[sync-abis] All contract ABIs and addresses synchronized successfully!`);
  console.log(`========================================\n`);
}

syncAbis().catch((err) => {
  console.error(`\n❌ [sync-abis] Unexpected error:`, err);
  process.exit(1);
});
