use soroban_sdk::{Address, Env, InvokeError, Symbol, Val, Vec, Error};

pub mod errors {
    pub const CALL_FAILED: u32 = 2001;
    pub const CONTRACT_NOT_FOUND: u32 = 2002;
}

/// Safely invokes a contract method with error handling checks.
/// 
/// # Arguments
/// * `env` - The environment
/// * `contract` - The address of the contract to call
/// * `func` - The function name to call
/// * `args` - The arguments to pass
/// 
/// # Returns
/// * `Result<Val, u32>` - The return value or an error code
pub fn safe_invoke(
    env: &Env,
    contract: &Address,
    func: &Symbol,
    args: Vec<Val>,
) -> Result<Val, u32> {
    // 1. Defensive Check: Ensure contract exists/is deployed?
    // Soroban doesn't have a direct "exists" check on Address easily accessible without trying to call 
    // or checking ledger entries, but try_call handles non-existence as an error.

    // 2. Try Call
    // try_invoke_contract now returns Result<Result<Val, Error>, InvokeError>
    // The outer Result handles invocation errors, inner Result handles contract errors
    
    let res = env.try_invoke_contract::<Val, Error>(contract, func, args);

    match res {
        Ok(Ok(val)) => Ok(val),
        Ok(Err(_contract_error)) => {
            // Contract executed but returned an error
            Err(errors::CALL_FAILED)
        }
        Err(_invoke_error) => {
            // Failed to invoke (contract not found, etc.)
            Err(errors::CONTRACT_NOT_FOUND)
        }
    }
}

/// Verifies a contract address is valid (basic check).
pub fn verify_target(_env: &Env, _contract: &Address) -> bool {
    // This is a placeholder. In Soroban, an Address is just a handle.
    // We could check if it's a contract address vs account address if needed.
    true
}
