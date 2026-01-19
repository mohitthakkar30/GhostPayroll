'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletButton() {
  return (
    <div className="wallet-button-wrapper">
      <WalletMultiButton className="!bg-ghost-600 hover:!bg-ghost-700 !transition-all !duration-200 !rounded-lg !h-10 !px-4 !text-sm !font-medium" />
    </div>
  );
}
