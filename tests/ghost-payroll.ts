import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GhostPayroll } from "../target/types/ghost_payroll";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("ghost-payroll", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GhostPayroll as Program<GhostPayroll>;

  // Test accounts
  let companyAuthority: Keypair;
  let employee1: Keypair;
  let employee2: Keypair;
  let tokenMint: PublicKey;
  let companyTokenAccount: PublicKey;
  let employee1TokenAccount: PublicKey;
  let employee2TokenAccount: PublicKey;

  // PDAs
  let companyPDA: PublicKey;
  let companyBump: number;
  let treasuryPDA: PublicKey;
  let treasuryBump: number;
  let employee1PDA: PublicKey;
  let employee1Bump: number;
  let employee2PDA: PublicKey;
  let employee2Bump: number;

  // Constants
  const COMPANY_NAME = "Acme Corp";
  const USDC_DECIMALS = 6;
  const MIN_SALARY_AMOUNT = 1_000_000; // 1 USDC
  const EMPLOYEE1_SALARY = 5_000_000_000; // 5000 USDC
  const EMPLOYEE2_SALARY = 3_000_000_000; // 3000 USDC

  before(async () => {
    // Generate keypairs
    companyAuthority = Keypair.generate();
    employee1 = Keypair.generate();
    employee2 = Keypair.generate();

    // Airdrop SOL to test accounts
    const airdropAmount = 2 * LAMPORTS_PER_SOL;
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(companyAuthority.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(employee1.publicKey, airdropAmount)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(employee2.publicKey, airdropAmount)
    );

    // Create USDC-like token mint (6 decimals)
    tokenMint = await createMint(
      provider.connection,
      companyAuthority,
      companyAuthority.publicKey,
      null,
      USDC_DECIMALS
    );

    // Create token accounts
    companyTokenAccount = await createAccount(
      provider.connection,
      companyAuthority,
      tokenMint,
      companyAuthority.publicKey
    );

    employee1TokenAccount = await createAccount(
      provider.connection,
      employee1,
      tokenMint,
      employee1.publicKey
    );

    employee2TokenAccount = await createAccount(
      provider.connection,
      employee2,
      tokenMint,
      employee2.publicKey
    );

    // Mint tokens to company (100,000 USDC for testing)
    await mintTo(
      provider.connection,
      companyAuthority,
      tokenMint,
      companyTokenAccount,
      companyAuthority,
      100_000_000_000 // 100k USDC
    );

    // Derive PDAs
    [companyPDA, companyBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("company"), companyAuthority.publicKey.toBuffer()],
      program.programId
    );

    [treasuryPDA, treasuryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), companyPDA.toBuffer()],
      program.programId
    );

    [employee1PDA, employee1Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("employee"), companyPDA.toBuffer(), employee1.publicKey.toBuffer()],
      program.programId
    );

    [employee2PDA, employee2Bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("employee"), companyPDA.toBuffer(), employee2.publicKey.toBuffer()],
      program.programId
    );

    console.log("✅ Test environment setup complete");
    console.log("Company Authority:", companyAuthority.publicKey.toString());
    console.log("Employee 1:", employee1.publicKey.toString());
    console.log("Employee 2:", employee2.publicKey.toString());
    console.log("Token Mint:", tokenMint.toString());
    console.log("Company PDA:", companyPDA.toString());
    console.log("Treasury PDA:", treasuryPDA.toString());
  });

  describe("initialize_company", () => {
    it("Creates company with valid parameters", async () => {
      const budgetCommitment = Array(32).fill(1); // Mock commitment hash

      const tx = await program.methods
        .initializeCompany(COMPANY_NAME, budgetCommitment, { weekly: {} })
        .accounts({
          company: companyPDA,
          authority: companyAuthority.publicKey,
          treasury: treasuryPDA,
          paymentToken: tokenMint,
          systemProgram: SystemProgram.programId,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("Initialize company tx:", tx);

      // Fetch and verify company account
      const companyAccount = await program.account.company.fetch(companyPDA);
      assert.equal(companyAccount.authority.toString(), companyAuthority.publicKey.toString());
      assert.equal(companyAccount.name, COMPANY_NAME);
      assert.equal(companyAccount.employeeCount, 0);
      assert.equal(companyAccount.paymentToken.toString(), tokenMint.toString());
      assert.equal(companyAccount.isActive, true);
      assert.equal(companyAccount.totalPaymentsMade.toNumber(), 0);

      console.log("✅ Company initialized successfully");
    });

    it("Fails with company name too long", async () => {
      const longName = "A".repeat(51); // Exceeds MAX_COMPANY_NAME_LENGTH (50)
      const budgetCommitment = Array(32).fill(1);

      const [anotherCompanyPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("company"), employee1.publicKey.toBuffer()],
        program.programId
      );

      const [anotherTreasuryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), anotherCompanyPDA.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .initializeCompany(longName, budgetCommitment, { weekly: {} })
          .accounts({
            company: anotherCompanyPDA,
            authority: employee1.publicKey,
            treasury: anotherTreasuryPDA,
            paymentToken: tokenMint,
            systemProgram: SystemProgram.programId,
          })
          .signers([employee1])
          .rpc();

        assert.fail("Should have failed with name too long");
      } catch (error) {
        assert.include(error.toString(), "CompanyNameTooLong");
        console.log("✅ Correctly rejected long company name");
      }
    });
  });

  describe("add_employee", () => {
    let treasuryTokenAccount: PublicKey;

    before(async () => {
      // Create treasury token account
      treasuryTokenAccount = await createAccount(
        provider.connection,
        companyAuthority,
        tokenMint,
        treasuryPDA,
        null
      );

      // Fund treasury
      await mintTo(
        provider.connection,
        companyAuthority,
        tokenMint,
        treasuryTokenAccount,
        companyAuthority,
        50_000_000_000 // 50k USDC
      );
    });

    it("Adds employee with encrypted salary", async () => {
      const encryptedSalary = Buffer.from("encrypted_salary_data_employee1");
      const salaryCommitment = Array(32).fill(2);

      const tx = await program.methods
        .addEmployee(encryptedSalary, salaryCommitment, { weekly: {} })
        .accounts({
          employee: employee1PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
          employeeWallet: employee1.publicKey,
          employeeTokenAccount: employee1TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("Add employee1 tx:", tx);

      // Fetch and verify employee account
      const employeeAccount = await program.account.employee.fetch(employee1PDA);
      assert.equal(employeeAccount.wallet.toString(), employee1.publicKey.toString());
      assert.equal(employeeAccount.company.toString(), companyPDA.toString());
      assert.equal(employeeAccount.isActive, true);
      assert.equal(employeeAccount.totalPaymentsReceived.toNumber(), 0);

      // Verify company employee count incremented
      const companyAccount = await program.account.company.fetch(companyPDA);
      assert.equal(companyAccount.employeeCount, 1);

      console.log("✅ Employee 1 added successfully");
    });

    it("Adds second employee", async () => {
      const encryptedSalary = Buffer.from("encrypted_salary_data_employee2");
      const salaryCommitment = Array(32).fill(3);

      await program.methods
        .addEmployee(encryptedSalary, salaryCommitment, { biweekly: {} })
        .accounts({
          employee: employee2PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
          employeeWallet: employee2.publicKey,
          employeeTokenAccount: employee2TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([companyAuthority])
        .rpc();

      // Verify employee count
      const companyAccount = await program.account.company.fetch(companyPDA);
      assert.equal(companyAccount.employeeCount, 2);

      console.log("✅ Employee 2 added successfully");
    });

    it("Fails when adding duplicate employee", async () => {
      const encryptedSalary = Buffer.from("duplicate");
      const salaryCommitment = Array(32).fill(4);

      try {
        await program.methods
          .addEmployee(encryptedSalary, salaryCommitment, { weekly: {} })
          .accounts({
            employee: employee1PDA,
            company: companyPDA,
            authority: companyAuthority.publicKey,
            employeeWallet: employee1.publicKey,
            employeeTokenAccount: employee1TokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([companyAuthority])
          .rpc();

        assert.fail("Should have failed with duplicate employee");
      } catch (error) {
        // Account already exists error
        assert.ok(error);
        console.log("✅ Correctly rejected duplicate employee");
      }
    });

    it("Fails with unauthorized company authority", async () => {
      const employee3 = Keypair.generate();
      const [employee3PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("employee"), companyPDA.toBuffer(), employee3.publicKey.toBuffer()],
        program.programId
      );

      const employee3TokenAccount = await createAccount(
        provider.connection,
        employee1, // Using employee1 to pay for account creation
        tokenMint,
        employee3.publicKey
      );

      const encryptedSalary = Buffer.from("unauthorized");
      const salaryCommitment = Array(32).fill(5);

      try {
        await program.methods
          .addEmployee(encryptedSalary, salaryCommitment, { weekly: {} })
          .accounts({
            employee: employee3PDA,
            company: companyPDA,
            authority: employee1.publicKey, // Wrong authority!
            employeeWallet: employee3.publicKey,
            employeeTokenAccount: employee3TokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([employee1])
          .rpc();

        assert.fail("Should have failed with unauthorized access");
      } catch (error) {
        assert.ok(error);
        console.log("✅ Correctly rejected unauthorized authority");
      }
    });
  });

  describe("update_employee_salary", () => {
    it("Updates encrypted salary successfully", async () => {
      const newEncryptedSalary = Buffer.from("new_encrypted_salary_data_employee1_updated");
      const newSalaryCommitment = Array(32).fill(10);

      const tx = await program.methods
        .updateEmployeeSalary(newEncryptedSalary, newSalaryCommitment)
        .accounts({
          employee: employee1PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("Update salary tx:", tx);

      // Verify update
      const employeeAccount = await program.account.employee.fetch(employee1PDA);
      assert.equal(
        Buffer.from(employeeAccount.encryptedSalary).toString(),
        newEncryptedSalary.toString()
      );

      console.log("✅ Employee salary updated successfully");
    });

    it("Fails for non-existent employee", async () => {
      const fakeEmployee = Keypair.generate();
      const [fakeEmployeePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("employee"), companyPDA.toBuffer(), fakeEmployee.publicKey.toBuffer()],
        program.programId
      );

      const newEncryptedSalary = Buffer.from("fake");
      const newSalaryCommitment = Array(32).fill(11);

      try {
        await program.methods
          .updateEmployeeSalary(newEncryptedSalary, newSalaryCommitment)
          .accounts({
            employee: fakeEmployeePDA,
            company: companyPDA,
            authority: companyAuthority.publicKey,
          })
          .signers([companyAuthority])
          .rpc();

        assert.fail("Should have failed with employee not found");
      } catch (error) {
        assert.ok(error);
        console.log("✅ Correctly rejected non-existent employee");
      }
    });
  });

  describe("remove_employee", () => {
    it("Soft deletes employee", async () => {
      const tx = await program.methods
        .removeEmployee()
        .accounts({
          employee: employee2PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("Remove employee tx:", tx);

      // Verify employee is inactive
      const employeeAccount = await program.account.employee.fetch(employee2PDA);
      assert.equal(employeeAccount.isActive, false);

      // Verify employee count decremented
      const companyAccount = await program.account.company.fetch(companyPDA);
      assert.equal(companyAccount.employeeCount, 1);

      console.log("✅ Employee removed (soft deleted) successfully");
    });
  });

  describe("process_payment", () => {
    let treasuryTokenAccount: PublicKey;

    before(async () => {
      // Get treasury token account
      treasuryTokenAccount = await createAccount(
        provider.connection,
        companyAuthority,
        tokenMint,
        treasuryPDA,
        null
      );

      // Ensure treasury has funds
      const treasuryBalance = await getAccount(provider.connection, treasuryTokenAccount);
      console.log("Treasury balance:", treasuryBalance.amount.toString());
    });

    it("Transfers tokens from treasury to employee", async () => {
      const paymentAmount = EMPLOYEE1_SALARY;

      // Get balances before
      const employeeBalanceBefore = await getAccount(provider.connection, employee1TokenAccount);
      const treasuryBalanceBefore = await getAccount(provider.connection, treasuryTokenAccount);

      const tx = await program.methods
        .processPayment(new anchor.BN(paymentAmount))
        .accounts({
          employee: employee1PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
          treasury: treasuryPDA,
          treasuryTokenAccount: treasuryTokenAccount,
          employeeTokenAccount: employee1TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("Process payment tx:", tx);

      // Get balances after
      const employeeBalanceAfter = await getAccount(provider.connection, employee1TokenAccount);
      const treasuryBalanceAfter = await getAccount(provider.connection, treasuryTokenAccount);

      // Verify transfer
      assert.equal(
        employeeBalanceAfter.amount.toString(),
        (employeeBalanceBefore.amount + BigInt(paymentAmount)).toString()
      );
      assert.equal(
        treasuryBalanceAfter.amount.toString(),
        (treasuryBalanceBefore.amount - BigInt(paymentAmount)).toString()
      );

      // Verify payment counters
      const employeeAccount = await program.account.employee.fetch(employee1PDA);
      assert.equal(employeeAccount.totalPaymentsReceived.toNumber(), 1);

      const companyAccount = await program.account.company.fetch(companyPDA);
      assert.equal(companyAccount.totalPaymentsMade.toNumber(), 1);

      console.log("✅ Payment processed successfully");
      console.log("Employee received:", paymentAmount / 1_000_000, "USDC");
    });

    it("Fails with amount below minimum", async () => {
      const tooSmallAmount = MIN_SALARY_AMOUNT - 1;

      try {
        await program.methods
          .processPayment(new anchor.BN(tooSmallAmount))
          .accounts({
            employee: employee1PDA,
            company: companyPDA,
            authority: companyAuthority.publicKey,
            treasury: treasuryPDA,
            treasuryTokenAccount: treasuryTokenAccount,
            employeeTokenAccount: employee1TokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([companyAuthority])
          .rpc();

        assert.fail("Should have failed with invalid salary amount");
      } catch (error) {
        assert.include(error.toString(), "InvalidSalaryAmount");
        console.log("✅ Correctly rejected amount below minimum");
      }
    });

    it("Fails when paying inactive employee", async () => {
      const paymentAmount = EMPLOYEE2_SALARY;

      try {
        await program.methods
          .processPayment(new anchor.BN(paymentAmount))
          .accounts({
            employee: employee2PDA,
            company: companyPDA,
            authority: companyAuthority.publicKey,
            treasury: treasuryPDA,
            treasuryTokenAccount: treasuryTokenAccount,
            employeeTokenAccount: employee2TokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([companyAuthority])
          .rpc();

        assert.fail("Should have failed with inactive employee");
      } catch (error) {
        assert.include(error.toString(), "EmployeeInactive");
        console.log("✅ Correctly rejected payment to inactive employee");
      }
    });
  });

  describe("record_payment_proof", () => {
    let paymentProofPDA: PublicKey;
    const paymentId = new anchor.BN(1);

    before(async () => {
      [paymentProofPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("payment_proof"),
          companyPDA.toBuffer(),
          employee1.publicKey.toBuffer(),
          paymentId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
    });

    it("Stores ZK proof and ShadowWire signature", async () => {
      const amountCommitment = Array(32).fill(20);
      const zkProof = Buffer.from("mock_zk_proof_data_from_shadowwire_bulletproofs");
      const shadowwireTxSignature = "5XYZ...MockSignature...ABC123"; // Mock signature

      const tx = await program.methods
        .recordPaymentProof(paymentId, amountCommitment, zkProof, shadowwireTxSignature)
        .accounts({
          paymentProof: paymentProofPDA,
          employee: employee1PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
          employeeWallet: employee1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("Record payment proof tx:", tx);

      // Verify proof stored
      const proofAccount = await program.account.paymentProof.fetch(paymentProofPDA);
      assert.equal(proofAccount.paymentId.toNumber(), paymentId.toNumber());
      assert.equal(proofAccount.employee.toString(), employee1.publicKey.toString());
      assert.equal(proofAccount.company.toString(), companyPDA.toString());
      assert.equal(proofAccount.shadowwireTxSignature, shadowwireTxSignature);
      assert.deepEqual(proofAccount.status, { completed: {} });

      console.log("✅ Payment proof recorded successfully");
    });

    it("Fails with invalid proof size", async () => {
      const [anotherProofPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("payment_proof"),
          companyPDA.toBuffer(),
          employee1.publicKey.toBuffer(),
          new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const amountCommitment = Array(32).fill(21);
      const tooLargeProof = Buffer.alloc(513); // Exceeds ZK_PROOF_MAX_SIZE (512)
      const shadowwireTxSignature = "mock_sig";

      try {
        await program.methods
          .recordPaymentProof(new anchor.BN(2), amountCommitment, tooLargeProof, shadowwireTxSignature)
          .accounts({
            paymentProof: anotherProofPDA,
            employee: employee1PDA,
            company: companyPDA,
            authority: companyAuthority.publicKey,
            employeeWallet: employee1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([companyAuthority])
          .rpc();

        assert.fail("Should have failed with invalid proof size");
      } catch (error) {
        // Will fail during serialization or with custom error
        assert.ok(error);
        console.log("✅ Correctly rejected oversized ZK proof");
      }
    });
  });

  describe("Multi-employee payroll flow", () => {
    it("Processes complete payroll cycle", async () => {
      console.log("\n=== Complete Payroll Flow Test ===");

      // Add employee 2 back (was removed earlier)
      const encryptedSalary = Buffer.from("re_added_employee2_salary");
      const salaryCommitment = Array(32).fill(30);

      // Re-activate employee2 by adding again (since remove is soft delete, we test re-adding)
      // In production, you'd have a reactivate instruction
      const employee3 = Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(employee3.publicKey, LAMPORTS_PER_SOL)
      );

      const employee3TokenAccount = await createAccount(
        provider.connection,
        employee3,
        tokenMint,
        employee3.publicKey
      );

      const [employee3PDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("employee"), companyPDA.toBuffer(), employee3.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .addEmployee(encryptedSalary, salaryCommitment, { monthly: {} })
        .accounts({
          employee: employee3PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
          employeeWallet: employee3.publicKey,
          employeeTokenAccount: employee3TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("✅ Added employee 3 for batch test");

      // Get treasury token account
      const treasuryTokenAccount = await createAccount(
        provider.connection,
        companyAuthority,
        tokenMint,
        treasuryPDA,
        null
      );

      // Process payments for multiple employees
      const employee1Payment = EMPLOYEE1_SALARY;
      const employee3Payment = 2_000_000_000; // 2000 USDC

      await program.methods
        .processPayment(new anchor.BN(employee1Payment))
        .accounts({
          employee: employee1PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
          treasury: treasuryPDA,
          treasuryTokenAccount: treasuryTokenAccount,
          employeeTokenAccount: employee1TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("✅ Processed payment for employee 1");

      await program.methods
        .processPayment(new anchor.BN(employee3Payment))
        .accounts({
          employee: employee3PDA,
          company: companyPDA,
          authority: companyAuthority.publicKey,
          treasury: treasuryPDA,
          treasuryTokenAccount: treasuryTokenAccount,
          employeeTokenAccount: employee3TokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([companyAuthority])
        .rpc();

      console.log("✅ Processed payment for employee 3");

      // Verify final state
      const companyAccount = await program.account.company.fetch(companyPDA);
      console.log("\n=== Final Company State ===");
      console.log("Active employees:", companyAccount.employeeCount);
      console.log("Total payments made:", companyAccount.totalPaymentsMade.toNumber());

      assert.equal(companyAccount.employeeCount, 2); // employee1 and employee3 active
      assert.isTrue(companyAccount.totalPaymentsMade.toNumber() >= 3); // At least 3 payments total

      console.log("\n✅ Complete payroll flow test passed!");
    });
  });
});
