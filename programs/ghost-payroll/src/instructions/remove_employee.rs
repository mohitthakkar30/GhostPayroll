use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct RemoveEmployee<'info> {
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
        constraint = employee.company == company.key() @ GhostPayrollError::EmployeeNotFound
    )]
    pub employee: Account<'info, Employee>,

    /// Company authority (must sign)
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<RemoveEmployee>) -> Result<()> {
    let company = &mut ctx.accounts.company;
    let employee = &mut ctx.accounts.employee;

    // Mark employee as inactive (soft delete)
    employee.is_active = false;

    // Decrement company employee count
    company.employee_count = company
        .employee_count
        .checked_sub(1)
        .ok_or(GhostPayrollError::ArithmeticUnderflow)?;

    msg!("Employee removed from company: {}", company.name);
    msg!("Employee wallet: {}", employee.wallet);
    msg!("Remaining employees: {}", company.employee_count);

    Ok(())
}
