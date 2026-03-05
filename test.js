const fetch = require('node-fetch');

async function test() {
    const res = await fetch('http://localhost:7070/spp/api/students');
    const data = await res.json();
    console.log(JSON.stringify(data[0], null, 2));
}

test();
