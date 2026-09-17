import addressesJson from './addresses.json';

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532', 10);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org';
export const EXPLORER_BASE_URL =
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL ||
  (CHAIN_ID === 84532 ? 'https://sepolia.basescan.org' : 'https://sepolia.arbiscan.io');

export const CONTRACT_ADDRESSES: Record<string, string> = addressesJson || {};

export function getContractAddress(contractName: string): string {
  const addr = CONTRACT_ADDRESSES[contractName];
  if (!addr) {
    console.warn(`[web3/config] No address found for contract "${contractName}". Make sure sync-abis has run.`);
    return '';
  }
  return addr;
}
