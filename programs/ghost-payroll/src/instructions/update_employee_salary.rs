use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::*;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdateEmployeeSalary<'info> {
    #[account(
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

    /// Company authority (must sign)
    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateEmployeeSalary>,
    new_encrypted_salary: Vec<u8>,
    new_salary_commitment: [u8; 32],
) -> Result<()> {
    // Validate new encrypted salary
    require!(
        !new_encrypted_salary.is_empty()
            && new_encrypted_salary.len() <= Employee::MAX_ENCRYPTED_SALARY_SIZE,
        GhostPayrollError::InvalidEncryptedSalary
    );

    let employee = &mut ctx.accounts.employee;

    // Update salary data
    employee.encrypted_salary = new_encrypted_salary;
    employee.salary_commitment = new_salary_commitment;

    msg!("Employee salary updated");
    msg!("Employee wallet: {}", employee.wallet);

    Ok(())
}
