require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config({ path: '../backend/.env' });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.19',
  networks: {
    amoy: {
      url: process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology',
      accounts: process.env.ISSUER_PRIVATE_KEY ? [process.env.ISSUER_PRIVATE_KEY] : [],
    },
  },
};
