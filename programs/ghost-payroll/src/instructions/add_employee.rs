use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(employee_wallet: Pubkey)]
pub struct AddEmployee<'info> {
    #[account(
        mut,
        seeds = [COMPANY_SEED, authority.key().as_ref()],
        bump = company.bump,
        constraint = company.authority == authority.key() @ GhostPayrollError::UnauthorizedAccess,
        constraint = company.is_active @ GhostPayrollError::CompanyInactive,
        constraint = company.employee_count < MAX_EMPLOYEES_PER_COMPANY @ GhostPayrollError::MaxEmployeesReached
    )]
    pub company: Account<'info, Company>,

    #[account(
        init,
        payer = authority,
        space = Employee::LEN,
        seeds = [EMPLOYEE_SEED, company.key().as_ref(), employee_wallet.as_ref()],
        bump
    )]
    pub employee: Account<'info, Employee>,

    /// Company authority (must sign)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Employee's token account for receiving payments
    /// CHECK: We validate the owner and mint
    #[account(
        constraint = employee_token_account.owner == employee_wallet @ GhostPayrollError::InvalidTokenMint,
        constraint = employee_token_account.mint == company.payment_token @ GhostPayrollError::InvalidTokenMint
    )]
    pub employee_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddEmployee>,
    employee_wallet: Pubkey,
    encrypted_salary: Vec<u8>,
    salary_commitment: [u8; 32],
    payment_frequency: PaymentFrequency,
) -> Result<()> {
    // Validate encrypted salary
    require!(
        !encrypted_salary.is_empty() && encrypted_salary.len() <= Employee::MAX_ENCRYPTED_SALARY_SIZE,
        GhostPayrollError::InvalidEncryptedSalary
    );

    let company = &mut ctx.accounts.company;
    let employee = &mut ctx.accounts.employee;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Initialize employee account
    employee.wallet = employee_wallet;
    employee.company = company.key();
    employee.encrypted_salary = encrypted_salary;
    employee.salary_commitment = salary_commitment;
    employee.payment_frequency = payment_frequency;
    employee.join_date = current_time;
    employee.last_payment_date = current_time;
    employee.total_payments_received = 0;
    employee.is_active = true;
    employee.bump = ctx.bumps.employee;

    // Increment company employee count
    company.employee_count = company
        .employee_count
        .checked_add(1)
        .ok_or(GhostPayrollError::ArithmeticOverflow)?;

    msg!("Employee added to company: {}", company.name);
    msg!("Employee wallet: {}", employee.wallet);
    msg!("Payment frequency: {:?}", employee.payment_frequency);
    msg!("Total employees: {}", company.employee_count);

    Ok(())
}
