/// PDA seeds
pub const COMPANY_SEED: &[u8] = b"company";
pub const EMPLOYEE_SEED: &[u8] = b"employee";
pub const PAYMENT_PROOF_SEED: &[u8] = b"payment_proof";
pub const TREASURY_SEED: &[u8] = b"treasury";

/// Business logic constants
pub const MAX_EMPLOYEES_PER_COMPANY: u16 = 1000;
pub const MAX_COMPANY_NAME_LENGTH: usize = 50;

/// Minimum amounts (in smallest unit)
pub const MIN_SALARY_AMOUNT: u64 = 1_000_000; // 1 USDC (6 decimals)

/// Token decimals
pub const USDC_DECIMALS: u8 = 6;

/// Payment processing fees (basis points)
pub const PAYMENT_PROCESSING_FEE_BPS: u16 = 30; // 0.3% fee
pub const SHADOWWIRE_RELAYER_FEE_BPS: u16 = 100; // 1% (from ShadowWire docs)

/// Max batch size for payroll processing
pub const MAX_BATCH_SIZE: usize = 10;

/// Time constants (seconds)
pub const SECONDS_PER_WEEK: i64 = 604_800;
pub const SECONDS_PER_BIWEEK: i64 = 1_209_600;
pub const SECONDS_PER_MONTH: i64 = 2_592_000; // ~30 days

/// Encryption sizes
pub const ENCRYPTED_SALARY_MAX_SIZE: usize = 256;
pub const ZK_PROOF_MAX_SIZE: usize = 512;
pub const TX_SIGNATURE_LENGTH: usize = 88;
