// Firebase configuration (replace with your own config)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let healthRecords = [];
let healthGoals = {};

// DOM elements
const authForm = document.getElementById('auth-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const healthForm = document.getElementById('health-form');
const goalForm = document.getElementById('goal-form');
const exportDataBtn = document.getElementById('export-data');
const importDataBtn = document.getElementById('import-data');
const importFile = document.getElementById('import-file');
const deleteAccountBtn = document.getElementById('delete-account');
const themeSelect = document.getElementById('theme');

// Authentication
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .catch((error) => alert(error.message));
});

registerBtn.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .catch((error) => alert(error.message));
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        userEmail.textContent = user.email;
        document.getElementById('auth').classList.add('hidden');
        document.querySelectorAll('section:not(#auth)').forEach(section => section.classList.remove('hidden'));
        loadUserData();
    } else {
        currentUser = null;
        document.getElementById('auth').classList.remove('hidden');
        document.querySelectorAll('section:not(#auth)').forEach(section => section.classList.add('hidden'));
    }
});

// Data management
function loadUserData() {
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists) {
                healthRecords = doc.data().healthRecords || [];
                healthGoals = doc.data().healthGoals || {};
                updateDashboard();
                updateCharts();
                updateAnalytics();
                updateGoals();
            }
        })
        .catch((error) => console.error("Error loading user data:", error));
}

function saveUserData() {
    db.collection('users').doc(currentUser.uid).set({
        healthRecords: healthRecords,
        healthGoals: healthGoals
    })
    .then(() => console.log("User data saved successfully"))
    .catch((error) => console.error("Error saving user data:", error));
}

healthForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newRecord = {
        date: document.getElementById('date').value,
        weight: parseFloat(document.getElementById('weight').value),
        steps: parseInt(document.getElementById('steps').value),
        water: parseInt(document.getElementById('water').value),
        sleep: parseFloat(document.getElementById('sleep').value),
        mood: parseInt(document.getElementById('mood').value),
        stress: parseInt(document.getElementById('stress').value),
        notes: document.getElementById('notes').value
    };
    healthRecords.push(newRecord);
    saveUserData();
    updateDashboard();
    updateCharts();
    updateAnalytics();
    updateGoals();
    healthForm.reset();
});

goalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    healthGoals = {
        weight: parseFloat(document.getElementById('weight-goal').value),
        steps: parseInt(document.getElementById('steps-goal').value),
        water: parseInt(document.getElementById('water-goal').value),
        sleep: parseFloat(document.getElementById('sleep-goal').value)
    };
    saveUserData();
    updateGoals();
});

// Dashboard
function updateDashboard() {
    const summary = document.getElementById('summary');
    const recentEntries = document.getElementById('recent-entries');
    const healthScore = document.getElementById('health-score');
    
    if (healthRecords.length > 0) {
        const latestRecord = healthRecords[healthRecords.length - 1];
        summary.innerHTML = `
            <h3>Latest Entry (${latestRecord.date})</h3>
            <p>Weight: ${latestRecord.weight} kg</p>
            <p>Steps: ${latestRecord.steps}</p>
            <p>Water: ${latestRecord.water} ml</p>
            <p>Sleep: ${latestRecord.sleep} hours</p>
            <p>Mood: ${latestRecord.mood}/10</p>
            <p>Stress: ${latestRecord.stress}/10</p>
        `;
        
        recentEntries.innerHTML = '<h3>Recent Entries</h3>';
        const lastFiveEntries = healthRecords.slice(-5).reverse();
        lastFiveEntries.forEach(entry => {
            recentEntries.innerHTML += `
                <p>${entry.date}: Weight ${entry.weight} kg, ${entry.steps} steps</p>
            `;
        });

        const score = calculateHealthScore(latestRecord);
        healthScore.innerHTML = `
            <h3>Health Score</h3>
            <p>Your current health score: ${score}/100</p>
        `;
    } else {
        summary.innerHTML = '<p>No data available. Please enter your health data.</p>';
        recentEntries.innerHTML = '';
        healthScore.innerHTML = '';
    }
}

function calculateHealthScore(record) {
    // This is a simple example. You should adjust this based on medical guidelines.
    let score = 0;
    if (record.weight > 18.5 && record.weight < 25) score += 20;
    if (record.steps > 10000) score += 20;
    if (record.water > 2000) score += 20;
    if (record.sleep >= 7 && record.sleep <= 9) score += 20;
    if (record.mood > 7) score += 10;
    if (record.stress < 5) score += 10;
    return score;
}

// Charts
function updateCharts() {
    const chartType = document.getElementById('chart-type').value;
    const timeRange = parseInt(document.getElementById('time-range').value);
    const dataType = document.getElementById('data-type').value;

    const filteredRecords = timeRange ? healthRecords.slice(-timeRange) : healthRecords;
    const dates = filteredRecords.map(record => record.date);
    const data = filteredRecords.map(record => record[dataType]);

    const ctx = document.getElementById('healthChart').getContext('2d');
    new Chart(ctx, {
        type: chartType,
        data: {
            labels: dates,
            datasets: [{
                label: dataType.charAt(0).toUpperCase() + dataType.slice(1),
                data: data,
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
}

// Analytics
function updateAnalytics() {
    const correlations = document.getElementById('correlations');
    const trends = document.getElementById('trends');
    const predictions = document.getElementById('predictions');
    const insights = document.getElementById('insights');

    correlations.innerHTML = '<h3>Correlations</h3>';
    trends.innerHTML = '<h3>Trends</h3>';
    predictions.innerHTML = '<h3>Predictions</h3>';
    insights.innerHTML = '<h3>Insights</h3>';

    if (healthRecords.length > 5) {
        const stepsVsMood = calculateCorrelation(
            healthRecords.map(r => r.steps),
            healthRecords.map(r => r.mood)
        );
        correlations.innerHTML += `<p>Steps vs Mood correlation: ${stepsVsMood.toFixed(2)}</p>`;

        const sleepVsStress = calculateCorrelation(
            healthRecords.map(r => r.sleep),
            healthRecords.map(r => r.stress)
        );
        correlations.innerHTML += `<p>Sleep vs Stress correlation: ${sleepVsStress.toFixed(2)}</p>`;

        const weightTrend = calculateTrend(healthRecords.map(r => r.weight));
        trends.innerHTML += `<p>Weight trend: ${weightTrend > 0 ? 'Increasing' : 'Decreasing'}</p>`;

        const stepsTrend = calculateTrend(healthRecords.map(r => r.steps));
        trends.innerHTML += `<p>Steps trend: ${stepsTrend > 0 ? 'Increasing' : 'Decreasing'}</p>`;

        const nextWeight = predictNextValue(healthRecords.map(r => r.weight));
        predictions.innerHTML += `<p>Predicted next weight: ${nextWeight.toFixed(2)} kg</p>`;

        const nextSteps = predictNextValue(healthRecords.map(r => r.steps));
        predictions.innerHTML += `<p>Predicted next steps: ${Math.round(nextSteps)}</p>`;

        generateInsights(insights);
    } else {
        correlations.innerHTML += '<p>Not enough data for correlation analysis.</p>';
        trends.innerHTML += '<p>Not enough data for trend analysis.</p>';
        predictions.innerHTML += '<p>Not enough data for predictions.</p>';
        insights.innerHTML += '<p>Not enough data for insights.</p>';
    }
}

function calculateCorrelation(x, y) {
    const n = x.length;
    const sum1 = x.reduce((a, b) => a + b) * y.reduce((a, b) => a + b);
    const sum2 = x.reduce((a, b) => a + b * b) * y.reduce((a, b) => a + b * b);
    const sum3 = x.map((_, i) => x[i] * y[i]).reduce((a, b) => a + b);
    return (n * sum3 - sum1) / Math.sqrt((n * sum2 - sum1 * sum1));
}

function calculateTrend(data) {
    const n = data.length;
    return (data[n-1] - data[0]) / n;
}

function predictNextValue(data) {
    const n = data.length;
    const trend = calculateTrend(data);
    return data[n-1] + trend;
}

function generateInsights(insightsElement) {
    const latestRecord = healthRecords[healthRecords.length - 1];
    const insights = [];

    if (latestRecord.steps < 5000) {
        insights.push("Your step count is low. Try to increase your daily activity.");
    }
    if (latestRecord.water < 2000) {
        insights.push("You're not drinking enough water. Aim for at least 2 liters per day.");
    }
    if (latestRecord.sleep < 7) {
        insights.push("You're not getting enough sleep. Aim for 7-9 hours per night.");
    }
    if (latestRecord.stress > 7) {
        insights.push("Your stress levels are high. Consider stress-reduction techniques like meditation.");
    }

    if (insights.length > 0) {
        insightsElement.innerHTML += '<ul>' + insights.map(insight => `<li>${insight}</li>`).join('') + '</ul>';
    } else {
        insightsElement.innerHTML += '<p>Great job! Keep up the good work.</p>';
    }
}

// Goals
function updateGoals() {
    const goalProgressDetails = document.getElementById('goal-progress-details');
    goalProgressDetails.innerHTML = '<h3>Goal Progress</h3>';

    if (Object.keys(healthGoals).length > 0 && healthRecords.length > 0) {
        const latestRecord = healthRecords[healthRecords.length - 1];
        
        for (const [key, goal] of Object.entries(healthGoals)) {
            const current = latestRecord[key];
            const progress = (current / goal) * 100;
            goalProgressDetails.innerHTML += `
                <p>${key.charAt(0).toUpperCase() + key.slice(1)} Goal: ${goal}</p>
                <p>Current: ${current}</p>
                <progress value="${progress}" max="100"></progress>
                <p>${progress.toFixed(2)}% of goal achieved</p>
            `;
        }
    } else {
        goalProgressDetails.innerHTML += '<p>No goals set or no data available.</p>';
    }
}

// Data export/import
exportDataBtn.addEventListener('click', () => {
    const dataStr = JSON.stringify({ healthRecords, healthGoals });
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'health_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
});

importDataBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const importedData = JSON.parse(content);
            healthRecords = importedData.healthRecords || [];
            healthGoals = importedData.healthGoals || {};
            saveUserData();
            updateDashboard();
            updateCharts();
            updateAnalytics();
            updateGoals();
        };
        reader.readAsText(file);
    }
});

// Delete account
deleteAccountBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        db.collection('users').doc(currentUser.uid).delete()
            .then(() => {
                return currentUser.delete();
            })
            .then(() => {
                alert('Your account has been deleted.');
            })
            .catch((error) => {
                console.error("Error deleting account:", error);
                alert('An error occurred while deleting your account. Please try again.');
            });
    }
});
// ... [All the previous code remains the same]

// Theme management
themeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', e.target.value);
});

// Initialize charts and theme
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chart-type').addEventListener('change', updateCharts);
    document.getElementById('time-range').addEventListener('change', updateCharts);
    document.getElementById('data-type').addEventListener('change', updateCharts);

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        themeSelect.value = savedTheme;
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    // Initialize tooltips for mood and stress sliders
    const moodSlider = document.getElementById('mood');
    const moodOutput = document.getElementById('mood-output');
    const stressSlider = document.getElementById('stress');
    const stressOutput = document.getElementById('stress-output');

    moodSlider.addEventListener('input', () => {
        moodOutput.textContent = moodSlider.value;
    });

    stressSlider.addEventListener('input', () => {
        stressOutput.textContent = stressSlider.value;
    });
});

// Notification setup
const enableNotifications = document.getElementById('enable-notifications');
const notificationTime = document.getElementById('notification-time');

enableNotifications.addEventListener('change', () => {
    if (enableNotifications.checked) {
        if ('Notification' in window) {
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    scheduleNotification();
                }
            });
        }
    } else {
        // Cancel scheduled notification
        if ('Notification' in window) {
            cancelScheduledNotification();
        }
    }
});

notificationTime.addEventListener('change', () => {
    if (enableNotifications.checked) {
        scheduleNotification();
    }
});

function scheduleNotification() {
    // Implementation for scheduling daily notification
    // This is a placeholder and would need to be implemented based on your specific requirements
    console.log('Notification scheduled for', notificationTime.value);
}

function cancelScheduledNotification() {
    // Implementation for cancelling scheduled notification
    console.log('Scheduled notification cancelled');
}

// Cloud backup and restore
const backupDataBtn = document.getElementById('backup-data');
const restoreDataBtn = document.getElementById('restore-data');

backupDataBtn.addEventListener('click', () => {
    const backupData = {
        healthRecords: healthRecords,
        healthGoals: healthGoals,
        timestamp: new Date().toISOString()
    };

    db.collection('backups').doc(currentUser.uid).set(backupData)
        .then(() => {
            alert('Data backed up successfully');
        })
        .catch((error) => {
            console.error("Error backing up data:", error);
            alert('An error occurred while backing up your data');
        });
});

restoreDataBtn.addEventListener('click', () => {
    db.collection('backups').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const backupData = doc.data();
                healthRecords = backupData.healthRecords;
                healthGoals = backupData.healthGoals;
                saveUserData();
                updateDashboard();
                updateCharts();
                updateAnalytics();
                updateGoals();
                alert('Data restored successfully');
            } else {
                alert('No backup found');
            }
        })
        .catch((error) => {
            console.error("Error restoring data:", error);
            alert('An error occurred while restoring your data');
        });
});