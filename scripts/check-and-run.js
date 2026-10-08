/**
 * Developer Command Prompt & Debug Helper Script
 * Automates pre-flight build checks, TypeScript verification,
 * Unit Testing, Development Integration Testing, and dev server launching.
 */

const { execSync, spawn } = require('child_process');

console.log('\n======================================================');
console.log('🚀 CMS ADMIN PORTAL - BUILD, TEST & DEBUG RUNNER');
console.log('======================================================\n');

// 1. Check TypeScript & Build Validity
console.log('🔍 Step 1: Checking TypeScript & Build Validity...');
try {
  execSync('npx next build', { stdio: 'inherit', cwd: process.cwd() });
  console.log('\n✅ Step 1 Passed: Zero build compilation errors!\n');
} catch (error) {
  console.error('\n❌ Step 1 Failed: Build compilation issues detected.\n');
  process.exit(1);
}

// 2. Run Unit Tests & Development Integration Tests
console.log('🧪 Step 2: Running Unit Tests & Development Integration Tests...');
try {
  execSync('npx jest --passWithNoTests', { stdio: 'inherit', cwd: process.cwd() });
  console.log('\n✅ Step 2 Passed: All Unit & Development Integration Tests Passed!\n');
} catch (error) {
  console.error('\n❌ Step 2 Failed: Test failures detected.\n');
  process.exit(1);
}

// 3. Launch Dev Server for UI Debugging
console.log('🌐 Step 3: Starting Development Server for UI Debugging...');
console.log('📍 Access Admin Portal Login UI at: http://localhost:3000/admin/login\n');

const devServer = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

devServer.on('error', (err) => {
  console.error('Failed to start Next.js dev server:', err);
});
