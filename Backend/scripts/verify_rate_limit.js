
import axios from 'axios';

const runTest = async () => {
    const url = 'http://localhost:8888/api/v1/';
    console.log(`Testing rate limit against ${url} with limit 3...`);

    for (let i = 1; i <= 5; i++) {
        try {
            const response = await axios.get(url);
            console.log(`Request ${i}: Status ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`Request ${i}: Status ${error.response.status} - ${error.response.data.message || error.response.statusText}`);
            } else {
                console.log(`Request ${i}: Error ${error.message}`);
            }
        }
    }
};

runTest();
