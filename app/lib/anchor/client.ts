import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { GhostPayroll } from '../../../target/types/ghost_payroll';
import idl from '../../../target/idl/ghost_payroll.json';

export const PROGRAM_ID = new PublicKey('BW7Efo8SJQhm5TuAiogpJZPjzNKxc4WQhT8PVhBgpsoa');
export const DEVNET_RPC = 'https://api.devnet.solana.com';

export function getProgram(
  connection: Connection,
  wallet: any
): Program<GhostPayroll> {
  const provider = new AnchorProvider(
    connection,
    wallet,
    { commitment: 'confirmed' }
  );

  return new Program<GhostPayroll>(
    idl as any,
    provider
  );
}
