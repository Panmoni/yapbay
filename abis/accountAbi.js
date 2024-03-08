//abis/accountAbi.js
export const accountContractAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "userId",
        type: "uint256",
      },
    ],
    name: "UserProfileUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "userId",
        type: "uint256",
      },
    ],
    name: "UserRegistered",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userBasicInfo",
    outputs: [
      {
        internalType: "uint256",
        name: "userId",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "userEmail",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "userChatHandle",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "userWebsite",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "userAvatar",
        type: "string",
      },
      {
        internalType: "string",
        name: "userRole",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "userCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userIdToAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_userEmail",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_userChatHandle",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_userWebsite",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "_userAvatar",
        type: "string",
      },
      {
        internalType: "string",
        name: "_userRole",
        type: "string",
      },
    ],
    name: "userReg",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_user",
        type: "address",
      },
    ],
    name: "userReputationCalc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "userStats",
    outputs: [
      {
        internalType: "uint256",
        name: "userReputationScore",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userEndorsementsGiven",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userEndorsementsReceived",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userDisputesInitiated",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userDisputesLost",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userTotalTradesInitiated",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userTotalTradesAccepted",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userTotalTradesCompleted",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userTotalTradeVolume",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userAverageTradeVolume",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "userLastCompletedTradeDate",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_userEmail",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_userChatHandle",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_userWebsite",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "_userAvatar",
        type: "string",
      },
      {
        internalType: "string",
        name: "_userRole",
        type: "string",
      },
    ],
    name: "userUpdateProfile",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
