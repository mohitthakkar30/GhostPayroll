'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WalletButton from '../../components/WalletButton';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  walletAddress: string;
  selected: boolean;
}

type PaymentStage = 'idle' | 'generating-proof' | 'processing' | 'complete' | 'error';

export default function PaymentsPage() {
  const { connected } = useWallet();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [paymentStage, setPaymentStage] = useState<PaymentStage>('idle');
  const [usePrivateTransfer, setUsePrivateTransfer] = useState(true);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  const selectedCount = employees.filter(e => e.selected).length;

  const handleProcessPayment = async () => {
    if (selectedCount === 0) return;

    // Stage 1: Generating ZK proof
    setPaymentStage('generating-proof');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stage 2: Processing payment
    setPaymentStage('processing');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stage 3: Complete
    setPaymentStage('complete');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Reset
    setPaymentStage('idle');
    setEmployees(employees.map(e => ({ ...e, selected: false })));
  };

  const toggleEmployee = (id: string) => {
    setEmployees(employees.map(e =>
      e.id === id ? { ...e, selected: !e.selected } : e
    ));
  };

  const selectAll = () => {
    setEmployees(employees.map(e => ({ ...e, selected: true })));
  };

  const deselectAll = () => {
    setEmployees(employees.map(e => ({ ...e, selected: false })));
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
              <h1 className="text-xl font-bold text-ghost-400">Process Payments</h1>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Payment Options */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">Payment Configuration</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <div className="font-semibold text-white">Private Transfer</div>
                    <div className="text-sm text-slate-400">Hide payment amounts using ShadowWire ZK proofs</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePrivateTransfer}
                    onChange={(e) => setUsePrivateTransfer(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-border rounded-full peer peer-checked:bg-ghost-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              {usePrivateTransfer && (
                <div className="bg-ghost-950/30 border border-ghost-800/30 rounded-lg p-4 text-sm text-slate-400 animate-slide-in">
                  <div className="flex items-start gap-2">
                    <span className="text-ghost-400 mt-0.5">ℹ️</span>
                    <div>
                      <div className="font-medium text-ghost-300">Private transfers enabled</div>
                      <div className="mt-1">Payment amounts will be hidden on-chain. A 1% relayer fee applies for ShadowWire protocol.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee Selection */}
          <div className="glass-card">
            <div className="p-6 border-b border-dark-border">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Select Employees</h2>
                  <p className="text-sm text-slate-400 mt-1">{selectedCount} of {employees.length} selected</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-ghost-400 hover:text-ghost-300 transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="text-5xl mb-4">💸</div>
                <h3 className="text-xl font-semibold text-white mb-2">No employees to pay</h3>
                <p className="text-slate-400 mb-6">Add employees first to process payments</p>
                <Link href="/company/employees">
                  <button className="bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200">
                    Add Employees
                  </button>
                </Link>
              </div>
            ) : (
              <div className="p-6 space-y-3">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => toggleEmployee(employee.id)}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      employee.selected
                        ? 'border-ghost-600 bg-ghost-950/30'
                        : 'border-dark-border hover:border-dark-border/50 bg-dark-bg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={employee.selected}
                          onChange={() => {}}
                          className="w-4 h-4 text-ghost-600 rounded focus:ring-ghost-500"
                        />
                        <div>
                          <div className="font-semibold text-white">{employee.name}</div>
                          <div className="text-sm text-slate-400 font-mono">
                            {employee.walletAddress.slice(0, 8)}...{employee.walletAddress.slice(-8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Salary</div>
                        <div className="encrypted-text text-sm">████████</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Process Payment Button */}
          {employees.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-slate-400">Total Payment</div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {selectedCount > 0 ? (
                      <span className="shimmer inline-block w-32 h-8 rounded"></span>
                    ) : (
                      <span className="text-slate-600">Select employees</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleProcessPayment}
                  disabled={selectedCount === 0 || paymentStage !== 'idle'}
                  className="bg-ghost-600 hover:bg-ghost-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 hover:shadow-glow"
                >
                  {paymentStage === 'idle' && 'Process Payment'}
                  {paymentStage === 'generating-proof' && 'Generating Proof...'}
                  {paymentStage === 'processing' && 'Processing...'}
                  {paymentStage === 'complete' && '✓ Complete'}
                </button>
              </div>

              {selectedCount > 0 && (
                <div className="text-xs text-slate-500 space-y-1">
                  <div>• Platform fee: 0.3%</div>
                  {usePrivateTransfer && <div>• ShadowWire relayer fee: 1%</div>}
                  <div>• Estimated transaction time: ~2 seconds</div>
                </div>
              )}
            </div>
          )}

          {/* Payment Processing Modal */}
          {paymentStage !== 'idle' && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-slide-in">
              <div className="glass-card max-w-md w-full p-8">
                <div className="text-center">
                  {paymentStage === 'generating-proof' && (
                    <>
                      <div className="text-5xl mb-4 animate-pulse-slow">🔒</div>
                      <h3 className="text-xl font-bold text-white mb-2">Generating ZK Proof</h3>
                      <p className="text-slate-400 mb-6">Creating zero-knowledge proof for private transfer...</p>
                      <div className="space-y-3 text-sm text-left">
                        <div className="flex items-center gap-2 text-green-400">
                          <span>✓</span> Payment amounts committed
                        </div>
                        <div className="flex items-center gap-2 text-ghost-400 shimmer">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-ghost-500 border-t-transparent"></div>
                          <span>Generating Bulletproof...</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>○</span> Broadcasting transaction
                        </div>
                      </div>
                    </>
                  )}

                  {paymentStage === 'processing' && (
                    <>
                      <div className="text-5xl mb-4 animate-spin">⟳</div>
                      <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
                      <p className="text-slate-400 mb-6">Sending private transfers via ShadowWire relayer...</p>
                      <div className="space-y-3 text-sm text-left">
                        <div className="flex items-center gap-2 text-green-400">
                          <span>✓</span> ZK proof generated
                        </div>
                        <div className="flex items-center gap-2 text-green-400">
                          <span>✓</span> Transaction signed
                        </div>
                        <div className="flex items-center gap-2 text-ghost-400 shimmer">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-ghost-500 border-t-transparent"></div>
                          <span>Confirming on Solana...</span>
                        </div>
                      </div>
                    </>
                  )}

                  {paymentStage === 'complete' && (
                    <>
                      <div className="text-5xl mb-4">✓</div>
                      <h3 className="text-xl font-bold text-white mb-2">Payment Complete!</h3>
                      <p className="text-slate-400 mb-6">{selectedCount} employee{selectedCount > 1 ? 's' : ''} paid successfully</p>
                      <div className="bg-ghost-950/30 border border-ghost-800/30 rounded-lg p-4 text-sm text-left space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status</span>
                          <span className="text-green-400">Confirmed</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Privacy</span>
                          <span className="text-ghost-400">Hidden on-chain 🔒</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Signature</span>
                          <span className="text-white font-mono text-xs">abc123...xyz789</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setPaymentStage('idle')}
                        className="mt-6 w-full bg-ghost-600 hover:bg-ghost-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Done
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
