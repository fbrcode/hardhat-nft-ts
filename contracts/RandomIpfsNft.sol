// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreEthSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  // when we mint an NFT, we will trigger a chainlink VRF call to get us a random number
  // using that number, we will get a random NFT
  // Pug, Shiba Inu, St. Bernard
  // Pug super rare
  // Shiba Inu sort of rare
  // St. Bernard is common

  // users have to pay to mint an NFT
  // the owner of the contract can withdraw the funds

  // Type declaration
  enum Breed {
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }

  // chainlink vars
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;

  // VRF helpers
  mapping(uint256 => address) public s_requestIdToSender;

  // NFT vars
  uint256 public s_tokenCounter;
  uint256 internal constant MAX_CHANCE_VALUE = 100;
  string[] internal s_dogTokenUris;
  uint256 internal immutable i_mintFee;

  // Events
  event NftRequested(uint256 indexed requestId, address requester);
  event NftMinted(Breed breed, address minter);

  constructor(
    address vrfCoordinatorV2,
    uint64 subscriptionId,
    bytes32 gasLane,
    uint32 callbackGasLimit,
    string[3] memory dogTokenUris,
    uint256 mintFee
  ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721('Random IPFS Dogs', 'RID') {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_subscriptionId = subscriptionId;
    i_gasLane = gasLane;
    i_callbackGasLimit = callbackGasLimit;
    s_dogTokenUris = dogTokenUris;
    i_mintFee = mintFee;
  }

  function requestNft() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert RandomIpfsNft__NeedMoreEthSent();
    }
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requestIdToSender[requestId] = msg.sender;
    emit NftRequested(requestId, msg.sender);
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    address dogOwner = s_requestIdToSender[requestId];
    // mint a random NFT on VRF node callback
    uint256 newTokenId = s_tokenCounter;
    // what does this token looks like?
    uint256 moddedRange = randomWords[0] % MAX_CHANCE_VALUE;
    // 0 - 99
    // 7 -> Pug
    // 12 -> Shiba Inu
    // 88 -> St. Bernard
    // 45 -> St. Bernard
    Breed dogBreed = getBreedFromModdedRange(moddedRange);
    s_tokenCounter++;
    _safeMint(dogOwner, newTokenId);
    _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
    emit NftMinted(dogBreed, dogOwner);
  }

  function widthdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool success, ) = payable(msg.sender).call{value: amount}('');
    if (!success) {
      revert RandomIpfsNft__TransferFailed();
    }
  }

  function getBreedFromModdedRange(uint256 moddedRange) public pure returns (Breed) {
    uint256 cummulativeSum = 0;
    uint256[3] memory chanceArray = getChanceArray();
    for (uint256 i = 0; i < chanceArray.length; i++) {
      if (moddedRange >= cummulativeSum && moddedRange < cummulativeSum + chanceArray[i]) {
        return Breed(i);
      }
      cummulativeSum += chanceArray[i];
    }
    revert RandomIpfsNft__RangeOutOfBounds();
  }

  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 30, MAX_CHANCE_VALUE];
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getDogTokenUris(uint256 index) public view returns (string memory) {
    return s_dogTokenUris[index];
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }
}
