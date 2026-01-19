use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        mut,
        seeds = [COMPANY_SEED, authority.key().as_ref()],
        bump = company.bump,
        constraint = company.authority == authority.key() @ GhostPayrollError::UnauthorizedAccess,
        constraint = company.is_active @ GhostPayrollError::CompanyInactive
    )]
    pub company: Account<'info, Company>,

    #[account(
        mut,
        seeds = [EMPLOYEE_SEED, company.key().as_ref(), employee.wallet.as_ref()],
        bump = employee.bump,
        constraint = employee.company == company.key() @ GhostPayrollError::EmployeeNotFound,
        constraint = employee.is_active @ GhostPayrollError::EmployeeInactive
    )]
    pub employee: Account<'info, Employee>,

    /// Company treasury token account
    #[account(
        mut,
        seeds = [TREASURY_SEED, company.key().as_ref()],
        bump,
        constraint = treasury.mint == company.payment_token @ GhostPayrollError::InvalidTokenMint
    )]
    pub treasury: Account<'info, TokenAccount>,

    /// Employee's token account for receiving payment
    #[account(
        mut,
        constraint = employee_token_account.owner == employee.wallet @ GhostPayrollError::InvalidTokenMint,
        constraint = employee_token_account.mint == company.payment_token @ GhostPayrollError::InvalidTokenMint
    )]
    pub employee_token_account: Account<'info, TokenAccount>,

    /// Company authority (must sign)
    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<ProcessPayment>,
    amount: u64,
    amount_commitment: [u8; 32],
) -> Result<()> {
    let company = &mut ctx.accounts.company;
    let employee = &mut ctx.accounts.employee;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Validate amount
    require!(amount >= MIN_SALARY_AMOUNT, GhostPayrollError::InvalidSalaryAmount);

    // Check if company treasury has sufficient balance
    require!(
        ctx.accounts.treasury.amount >= amount,
        GhostPayrollError::InsufficientCompanyBalance
    );

    // Create PDA signer seeds for company
    let authority_key = ctx.accounts.authority.key();
    let company_seeds = &[
        COMPANY_SEED,
        authority_key.as_ref(),
        &[company.bump],
    ];
    let signer_seeds = &[&company_seeds[..]];

    // Transfer tokens from treasury to employee
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.treasury.to_account_info(),
            to: ctx.accounts.employee_token_account.to_account_info(),
            authority: company.to_account_info(),
        },
        signer_seeds,
    );

    token::transfer(transfer_ctx, amount)?;

    // Update employee payment records
    employee.last_payment_date = current_time;
    employee.total_payments_received = employee
        .total_payments_received
        .checked_add(1)
        .ok_or(GhostPayrollError::ArithmeticOverflow)?;

    // Update company payment records
    company.last_payment_timestamp = current_time;
    company.next_payment_due = current_time + employee.payment_frequency.seconds_to_next_payment();
    company.total_payments_made = company
        .total_payments_made
        .checked_add(1)
        .ok_or(GhostPayrollError::ArithmeticOverflow)?;

    msg!("Payment processed successfully");
    msg!("Employee: {}", employee.wallet);
    msg!("Amount commitment: {:?}", amount_commitment);
    msg!("Payment #{}", employee.total_payments_received);

    Ok(())
}
