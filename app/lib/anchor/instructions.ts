import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { GhostPayroll } from '../../../target/types/ghost_payroll';
import { getCompanyPDA, getTreasuryPDA, getEmployeePDA, getPaymentProofPDA } from './pdas';

export async function initializeCompany(
  program: Program<GhostPayroll>,
  authority: PublicKey,
  name: string,
  budgetCommitment: number[],
  paymentToken: PublicKey,
  paymentFrequency: { weekly: {} } | { biweekly: {} } | { monthly: {} }
) {
  const [companyPDA] = getCompanyPDA(authority);
  const [treasuryPDA] = getTreasuryPDA(companyPDA);

  return await program.methods
    .initializeCompany(name, budgetCommitment, paymentFrequency)
    .accounts({
      company: companyPDA,
      authority,
      paymentToken,
      treasury: treasuryPDA,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();
}

export async function addEmployee(
  program: Program<GhostPayroll>,
  authority: PublicKey,
  employeeWallet: PublicKey,
  encryptedSalary: number[],
  salaryCommitment: number[],
  paymentFrequency: { weekly: {} } | { biweekly: {} } | { monthly: {} }
) {
  const [companyPDA] = getCompanyPDA(authority);
  const [employeePDA] = getEmployeePDA(companyPDA, employeeWallet);

  // Check if employee already exists
  try {
    const existingEmployee = await program.account.employee.fetch(employeePDA);
    if (existingEmployee) {
      throw new Error('Employee already exists in this company');
    }
  } catch (err: any) {
    // If account doesn't exist, that's what we want - continue
    if (!err.message.includes('Account does not exist')) {
      throw err;
    }
  }

  const paymentToken = await getPaymentToken(program, companyPDA);
  const employeeTokenAccount = await getAssociatedTokenAddress(
    paymentToken,
    employeeWallet
  );

  console.log('addEmployee - accounts:', {
    companyPDA: companyPDA.toBase58(),
    employeePDA: employeePDA.toBase58(),
    employeeTokenAccount: employeeTokenAccount.toBase58(),
    paymentToken: paymentToken.toBase58(),
  });

  // Validate arrays
  if (!Array.isArray(encryptedSalary) || !Array.isArray(salaryCommitment)) {
    throw new Error('encryptedSalary and salaryCommitment must be arrays');
  }

  if (salaryCommitment.length !== 32) {
    throw new Error(`salaryCommitment must be exactly 32 bytes, got ${salaryCommitment.length}`);
  }

  console.log('Salary commitment:', {
    length: salaryCommitment.length,
    first8Bytes: salaryCommitment.slice(0, 8),
  });

  // Convert encryptedSalary to Buffer (tests use Buffer.from)
  const encryptedSalaryBuffer = Buffer.from(encryptedSalary);

  // Check if employee's ATA exists, create it if not
  let accountInfo = await program.provider.connection.getAccountInfo(employeeTokenAccount);

  if (!accountInfo) {
    console.log('Creating ATA for employee...');
    try {
      // Create ATA first in a separate transaction
      const createATAIx = createAssociatedTokenAccountInstruction(
        authority, // payer
        employeeTokenAccount, // ata
        employeeWallet, // owner
        paymentToken // mint
      );

      // Send ATA creation transaction first
      const createATATx = await program.provider.sendAndConfirm(
        new Transaction().add(createATAIx),
        []
      );
      console.log('ATA created:', createATATx);

      // Wait a moment and verify ATA was created
      await new Promise(resolve => setTimeout(resolve, 1000));
      accountInfo = await program.provider.connection.getAccountInfo(employeeTokenAccount);

      if (!accountInfo) {
        throw new Error('ATA creation failed - account not found after creation');
      }
      console.log('ATA verified successfully');
    } catch (error: any) {
      // Check if error is because ATA already exists (from previous failed attempt)
      if (error.message?.includes('already been processed') || error.message?.includes('already in use')) {
        console.log('ATA might already exist, verifying...');
        accountInfo = await program.provider.connection.getAccountInfo(employeeTokenAccount);
        if (accountInfo) {
          console.log('ATA exists from previous attempt, continuing...');
        } else {
          throw new Error('ATA creation failed and account still does not exist');
        }
      } else {
        throw error;
      }
    }
  } else {
    console.log('ATA already exists for employee');
  }

  // CRITICAL: Match EXACTLY the IDL
  // IDL accounts: company, employee, authority, employee_token_account, system_program
  // IDL args: employee_wallet, encrypted_salary, salary_commitment, payment_frequency
  const tx = await program.methods
    .addEmployee(employeeWallet, encryptedSalaryBuffer, salaryCommitment, paymentFrequency)
    .accounts({
      company: companyPDA,
      employee: employeePDA,
      authority: authority,
      employeeTokenAccount: employeeTokenAccount,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return tx;
}

export async function processPayment(
  program: Program<GhostPayroll>,
  authority: PublicKey,
  employeeWallet: PublicKey,
  amount: bigint,
  amountCommitment: number[]
) {
  const [companyPDA] = getCompanyPDA(authority);
  const [employeePDA] = getEmployeePDA(companyPDA, employeeWallet);
  const [treasuryPDA] = getTreasuryPDA(companyPDA);

  const paymentToken = await getPaymentToken(program, companyPDA);
  const employeeTokenAccount = await getAssociatedTokenAddress(
    paymentToken,
    employeeWallet
  );

  return await program.methods
    .processPayment(amount, amountCommitment)
    .accounts({
      company: companyPDA,
      employee: employeePDA,
      treasury: treasuryPDA,
      employeeTokenAccount,
      authority,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function recordPaymentProof(
  program: Program<GhostPayroll>,
  authority: PublicKey,
  employeeWallet: PublicKey,
  paymentId: bigint,
  amountCommitment: number[],
  zkProof: number[],
  shadowwireTxSignature: string
) {
  const [companyPDA] = getCompanyPDA(authority);
  const [employeePDA] = getEmployeePDA(companyPDA, employeeWallet);
  const [paymentProofPDA] = getPaymentProofPDA(companyPDA, employeeWallet, paymentId);

  return await program.methods
    .recordPaymentProof(paymentId, amountCommitment, zkProof, shadowwireTxSignature)
    .accounts({
      company: companyPDA,
      employee: employeePDA,
      paymentProof: paymentProofPDA,
      authority,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

// Helper to get payment token from company account
async function getPaymentToken(
  program: Program<GhostPayroll>,
  companyPDA: PublicKey
): Promise<PublicKey> {
  const company = await program.account.company.fetch(companyPDA);
  return company.paymentToken;
}
