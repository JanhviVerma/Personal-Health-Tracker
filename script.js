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
const enableNotifications = document.getElementById('enable-notifications');
const notificationTime = document.getElementById('notification-time');
const backupDataBtn = document.getElementById('backup-data');
const restoreDataBtn = document.getElementById('restore-data');

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
        document.querySelectorAll('section:not(#auth)'). forEach(section => section.classList.add('hidden'));
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

        const weightTrend = calculateTrend(
            healthRecords.map(r => r.date),
            healthRecords.map(r => r.weight)
        );
        trends.innerHTML += `<p>Weight trend: ${weightTrend > 0 ? 'Increasing' : 'Decreasing'}</p>`;

        const stepsTrend = calculateTrend(
            healthRecords.map(r => r.date),
            healthRecords.map(r => r.steps)
        );
        trends.innerHTML += `<p>Steps trend: ${stepsTrend > 0 ? 'Increasing' : 'Decreasing'}</p>`;

        const predictedWeight = predictNextValue(
            healthRecords.map(r => r.date),
            healthRecords.map(r => r.weight)
        );
        predictions.innerHTML += `<p>Predicted next weight: ${predictedWeight.toFixed(2)} kg</p>`;

        insights.innerHTML += `<p>Consider increasing steps if mood is low.</p>`;
        insights.innerHTML += `<p>Improve sleep quality to reduce stress levels.</p>`;
    } else {
        correlations.innerHTML += '<p>More data needed for analysis.</p>';
        trends.innerHTML += '<p>More data needed for analysis.</p>';
        predictions.innerHTML += '<p>More data needed for analysis.</p>';
        insights.innerHTML += '<p>More data needed for analysis.</p>';
    }
}

function calculateCorrelation(arr1, arr2) {
    const n = arr1.length;
    const sum1 = arr1.reduce((a, b) => a + b, 0);
    const sum2 = arr2.reduce((a, b) => a + b, 0);
    const sum1Sq = arr1.reduce((a, b) => a + b ** 2, 0);
    const sum2Sq = arr2.reduce((a, b) => a + b ** 2, 0);
    const pSum = arr1.reduce((sum, a, idx) => sum + a * arr2[idx], 0);

    const numerator = pSum - (sum1 * sum2 / n);
    const denominator = Math.sqrt(
        (sum1Sq - (sum1 ** 2 / n)) * (sum2Sq - (sum2 ** 2 / n))
    );

    return denominator === 0 ? 0 : numerator / denominator;
}

function calculateTrend(dates, values) {
    const n = dates.length;
    const xMean = dates.reduce((a, b) => a + new Date(b).getTime(), 0) / n;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    const numerator = dates.reduce((sum, date, idx) => sum + (new Date(date).getTime() - xMean) * (values[idx] - yMean), 0);
    const denominator = dates.reduce((sum, date) => sum + (new Date(date).getTime() - xMean) ** 2, 0);

    return numerator / denominator;
}

function predictNextValue(dates, values) {
    const trend = calculateTrend(dates, values);
    const latestDate = new Date(dates[dates.length - 1]).getTime();
    const nextDate = new Date(latestDate + 24 * 60 * 60 * 1000);
    const n = dates.length;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    const xMean = dates.reduce((a, b) => a + new Date(b).getTime(), 0) / n;
    return yMean + trend * (nextDate.getTime() - xMean);
}

// Goals
function updateGoals() {
    const goalStatus = document.getElementById('goal-status');
    goalStatus.innerHTML = '<h3>Goal Status</h3>';
    if (Object.keys(healthGoals).length > 0) {
        goalStatus.innerHTML += `
            <p>Weight Goal: ${healthGoals.weight} kg</p>
            <p>Steps Goal: ${healthGoals.steps}</p>
            <p>Water Goal: ${healthGoals.water} ml</p>
            <p>Sleep Goal: ${healthGoals.sleep} hours</p>
        `;
    } else {
        goalStatus.innerHTML += '<p>No goals set. Please set your health goals.</p>';
    }
}

// Export data
exportDataBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ healthRecords, healthGoals }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "health_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

// Import data
importDataBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
        const importedData = JSON.parse(event.target.result);
        healthRecords = importedData.healthRecords;
        healthGoals = importedData.healthGoals;
        saveUserData();
        updateDashboard();
        updateCharts();
        updateAnalytics();
        updateGoals();
    };
    reader.readAsText(file);
});

// Delete account
deleteAccountBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        currentUser.delete().then(() => {
            db.collection('users').doc(currentUser.uid).delete();
            alert("Account deleted successfully.");
        }).catch((error) => alert(error.message));
    }
});

// Theme management
themeSelect.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    document.body.className = selectedTheme;
    localStorage.setItem('theme', selectedTheme);
});

// Load theme on page load
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme;
    themeSelect.value = savedTheme;
});

// Notifications
enableNotifications.addEventListener('change', () => {
    if (enableNotifications.checked) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                scheduleNotification();
            } else {
                alert('Notifications permission denied');
                enableNotifications.checked = false;
            }
        });
    } else {
        cancelNotification();
    }
});

notificationTime.addEventListener('change', scheduleNotification);

function scheduleNotification() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const time = notificationTime.value;
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }

    const delay = targetTime - now;

    setTimeout(() => {
        new Notification('Health Reminder', {
            body: 'Time to update your health record!',
            icon: 'icon.png'
        });
        scheduleNotification();
    }, delay);
}

function cancelNotification() {
    // Clear all scheduled notifications
    const highestTimeoutId = setTimeout(() => { });
    for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
    }
}

// Cloud backup and restore
backupDataBtn.addEventListener('click', () => {
    db.collection('backups').doc(currentUser.uid).set({
        healthRecords: healthRecords,
        healthGoals: healthGoals
    })
    .then(() => alert('Backup successful'))
    .catch((error) => alert('Error creating backup: ' + error.message));
});

restoreDataBtn.addEventListener('click', () => {
    db.collection('backups').doc(currentUser.uid).get()
    .then((doc) => {
        if (doc.exists) {
            healthRecords = doc.data().healthRecords || [];
            healthGoals = doc.data().healthGoals || {};
            saveUserData();
            updateDashboard();
            updateCharts();
            updateAnalytics();
            updateGoals();
            alert('Restore successful');
        } else {
            alert('No backup found');
        }
    })
    .catch((error) => alert('Error restoring backup: ' + error.message));
});
