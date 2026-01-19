'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import WalletButton from './components/WalletButton';
import { useEffect } from 'react';

export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected) {
      // Auto-redirect to company dashboard when wallet connects
      router.push('/company');
    }
  }, [connected, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-radial from-ghost-900/20 via-transparent to-transparent pointer-events-none" />

      <div className="z-10 max-w-4xl w-full text-center space-y-8 animate-slide-in">
        {/* Logo/Title */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-ghost-400 via-ghost-500 to-ghost-600 bg-clip-text text-transparent">
            Ghost Payroll
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Enterprise payroll with <span className="text-ghost-400 font-semibold">zero-knowledge proofs</span> and <span className="text-ghost-400 font-semibold">encrypted salaries</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="glass-card p-6 lift-hover">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-ghost-300 mb-2">Private Transfers</h3>
            <p className="text-sm text-slate-400">Payment amounts hidden on-chain using ShadowWire ZK proofs</p>
          </div>

          <div className="glass-card p-6 lift-hover">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-ghost-300 mb-2">Encrypted Salaries</h3>
            <p className="text-sm text-slate-400">MPC encryption via Arcium - only you can see your salary</p>
          </div>

          <div className="glass-card p-6 lift-hover">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold text-ghost-300 mb-2">Instant Payouts</h3>
            <p className="text-sm text-slate-400">Real-time notifications via Helius, cash out with Starpay</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 space-y-4">
          <p className="text-slate-400 text-sm">Connect your wallet to get started</p>
          <WalletButton />
        </div>

        {/* Stats */}
        <div className="mt-16 flex justify-center gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-ghost-400">100%</div>
            <div className="text-sm text-slate-500">Private</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ghost-400">&lt; 2s</div>
            <div className="text-sm text-slate-500">Settlement</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ghost-400">0.3%</div>
            <div className="text-sm text-slate-500">Fee</div>
          </div>
        </div>

        {/* Built on Solana badge */}
        <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ghost-950/30 border border-ghost-800/30">
          <span className="text-sm text-slate-400">Built on</span>
          <span className="text-sm font-semibold bg-gradient-to-r from-[#14F195] to-[#9945FF] bg-clip-text text-transparent">Solana</span>
        </div>
      </div>
    </main>
  );
}
