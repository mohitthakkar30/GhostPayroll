'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WalletButton from '../components/WalletButton';
import Link from 'next/link';

export default function CompanyDashboard() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [hasCompany, setHasCompany] = useState(false);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-ghost-400">Ghost Payroll</h1>
              <span className="text-slate-500">|</span>
              <span className="text-sm text-slate-400">Company Dashboard</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasCompany ? (
          /* Company Creation View */
          <div className="max-w-2xl mx-auto space-y-6 animate-slide-in">
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Company</h2>
              <p className="text-slate-400 mb-6">Initialize your payroll system on Solana</p>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                // TODO: Initialize company on-chain
                setHasCompany(true);
              }}>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Frequency
                  </label>
                  <select className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white">
                    <option value="0">Weekly</option>
                    <option value="1">Bi-weekly</option>
                    <option value="2">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Initial Treasury Amount (USDC)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.000001"
                    placeholder="10000"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum: 1 USDC</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-glow"
                >
                  Create Company
                </button>
              </form>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-ghost-300 mb-3 flex items-center gap-2">
                <span>ℹ️</span> What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>• Company PDA created on Solana</li>
                <li>• Treasury account initialized</li>
                <li>• Ready to add employees</li>
                <li>• Process payments privately</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Dashboard View */
          <div className="space-y-6 animate-slide-in">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-6">
                <div className="text-sm text-slate-400 mb-1">Treasury Balance</div>
                <div className="text-2xl font-bold text-white">
                  <span className="shimmer inline-block w-24 h-8 rounded"></span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Encrypted</div>
              </div>

              <div className="glass-card p-6">
                <div className="text-sm text-slate-400 mb-1">Total Employees</div>
                <div className="text-2xl font-bold text-ghost-400">0</div>
                <div className="text-xs text-slate-500 mt-1">Active</div>
              </div>

              <div className="glass-card p-6">
                <div className="text-sm text-slate-400 mb-1">Payments This Month</div>
                <div className="text-2xl font-bold text-ghost-400">0</div>
                <div className="text-xs text-slate-500 mt-1">Completed</div>
              </div>

              <div className="glass-card p-6">
                <div className="text-sm text-slate-400 mb-1">Total Paid</div>
                <div className="text-2xl font-bold text-white">
                  <span className="shimmer inline-block w-20 h-8 rounded"></span>
                </div>
                <div className="text-xs text-slate-500 mt-1">All time</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/company/employees">
                  <button className="w-full bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 lift-hover flex items-center justify-center gap-2">
                    <span>👥</span> Manage Employees
                  </button>
                </Link>

                <Link href="/company/payments">
                  <button className="w-full bg-dark-card hover:bg-dark-border text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 lift-hover flex items-center justify-center gap-2 border border-dark-border">
                    <span>💸</span> Process Payments
                  </button>
                </Link>

                <button className="w-full bg-dark-card hover:bg-dark-border text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 lift-hover flex items-center justify-center gap-2 border border-dark-border">
                  <span>💰</span> Fund Treasury
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-2">📊</div>
                <p>No activity yet</p>
                <p className="text-sm mt-1">Add employees and process payments to see activity</p>
              </div>
            </div>

            {/* Company Info */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Company Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Company Name</span>
                  <span className="text-white font-medium">Acme Inc.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Frequency</span>
                  <span className="text-white font-medium">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Company PDA</span>
                  <span className="text-white font-mono text-xs">{publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network</span>
                  <span className="text-ghost-400 font-medium">Devnet</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
