
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/';

async function testProposalFlow() {
    try {
        // 1. Login as a brand to get a token
        console.log('Logging in as brand...');
        const loginRes = await axios.post(`${API_URL}auth/login`, {
            email: 'brand@example.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token acquired.');

        // 2. Fetch some students
        console.log('Fetching students...');
        const usersRes = await axios.get(`${API_URL}users?role=Ambassador`);
        if (!usersRes.data || usersRes.data.length === 0) {
            console.log('No students found. Response:', usersRes.data);
            return;
        }
        const studentId = usersRes.data[0].id;
        console.log(`Found student: ${usersRes.data[0].name} (ID: ${studentId})`);

        // 3. Send proposal
        console.log('Sending proposal...');
        const proposalRes = await axios.post(`${API_URL}proposals`,
            { recipientId: studentId, message: "Test offer from diagnostic script" },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Proposal sent successfully:', proposalRes.data);
    } catch (error) {
        if (error.response) {
            console.error('Test failed (Response):', error.response.status, error.response.data);
        } else {
            console.error('Test failed (Message):', error.message);
        }
    }
}

testProposalFlow();
