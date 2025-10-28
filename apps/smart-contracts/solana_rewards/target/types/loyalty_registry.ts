/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/loyalty_registry.json`.
 */
export type LoyaltyRegistry = {
  "address": "GgfPQkNHuNbSw6cyDpzHeTLbTxSA2ZPUa2F1ZascnJur",
  "metadata": {
    "name": "loyaltyRegistry",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Anchor program tracking cross-marketplace loyalty tiers."
  },
  "instructions": [
    {
      "name": "grantBonus",
      "docs": [
        "Grants additional loyalty points outside of direct marketplace volume."
      ],
      "discriminator": [
        167,
        197,
        55,
        15,
        33,
        179,
        251,
        180
      ],
      "accounts": [
        {
          "name": "profile",
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
                "path": "profile.owner",
                "account": "loyaltyProfile"
              }
            ]
          }
        },
        {
          "name": "registryConfig",
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
          "name": "authority",
          "signer": true,
          "relations": [
            "registryConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "points",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeRegistry",
      "docs": [
        "Initialize the registry configuration with a controlling authority and",
        "default point multiplier (points granted per SOL of activity)."
      ],
      "discriminator": [
        189,
        181,
        20,
        17,
        174,
        57,
        249,
        59
      ],
      "accounts": [
        {
          "name": "registryConfig",
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
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "authority",
          "type": "pubkey"
        },
        {
          "name": "pointsPerSol",
          "type": "u64"
        }
      ]
    },
    {
      "name": "recordActivity",
      "docs": [
        "Records marketplace activity for a user. The authority signs to confirm",
        "the action originated from a trusted pipeline (e.g. market_escrow)."
      ],
      "discriminator": [
        199,
        86,
        104,
        65,
        200,
        211,
        71,
        50
      ],
      "accounts": [
        {
          "name": "profile",
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
                "path": "profile.owner",
                "account": "loyaltyProfile"
              }
            ]
          }
        },
        {
          "name": "registryConfig",
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
          "name": "authority",
          "signer": true,
          "relations": [
            "registryConfig"
          ]
        },
        {
          "name": "actor"
        }
      ],
      "args": [
        {
          "name": "volumeLamports",
          "type": "u64"
        },
        {
          "name": "bonusPoints",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerProfile",
      "docs": [
        "Creates a loyalty profile PDA for a user. This should be invoked on the",
        "user's first interaction with the marketplace."
      ],
      "discriminator": [
        218,
        120,
        4,
        210,
        2,
        210,
        149,
        255
      ],
      "accounts": [
        {
          "name": "registryConfig",
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
          "name": "profile",
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
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "setDelegate",
      "docs": [
        "Assigns a delegate who can perform tier maintenance on behalf of the user."
      ],
      "discriminator": [
        242,
        30,
        46,
        76,
        108,
        235,
        128,
        181
      ],
      "accounts": [
        {
          "name": "profile",
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
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "delegate",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "setRegistryAuthority",
      "docs": [
        "Allows the current authority to rotate control of the registry."
      ],
      "discriminator": [
        140,
        214,
        166,
        246,
        135,
        116,
        20,
        37
      ],
      "accounts": [
        {
          "name": "registryConfig",
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
          "name": "authority",
          "signer": true,
          "relations": [
            "registryConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "upgradeTier",
      "docs": [
        "Allows a user (or their delegate) to recalculate tier status manually."
      ],
      "discriminator": [
        122,
        56,
        170,
        60,
        252,
        234,
        190,
        51
      ],
      "accounts": [
        {
          "name": "profile",
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
                "path": "profile.owner",
                "account": "loyaltyProfile"
              }
            ]
          }
        },
        {
          "name": "caller",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
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
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "mathOverflow",
      "msg": "Math overflow detected."
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Caller is not authorized to perform this action."
    },
    {
      "code": 6002,
      "name": "profileAlreadyInitialized",
      "msg": "Loyalty profile already initialized."
    },
    {
      "code": 6003,
      "name": "actorMismatch",
      "msg": "Provided actor does not match the profile owner."
    }
  ],
  "types": [
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
    }
  ]
};
