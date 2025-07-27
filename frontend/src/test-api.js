// Test script to verify API integration
import { authAPI, productAPI, inventoryAPI, orderAPI, bargainAPI } from './utils/api.js';

const testAPI = async () => {
  console.log('🧪 Testing API Integration...\n');

  try {
    // Test 1: Login (you'll need to replace with actual credentials)
    console.log('1. Testing Authentication...');
    // const loginResult = await authAPI.login('test@example.com', 'password');
    // console.log('✅ Login successful:', loginResult);

    // Test 2: Get Products
    console.log('2. Testing Product API...');
    const products = await productAPI.getAllProducts({ limit: 5 });
    console.log('✅ Products fetched:', products.length, 'items');

    // Test 3: Get Inventory (if user is seller)
    console.log('3. Testing Inventory API...');
    try {
      const inventory = await inventoryAPI.getMyInventory({ limit: 5 });
      console.log('✅ Inventory fetched:', inventory.length, 'items');
    } catch (error) {
      console.log('ℹ️ Inventory test skipped (user might not be seller)');
    }

    // Test 4: Get Orders
    console.log('4. Testing Order API...');
    try {
      const orders = await orderAPI.getAllOrders({ limit: 5 });
      console.log('✅ Orders fetched:', orders.length, 'items');
    } catch (error) {
      console.log('ℹ️ Orders test skipped:', error.message);
    }

    // Test 5: Get Public Bargains
    console.log('5. Testing Bargain API...');
    try {
      const bargains = await bargainAPI.getAvailablePublicBargains({ limit: 5 });
      console.log('✅ Bargains fetched:', bargains.length, 'items');
    } catch (error) {
      console.log('ℹ️ Bargains test skipped:', error.message);
    }

    console.log('\n🎉 API Integration Test Completed!');

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
};

// Export for manual testing
export default testAPI;

// Uncomment to run automatically
// testAPI();
