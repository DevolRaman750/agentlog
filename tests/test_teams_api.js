#!/usr/bin/env node

// Node.js 18+ has built-in fetch support

const API_BASE = 'http://localhost:8080';

async function testTeamsAPI() {
    console.log('🧪 Testing Teams API endpoints...\n');

    try {
        // Test 1: Create temporary user for testing
        console.log('1. Creating temporary user...');
        const userResponse = await fetch(`${API_BASE}/api/auth/temp-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!userResponse.ok) {
            throw new Error(`User creation failed: ${userResponse.status}`);
        }
        
        const userData = await userResponse.json();
        const authToken = userData.token;
        console.log('✅ Temporary user created');

        // Test 2: List teams (should be empty initially)
        console.log('\n2. Listing teams...');
        const teamsResponse = await fetch(`${API_BASE}/api/teams`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!teamsResponse.ok) {
            throw new Error(`Teams list failed: ${teamsResponse.status}`);
        }
        
        const teams = await teamsResponse.json();
        console.log(`✅ Teams listed successfully: ${teams.length} teams found`);

        // Test 3: Create a team
        console.log('\n3. Creating a team...');
        const createTeamResponse = await fetch(`${API_BASE}/api/teams`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test Team',
                description: 'A test team for API validation',
                maxTokensPerDay: 50000
            })
        });
        
        if (!createTeamResponse.ok) {
            const errorText = await createTeamResponse.text();
            throw new Error(`Team creation failed: ${createTeamResponse.status} - ${errorText}`);
        }
        
        const newTeam = await createTeamResponse.json();
        console.log(`✅ Team created successfully: ${newTeam.name} (ID: ${newTeam.id})`);

        // Test 4: Get the created team
        console.log('\n4. Getting team details...');
        const getTeamResponse = await fetch(`${API_BASE}/api/teams/${newTeam.id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!getTeamResponse.ok) {
            throw new Error(`Get team failed: ${getTeamResponse.status}`);
        }
        
        const teamDetails = await getTeamResponse.json();
        console.log(`✅ Team retrieved successfully: ${teamDetails.name}`);

        // Test 5: Update the team
        console.log('\n5. Updating team...');
        const updateTeamResponse = await fetch(`${API_BASE}/api/teams/${newTeam.id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: 'Updated test team description',
                maxTokensPerDay: 75000
            })
        });
        
        if (!updateTeamResponse.ok) {
            throw new Error(`Team update failed: ${updateTeamResponse.status}`);
        }
        
        const updatedTeam = await updateTeamResponse.json();
        console.log(`✅ Team updated successfully: Max tokens now ${updatedTeam.maxTokensPerDay}`);

        // Test 6: Get team stats
        console.log('\n6. Getting team stats...');
        const statsResponse = await fetch(`${API_BASE}/api/teams/${newTeam.id}/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!statsResponse.ok) {
            throw new Error(`Team stats failed: ${statsResponse.status}`);
        }
        
        const stats = await statsResponse.json();
        console.log(`✅ Team stats retrieved: ${stats.totalAgents} agents, ${stats.totalExecutions} executions`);

        // Test 7: Delete the team
        console.log('\n7. Cleaning up - deleting team...');
        const deleteTeamResponse = await fetch(`${API_BASE}/api/teams/${newTeam.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!deleteTeamResponse.ok) {
            throw new Error(`Team deletion failed: ${deleteTeamResponse.status}`);
        }
        
        console.log('✅ Team deleted successfully');

        console.log('\n🎉 All Teams API tests passed! The feature is working correctly.');
        
    } catch (error) {
        console.error('\n❌ Teams API test failed:', error.message);
        process.exit(1);
    }
}

testTeamsAPI(); 