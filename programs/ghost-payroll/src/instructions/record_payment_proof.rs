use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(payment_id: u64)]
pub struct RecordPaymentProof<'info> {
    #[account(
        seeds = [COMPANY_SEED, authority.key().as_ref()],
        bump = company.bump,
        constraint = company.authority == authority.key() @ GhostPayrollError::UnauthorizedAccess,
        constraint = company.is_active @ GhostPayrollError::CompanyInactive
    )]
    pub company: Account<'info, Company>,

    #[account(
        seeds = [EMPLOYEE_SEED, company.key().as_ref(), employee.wallet.as_ref()],
        bump = employee.bump,
        constraint = employee.company == company.key() @ GhostPayrollError::EmployeeNotFound
    )]
    pub employee: Account<'info, Employee>,

    #[account(
        init,
        payer = authority,
        space = PaymentProof::LEN,
        seeds = [
            PAYMENT_PROOF_SEED,
            company.key().as_ref(),
            employee.wallet.as_ref(),
            &payment_id.to_le_bytes()
        ],
        bump
    )]
    pub payment_proof: Account<'info, PaymentProof>,

    /// Company authority (must sign and pay)
    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<RecordPaymentProof>,
    payment_id: u64,
    amount_commitment: [u8; 32],
    zk_proof: Vec<u8>,
    shadowwire_tx_signature: String,
) -> Result<()> {
    // Validate ZK proof size
    require!(
        zk_proof.len() <= PaymentProof::MAX_ZK_PROOF_SIZE,
        GhostPayrollError::InvalidPaymentProof
    );

    // Validate signature length
    require!(
        shadowwire_tx_signature.len() <= PaymentProof::MAX_SIGNATURE_LENGTH,
        GhostPayrollError::InvalidPaymentProof
    );

    let payment_proof = &mut ctx.accounts.payment_proof;
    let clock = Clock::get()?;

    // Initialize payment proof
    payment_proof.payment_id = payment_id;
    payment_proof.employee = ctx.accounts.employee.wallet;
    payment_proof.company = ctx.accounts.company.key();
    payment_proof.payment_date = clock.unix_timestamp;
    payment_proof.amount_commitment = amount_commitment;
    payment_proof.zk_proof = zk_proof;
    payment_proof.shadowwire_tx_signature = shadowwire_tx_signature;
    payment_proof.status = PaymentStatus::Completed;
    payment_proof.bump = ctx.bumps.payment_proof;

    msg!("Payment proof recorded");
    msg!("Payment ID: {}", payment_proof.payment_id);
    msg!("Employee: {}", payment_proof.employee);
    msg!("Company: {}", payment_proof.company);
    msg!("ShadowWire TX: {}", payment_proof.shadowwire_tx_signature);

    Ok(())
}
