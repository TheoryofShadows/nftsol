/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rewards_vault.json`.
 */
export type RewardsVault = {
  "address": "YBSSnuhAgYq6SN1yofjNt8XyLW7B3mQQQFUBF8gwH6J",
  "metadata": {
    "name": "rewardsVault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Anchor program responsible for managing CLOUT reward emissions."
  },
  "instructions": [
    {
      "name": "initializeVault",
      "docs": [
        "Initialize a vault configuration that will control emission schedules",
        "and reward distribution."
      ],
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "vaultConfig",
          "writable": true,
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
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
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
          "writable": true
        },
        {
          "name": "authority",
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
      "name": "mintRewards",
      "docs": [
        "Mint rewards directly to a recipient. In production this will be called",
        "internally by staking/escrow CPI flows."
      ],
      "discriminator": [
        88,
        68,
        37,
        76,
        94,
        110,
        224,
        187
      ],
      "accounts": [
        {
          "name": "vaultConfig",
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
            "vaultConfig"
          ]
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vaultConfig"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "setEmissionRate",
      "docs": [
        "Set the number of tokens emitted per slot. Eventually we will add",
        "advanced schedules, but this lets us test program wiring on-chain."
      ],
      "discriminator": [
        65,
        212,
        116,
        79,
        181,
        93,
        85,
        117
      ],
      "accounts": [
        {
          "name": "vaultConfig",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "vaultConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "emissionRate",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
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
      "name": "unauthorized",
      "msg": "Only the configured authority may perform this action."
    }
  ],
  "types": [
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
