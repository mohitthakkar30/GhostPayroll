use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct InitializeCompany<'info> {
    #[account(
        init,
        payer = authority,
        space = Company::LEN,
        seeds = [COMPANY_SEED, authority.key().as_ref()],
        bump
    )]
    pub company: Account<'info, Company>,

    /// Company admin/owner wallet
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Token mint for payments (e.g., USDC)
    pub payment_token: Account<'info, Mint>,

    /// Company treasury token account (owned by company PDA)
    #[account(
        init,
        payer = authority,
        seeds = [TREASURY_SEED, company.key().as_ref()],
        bump,
        token::mint = payment_token,
        token::authority = company,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeCompany>,
    name: String,
    budget_commitment: [u8; 32],
    payment_frequency: PaymentFrequency,
) -> Result<()> {
    // Validate company name
    require!(
        name.len() <= MAX_COMPANY_NAME_LENGTH && !name.is_empty(),
        GhostPayrollError::CompanyNameTooLong
    );

    let company = &mut ctx.accounts.company;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Initialize company account
    company.authority = ctx.accounts.authority.key();
    company.name = name;
    company.employee_count = 0;
    company.budget_commitment = budget_commitment;
    company.payment_token = ctx.accounts.payment_token.key();
    company.payment_frequency = payment_frequency;
    company.last_payment_timestamp = current_time;
    company.next_payment_due = current_time + payment_frequency.seconds_to_next_payment();
    company.total_payments_made = 0;
    company.is_active = true;
    company.bump = ctx.bumps.company;

    msg!("Company initialized: {}", company.name);
    msg!("Authority: {}", company.authority);
    msg!("Payment token: {}", company.payment_token);
    msg!("Payment frequency: {:?}", company.payment_frequency);
    msg!("Next payment due: {}", company.next_payment_due);

    Ok(())
}
