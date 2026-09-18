import { ethers } from 'ethers';
import { PreparedTransactionDto } from '@/lib/api/types';
import { CHAIN_ID } from './config';

import batchAbi from './abis/Batch.json';
import custodyAbi from './abis/Custody.json';
import prescriptionAbi from './abis/Prescription.json';
import dispensingAbi from './abis/Dispensing.json';
import verificationAbi from './abis/Verification.json';
import accessControlAbi from './abis/AccessControl.json';

const CONTRACT_ABIS: Record<string, any[]> = {
  Batch: batchAbi,
  Custody: custodyAbi,
  Prescription: prescriptionAbi,
  Dispensing: dispensingAbi,
  Verification: verificationAbi,
  AccessControl: accessControlAbi,
};

export interface SubmitTxOptions {
  confirmations?: number;
  onTxSubmitted?: (txHash: string) => void;
}

export interface SubmitTxResult {
  txHash: string;
  receipt: ethers.TransactionReceipt | null;
}

export class WalletTransactionError extends Error {
  code: 'rejected_by_user' | 'reverted' | 'wrong_network' | 'insufficient_funds' | 'unknown';
  originalError: any;

  constructor(
    code: 'rejected_by_user' | 'reverted' | 'wrong_network' | 'insufficient_funds' | 'unknown',
    message: string,
    originalError?: any,
  ) {
    super(message);
    this.name = 'WalletTransactionError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * THE ONLY PLACE in the entire frontend where signer.sendTransaction is called.
 * Encodes calldata from PreparedTransactionDto against verified ABIs,
 * enforces correct chain ID, submits to L2, and awaits confirmation.
 */
export async function submitTx(
  signer: ethers.Signer,
  prepared: PreparedTransactionDto,
  options: SubmitTxOptions = {},
): Promise<SubmitTxResult> {
  const { confirmations = 1, onTxSubmitted } = options;

  // 1. Assert chainId matches configured L2
  if (signer.provider) {
    const net = await signer.provider.getNetwork();
    const currentChainId = Number(net.chainId);
    if (currentChainId !== CHAIN_ID) {
      throw new WalletTransactionError(
        'wrong_network',
        `Wallet is connected to chain ID ${currentChainId}, but target network is ${CHAIN_ID}. Please switch network in your wallet.`,
      );
    }
  }

  // 2. Resolve ABI
  const abi = CONTRACT_ABIS[prepared.contract];
  if (!abi) {
    throw new Error(`Unknown contract "${prepared.contract}". Check lib/web3/abis.`);
  }

  // 3. Encode calldata
  let calldata: string;
  try {
    const iface = new ethers.Interface(abi);
    calldata = iface.encodeFunctionData(prepared.method, prepared.args);
  } catch (err: any) {
    console.error(`[submitTx] Encoding error on ${prepared.contract}.${prepared.method}:`, err);
    throw new Error(`Failed to encode transaction calldata for ${prepared.contract}.${prepared.method}: ${err.message}`);
  }

  // 4. Build transaction payload
  const txRequest: ethers.TransactionRequest = {
    to: prepared.address,
    data: calldata,
    value: prepared.value ? BigInt(prepared.value) : undefined,
  };

  // 5. Submit transaction through user's own wallet
  let txResponse: ethers.TransactionResponse;
  try {
    txResponse = await signer.sendTransaction(txRequest);
  } catch (err: any) {
    console.warn(`[submitTx] Wallet submission error:`, err);
    const msg = (err?.message || '').toLowerCase();
    const code = err?.code;

    if (code === 'ACTION_REJECTED' || msg.includes('user rejected') || msg.includes('declined') || msg.includes('cancelled')) {
      throw new WalletTransactionError('rejected_by_user', 'Transaction was rejected in MetaMask.', err);
    }
    if (code === 'INSUFFICIENT_FUNDS' || msg.includes('insufficient funds')) {
      throw new WalletTransactionError('insufficient_funds', 'Insufficient ETH in wallet to pay for transaction gas.', err);
    }
    if (msg.includes('revert')) {
      throw new WalletTransactionError('reverted', 'Transaction was reverted by smart contract rules.', err);
    }
    throw new WalletTransactionError('unknown', err?.message || 'Transaction submission failed.', err);
  }

  const txHash = txResponse.hash;
  if (onTxSubmitted) {
    onTxSubmitted(txHash);
  }

  // 6. Await receipt
  let receipt: ethers.TransactionReceipt | null = null;
  try {
    receipt = await txResponse.wait(confirmations);
  } catch (err: any) {
    console.error(`[submitTx] Error waiting for receipt on tx ${txHash}:`, err);
    if (err?.message?.includes('revert')) {
      throw new WalletTransactionError('reverted', `Transaction reverted on-chain. Tx: ${txHash}`, err);
    }
    throw new WalletTransactionError('unknown', err?.message || 'Error confirming transaction receipt.', err);
  }

  if (receipt && receipt.status === 0) {
    throw new WalletTransactionError('reverted', `Transaction reverted by the network. Tx: ${txHash}`);
  }

  return {
    txHash,
    receipt,
  };
}
