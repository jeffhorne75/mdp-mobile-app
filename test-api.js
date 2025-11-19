const nodeFetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'https://demo-api.staging.wicketcloud.com';
const JWT_TOKEN = process.env.EXPO_PUBLIC_JWT_TOKEN;

async function testPersonDetails() {
  // You'll need to replace this with an actual person ID from your system
  const personId = 'fc89d34e-724a-41cc-9860-e2ee35e22218'; // Using first person from list
  
  const url = `${API_BASE_URL}/people/${personId}?include=addresses,phones,emails,web_addresses`;
  
  console.log('Testing API endpoint:', url);
  console.log('Using JWT Token (first 10 chars):', JWT_TOKEN?.substring(0, 10) + '...');
  
  try {
    const response = await nodeFetch(url, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n=== RESPONSE STRUCTURE ===');
    console.log('Has data:', !!data.data);
    console.log('Has included:', !!data.included);
    console.log('Included count:', data.included?.length || 0);
    
    if (data.included && data.included.length > 0) {
      console.log('\n=== INCLUDED TYPES ===');
      const types = {};
      data.included.forEach(item => {
        types[item.type] = (types[item.type] || 0) + 1;
      });
      console.log('Types found:', types);
      
      console.log('\n=== SAMPLE INCLUDED ITEMS ===');
      data.included.forEach(item => {
        console.log(`- ${item.type} (${item.id}): type="${item.attributes.type}", primary=${item.attributes.primary}`);
        if (item.type === 'emails') {
          console.log(`  Email: ${item.attributes.address}`);
        } else if (item.type === 'phones') {
          console.log(`  Phone: ${item.attributes.formatted || item.attributes.phone_number}`);
        } else if (item.type === 'addresses') {
          console.log(`  Address: ${item.attributes.formatted_address_label || item.attributes.address1}`);
        } else if (item.type === 'web_addresses') {
          console.log(`  URL: ${item.attributes.address}`);
        }
      });
    }
    
    console.log('\n=== PERSON RELATIONSHIPS ===');
    if (data.data?.relationships) {
      Object.keys(data.data.relationships).forEach(key => {
        const rel = data.data.relationships[key];
        console.log(`${key}:`, rel.data ? `${rel.data.length} items` : 'no data');
      });
    }
    
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}

// Test people list endpoint too
async function testPeopleList() {
  const url = `${API_BASE_URL}/people?page[size]=5&include=addresses,phones,emails,web_addresses`;
  
  console.log('\n\n=== TESTING PEOPLE LIST ===');
  console.log('Testing API endpoint:', url);
  
  try {
    const response = await nodeFetch(url, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n=== LIST RESPONSE STRUCTURE ===');
    console.log('People count:', data.data?.length || 0);
    console.log('Has included:', !!data.included);
    console.log('Included count:', data.included?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\nFirst person ID:', data.data[0].id);
      console.log('First person name:', data.data[0].attributes?.given_name, data.data[0].attributes?.family_name);
    }
    
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}

async function testGroupsList() {
  const url = `${API_BASE_URL}/groups?page[size]=10&include=parent_group,members`;
  
  console.log('\n\n=== TESTING GROUPS LIST WITH INCLUDES ===');
  console.log('Testing API endpoint:', url);
  
  try {
    const response = await nodeFetch(url, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n=== GROUPS RESPONSE STRUCTURE ===');
    console.log('Groups count:', data.data?.length || 0);
    console.log('Has included:', !!data.included);
    console.log('Included count:', data.included?.length || 0);
    
    if (data.included && data.included.length > 0) {
      console.log('\n=== INCLUDED DATA ===');
      const types = {};
      data.included.forEach(item => {
        types[item.type] = (types[item.type] || 0) + 1;
      });
      console.log('Types found:', types);
      
      console.log('\n=== PARENT GROUPS IN INCLUDED ===');
      data.included.forEach(item => {
        if (item.type === 'groups') {
          console.log(`- Parent Group: ${item.id} - ${item.attributes.name || item.attributes.name_en}`);
        }
      });
    }
    
    console.log('\n=== GROUPS WITH PARENT_GROUP RELATIONSHIPS ===');
    if (data.data) {
      data.data.forEach(group => {
        if (group.relationships?.parent_group?.data) {
          console.log(`\nGroup: ${group.attributes.name || group.attributes.name_en} (${group.id})`);
          console.log(`  Has parent: ${group.relationships.parent_group.data.id}`);
          
          // Look for parent in included
          const parentKey = `groups:${group.relationships.parent_group.data.id}`;
          const parent = data.included?.find(item => 
            item.type === 'groups' && item.id === group.relationships.parent_group.data.id
          );
          
          if (parent) {
            console.log(`  Parent name: ${parent.attributes.name || parent.attributes.name_en}`);
          } else {
            console.log(`  Parent NOT FOUND in included data!`);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}

async function testSingleGroup(groupId) {
  const url = `${API_BASE_URL}/groups/${groupId}?include=parent_group`;
  
  console.log('\n\n=== TESTING SINGLE GROUP WITH INCLUDES ===');
  console.log('Testing API endpoint:', url);
  
  try {
    const response = await nodeFetch(url, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n=== SINGLE GROUP RESPONSE ===');
    console.log('Group name:', data.data?.attributes?.name || data.data?.attributes?.name_en);
    console.log('Has included:', !!data.included);
    console.log('Included count:', data.included?.length || 0);
    
    if (data.data?.relationships?.parent_group?.data) {
      console.log('\nParent group relationship:', data.data.relationships.parent_group.data.id);
      
      if (data.included && data.included.length > 0) {
        const parent = data.included.find(item => 
          item.type === 'groups' && item.id === data.data.relationships.parent_group.data.id
        );
        if (parent) {
          console.log('Parent group name:', parent.attributes.name || parent.attributes.name_en);
        }
      }
    }
    
  } catch (error) {
    console.error('Failed to fetch:', error);
  }
}

async function main() {
  // await testPeopleList();
  // await testPersonDetails();
  await testGroupsList();
  
  // Test a specific group that has a parent
  await testSingleGroup('95efa168-d151-4963-b2e8-dee19d4213ca');
}

main();