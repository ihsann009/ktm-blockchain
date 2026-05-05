const { getIssuerPublicJwk } = require('../services/credential.service');

// /.well-known/jwks.json — Issuer public key for external verifiers
async function jwks(req, res, next) {
  try {
    const issuerPublicJwk = await getIssuerPublicJwk();
    res.json({
      keys: [issuerPublicJwk],
    });
  } catch (error) {
    next(error);
  }
}

// /.well-known/blockchain-registry.json — Contract info for external verifiers
function blockchainRegistry(req, res) {
  res.json({
    network: 'Polygon Amoy Testnet',
    chainId: 80002,
    contractAddress: process.env.CONTRACT_ADDRESS || null,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
  });
}

module.exports = { jwks, blockchainRegistry };
