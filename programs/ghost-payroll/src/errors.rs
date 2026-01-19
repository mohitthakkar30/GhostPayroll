use anchor_lang::prelude::*;

#[error_code]
pub enum GhostPayrollError {
    #[msg("Only company authority can perform this action")]
    UnauthorizedAccess,

    #[msg("Employee already exists in this company")]
    EmployeeAlreadyExists,

    #[msg("Employee not found in this company")]
    EmployeeNotFound,

    #[msg("Salary amount must be greater than minimum")]
    InvalidSalaryAmount,

    #[msg("Company has insufficient balance for payroll")]
    InsufficientCompanyBalance,

    #[msg("Payment not yet due based on schedule")]
    PaymentNotDue,

    #[msg("Employee is marked as inactive")]
    EmployeeInactive,

    #[msg("Company is marked as inactive")]
    CompanyInactive,

    #[msg("Invalid payment frequency specified")]
    InvalidPaymentFrequency,

    #[msg("Failed to encrypt salary data")]
    EncryptionFailed,

    #[msg("Failed to decrypt salary data")]
    DecryptionFailed,

    #[msg("ZK proof verification failed")]
    ProofVerificationFailed,

    #[msg("Maximum employee limit reached")]
    MaxEmployeesReached,

    #[msg("Company name too long")]
    CompanyNameTooLong,

    #[msg("Invalid token mint address")]
    InvalidTokenMint,

    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,

    #[msg("Arithmetic underflow occurred")]
    ArithmeticUnderflow,

    #[msg("ShadowWire integration failed")]
    ShadowWireError,

    #[msg("Invalid payment proof provided")]
    InvalidPaymentProof,

    #[msg("Payment already processed")]
    PaymentAlreadyProcessed,

    #[msg("Invalid encrypted salary data")]
    InvalidEncryptedSalary,
}
