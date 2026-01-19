use anchor_lang::prelude::*;

// ==================== COMPANY ACCOUNT ====================
#[account]
#[derive(Default)]
pub struct Company {
    /// Company admin wallet address
    pub authority: Pubkey,

    /// Company name
    pub name: String,

    /// Number of active employees
    pub employee_count: u16,

    /// Total monthly budget (stored encrypted off-chain, this is a commitment)
    pub budget_commitment: [u8; 32],

    /// Token mint for payments (e.g., USDC)
    pub payment_token: Pubkey,

    /// How often employees get paid
    pub payment_frequency: PaymentFrequency,

    /// Unix timestamp of last payroll run
    pub last_payment_timestamp: i64,

    /// Unix timestamp when next payment is due
    pub next_payment_due: i64,

    /// Total payments made (count)
    pub total_payments_made: u64,

    /// Whether company is active
    pub is_active: bool,

    /// Bump seed for PDA
    pub bump: u8,
}

impl Company {
    pub const LEN: usize = 8 + // discriminator
        32 +  // authority
        (4 + 50) + // name (String with max 50 chars)
        2 +   // employee_count
        32 +  // budget_commitment
        32 +  // payment_token
        1 +   // payment_frequency
        8 +   // last_payment_timestamp
        8 +   // next_payment_due
        8 +   // total_payments_made
        1 +   // is_active
        1 +   // bump
        64;   // padding

    pub const MAX_NAME_LENGTH: usize = 50;
}

// ==================== EMPLOYEE ACCOUNT ====================
#[account]
#[derive(Default)]
pub struct Employee {
    /// Employee wallet address
    pub wallet: Pubkey,

    /// Associated company
    pub company: Pubkey,

    /// Encrypted salary amount (encrypted via client-side encryption)
    /// Only company authority and employee can decrypt
    pub encrypted_salary: Vec<u8>,

    /// Salary commitment hash for verification
    pub salary_commitment: [u8; 32],

    /// Payment frequency for this employee
    pub payment_frequency: PaymentFrequency,

    /// Unix timestamp when employee joined
    pub join_date: i64,

    /// Unix timestamp of last payment
    pub last_payment_date: i64,

    /// Total number of payments received
    pub total_payments_received: u64,

    /// Whether employee is active
    pub is_active: bool,

    /// Bump seed for PDA
    pub bump: u8,
}

impl Employee {
    pub const LEN: usize = 8 + // discriminator
        32 +  // wallet
        32 +  // company
        (4 + 256) + // encrypted_salary (Vec with max 256 bytes)
        32 +  // salary_commitment
        1 +   // payment_frequency
        8 +   // join_date
        8 +   // last_payment_date
        8 +   // total_payments_received
        1 +   // is_active
        1 +   // bump
        32;   // padding

    pub const MAX_ENCRYPTED_SALARY_SIZE: usize = 256;
}

// ==================== PAYMENT PROOF ACCOUNT ====================
#[account]
#[derive(Default)]
pub struct PaymentProof {
    /// Unique payment ID (incrementing)
    pub payment_id: u64,

    /// Employee who received payment
    pub employee: Pubkey,

    /// Company that made payment
    pub company: Pubkey,

    /// Unix timestamp of payment
    pub payment_date: i64,

    /// Commitment hash of payment amount (for verification without revealing)
    pub amount_commitment: [u8; 32],

    /// ZK proof of payment (proves payment was made correctly)
    pub zk_proof: Vec<u8>,

    /// ShadowWire transaction signature
    pub shadowwire_tx_signature: String,

    /// Payment status
    pub status: PaymentStatus,

    /// Bump seed for PDA
    pub bump: u8,
}

impl PaymentProof {
    pub const LEN: usize = 8 + // discriminator
        8 +   // payment_id
        32 +  // employee
        32 +  // company
        8 +   // payment_date
        32 +  // amount_commitment
        (4 + 512) + // zk_proof (Vec with max 512 bytes)
        (4 + 88) + // shadowwire_tx_signature (String with 88 chars)
        1 +   // status
        1 +   // bump
        32;   // padding

    pub const MAX_ZK_PROOF_SIZE: usize = 512;
    pub const MAX_SIGNATURE_LENGTH: usize = 88;
}

// ==================== ENUMS ====================
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, Debug)]
pub enum PaymentFrequency {
    #[default]
    Weekly,
    Biweekly,
    Monthly,
}

impl PaymentFrequency {
    /// Returns seconds until next payment
    pub fn seconds_to_next_payment(&self) -> i64 {
        match self {
            PaymentFrequency::Weekly => 7 * 24 * 60 * 60,
            PaymentFrequency::Biweekly => 14 * 24 * 60 * 60,
            PaymentFrequency::Monthly => 30 * 24 * 60 * 60,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default, Debug)]
pub enum PaymentStatus {
    #[default]
    Pending,
    Processing,
    Completed,
    Failed,
}
