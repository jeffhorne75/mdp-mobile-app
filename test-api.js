const fetch = require('node-fetch');
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
    const response = await fetch(url, {
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
    const response = await fetch(url, {
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

async function main() {
  await testPeopleList();
  await testPersonDetails();
}

main();