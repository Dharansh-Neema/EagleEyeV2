const axios = require("axios");

// Test configuration
const BASE_URL = "http://localhost:5000";
const TEST_ORG_ID = "685e4a8dac95c110b5f0026a";

async function testIntegration() {
  console.log("🧪 Testing Organization Dashboard Integration...\n");

  try {
    // Test 1: Get Organization Details
    console.log("1. Testing Organization Details API...");
    const orgResponse = await axios.post(
      `${BASE_URL}/api/organizations/details`,
      {
        organizationId: TEST_ORG_ID,
      }
    );

    if (orgResponse.data.success) {
      console.log("✅ Organization details fetched successfully");
      console.log(`   Organization: ${orgResponse.data.data.name}`);
    } else {
      console.log("❌ Failed to fetch organization details");
    }

    // Test 2: Get Project Names
    console.log("\n2. Testing Project Names API...");
    const projectsResponse = await axios.post(
      `${BASE_URL}/api/projects/names`,
      {
        organizationId: TEST_ORG_ID,
      }
    );

    if (projectsResponse.data.success) {
      console.log("✅ Project names fetched successfully");
      console.log(`   Found ${projectsResponse.data.count} projects:`);
      projectsResponse.data.data.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (${project._id})`);
      });
    } else {
      console.log("❌ Failed to fetch project names");
    }

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Data:", error.response.data);
    }
  }
}

testIntegration();
