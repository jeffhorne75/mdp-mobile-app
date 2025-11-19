const nodeFetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'https://demo-api.staging.wicketcloud.com';
const JWT_TOKEN = process.env.EXPO_PUBLIC_JWT_TOKEN;

async function testGroupPeopleEndpoint() {
  if (!JWT_TOKEN) {
    console.error('JWT_TOKEN not found in environment variables');
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    const groupId = '95efa168-d151-4963-b2e8-dee19d4213ca'; // Another Forj Group
    const url = `${API_BASE_URL}/groups/${groupId}/people?include=person,role&sort=-created_at&page[size]=10`;
    
    console.log('=== TESTING GROUP PEOPLE ENDPOINT ===');
    console.log(`Requesting: ${url}\n`);
    
    const response = await nodeFetch(url, { headers });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Error: ${response.status} ${response.statusText}`);
      console.error('Response:', text.substring(0, 200));
      return;
    }
    
    const data = await response.json();
    const people = data.data || [];
    
    console.log(`✓ Success! Found ${people.length} people in the group`);
    
    if (people.length > 0) {
      console.log('\nFirst member details:');
      const firstMember = people[0];
      console.log(`- ID: ${firstMember.id}`);
      console.log(`- Type: ${firstMember.type}`);
      console.log(`- Attributes:`, firstMember.attributes || 'No attributes');
      
      // Check relationships
      if (firstMember.relationships?.person?.data) {
        console.log(`- Person ID: ${firstMember.relationships.person.data.id}`);
      }
      
      // Check included data
      const included = data.included || [];
      if (included.length > 0) {
        console.log(`\nIncluded data: ${included.length} items`);
        const personData = included.find(item => 
          item.type === 'people' && 
          item.id === firstMember.relationships?.person?.data?.id
        );
        if (personData) {
          console.log('Person data found:');
          console.log(`- Name: ${personData.attributes?.full_name}`);
          console.log(`- Email: ${personData.attributes?.primary_email}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
console.log('Testing Group People API Endpoint\n');
testGroupPeopleEndpoint();