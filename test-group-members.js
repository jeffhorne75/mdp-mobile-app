const nodeFetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'https://demo-api.staging.wicketcloud.com';
const JWT_TOKEN = process.env.EXPO_PUBLIC_JWT_TOKEN;

async function testGroupMembersEndpoint() {
  if (!JWT_TOKEN) {
    console.error('JWT_TOKEN not found in environment variables');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // First, get a list of groups to find one with members
    console.log('=== FETCHING GROUPS LIST ===');
    const groupsResponse = await nodeFetch(`${API_BASE_URL}/groups?page[size]=10`, {
      headers
    });
    const groupsData = await groupsResponse.json();
    const groups = groupsData.data;
    
    if (!groups || groups.length === 0) {
      console.log('No groups found');
      return;
    }

    console.log(`Found ${groups.length} groups\n`);

    // Test membership_entries endpoint for each group
    for (const group of groups.slice(0, 5)) { // Test first 5 groups
      console.log(`\n=== TESTING GROUP: ${group.attributes.name} (${group.id}) ===`);
      
      try {
        const membersUrl = `${API_BASE_URL}/groups/${group.id}/membership_entries?include=person,role&sort=-starts_at&page[size]=10`;
        console.log(`Requesting: ${membersUrl}`);
        
        const membersResponse = await nodeFetch(membersUrl, { headers });
        
        console.log(`Response status: ${membersResponse.status}`);
        
        if (!membersResponse.ok) {
          const text = await membersResponse.text();
          console.error(`✗ Error: ${membersResponse.status} ${membersResponse.statusText}`);
          if (membersResponse.status === 404) {
            console.error('  -> Endpoint not found');
          }
          continue;
        }
        
        const membersData = await membersResponse.json();
        const members = membersData.data || [];
        
        console.log(`✓ Success! Found ${members.length} members`);
        
        if (members.length > 0) {
          console.log('\nFirst member details:');
          const firstMember = members[0];
          console.log(`- ID: ${firstMember.id}`);
          console.log(`- Type: ${firstMember.type}`);
          console.log(`- Starts at: ${firstMember.attributes?.starts_at || 'N/A'}`);
          console.log(`- Ends at: ${firstMember.attributes?.ends_at || 'N/A'}`);
          console.log(`- Status: ${firstMember.attributes?.status || 'N/A'}`);
          
          // Check if person data is included
          const included = membersData.included || [];
          const personId = firstMember.relationships?.person?.data?.id;
          if (personId) {
            const person = included.find(item => item.id === personId && item.type === 'people');
            if (person) {
              console.log(`- Person: ${person.attributes?.full_name || 'Unknown'}`);
            }
          }
          
          // Check if role data is included
          const roleId = firstMember.relationships?.role?.data?.id;
          if (roleId) {
            const role = included.find(item => item.id === roleId && item.type === 'roles');
            if (role) {
              console.log(`- Role: ${role.attributes?.title || 'Unknown'}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`✗ Error for group ${group.id}:`, error.message);
        if (error.message.includes('404')) {
          console.error('  -> 404 Not Found - membership_entries endpoint not available for this group');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
console.log('Testing Group Members API Endpoint\n');
testGroupMembersEndpoint();