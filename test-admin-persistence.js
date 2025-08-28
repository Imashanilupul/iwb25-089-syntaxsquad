// Test script to verify admin authentication persistence
// This script simulates the authentication flow and checks localStorage persistence

console.log('🧪 Testing Admin Authentication Persistence...\n');

// Simulate a fully authenticated state
const mockAuthState = {
  address: "0x1234567890abcdef1234567890abcdef12345678",
  walletVerified: true,
  verified: true,
  asgardeoUser: {
    sub: "test-user-123",
    given_name: "Test",
    family_name: "Admin"
  },
  isRegisteredUser: true,
  isFullyAuthenticated: true,
  jwt: "mock-jwt-token"
};

// Test localStorage persistence
console.log('1. Testing localStorage persistence...');
try {
  localStorage.setItem('adminAuthState', JSON.stringify(mockAuthState));
  localStorage.setItem('adminAuthStateTime', Date.now().toString());
  
  const saved = localStorage.getItem('adminAuthState');
  const parsedSaved = JSON.parse(saved);
  
  console.log('   ✅ Successfully saved auth state to localStorage');
  console.log('   📦 Saved state:', parsedSaved);
} catch (error) {
  console.log('   ❌ Failed to save to localStorage:', error);
}

// Test state restoration
console.log('\n2. Testing state restoration...');
try {
  const savedAuth = localStorage.getItem('adminAuthState');
  const saveTime = localStorage.getItem('adminAuthStateTime');
  
  if (savedAuth && saveTime) {
    const parsedAuth = JSON.parse(savedAuth);
    const timeDiff = Date.now() - parseInt(saveTime);
    const isExpired = timeDiff > 24 * 60 * 60 * 1000; // 24 hours
    
    console.log('   ✅ Found saved auth state');
    console.log('   🕒 Save time:', new Date(parseInt(saveTime)).toISOString());
    console.log('   ⏰ Time difference:', Math.round(timeDiff / 1000), 'seconds');
    console.log('   🔒 Is expired:', isExpired);
    
    if (!isExpired) {
      console.log('   🎉 Auth state can be restored!');
    } else {
      console.log('   ⚠️  Auth state is expired and should be cleared');
    }
  } else {
    console.log('   ❌ No saved auth state found');
  }
} catch (error) {
  console.log('   ❌ Failed to restore auth state:', error);
}

// Test cleanup
console.log('\n3. Testing cleanup...');
try {
  localStorage.removeItem('adminAuthState');
  localStorage.removeItem('adminAuthStateTime');
  
  const afterCleanup = localStorage.getItem('adminAuthState');
  if (!afterCleanup) {
    console.log('   ✅ Successfully cleaned up auth state');
  } else {
    console.log('   ❌ Failed to clean up auth state');
  }
} catch (error) {
  console.log('   ❌ Failed to cleanup:', error);
}

console.log('\n🏁 Test completed!\n');

// Instructions for manual testing
console.log('📝 Manual Testing Instructions:');
console.log('1. Connect wallet and login to admin portal');
console.log('2. Verify you see the admin dashboard (not the welcome screen)');
console.log('3. Refresh the page (F5 or Ctrl+R)');
console.log('4. You should stay on the admin dashboard (not redirect to welcome)');
console.log('5. Click "Disconnect Wallet" button');
console.log('6. You should be redirected to adminLogin/welcome screen');
console.log('7. Refresh again - you should stay on the welcome screen');
