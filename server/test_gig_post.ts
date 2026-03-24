
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/';

async function testPostGig() {
    try {
        console.log('Testing POST /api/gigs...');
        const res = await axios.post(`${API_URL}gigs`, {
            title: 'Test Campaign',
            description: 'Test Brief',
            reward: 1000,
            brand: 'Test Brand'
        });
        console.log('Success:', res.data);
    } catch (error: any) {
        console.error('Error:', error.response?.status, error.response?.data || error.message);
    }
}

testPostGig();
