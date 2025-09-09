/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/localsolana_contracts.json`.
 */
export type LocalsolanaContracts = {
  "address": "4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x",
  "metadata": {
    "name": "localsolanaContracts",
    "version": "0.1.2",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "autoCancel",
      "discriminator": [
        83,
        161,
        99,
        154,
        167,
        3,
        133,
        159
      ],
      "accounts": [
        {
          "name": "arbitrator",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "sellerTokenAccount",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "cancelEscrow",
      "discriminator": [
        156,
        203,
        54,
        179,
        38,
        72,
        33,
        21
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "optional": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "sellerTokenAccount",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createEscrow",
      "discriminator": [
        253,
        215,
        165,
        116,
        36,
        108,
        68,
        80
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "buyer"
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "escrowId"
              },
              {
                "kind": "arg",
                "path": "tradeId"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "escrowId",
          "type": "u64"
        },
        {
          "name": "tradeId",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "sequential",
          "type": "bool"
        },
        {
          "name": "sequentialEscrowAddress",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "defaultJudgment",
      "discriminator": [
        103,
        255,
        235,
        98,
        158,
        165,
        125,
        75
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "arbitrator",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "buyerTokenAccount",
          "writable": true
        },
        {
          "name": "sellerTokenAccount",
          "writable": true
        },
        {
          "name": "buyerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "sellerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "fundEscrow",
      "discriminator": [
        155,
        18,
        218,
        141,
        182,
        213,
        69,
        201
      ],
      "accounts": [
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "escrowId"
              },
              {
                "kind": "arg",
                "path": "tradeId"
              }
            ]
          }
        },
        {
          "name": "sellerTokenAccount",
          "writable": true
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "escrowId",
          "type": "u64"
        },
        {
          "name": "tradeId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeBuyerBondAccount",
      "discriminator": [
        33,
        161,
        142,
        133,
        182,
        160,
        195,
        90
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "escrowId"
              },
              {
                "kind": "arg",
                "path": "tradeId"
              }
            ]
          }
        },
        {
          "name": "buyerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "escrowId",
          "type": "u64"
        },
        {
          "name": "tradeId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeSellerBondAccount",
      "discriminator": [
        164,
        116,
        173,
        16,
        54,
        62,
        16,
        194
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "arg",
                "path": "escrowId"
              },
              {
                "kind": "arg",
                "path": "tradeId"
              }
            ]
          }
        },
        {
          "name": "sellerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "escrowId",
          "type": "u64"
        },
        {
          "name": "tradeId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "markFiatPaid",
      "discriminator": [
        147,
        155,
        78,
        133,
        158,
        150,
        89,
        70
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "openDisputeWithBond",
      "discriminator": [
        107,
        47,
        12,
        245,
        112,
        23,
        5,
        85
      ],
      "accounts": [
        {
          "name": "disputingParty",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        },
        {
          "name": "disputingPartyTokenAccount",
          "writable": true
        },
        {
          "name": "buyerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "sellerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "evidenceHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "releaseEscrow",
      "discriminator": [
        146,
        253,
        129,
        233,
        20,
        145,
        181,
        206
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "buyerTokenAccount",
          "writable": true
        },
        {
          "name": "arbitratorTokenAccount",
          "writable": true
        },
        {
          "name": "sequentialEscrowTokenAccount",
          "writable": true,
          "optional": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "resolveDisputeWithExplanation",
      "discriminator": [
        189,
        74,
        181,
        226,
        179,
        199,
        201,
        192
      ],
      "accounts": [
        {
          "name": "arbitrator",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "writable": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "buyerTokenAccount",
          "writable": true
        },
        {
          "name": "sellerTokenAccount",
          "writable": true
        },
        {
          "name": "arbitratorTokenAccount",
          "writable": true
        },
        {
          "name": "buyerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "sellerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "decision",
          "type": "bool"
        },
        {
          "name": "resolutionHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "respondToDisputeWithBond",
      "discriminator": [
        228,
        27,
        214,
        143,
        75,
        31,
        29,
        212
      ],
      "accounts": [
        {
          "name": "respondingParty",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        },
        {
          "name": "respondingPartyTokenAccount",
          "writable": true
        },
        {
          "name": "buyerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  121,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "sellerBondAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  98,
                  111,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "evidenceHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "updateSequentialAddress",
      "discriminator": [
        11,
        3,
        89,
        53,
        111,
        178,
        25,
        158
      ],
      "accounts": [
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "escrow.escrow_id",
                "account": "escrow"
              },
              {
                "kind": "account",
                "path": "escrow.trade_id",
                "account": "escrow"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newAddress",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    }
  ],
  "events": [
    {
      "name": "disputeDefaultJudgment",
      "discriminator": [
        194,
        12,
        130,
        224,
        60,
        204,
        39,
        194
      ]
    },
    {
      "name": "disputeOpened",
      "discriminator": [
        239,
        222,
        102,
        235,
        193,
        85,
        1,
        214
      ]
    },
    {
      "name": "disputeResolved",
      "discriminator": [
        121,
        64,
        249,
        153,
        139,
        128,
        236,
        187
      ]
    },
    {
      "name": "disputeResponseSubmitted",
      "discriminator": [
        22,
        179,
        0,
        219,
        181,
        109,
        45,
        5
      ]
    },
    {
      "name": "escrowBalanceChanged",
      "discriminator": [
        169,
        241,
        33,
        44,
        253,
        206,
        89,
        168
      ]
    },
    {
      "name": "escrowCancelled",
      "discriminator": [
        98,
        241,
        195,
        122,
        213,
        0,
        162,
        161
      ]
    },
    {
      "name": "escrowCreated",
      "discriminator": [
        70,
        127,
        105,
        102,
        92,
        97,
        7,
        173
      ]
    },
    {
      "name": "escrowReleased",
      "discriminator": [
        131,
        7,
        138,
        104,
        166,
        190,
        113,
        112
      ]
    },
    {
      "name": "fiatMarkedPaid",
      "discriminator": [
        38,
        159,
        7,
        17,
        32,
        79,
        143,
        184
      ]
    },
    {
      "name": "fundsDeposited",
      "discriminator": [
        157,
        209,
        100,
        95,
        59,
        100,
        3,
        68
      ]
    },
    {
      "name": "sequentialAddressUpdated",
      "discriminator": [
        205,
        6,
        123,
        144,
        102,
        253,
        81,
        133
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Invalid amount: Zero or negative"
    },
    {
      "code": 6001,
      "name": "exceedsMaximum",
      "msg": "Amount exceeds maximum (100 USDC)"
    },
    {
      "code": 6002,
      "name": "unauthorized",
      "msg": "Unauthorized caller"
    },
    {
      "code": 6003,
      "name": "depositDeadlineExpired",
      "msg": "Deposit deadline expired"
    },
    {
      "code": 6004,
      "name": "fiatDeadlineExpired",
      "msg": "Fiat payment deadline expired"
    },
    {
      "code": 6005,
      "name": "invalidState",
      "msg": "Invalid state transition"
    },
    {
      "code": 6006,
      "name": "missingSequentialAddress",
      "msg": "Missing sequential escrow address"
    },
    {
      "code": 6007,
      "name": "terminalState",
      "msg": "Already in terminal state"
    },
    {
      "code": 6008,
      "name": "feeCalculationError",
      "msg": "Fee calculation error"
    },
    {
      "code": 6009,
      "name": "insufficientFunds",
      "msg": "Insufficient funds to cover principal and fee"
    },
    {
      "code": 6010,
      "name": "incorrectBondAmount",
      "msg": "Dispute bond amount incorrect"
    },
    {
      "code": 6011,
      "name": "responseDeadlineExpired",
      "msg": "Dispute response deadline expired"
    },
    {
      "code": 6012,
      "name": "invalidEvidenceHash",
      "msg": "Evidence hash missing or invalid"
    },
    {
      "code": 6013,
      "name": "duplicateEvidence",
      "msg": "Duplicate evidence submission"
    },
    {
      "code": 6014,
      "name": "arbitrationDeadlineExpired",
      "msg": "Arbitration deadline expired"
    },
    {
      "code": 6015,
      "name": "missingDisputeBond",
      "msg": "Missing dispute bond"
    },
    {
      "code": 6016,
      "name": "invalidResolutionExplanation",
      "msg": "Invalid resolution explanation"
    },
    {
      "code": 6017,
      "name": "bumpNotFound",
      "msg": "Required bump seed not found"
    }
  ],
  "types": [
    {
      "name": "disputeDefaultJudgment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "defaultingParty",
            "type": "pubkey"
          },
          {
            "name": "decision",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "disputeOpened",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "disputingParty",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "evidenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bondAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "disputeResolved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "decision",
            "type": "bool"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "counter",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "resolutionHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "explanationReference",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "disputeResponseSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "respondingParty",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "evidenceHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bondAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "escrow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "arbitrator",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "depositDeadline",
            "type": "i64"
          },
          {
            "name": "fiatDeadline",
            "type": "i64"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "escrowState"
              }
            }
          },
          {
            "name": "sequential",
            "type": "bool"
          },
          {
            "name": "sequentialEscrowAddress",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "fiatPaid",
            "type": "bool"
          },
          {
            "name": "counter",
            "type": "u64"
          },
          {
            "name": "disputeInitiator",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "disputeInitiatedTime",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "disputeEvidenceHashBuyer",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "disputeEvidenceHashSeller",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "disputeResolutionHash",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "trackedBalance",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "escrowBalanceChanged",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "newBalance",
            "type": "u64"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "escrowCancelled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "counter",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "escrowCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "arbitrator",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "depositDeadline",
            "type": "i64"
          },
          {
            "name": "fiatDeadline",
            "type": "i64"
          },
          {
            "name": "sequential",
            "type": "bool"
          },
          {
            "name": "sequentialEscrowAddress",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "escrowReleased",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "counter",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "destination",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "escrowState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "created"
          },
          {
            "name": "funded"
          },
          {
            "name": "released"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "disputed"
          },
          {
            "name": "resolved"
          }
        ]
      }
    },
    {
      "name": "fiatMarkedPaid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "fundsDeposited",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "counter",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "sequentialAddressUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "objectId",
            "type": "pubkey"
          },
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "tradeId",
            "type": "u64"
          },
          {
            "name": "oldAddress",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "newAddress",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
