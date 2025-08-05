#!/usr/bin/env node

const BACKEND_URL = 'http://localhost:8080';

// Test configuration for GitHub functions
const testConfig = {
  executionRunName: "GitHub Functions Test",
  description: "Testing GitHub functions after database reset",
  basePrompt: "Test the github_read_issues function with microsoft/vscode repository to verify it's working correctly. Use the function to read some issues.",
  enableFunctionCalling: true,
  functionTools: [
    {
      name: "github_read_issues",
      description: "Read and analyze issues from a GitHub repository. Provide valid owner/repo combinations like microsoft/vscode, facebook/react, or vercel/next.js. This helps understand bugs, feature requests, and project status."
    }
  ],
  configurations: [
    {
      id: "test-config-1",
      variationName: "GitHub Test",
      modelName: "gemini-1.5-flash",
      systemPrompt: "You are testing GitHub functions. Use the github_read_issues function with owner='microsoft' and repo='vscode' to verify it works.",
      temperature: 0.3,
      maxTokens: 1024,
      topP: 0.9
    }
  ]
};

async function testGitHubFunctions() {
  console.log('🧪 Testing GitHub Functions...');
  
  try {
    console.log('📡 Sending request to backend...');
    
    const response = await fetch(`${BACKEND_URL}/api/multi-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': 'test-user',
        // Add a dummy GitHub API key for testing (will use fallback if invalid)
        'X-GitHub-API-Key': 'test-key-for-validation'
      },
      body: JSON.stringify(testConfig)
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Test completed successfully!');
      console.log('📋 Execution ID:', result.executionRun?.id);
      console.log('📊 Success count:', result.successCount || 0);
      console.log('❌ Error count:', result.errorCount || 0);
      
      if (result.results && result.results.length > 0) {
        const firstResult = result.results[0];
        console.log('📄 First result preview:', firstResult.responseText?.substring(0, 200) + '...');
        
        if (firstResult.functionCalls && firstResult.functionCalls.length > 0) {
          console.log('🔧 Function calls made:', firstResult.functionCalls.length);
          firstResult.functionCalls.forEach((call, index) => {
            console.log(`   ${index + 1}. ${call.name} with args:`, call.args);
          });
        }
      }
      
      console.log('\n🎉 GitHub functions appear to be working correctly!');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Test failed with status:', response.status);
      console.error('📋 Error details:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
    return false;
  }
}

// Run the test
testGitHubFunctions().then(success => {
  console.log('\n📊 Test Result:', success ? 'PASSED ✅' : 'FAILED ❌');
  process.exit(success ? 0 : 1);
}); 