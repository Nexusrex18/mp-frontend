import { EXPLORER_BASE_URL } from './config';

export function getExplorerTxUrl(txHash: string): string {
  if (!txHash) return EXPLORER_BASE_URL;
  return `${EXPLORER_BASE_URL}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string): string {
  if (!address) return EXPLORER_BASE_URL;
  return `${EXPLORER_BASE_URL}/address/${address}`;
}

export function getExplorerBlockUrl(blockNumber: number | string): string {
  if (!blockNumber) return EXPLORER_BASE_URL;
  return `${EXPLORER_BASE_URL}/block/${blockNumber}`;
}
