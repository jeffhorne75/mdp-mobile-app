const nodeFetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'https://demo-api.staging.wicketcloud.com';
const JWT_TOKEN = process.env.EXPO_PUBLIC_JWT_TOKEN;

async function testGroupMembersInclude() {
  if (!JWT_TOKEN) {
    console.error('JWT_TOKEN not found in environment variables');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test getting a single group with members included
    const groupId = '95efa168-d151-4963-b2e8-dee19d4213ca'; // Another Forj Group
    const url = `${API_BASE_URL}/groups/${groupId}?include=members,members.person,members.role`;
    
    console.log('=== TESTING GROUP WITH MEMBERS INCLUDED ===');
    console.log(`Requesting: ${url}\n`);
    
    const response = await nodeFetch(url, { headers });
    
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    const group = data.data;
    const included = data.included || [];
    
    console.log(`Group: ${group.attributes.name}`);
    console.log(`Group ID: ${group.id}`);
    
    // Check if members relationship exists
    const membersRelationship = group.relationships?.members;
    if (membersRelationship) {
      console.log('\nMembers relationship found!');
      const memberIds = membersRelationship.data || [];
      console.log(`Number of member relationships: ${memberIds.length}`);
      
      if (memberIds.length > 0 && included.length > 0) {
        console.log('\nIncluded data types:');
        const types = [...new Set(included.map(item => item.type))];
        types.forEach(type => {
          const count = included.filter(item => item.type === type).length;
          console.log(`- ${type}: ${count}`);
        });
        
        // Try to find member data
        console.log('\nFirst few member IDs:');
        memberIds.slice(0, 3).forEach(memberData => {
          console.log(`- ${memberData.type}: ${memberData.id}`);
        });
        
        // Look for any membership-related data in included
        const membershipTypes = included.filter(item => 
          item.type.includes('member') || 
          item.type.includes('membership')
        );
        
        if (membershipTypes.length > 0) {
          console.log('\nFound membership-related data:');
          membershipTypes.slice(0, 3).forEach(item => {
            console.log(`- Type: ${item.type}, ID: ${item.id}`);
            if (item.attributes) {
              console.log(`  Attributes:`, Object.keys(item.attributes).join(', '));
            }
          });
        }
      }
    } else {
      console.log('\nNo members relationship found in group data');
      console.log('Available relationships:', Object.keys(group.relationships || {}));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
console.log('Testing Group Members via Include Parameter\n');
testGroupMembersInclude();