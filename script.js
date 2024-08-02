document.addEventListener('DOMContentLoaded', () => {
    const healthForm = document.getElementById('health-form');
    const goalForm = document.getElementById('goal-form');
    const healthData = document.getElementById('health-data');
    const exportDataBtn = document.getElementById('export-data');
    const progressContainer = document.getElementById('progress-container');
    let healthRecords = JSON.parse(localStorage.getItem('healthRecords')) || [];
    let healthGoals = JSON.parse(localStorage.getItem('healthGoals')) || {};

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
        updateProgressTracking();
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

    function saveHealthGoals(event) {
        event.preventDefault();
        healthGoals = {
            weight: parseFloat(document.getElementById('weight-goal').value),
            steps: parseInt(document.getElementById('steps-goal').value),
            water: parseInt(document.getElementById('water-goal').value),
            sleep: parseFloat(document.getElementById('sleep-goal').value)
        };
        localStorage.setItem('healthGoals', JSON.stringify(healthGoals));
        updateProgressTracking();
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

    function updateProgressTracking() {
        progressContainer.innerHTML = '';
        if (Object.keys(healthGoals).length === 0) {
            progressContainer.innerHTML = '<p>No goals set. Please set your health goals.</p>';
            return;
        }

        const latestRecord = healthRecords[healthRecords.length - 1];
        if (!latestRecord) {
            progressContainer.innerHTML = '<p>No data available. Please enter your health data.</p>';
            return;
        }

        for (const [key, goal] of Object.entries(healthGoals)) {
            const progress = (latestRecord[key] / goal) * 100;
            const progressItem = document.createElement('div');
            progressItem.classList.add('progress-item');
            progressItem.innerHTML = `
                <h3>${key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                <p>Goal: ${goal}</p>
                <p>Current: ${latestRecord[key]}</p>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <p>${progress.toFixed(2)}% of goal</p>
            `;
            progressContainer.appendChild(progressItem);
        }
    }

    function exportData() {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Date,Weight,Steps,Water,Sleep\n"
            + healthRecords.map(record => 
                `${record.date},${record.weight},${record.steps},${record.water},${record.sleep}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "health_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    healthForm.addEventListener('submit', saveHealthData);
    goalForm.addEventListener('submit', saveHealthGoals);
    exportDataBtn.addEventListener('click', exportData);

    displayHealthData();
    updateProgressTracking();
});