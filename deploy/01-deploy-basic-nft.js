const { network } = require('hardhat');
const { verify } = require('../utils/verify');

async function deployBasicNft({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log('----------------------------------------------------');
  log('Deploying BasicNft contract...');

  const args = [];
  const basicNft = await deploy('BasicNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: 1,
  });

  if (network.live && process.env.ETHERSCAN_API_KEY) {
    log(`Verifying contract "${basicNft.address}" with args [${args}] on a live network: ${network.name} ...`);
    await verify(basicNft.address, args);
  }
  log(`BasicNft Deployed!`);
  log('----------------------------------------------------');
}

module.exports = deployBasicNft;
module.exports.tags = ['all', 'basic'];
