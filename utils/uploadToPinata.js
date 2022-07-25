// use pinata sdk: @pinata/sdk
const pinataSdk = require('@pinata/sdk');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = pinataSdk(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
  const fullImagesPath = path.resolve(__dirname, imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  // console.log(`Found ${files} images`);
  let responses = [];
  console.log('Uploading images to Pinata IPFS...');
  for (const file of files) {
    console.log(`Uploading ${file}...`);
    const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${file}`);
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
  return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

module.exports = {
  storeImages,
  storeTokenUriMetadata,
};
