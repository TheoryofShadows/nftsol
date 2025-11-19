/**
 * 🔄 Irys Address Conversion Utilities
 * Handle both Irys (base58) and Execution (hex/EVM) address formats
 */

import { irysToExecAddr, execToIrysAddr } from "@irys/js/common/utils";

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
   * Convert Irys address (base58) to Execution address (hex)
   */
  static irysToExecution(irysAddr: string): string {
    try {
      return irysToExecAddr(irysAddr);
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
      return execToIrysAddr(execAddr);
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
