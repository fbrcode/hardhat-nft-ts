const { network } = require('hardhat');
const { verify } = require('../utils/verify');
const { storeImages, storeTokenUriMetadata } = require('../utils/uploadToPinata');

const imagesLocation = '../images/randomNft';

const metadataTemplate = {
  name: '',
  description: '',
  image: '',
  attributes: [],
};

// only define rinkeby as testnet for now
const networkConfig = {
  31337: {
    vrfCoordinator: null,
    subscriptionId: null,
    gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
    callbackGasLimit: '500000', // 500,000 gas
    mintFee: '10000000000000000', // 0.01 ETH
  },
  4: {
    vrfCoordinator: '0x6168499c0cFfCaCD319c818142124B7A15E857ab',
    subscriptionId: '5959',
    gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
    callbackGasLimit: '500000', // 500,000 gas
    mintFee: '10000000000000000', // 0.01 ETH
  },
};

const MOCK_VRF_SUB_FUND_AMOUNT = '1000000000000000000000';

async function deployRandomIpfsNft({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // get the IPFS hashes of our images
  let tokenUris;
  if (process.env.UPLOAD_TO_PINATA == 'true') {
    tokenUris = await handleTokenUris();
  }
  // options:
  // 1. with our own IPFS node
  // 2. pinata: https://www.pinata.cloud/ << using this option now
  // 3. nft.storage: https://nft.storage/

  let vrfCoordinatorV2Address, subscriptionId;
  if (!network.live) {
    try {
      const vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
      vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
      // extract subscription id from the mocked contract
      const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
      const transactionReceipt = await transactionResponse.wait(1);
      subscriptionId = transactionReceipt.events[0].args.subId;
      // in a real contract / network, we need to fund the subscription
      // you would need the link token on a real network
      await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, MOCK_VRF_SUB_FUND_AMOUNT);
    } catch (error) {
      log(error);
    }
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinator;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  log('----------------------------------------------------');
  log('Deploying RandomIpfsNft contract...');

  const gasLane = networkConfig[chainId].gasLane;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  // const mockedTokenUris = [
  //   'https://ipfs.io/ipfs/QmYwAPJzv5CZsnA8DzPAg8ePQZkzRcY5zT2hcVLDV7xymu',
  //   'https://ipfs.io/ipfs/QmYwAPJzv5CZsnA8DzPAg8ePQZkzRcY5zT2hcVLDV7xymu',
  //   'https://ipfs.io/ipfs/QmYwAPJzv5CZsnA8DzPAg8ePQZkzRcY5zT2hcVLDV7xymu',
  // ];
  const mintFee = networkConfig[chainId].mintFee;

  const args = [vrfCoordinatorV2Address, subscriptionId, gasLane, callbackGasLimit, tokenUris, mintFee];
  const randomIpfsNft = await deploy('RandomIpfsNft', {
    from: deployer,
    args,
    log: true,
    waitConfirmations: 1,
  });

  if (network.live && process.env.ETHERSCAN_API_KEY) {
    log(`Verifying contract "${randomIpfsNft.address}" with args [${args}] on a live network: ${network.name} ...`);
    await verify(randomIpfsNft.address, args);
  }
  log(`RandomIpfsNft Deployed!`);
  log('----------------------------------------------------');
}

async function handleTokenUris() {
  const tokenUris = [];
  // 1. store the image in IPFS
  // 2. store the metadata in IPFS
  const { responses: imageUploadResponses, files } = await storeImages(imagesLocation);
  for (imageUploadResponseIndex in imageUploadResponses) {
    let tokenUriMetadata = { ...metadataTemplate };
    tokenUriMetadata.name = files[imageUploadResponseIndex].replace('.png', '');
    tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} puppy!`;
    tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
    console.log(`Uploading metadata for ${tokenUriMetadata.name}...`);
    // store the JSON to pinata / IPFS
    const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log(`Token URIs Uploaded! They are:\n${JSON.stringify(tokenUris, null, 2)}`);
  return tokenUris;
}

module.exports = deployRandomIpfsNft;
module.exports.tags = ['all', 'random'];
