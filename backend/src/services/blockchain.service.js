const { ethers } = require('ethers');

const CREDENTIAL_REGISTRY_ABI = [
  'function issueCredential(string calldata credentialId, bytes32 credentialHash, uint256 issuedAt, uint256 expiresAt) external',
  'function revokeCredential(string calldata credentialId) external',
  'function getCredential(string calldata credentialId) external view returns (bytes32 credentialHash, uint256 issuedAt, uint256 expiresAt, bool revoked)',
  'function isCredentialValid(string calldata credentialId) external view returns (bool)',
  'event CredentialIssued(string indexed credentialId, bytes32 credentialHash, uint256 issuedAt, uint256 expiresAt)',
  'event CredentialRevoked(string indexed credentialId)',
];

let provider;
let wallet;
let contract;

function getProvider() {
  if (!provider) {
    const rpcUrl = process.env.POLYGON_AMOY_RPC;
    if (!rpcUrl) {
      throw new Error('POLYGON_AMOY_RPC is required');
    }
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

function getWallet() {
  if (!wallet) {
    const privateKey = process.env.ISSUER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ISSUER_PRIVATE_KEY is required');
    }
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    wallet = new ethers.Wallet(formattedKey, getProvider());
  }
  return wallet;
}

function getContract() {
  if (!contract) {
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS is required');
    }
    contract = new ethers.Contract(contractAddress, CREDENTIAL_REGISTRY_ABI, getWallet());
  }
  return contract;
}

/**
 * Check if blockchain service is configured (all env vars present).
 * Returns false if CONTRACT_ADDRESS is missing — allows graceful degradation.
 */
function isConfigured() {
  return !!(
    process.env.POLYGON_AMOY_RPC &&
    process.env.ISSUER_PRIVATE_KEY &&
    process.env.CONTRACT_ADDRESS
  );
}

/**
 * Anchor credential hash on-chain.
 * @param {string} credentialId - UUID credential identifier
 * @param {string} credentialHash - SHA-256 hex hash of JWT string (without 0x prefix)
 * @param {Date} issuanceDate - Credential issuance date
 * @param {Date} expirationDate - Credential expiration date
 * @returns {Promise<string>} Transaction hash (0x...)
 */
async function anchorCredential(credentialId, credentialHash, issuanceDate, expirationDate) {
  const registry = getContract();

  const hashBytes32 = `0x${credentialHash}`;
  const issuedAt = Math.floor(issuanceDate.getTime() / 1000);
  const expiresAt = Math.floor(expirationDate.getTime() / 1000);

  const tx = await registry.issueCredential(credentialId, hashBytes32, issuedAt, expiresAt);
  const receipt = await tx.wait();

  return receipt.hash;
}

/**
 * Revoke credential on-chain.
 * @param {string} credentialId - UUID credential identifier
 * @returns {Promise<string>} Transaction hash (0x...)
 */
async function revokeOnChain(credentialId) {
  const registry = getContract();

  const tx = await registry.revokeCredential(credentialId);
  const receipt = await tx.wait();

  return receipt.hash;
}

/**
 * Query credential data from blockchain.
 * @param {string} credentialId - UUID credential identifier
 * @returns {Promise<{credentialHash: string, issuedAt: number, expiresAt: number, revoked: boolean} | null>}
 */
async function getCredentialFromChain(credentialId) {
  const registry = getContract();

  const [credentialHash, issuedAt, expiresAt, revoked] = await registry.getCredential(credentialId);

  // If issuedAt is 0, credential doesn't exist on-chain
  if (issuedAt === 0n) {
    return null;
  }

  return {
    credentialHash: credentialHash.slice(2), // Remove 0x prefix, return hex string
    issuedAt: Number(issuedAt),
    expiresAt: Number(expiresAt),
    revoked,
  };
}

/**
 * Check if credential is valid on-chain.
 * @param {string} credentialId - UUID credential identifier
 * @returns {Promise<boolean>}
 */
async function isCredentialValidOnChain(credentialId) {
  const registry = getContract();
  return registry.isCredentialValid(credentialId);
}

module.exports = {
  isConfigured,
  anchorCredential,
  revokeOnChain,
  getCredentialFromChain,
  isCredentialValidOnChain,
};
