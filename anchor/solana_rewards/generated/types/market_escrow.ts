/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/market_escrow.json`.
 */
export type MarketEscrow = {
  "address": "8um9wXkGXVuxs9jVCpt3DrzkmMAiLDKrKkaHSLyPqPcX",
  "metadata": {
    "name": "marketEscrow",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Anchor program for escrowed NFT marketplace settlements."
  },
  "instructions": [
    {
      "name": "cancelListing",
      "docs": [
        "Cancels an active listing before any sale is executed."
      ],
      "discriminator": [
        41,
        183,
        50,
        232,
        230,
        233,
        157,
        70
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "escrowVault",
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
                "path": "listing"
              }
            ]
          }
        },
        {
          "name": "seller",
          "signer": true,
          "relations": [
            "listing"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "createListing",
      "docs": [
        "Creates a new listing PDA along with an escrow vault that will hold SOL",
        "until the sale settles."
      ],
      "discriminator": [
        18,
        168,
        45,
        24,
        191,
        31,
        117,
        54
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  115,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              },
              {
                "kind": "account",
                "path": "nftMint"
              },
              {
                "kind": "arg",
                "path": "listingId"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
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
                "path": "listing"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "nftMint"
        },
        {
          "name": "royaltyDestination"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "listingId",
          "type": "u64"
        },
        {
          "name": "priceLamports",
          "type": "u64"
        },
        {
          "name": "expirationTs",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "royaltyBps",
          "type": "u16"
        },
        {
          "name": "treasuryBps",
          "type": "u16"
        },
        {
          "name": "marketplaceFeeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "executeSale",
      "docs": [
        "Buyer transfers SOL into escrow. Once deposited, the listing moves into",
        "a pending settlement state awaiting admin settlement."
      ],
      "discriminator": [
        37,
        74,
        217,
        157,
        79,
        49,
        35,
        6
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "escrowVault",
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
                "path": "listing"
              }
            ]
          }
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "seller",
          "relations": [
            "listing"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "settleSale",
      "docs": [
        "Settles a sale by distributing escrowed funds, minting reward tokens,",
        "and recording loyalty activity."
      ],
      "discriminator": [
        182,
        49,
        63,
        248,
        140,
        81,
        40,
        126
      ],
      "accounts": [
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "escrowVault",
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
                "path": "listing"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true,
          "relations": [
            "listing"
          ]
        },
        {
          "name": "buyer"
        },
        {
          "name": "treasuryDestination",
          "writable": true
        },
        {
          "name": "marketplaceFeeDestination",
          "writable": true
        },
        {
          "name": "royaltyDestination",
          "writable": true
        },
        {
          "name": "receipt",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  99,
                  101,
                  105,
                  112,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "listing"
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "rewardVault",
          "writable": true
        },
        {
          "name": "vaultSigner",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  45,
                  115,
                  105,
                  103,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "rewardMint"
              }
            ]
          }
        },
        {
          "name": "rewardMint",
          "writable": true,
          "relations": [
            "rewardVault"
          ]
        },
        {
          "name": "buyerRewardAccount",
          "writable": true
        },
        {
          "name": "rewardAuthority",
          "signer": true
        },
        {
          "name": "loyaltyProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "buyer"
              }
            ]
          }
        },
        {
          "name": "loyaltyRegistryConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  103,
                  105,
                  115,
                  116,
                  114,
                  121,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "loyaltyAuthority",
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rewardsVaultProgram",
          "address": "YBSSnuhAgYq6SN1yofjNt8XyLW7B3mQQQFUBF8gwH6J"
        },
        {
          "name": "loyaltyProgram",
          "address": "GgfPQkNHuNbSw6cyDpzHeTLbTxSA2ZPUa2F1ZascnJur"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "rewardAmount",
          "type": "u64"
        },
        {
          "name": "loyaltyBonusPoints",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrowVault",
      "discriminator": [
        54,
        84,
        41,
        149,
        160,
        181,
        85,
        114
      ]
    },
    {
      "name": "listing",
      "discriminator": [
        218,
        32,
        50,
        73,
        43,
        134,
        26,
        58
      ]
    },
    {
      "name": "loyaltyProfile",
      "discriminator": [
        219,
        234,
        102,
        172,
        129,
        26,
        164,
        189
      ]
    },
    {
      "name": "registryConfig",
      "discriminator": [
        23,
        118,
        10,
        246,
        173,
        231,
        243,
        156
      ]
    },
    {
      "name": "saleReceipt",
      "discriminator": [
        114,
        79,
        236,
        216,
        212,
        117,
        80,
        21
      ]
    },
    {
      "name": "vaultConfig",
      "discriminator": [
        99,
        86,
        43,
        216,
        184,
        102,
        119,
        77
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "listingNotActive",
      "msg": "Listing is not active."
    },
    {
      "code": 6001,
      "name": "listingNotPending",
      "msg": "Listing must be pending settlement for this operation."
    },
    {
      "code": 6002,
      "name": "invalidListingPrice",
      "msg": "Listing price must be greater than zero."
    },
    {
      "code": 6003,
      "name": "invalidFeeConfiguration",
      "msg": "Total fee configuration exceeds 100%."
    },
    {
      "code": 6004,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow encountered."
    },
    {
      "code": 6005,
      "name": "missingBuyer",
      "msg": "No buyer recorded for this listing."
    },
    {
      "code": 6006,
      "name": "buyerMismatch",
      "msg": "Provided buyer account does not match listing state."
    },
    {
      "code": 6007,
      "name": "sellerMismatch",
      "msg": "Provided seller account does not match listing state."
    },
    {
      "code": 6008,
      "name": "royaltyDestinationMismatch",
      "msg": "Royalty destination does not match listing configuration."
    },
    {
      "code": 6009,
      "name": "insufficientEscrowBalance",
      "msg": "Escrow vault balance is insufficient."
    },
    {
      "code": 6010,
      "name": "outstandingEscrowBalance",
      "msg": "Escrow vault still holds funds; cancel not allowed."
    },
    {
      "code": 6011,
      "name": "escrowAlreadyFunded",
      "msg": "Escrow vault already funded for this listing."
    },
    {
      "code": 6012,
      "name": "unauthorizedLoyaltyAuthority",
      "msg": "Loyalty authority does not match registry configuration."
    },
    {
      "code": 6013,
      "name": "unauthorizedRewardAuthority",
      "msg": "Reward authority does not match vault configuration."
    },
    {
      "code": 6014,
      "name": "invalidPayoutAccount",
      "msg": "Destination account must be a system account."
    },
    {
      "code": 6015,
      "name": "listingExpired",
      "msg": "The listing has expired."
    },
    {
      "code": 6016,
      "name": "mismatchedRewardMint",
      "msg": "Reward mint does not match vault configuration."
    }
  ],
  "types": [
    {
      "name": "escrowVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "listing",
            "type": "pubkey"
          },
          {
            "name": "totalDeposited",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "listing",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "type": "u8"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "listingId",
            "type": "u64"
          },
          {
            "name": "priceLamports",
            "type": "u64"
          },
          {
            "name": "creationTs",
            "type": "i64"
          },
          {
            "name": "expirationTs",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "saleTs",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "settlementTs",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "listingStatus"
              }
            }
          },
          {
            "name": "royaltyBps",
            "type": "u16"
          },
          {
            "name": "royaltyDestination",
            "type": "pubkey"
          },
          {
            "name": "treasuryBps",
            "type": "u16"
          },
          {
            "name": "marketplaceFeeBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "listingStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "pendingSettlement"
          },
          {
            "name": "settled"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "loyaltyProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "points",
            "type": "u64"
          },
          {
            "name": "tier",
            "type": {
              "defined": {
                "name": "loyaltyTier"
              }
            }
          },
          {
            "name": "lastActivityTs",
            "type": "i64"
          },
          {
            "name": "delegate",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "loyaltyTier",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "bronze"
          },
          {
            "name": "silver"
          },
          {
            "name": "gold"
          },
          {
            "name": "platinum"
          },
          {
            "name": "diamond"
          }
        ]
      }
    },
    {
      "name": "registryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "pointsPerSol",
            "type": "u64"
          },
          {
            "name": "totalProfiles",
            "type": "u32"
          },
          {
            "name": "lastUpdatedTs",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "saleReceipt",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "listing",
            "type": "pubkey"
          },
          {
            "name": "buyer",
            "type": "pubkey"
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "amountPaid",
            "type": "u64"
          },
          {
            "name": "sellerProceeds",
            "type": "u64"
          },
          {
            "name": "royaltyPaid",
            "type": "u64"
          },
          {
            "name": "treasuryPaid",
            "type": "u64"
          },
          {
            "name": "marketplaceFeePaid",
            "type": "u64"
          },
          {
            "name": "rewardsMinted",
            "type": "u64"
          },
          {
            "name": "loyaltyPointsAwarded",
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
      "name": "vaultConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "configBump",
            "type": "u8"
          },
          {
            "name": "signerBump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "rewardMint",
            "type": "pubkey"
          },
          {
            "name": "emissionRate",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
