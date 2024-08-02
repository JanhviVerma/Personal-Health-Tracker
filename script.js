document.addEventListener('DOMContentLoaded', () => {
    const healthForm = document.getElementById('health-form');
    const healthData = document.getElementById('health-data');
    let healthRecords = JSON.parse(localStorage.getItem('healthRecords')) || [];

    function displayHealthData() {
        const tbody = healthData.querySelector('tbody');
        tbody.innerHTML = '';
        healthRecords.forEach((record, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.weight}</td>
                <td>${record.steps}</td>
                <td>${record.water}</td>
                <td>${record.sleep}</td>
                <td>
                    <button onclick="editRecord(${index})">Edit</button>
                    <button onclick="deleteRecord(${index})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        updateCharts();
    }

    function saveHealthData(event) {
        event.preventDefault();
        const newRecord = {
            date: document.getElementById('date').value,
            weight: parseFloat(document.getElementById('weight').value),
            steps: parseInt(document.getElementById('steps').value),
            water: parseInt(document.getElementById('water').value),
            sleep: parseFloat(document.getElementById('sleep').value)
        };
        healthRecords.push(newRecord);
        localStorage.setItem('healthRecords', JSON.stringify(healthRecords));
        displayHealthData();
        healthForm.reset();
    }

    window.editRecord = (index) => {
        const record = healthRecords[index];
        document.getElementById('date').value = record.date;
        document.getElementById('weight').value = record.weight;
        document.getElementById('steps').value = record.steps;
        document.getElementById('water').value = record.water;
        document.getElementById('sleep').value = record.sleep;
        healthRecords.splice(index, 1);
        localStorage.setItem('healthRecords', JSON.stringify(healthRecords));
        displayHealthData();
    };

    window.deleteRecord = (index) => {
        if (confirm('Are you sure you want to delete this record?')) {
            healthRecords.splice(index, 1);
            localStorage.setItem('healthRecords', JSON.stringify(healthRecords));
            displayHealthData();
        }
    };

    function updateCharts() {
        const dates = healthRecords.map(record => record.date);
        const weights = healthRecords.map(record => record.weight);
        const steps = healthRecords.map(record => record.steps);

        new Chart(document.getElementById('weightChart'), {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Weight (kg)',
                    data: weights,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });

        new Chart(document.getElementById('stepsChart'), {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Steps',
                    data: steps,
                    backgroundColor: 'rgb(255, 99, 132)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    healthForm.addEventListener('submit', saveHealthData);
    displayHealthData();
});