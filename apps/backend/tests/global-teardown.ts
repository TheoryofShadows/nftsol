/**
 * Global Test Teardown
 * Runs once after all tests
 */

export default async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any global resources
  // Close database connections, etc.
  
  console.log('✅ Test environment cleanup completed');
};