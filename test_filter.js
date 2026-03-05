const fs = require('fs');

const students = JSON.parse(fs.readFileSync('output.json', 'utf8'));

let monitorSearchTerm = '';
let monitorFilterRiskOnly = false;

function renderMonitorTable() {
    const filtered = students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(monitorSearchTerm.toLowerCase()) ||
            s.rollNo.includes(monitorSearchTerm);
        const matchFilter = !monitorFilterRiskOnly || s.interventionNeeded;
        return matchSearch && matchFilter;
    });

    console.log('Total incoming students:', students.length);
    console.log('Filtered students length:', filtered.length);
}

renderMonitorTable();
