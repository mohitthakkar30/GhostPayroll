use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::PaymentFrequency;

declare_id!("BW7Efo8SJQhm5TuAiogpJZPjzNKxc4WQhT8PVhBgpsoa");

#[program]
pub mod ghost_payroll {
    use super::*;

    /// Initialize a new company with a treasury account
    pub fn initialize_company(
        ctx: Context<InitializeCompany>,
        name: String,
        budget_commitment: [u8; 32],
        payment_frequency: PaymentFrequency,
    ) -> Result<()> {
        instructions::initialize_company::handler(ctx, name, budget_commitment, payment_frequency)
    }

    /// Add an employee to a company with encrypted salary
    pub fn add_employee(
        ctx: Context<AddEmployee>,
        employee_wallet: Pubkey,
        encrypted_salary: Vec<u8>,
        salary_commitment: [u8; 32],
        payment_frequency: PaymentFrequency,
    ) -> Result<()> {
        instructions::add_employee::handler(
            ctx,
            employee_wallet,
            encrypted_salary,
            salary_commitment,
            payment_frequency,
        )
    }

    /// Update an employee's encrypted salary
    pub fn update_employee_salary(
        ctx: Context<UpdateEmployeeSalary>,
        new_encrypted_salary: Vec<u8>,
        new_salary_commitment: [u8; 32],
    ) -> Result<()> {
        instructions::update_employee_salary::handler(ctx, new_encrypted_salary, new_salary_commitment)
    }

    /// Remove (deactivate) an employee from a company
    pub fn remove_employee(ctx: Context<RemoveEmployee>) -> Result<()> {
        instructions::remove_employee::handler(ctx)
    }

    /// Process a payment from company treasury to employee
    /// Note: For private payments, this is used in combination with ShadowWire
    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        amount: u64,
        amount_commitment: [u8; 32],
    ) -> Result<()> {
        instructions::process_payment::handler(ctx, amount, amount_commitment)
    }

    /// Record a payment proof on-chain (for ShadowWire private payments)
    pub fn record_payment_proof(
        ctx: Context<RecordPaymentProof>,
        payment_id: u64,
        amount_commitment: [u8; 32],
        zk_proof: Vec<u8>,
        shadowwire_tx_signature: String,
    ) -> Result<()> {
        instructions::record_payment_proof::handler(
            ctx,
            payment_id,
            amount_commitment,
            zk_proof,
            shadowwire_tx_signature,
        )
    }
}
