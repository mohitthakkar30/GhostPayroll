'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { getProgram } from '../lib/anchor/client';
import * as instructions from '../lib/anchor/instructions';

export function useGhostPayroll() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.publicKey) return null;
    return getProgram(connection, wallet);
  }, [connection, wallet]);

  return {
    program,
    connected: wallet.connected,
    publicKey: wallet.publicKey,
    ...instructions,
  };
}
