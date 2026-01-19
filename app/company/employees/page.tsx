'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WalletButton from '../../components/WalletButton';
import Link from 'next/link';

interface Employee {
  id: string;
  walletAddress: string;
  name: string;
  encryptedSalary: string;
  isActive: boolean;
  lastPayment: Date | null;
}

export default function EmployeesPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsEncrypting(true);

    // Simulate encryption delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Add employee on-chain
    setIsEncrypting(false);
    setShowAddModal(false);
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/company" className="text-slate-400 hover:text-white transition-colors">
                ← Back
              </Link>
              <span className="text-slate-500">|</span>
              <h1 className="text-xl font-bold text-ghost-400">Employee Management</h1>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Employees</h2>
              <p className="text-slate-400 text-sm mt-1">Manage your team and their salaries</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-glow flex items-center gap-2"
            >
              <span>+</span> Add Employee
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <div className="text-sm text-slate-400">Total Employees</div>
              <div className="text-2xl font-bold text-ghost-400">{employees.length}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-slate-400">Active</div>
              <div className="text-2xl font-bold text-green-400">{employees.filter(e => e.isActive).length}</div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-slate-400">Monthly Payroll</div>
              <div className="text-2xl font-bold text-white">
                <span className="shimmer inline-block w-24 h-8 rounded"></span>
              </div>
            </div>
          </div>

          {/* Employee List */}
          <div className="glass-card">
            {employees.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-white mb-2">No employees yet</h3>
                <p className="text-slate-400 mb-6">Add your first employee to get started</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200"
                >
                  Add Employee
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-border">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Name</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Wallet</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Salary</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Last Payment</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id} className="border-b border-dark-border hover:bg-dark-card/30 transition-colors">
                        <td className="py-4 px-6 text-white font-medium">{employee.name}</td>
                        <td className="py-4 px-6 text-slate-400 font-mono text-sm">
                          {employee.walletAddress.slice(0, 4)}...{employee.walletAddress.slice(-4)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="encrypted-text">████████</span>
                          <span className="text-xs text-slate-500 ml-2">🔒</span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 text-sm">
                          {employee.lastPayment ? employee.lastPayment.toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            employee.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button className="text-ghost-400 hover:text-ghost-300 text-sm">Edit</button>
                            <button className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-in">
          <div className="glass-card max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Employee</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Employee Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white"
                  required
                  disabled={isEncrypting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="Solana wallet address"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white font-mono text-sm"
                  required
                  disabled={isEncrypting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Monthly Salary (USDC)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.000001"
                  placeholder="5000"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ghost-500 text-white"
                  required
                  disabled={isEncrypting}
                />
                <p className="text-xs text-slate-500 mt-1">Minimum: 1 USDC</p>
              </div>

              {isEncrypting && (
                <div className="bg-ghost-950/30 border border-ghost-800/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-ghost-500 border-t-transparent"></div>
                    <div className="text-sm text-slate-300">
                      <div className="font-medium">Encrypting salary data...</div>
                      <div className="text-xs text-slate-500 mt-1">Using Arcium MPC encryption</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> Generating encryption key
                    </div>
                    <div className="flex items-center gap-2 shimmer">
                      <span className="text-ghost-400">⟳</span> Encrypting salary amount
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span>○</span> Storing on-chain
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-dark-card hover:bg-dark-border text-white font-medium py-2 px-4 rounded-lg transition-colors border border-dark-border"
                  disabled={isEncrypting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isEncrypting}
                >
                  {isEncrypting ? 'Encrypting...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
