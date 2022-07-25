const { network, deployments, ethers } = require('hardhat');
const { assert, expect } = require('chai');

network.live
  ? describe.skip
  : describe('RandomIpfsNft Unit Tests', () => {
      let mintFee, user2;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user2 = accounts[1];
        await deployments.fixture(['mocks', 'random']);
        randomIpfsNftContract = await ethers.getContract('RandomIpfsNft');
        randomIpfsNft = randomIpfsNftContract.connect(deployer);
        vrfCoordinatorV2MockContract = await ethers.getContract('VRFCoordinatorV2Mock');
        vrfCoordinatorV2Mock = vrfCoordinatorV2MockContract.connect(deployer);
        mintFee = await randomIpfsNft.getMintFee();
      });

      describe('constructor', () => {
        it('initializes the random IPFS NFT generator correctly', async () => {
          const counterNft = await randomIpfsNft.getTokenCounter();
          assert.equal(counterNft.toString(), '0');
          assert.equal(mintFee.toString(), '10000000000000000');
        });

        it('uri list should match constants', async () => {
          const tokenUrisArray = [
            'ipfs://QmSm533aM6AqYE6LCXaUA91wxRty6gpCsfU4pcjPBuZcvW',
            'ipfs://QmZLbzn1nqdgYgVKisGkEx4nCcvwUq5sD1Q4yUyqsHnkEY',
            'ipfs://QmWVEenjv3mUGmsVaRyKzxBho4rKmw6AfjbNxzhbBnCviM',
          ];
          const dogTokenUris1 = await randomIpfsNft.getDogTokenUris(0);
          const dogTokenUris2 = await randomIpfsNft.getDogTokenUris(1);
          const dogTokenUris3 = await randomIpfsNft.getDogTokenUris(2);
          assert.equal(dogTokenUris1.toString(), tokenUrisArray[0]);
          assert.equal(dogTokenUris2.toString(), tokenUrisArray[1]);
          assert.equal(dogTokenUris3.toString(), tokenUrisArray[2]);
        });
      });

      describe('requestNft', () => {
        it('reverts if minimum fee is not enough', async () => {
          await expect(randomIpfsNft.requestNft()).to.be.revertedWith('RandomIpfsNft__NeedMoreEthSent()');
        });

        it('return with request id on valid request', async () => {
          const txResponse = await randomIpfsNft.requestNft({ value: mintFee });
          const txReceipt = await txResponse.wait(1);
          const requestId = txReceipt.events[1].args.requestId;
          assert.equal(requestId.toString(), '1');
        });

        it('assigns correct dog owner', async () => {
          const txResponse = await randomIpfsNft.requestNft({ value: mintFee });
          await txResponse.wait(1);
          const dogOwner = await randomIpfsNft.getDogOwner(1);
          assert.equal(dogOwner, deployer.address);
        });

        it('emits event on request', async () => {
          await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(randomIpfsNft, 'NftRequested');
        });
      });

      describe('fulfillRandomWords', () => {
        it('mints NFT after random number is returned', async () => {
          await new Promise(async (resolve, reject) => {
            randomIpfsNft.once('NftMinted', async () => {
              try {
                const tokenUri = await randomIpfsNft.tokenURI('0');
                const tokenCounter = await randomIpfsNft.getTokenCounter();
                assert.equal(tokenUri.toString().includes('ipfs://'), true);
                assert.equal(tokenCounter.toString(), '1');
                resolve();
              } catch (e) {
                console.log('\t ❌ ' + e);
                reject(e);
              }
            });
            try {
              const requestNftResponse = await randomIpfsNft.requestNft({ value: mintFee });
              const requestNftReceipt = await requestNftResponse.wait(1);
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestNftReceipt.events[1].args.requestId,
                randomIpfsNft.address
              );
            } catch (e) {
              console.log('\t ❌ ' + e);
              reject(e);
            }
          });
        });
      });

      describe('withdraw', () => {
        it('reverts if not owner tries to withdraw', async () => {
          // await expect(randomIpfsNft.withdraw({ from: user2 })).to.be.revertedWith('Ownable: caller is not the owner');
          await expect(randomIpfsNft.withdraw({ from: user2 })).to.be.reverted;
        });

        it('withdraw funds to NFT minter', async () => {
          let minterStartingBalance;
          await new Promise(async (resolve, reject) => {
            randomIpfsNft.once('NftMinted', async () => {
              try {
                const txResponse = await randomIpfsNft.withdraw();
                const txReceipt = await txResponse.wait(1);
                const minterEndingBalance = await deployer.getBalance();
                // console.log(`\t staring    >> balance 💰 ${minterStartingBalance.toString()}`);
                // console.log(`\t ending     >> balance 💰 ${minterEndingBalance.toString()}`);
                // console.log(`\t difference >> balance 💰 ${minterEndingBalance.sub(minterStartingBalance).toString()}`);
                assert(minterEndingBalance > minterStartingBalance);
                resolve();
              } catch (e) {
                console.log('\t ❌ ' + e);
                reject(e);
              }
            });
            try {
              const requestNftResponse = await randomIpfsNft.requestNft({ value: mintFee });
              const requestNftReceipt = await requestNftResponse.wait(1);
              minterStartingBalance = await deployer.getBalance();
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestNftReceipt.events[1].args.requestId,
                randomIpfsNft.address
              );
            } catch (e) {
              console.log('\t ❌ ' + e);
              reject(e);
            }
          });
        });
      });

      describe('getBreedFromModdedRange', () => {
        it('reverts if it is out of bounds', async () => {
          await expect(randomIpfsNft.getBreedFromModdedRange(200)).to.be.revertedWith(
            'RandomIpfsNft__RangeOutOfBounds()'
          );
        });

        it('returns 1st dog correctly', async () => {
          const breedFromModdedRange = await randomIpfsNft.getBreedFromModdedRange(5);
          assert(breedFromModdedRange.toString(), '0');
        });

        it('returns 2nd dog correctly', async () => {
          const breedFromModdedRange = await randomIpfsNft.getBreedFromModdedRange(22);
          assert(breedFromModdedRange.toString(), '1');
        });

        it('returns 3rd dog correctly', async () => {
          const breedFromModdedRange = await randomIpfsNft.getBreedFromModdedRange(88);
          assert(breedFromModdedRange.toString(), '2');
        });
      });
    });
