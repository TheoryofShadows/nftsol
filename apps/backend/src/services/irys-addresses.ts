/**
 * 🔄 Irys Address Conversion Utilities
 * Handle both Irys (base58) and Execution (hex/EVM) address formats
 */

/**
 * Convert between Irys and Execution address formats
 *
 * Irys Address (base58): 2QZrWyPPi4XukwiJQrVmUvuPQ57F
 * Execution Address (hex): 0x64f1a2829e0e698c18e7792d6e74f67d89aa0a32
 *
 * Both derive from same private key, so they're interchangeable
 */

export class IrysAddressConverter {
  /**
   * Base58 alphabet used by Irys
   */
  private static readonly BASE58_ALPHABET =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  /**
   * Decode base58 string to bytes
   */
  private static base58Decode(str: string): Buffer {
    let bytes = Buffer.from([0]);

    for (const char of str) {
      const digit = this.BASE58_ALPHABET.indexOf(char);
      if (digit === -1) {
        throw new Error(`Invalid base58 character: ${char}`);
      }

      let carry = digit;
      for (let j = 0; j < bytes.length; j++) {
        carry += bytes[j] * 58;
        bytes[j] = carry & 0xff;
        carry >>= 8;
      }

      while (carry > 0) {
        bytes = Buffer.concat([bytes, Buffer.from([carry & 0xff])]);
        carry >>= 8;
      }
    }

    // Handle leading zeros
    for (const char of str) {
      if (char === "1") {
        bytes = Buffer.concat([Buffer.from([0]), bytes]);
      } else {
        break;
      }
    }

    return bytes.reverse();
  }

  /**
   * Encode bytes to base58 string
   */
  private static base58Encode(buf: Buffer): string {
    if (buf.length === 0) return "";

    const bytes = Buffer.from(buf);
    const digits = [0];

    for (const byte of bytes) {
      let carry = byte;
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = Math.floor(carry / 58);
      }

      while (carry > 0) {
        digits.push(carry % 58);
        carry = Math.floor(carry / 58);
      }
    }

    let result = "";
    for (let i = bytes.length - 1; i >= 0 && bytes[i] === 0; i--) {
      result = "1" + result;
    }

    for (let i = digits.length - 1; i >= 0; i--) {
      result += this.BASE58_ALPHABET[digits[i]];
    }

    return result;
  }

  /**
   * Convert Irys address (base58) to Execution address (hex)
   */
  static irysToExecution(irysAddr: string): string {
    try {
      const bytes = this.base58Decode(irysAddr);
      // Take the first 20 bytes (40 hex chars) for EVM address
      const addressBytes = bytes.slice(0, 20);
      return "0x" + addressBytes.toString("hex");
    } catch (error) {
      console.error("Failed to convert Irys to Execution address:", error);
      throw new Error(`Invalid Irys address: ${irysAddr}`);
    }
  }

  /**
   * Convert Execution address (hex) to Irys address (base58)
   */
  static executionToIrys(execAddr: string): string {
    try {
      // Remove 0x prefix if present
      const hexAddr = execAddr.startsWith("0x") ? execAddr.slice(2) : execAddr;
      const bytes = Buffer.from(hexAddr, "hex");
      return this.base58Encode(bytes);
    } catch (error) {
      console.error("Failed to convert Execution to Irys address:", error);
      throw new Error(`Invalid Execution address: ${execAddr}`);
    }
  }

  /**
   * Detect which format an address is in
   */
  static detectFormat(address: string): "irys" | "execution" | "unknown" {
    if (!address) return "unknown";

    // Execution addresses start with 0x and are 42 chars (0x + 40 hex chars)
    if (address.startsWith("0x") && address.length === 42) {
      return "execution";
    }

    // Irys addresses are base58, typically 34 chars
    if (!address.startsWith("0x") && address.length > 30) {
      return "irys";
    }

    return "unknown";
  }

  /**
   * Normalize address - always return both formats
   */
  static normalize(address: string): {
    irys: string;
    execution: string;
    format: "irys" | "execution";
  } {
    const format = this.detectFormat(address);

    if (format === "irys") {
      return {
        irys: address,
        execution: this.irysToExecution(address),
        format: "irys",
      };
    } else if (format === "execution") {
      return {
        irys: this.executionToIrys(address),
        execution: address,
        format: "execution",
      };
    }

    throw new Error(`Unknown address format: ${address}`);
  }

  /**
   * Pretty print address info
   */
  static printAddressInfo(address: string): void {
    try {
      const normalized = this.normalize(address);
      console.log(`\n[Irys] Address Information:`);
      console.log(`  Input Format: ${normalized.format}`);
      console.log(`  Irys Address (base58): ${normalized.irys}`);
      console.log(`  Execution Address (hex): ${normalized.execution}`);
      console.log(`\n`);
    } catch (error) {
      console.error("Failed to print address info:", error);
    }
  }
}

// Export utilities for easy use
export const irysToExec = IrysAddressConverter.irysToExecution;
export const execToIrys = IrysAddressConverter.executionToIrys;
export const detectAddrFormat = IrysAddressConverter.detectFormat;
export const normalizeAddr = IrysAddressConverter.normalize;
