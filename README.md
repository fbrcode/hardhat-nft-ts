# Hardhat NFT Project

Use ERC-721 Non-Fungible Token Standard: <https://eips.ethereum.org/EIPS/eip-721>

## Init

- `git init`
- `yarn init -y`
- `yarn add --dev hardhat`
- `yarn add --dev prettier prettier-plugin-solidity`
- `yarn hardhat`
- `yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers @nomiclabs/hardhat-etherscan @nomiclabs/hardhat-waffle chai ethereum-waffle hardhat hardhat-contract-sizer hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage dotenv`

## Project steps

1. Basic NFT
2. Random IPFS NFT
3. Dynamic SVG NFT

## Openzeppelin Boilerplate

References:

- <https://docs.openzeppelin.com/contracts/2.x/api/token/erc721>
- <https://docs.openzeppelin.com/contracts/2.x/erc721>

`yarn add --dev @openzeppelin/contracts`

## Using Pinata

References:

- <https://www.pinata.cloud/>
- <https://app.pinata.cloud/keys>
- <https://docs.pinata.cloud/sdks>
  - <https://docs.pinata.cloud/pinata-api/pinning/pin-file-or-directory>
  - <https://docs.pinata.cloud/pinata-api/pinning/pin-json>

Install SDK: `yarn add --dev @pinata/sdk`
