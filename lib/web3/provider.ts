import { ethers } from 'ethers';
import { RPC_URL } from './config';

export function getBrowserProvider(): ethers.BrowserProvider | null {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return null;
  }
  return new ethers.BrowserProvider((window as any).ethereum);
}

export function getJsonRpcProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export async function getSigner(): Promise<ethers.Signer | null> {
  const provider = getBrowserProvider();
  if (!provider) return null;
  try {
    return await provider.getSigner();
  } catch {
    return null;
  }
}
