const { deployments, ethers } = require('hardhat');
const { assert } = require('chai');

describe('RandomIpfsNft Unit Tests', () => {
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    await deployments.fixture(['mocks', 'random']);
    randomIpfsNftContract = await ethers.getContract('RandomIpfsNft');
    randomIpfsNft = randomIpfsNftContract.connect(deployer);
  });

  describe('constructor', () => {
    it('initializes the random IPFS NFT generator correctly', async () => {
      const counterNft = await randomIpfsNft.getTokenCounter();
      assert.equal(counterNft.toString(), '0');
    });
  });
});
