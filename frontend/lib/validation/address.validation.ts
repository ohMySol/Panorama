import { API_CONFIG } from '@/lib/config/api.config';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Ethereum address regex: 0x followed by exactly 40 hex characters
 */
const ETH_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Validates Ethereum address format (0x + 40 hex characters)
 * 
 * @param address - The address to validate
 * @returns Validation result with error message if invalid
 */
export function validateEthereumAddress(address: string): ValidationResult {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Address is required',
    };
  }

  if (!ETH_ADDRESS_REGEX.test(address)) {
    return {
      isValid: false,
      error: 'Invalid Ethereum address format. Expected: 0x followed by 40 hexadecimal characters',
    };
  }

  return { isValid: true };
}

/**
 * Validates chain ID is supported
 * 
 * @param chainId - The chain ID to validate
 * @returns Validation result with error message if invalid
 */
export function validateChainId(chainId: number): ValidationResult {
  const supportedChainIds = Object.values(API_CONFIG.SUPPORTED_CHAINS);
  
  if (!supportedChainIds.includes(chainId)) {
    return {
      isValid: false,
      error: `Unsupported chain ID. Supported chains: ${supportedChainIds.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates graph depth is within allowed range
 * 
 * @param depth - The depth to validate
 * @returns Validation result with error message if invalid
 */
export function validateDepth(depth: number): ValidationResult {
  if (!Number.isInteger(depth)) {
    return {
      isValid: false,
      error: 'Depth must be an integer',
    };
  }

  if (depth < 1 || depth > API_CONFIG.MAX_DEPTH) {
    return {
      isValid: false,
      error: `Depth must be between 1 and ${API_CONFIG.MAX_DEPTH}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates complete build graph request
 * 
 * @param request - The request to validate
 * @returns Validation result with error message if invalid
 */
export function validateBuildGraphRequest(request: {
  address: string;
  chain_id: number;
  depth?: number;
}): ValidationResult {
  // Validate address
  const addressValidation = validateEthereumAddress(request.address);
  if (!addressValidation.isValid) {
    return addressValidation;
  }

  // Validate chain ID
  const chainIdValidation = validateChainId(request.chain_id);
  if (!chainIdValidation.isValid) {
    return chainIdValidation;
  }

  // Validate depth if provided
  if (request.depth !== undefined) {
    const depthValidation = validateDepth(request.depth);
    if (!depthValidation.isValid) {
      return depthValidation;
    }
  }

  return { isValid: true };
}
