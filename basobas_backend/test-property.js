const axios = require('axios');
const FormData = require('form-data');

async function testPropertyCreation() {
  try {
    const formData = new FormData();
    formData.append('title', 'Test Property');
    formData.append('description', 'A beautiful test property');
    formData.append('location', 'Test City');
    formData.append('price', '1000');
    formData.append('availability', JSON.stringify([{
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    }]));

    // Skip image for now
    // formData.append('images', Buffer.from('dummy image'), 'test.jpg');

    const response = await axios.post('http://localhost:5000/api/property', formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPropertyCreation();