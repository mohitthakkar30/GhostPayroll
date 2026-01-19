import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './client';

export function getCompanyPDA(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('company'), authority.toBuffer()],
    PROGRAM_ID
  );
}

export function getTreasuryPDA(companyPDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('treasury'), companyPDA.toBuffer()],
    PROGRAM_ID
  );
}

export function getEmployeePDA(
  companyPDA: PublicKey,
  employeeWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('employee'),
      companyPDA.toBuffer(),
      employeeWallet.toBuffer(),
    ],
    PROGRAM_ID
  );
}

export function getPaymentProofPDA(
  companyPDA: PublicKey,
  employeeWallet: PublicKey,
  paymentId: bigint
): [PublicKey, number] {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(paymentId);

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('payment_proof'),
      companyPDA.toBuffer(),
      employeeWallet.toBuffer(),
      buffer,
    ],
    PROGRAM_ID
  );
}
