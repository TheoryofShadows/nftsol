// NFTSol Production-Ready Test Suite
// Run this to verify the complete withdrawal system

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

class WithdrawalTestSuite {
  constructor() {
    this.testResults = [];
    this.withdrawalId = null;
  }

  async runAllTests() {
    console.log('🚀 NFTSol Production-Ready Test Suite');
    console.log('=====================================');

    try {
      await this.testHealthCheck();
      await this.testProgramsEndpoint();
      await this.testEmergencyControls();
      await this.testWithdrawalCreation();
      await this.testAdminApproval();
      await this.testAdminProcessing();
      await this.testReconciliationQueries();

      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('📊 Testing health check...');
    try {
      const response = await fetch(`${BASE_URL}/healthz`);
      const data = await response.json();

      if (data.success && data.data.status === 'healthy') {
        this.addResult('Health Check', 'PASS', 'Server is healthy');
      } else {
        this.addResult('Health Check', 'FAIL', 'Server health check failed');
      }
    } catch (error) {
      this.addResult('Health Check', 'FAIL', error.message);
    }
  }

  async testProgramsEndpoint() {
    console.log('📊 Testing programs endpoint...');
    try {
      const response = await fetch(`${BASE_URL}/api/programs`);
      const data = await response.json();

      if (data.success && data.data.programs.cloutProgramId) {
        this.addResult('Programs Endpoint', 'PASS', 'Program IDs configured');
      } else {
        this.addResult('Programs Endpoint', 'FAIL', 'Program IDs not configured');
      }
    } catch (error) {
      this.addResult('Programs Endpoint', 'FAIL', error.message);
    }
  }

  async testEmergencyControls() {
    console.log('📊 Testing emergency controls...');
    try {
      const response = await fetch(`${BASE_URL}/api/admin/emergency/status`);
      const data = await response.json();

      if (data.success && typeof data.data.withdrawalsPaused === 'boolean') {
        this.addResult('Emergency Controls', 'PASS', 'Emergency controls accessible');
      } else {
        this.addResult('Emergency Controls', 'FAIL', 'Emergency controls not accessible');
      }
    } catch (error) {
      this.addResult('Emergency Controls', 'FAIL', error.message);
    }
  }

  async testWithdrawalCreation() {
    console.log('📊 Testing withdrawal creation...');
    try {
      const withdrawalData = {
        amount_sol: 0.01,
        to_address: '11111111111111111111111111111112',
        request_token: 'test-token-' + Date.now(),
      };

      const response = await fetch(`${BASE_URL}/api/wallets/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withdrawalData),
      });

      const data = await response.json();

      if (data.status === 'pending' && data.withdrawal && data.withdrawal.id) {
        this.withdrawalId = data.withdrawal.id;
        this.addResult('Withdrawal Creation', 'PASS', `Created withdrawal: ${this.withdrawalId}`);
      } else {
        this.addResult(
          'Withdrawal Creation',
          'FAIL',
          `Unexpected response: ${JSON.stringify(data)}`
        );
      }
    } catch (error) {
      this.addResult('Withdrawal Creation', 'FAIL', error.message);
    }
  }

  async testAdminApproval() {
    if (!this.withdrawalId) {
      this.addResult('Admin Approval', 'SKIP', 'No withdrawal ID available');
      return;
    }

    console.log('📊 Testing admin approval...');
    try {
      const response = await fetch(
        `${BASE_URL}/api/admin/withdrawals/${this.withdrawalId}/approve`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (data.status === 'approved') {
        this.addResult('Admin Approval', 'PASS', 'Withdrawal approved successfully');
      } else {
        this.addResult('Admin Approval', 'FAIL', `Approval failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      this.addResult('Admin Approval', 'FAIL', error.message);
    }
  }

  async testAdminProcessing() {
    if (!this.withdrawalId) {
      this.addResult('Admin Processing', 'SKIP', 'No withdrawal ID available');
      return;
    }

    console.log('📊 Testing admin processing...');
    try {
      const response = await fetch(
        `${BASE_URL}/api/admin/withdrawals/${this.withdrawalId}/process`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (data.status === 'completed' || data.txSig) {
        this.addResult('Admin Processing', 'PASS', `Withdrawal processed: ${data.txSig || 'mock'}`);
      } else {
        this.addResult('Admin Processing', 'FAIL', `Processing failed: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      this.addResult('Admin Processing', 'FAIL', error.message);
    }
  }

  async testReconciliationQueries() {
    console.log('📊 Testing reconciliation queries...');
    try {
      // Test that we can query pending withdrawals
      const response = await fetch(`${BASE_URL}/api/admin/withdrawals?status=pending`);
      const data = await response.json();

      if (Array.isArray(data)) {
        this.addResult('Reconciliation Queries', 'PASS', 'Admin queries working');
      } else {
        this.addResult('Reconciliation Queries', 'FAIL', 'Admin queries not working');
      }
    } catch (error) {
      this.addResult('Reconciliation Queries', 'FAIL', error.message);
    }
  }

  addResult(test, status, message) {
    this.testResults.push({ test, status, message });
  }

  printResults() {
    console.log('\n📋 TEST RESULTS');
    console.log('================');

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    this.testResults.forEach((result) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${icon} ${result.test}: ${result.status} - ${result.message}`);

      if (result.status === 'PASS') passed++;
      else if (result.status === 'FAIL') failed++;
      else skipped++;
    });

    console.log('\n📊 SUMMARY');
    console.log('===========');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📈 Total: ${this.testResults.length}`);

    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is production-ready!');
    } else {
      console.log('\n⚠️ Some tests failed. Please review before production deployment.');
      process.exit(1);
    }
  }
}

// Run the test suite
const testSuite = new WithdrawalTestSuite();
testSuite.runAllTests();
