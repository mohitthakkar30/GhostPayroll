'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import WalletButton from '../components/WalletButton';
import Link from 'next/link';
import { useGhostPayroll } from '../hooks/useGhostPayroll';
import { getCompanyPDA } from '../lib/anchor/pdas';

export default function CompanyDashboard() {
  const { connected, publicKey } = useWallet();
  const { program, initializeCompany } = useGhostPayroll();
  const router = useRouter();
  const [hasCompany, setHasCompany] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Check if company exists on mount
  useEffect(() => {
    if (!connected) {
      router.push('/');
      return;
    }

    async function checkCompany() {
      if (!program || !publicKey) {
        setLoading(false);
        return;
      }

      try {
        const [companyPDA] = getCompanyPDA(publicKey);
        const company = await program.account.company.fetch(companyPDA);
        setCompanyData(company);
        setHasCompany(true);
      } catch (err) {
        // Company doesn't exist yet
        setHasCompany(false);
      } finally {
        setLoading(false);
      }
    }

    checkCompany();
  }, [connected, program, publicKey, router]);

  if (!connected) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
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
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ghost-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading company data...</p>
            </div>
          </div>
        </main>
      </div>
    );
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

              <form className="space-y-4" onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                if (!program || !publicKey) return;

                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const paymentFrequency = formData.get('paymentFrequency') as string;

                setCreating(true);
                setError(null);

                try {
                  // Mock budget commitment (32 bytes of zeros for now)
                  const budgetCommitment = Array(32).fill(0);

                  // USDC mint address on devnet
                  const paymentToken = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

                  // Convert payment frequency to enum
                  const frequency = paymentFrequency === '0' ? { weekly: {} } :
                                   paymentFrequency === '1' ? { biweekly: {} } :
                                   { monthly: {} };

                  const signature = await initializeCompany(
                    program,
                    publicKey,
                    name,
                    budgetCommitment,
                    paymentToken,
                    frequency
                  );

                  console.log('Company created! Signature:', signature);

                  // Fetch the newly created company account
                  const [companyPDA] = getCompanyPDA(publicKey);
                  const company = await program.account.company.fetch(companyPDA);
                  setCompanyData(company);
                  setHasCompany(true);
                } catch (err: any) {
                  console.error('Error creating company:', err);
                  setError(err.message || 'Failed to create company');
                } finally {
                  setCreating(false);
                }
              }}>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
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
                  <select
                    name="paymentFrequency"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white"
                  >
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
                    name="initialAmount"
                    min="1"
                    step="0.000001"
                    placeholder="10000"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Minimum: 1 USDC (for treasury funding later)</p>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating Company...' : 'Create Company'}
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
                  <span className="text-white font-medium">{companyData?.name || 'Loading...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Frequency</span>
                  <span className="text-white font-medium">
                    {companyData?.paymentFrequency?.weekly ? 'Weekly' :
                     companyData?.paymentFrequency?.biweekly ? 'Bi-weekly' :
                     companyData?.paymentFrequency?.monthly ? 'Monthly' : 'Loading...'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Employees</span>
                  <span className="text-white font-medium">{companyData?.employeeCount?.toString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Payments Made</span>
                  <span className="text-white font-medium">{companyData?.totalPaymentsMade?.toString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Company PDA</span>
                  <span className="text-white font-mono text-xs">
                    {publicKey ? getCompanyPDA(publicKey)[0].toBase58().slice(0, 8) + '...' + getCompanyPDA(publicKey)[0].toBase58().slice(-8) : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <span className="text-ghost-400 font-medium">{companyData?.isActive ? 'Active' : 'Inactive'}</span>
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
