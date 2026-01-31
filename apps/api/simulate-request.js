const handler = require('./dist-api/index.js');
console.log('Artifact loaded successfully');

// Mock Request/Response
const req = {
    headers: { origin: 'http://localhost:3000' },
    method: 'GET',
    url: '/health'
};
const res = {
    setHeader: (k, v) => console.log(`Header: ${k}=${v}`),
    status: (code) => ({
        json: (body) => console.log(`Status: ${code}, Body:`, body),
        end: () => console.log(`Status: ${code} Ended`)
    }),
};

// Invoke handler
console.log('Invoking handler...');
Promise.resolve(handler.default(req, res))
    .then(() => console.log('Handler completed'))
    .catch(err => console.error('Handler crashed:', err));
