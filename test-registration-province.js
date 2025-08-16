// Test registration with province
const testRegistrationWithProvince = async () => {
    const BACKEND_API_BASE = 'http://localhost:8080';
    
    console.log('🧪 Testing Registration with Province...\n');

    // Test data
    const testUser = {
        user_name: "Test Registration Province",
        email: "testregprovince@example.com",
        nic: "199912345679",
        mobile_no: "0773456789",
        evm: "0x3456789012345678901234567890123456789012",
        Province: "Central"
    };

    try {
        console.log('📝 Creating user with province data:');
        console.log(JSON.stringify(testUser, null, 2));

        const response = await fetch(`${BACKEND_API_BASE}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testUser)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ User created successfully!');
            console.log('📋 Created user data:');
            console.log(`   ID: ${result.data?.id}`);
            console.log(`   Name: ${result.data?.user_name}`);
            console.log(`   Email: ${result.data?.email}`);
            console.log(`   NIC: ${result.data?.nic}`);
            console.log(`   Mobile: ${result.data?.mobile_no}`);
            console.log(`   Province: ${result.data?.Province}`);
            console.log(`   EVM: ${result.data?.evm?.slice(0, 10)}...`);
            
            // Test getting the user by email to verify province was saved
            console.log('\n🔍 Verifying province was saved...');
            const verifyResponse = await fetch(`${BACKEND_API_BASE}/api/users/email/${testUser.email}`);
            const verifyResult = await verifyResponse.json();
            
            if (verifyResponse.ok && verifyResult.data?.Province) {
                console.log(`✅ Province verification successful: ${verifyResult.data.Province}`);
            } else {
                console.log('❌ Province verification failed');
            }
        } else {
            console.log('❌ User creation failed:', result.message || response.statusText);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test if this is executed as a script
if (typeof window === 'undefined') {
    // Node.js environment
    testRegistrationWithProvince();
} else {
    // Browser environment - attach to window for manual testing
    window.testRegistrationWithProvince = testRegistrationWithProvince;
}

module.exports = { testRegistrationWithProvince };
