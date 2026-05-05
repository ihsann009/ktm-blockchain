const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying CredentialRegistry with account:', deployer.address);

  const CredentialRegistry = await ethers.getContractFactory('CredentialRegistry');
  const registry = await CredentialRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log('CredentialRegistry deployed to:', address);
  console.log('Set CONTRACT_ADDRESS=' + address + ' in your .env');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
