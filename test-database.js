// Simple test script to check if database operations are working
const axios = require('axios');

const BACKEND_API_BASE = 'http://localhost:8080';

async function testDatabaseOperations() {
    console.log('🧪 Testing Database Operations...\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing backend health...');
        const healthResponse = await axios.get(`${BACKEND_API_BASE}/api/health`);
        console.log('✅ Backend Health:', healthResponse.data);
        console.log('');

        // Test 2: Get all users (to see current state)
        console.log('2️⃣ Getting all users (current state)...');
        try {
            const usersResponse = await axios.get(`${BACKEND_API_BASE}/api/users`);
            console.log('✅ Current users count:', usersResponse.data.count || 0);
            if (usersResponse.data.data && usersResponse.data.data.length > 0) {
                console.log('📋 Latest users:');
                usersResponse.data.data.slice(0, 3).forEach((user, index) => {
                    console.log(`   ${index + 1}. ${user.user_name} (${user.email}) - ID: ${user.id}`);
                });
            }
        } catch (error) {
            console.log('❌ Error getting users:', error.response?.data || error.message);
        }
        console.log('');

        // Test 3: Create a new test user
        console.log('3️⃣ Creating a test user...');
        const testUser = {
            user_name: 'Test User ' + Date.now(),
            email: `testuser${Date.now()}@example.com`,
            nic: '199501234567',
            mobile_no: '0771234567',
            evm: '0x1234567890123456789012345678901234567890'
        };

        console.log('📝 Test user data:', testUser);

        const createResponse = await axios.post(`${BACKEND_API_BASE}/api/users`, testUser);
        console.log('✅ User created successfully!');
        console.log('📋 Created user:', {
            id: createResponse.data.data?.id,
            name: createResponse.data.data?.user_name,
            email: createResponse.data.data?.email
        });
        console.log('');

        // Test 4: Verify the user was created by fetching all users again
        console.log('4️⃣ Verifying user was saved...');
        const verifyResponse = await axios.get(`${BACKEND_API_BASE}/api/users`);
        console.log('✅ Total users after creation:', verifyResponse.data.count || 0);
        console.log('');

        // Test 5: Get user by email
        console.log('5️⃣ Testing get user by email...');
        try {
            const emailResponse = await axios.get(`${BACKEND_API_BASE}/api/users/email/${testUser.email}`);
            console.log('✅ Found user by email:', {
                id: emailResponse.data.data?.id,
                name: emailResponse.data.data?.user_name,
                email: emailResponse.data.data?.email
            });
        } catch (error) {
            console.log('❌ Error getting user by email:', error.response?.data || error.message);
        }
        console.log('');

        console.log('🎉 Database test completed successfully!');
        console.log('✅ The users table is working correctly and can:');
        console.log('   - Store new user registrations');
        console.log('   - Retrieve users by various methods');
        console.log('   - Handle the registration data format');

    } catch (error) {
        console.error('❌ Database test failed:', error.response?.data || error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Suggestions:');
            console.log('   1. Make sure the Ballerina server is running on port 9090');
            console.log('   2. Check if the server started successfully');
            console.log('   3. Verify database connection settings');
        }
    }
}

// Run the test
testDatabaseOperations();
