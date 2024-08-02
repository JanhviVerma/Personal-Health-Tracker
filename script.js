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
        mood: parseInt(document.getElementById('mood').value)
    };
    healthRecords.push(newRecord);
    saveUserData();
    updateDashboard();
    updateCharts();
    updateAnalytics();
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
    updateDashboard();
});

// Dashboard
function updateDashboard() {
    const summary = document.getElementById('summary');
    const recentEntries = document.getElementById('recent-entries');
    
    if (healthRecords.length > 0) {
        const latestRecord = healthRecords[healthRecords.length - 1];
        summary.innerHTML = `
            <h3>Latest Entry (${latestRecord.date})</h3>
            <p>Weight: ${latestRecord.weight} kg</p>
            <p>Steps: ${latestRecord.steps}</p>
            <p>Water: ${latestRecord.water} ml</p>
            <p>Sleep: ${latestRecord.sleep} hours</p>
            <p>Mood: ${latestRecord.mood}/10</p>
        `;
        
        recentEntries.innerHTML = '<h3>Recent Entries</h3>';
        const lastFiveEntries = healthRecords.slice(-5).reverse();
        lastFiveEntries.forEach(entry => {
            recentEntries.innerHTML += `
                <p>${entry.date}: Weight ${entry.weight} kg, ${entry.steps} steps</p>
            `;
        });
    } else {
        summary.innerHTML = '<p>No data available. Please enter your health data.</p>';
        recentEntries.innerHTML = '';
    }
}

// Charts
function updateCharts() {
    const dates = healthRecords.map(record => record.date);
    const weights = healthRecords.map(record => record.weight);
    const steps = healthRecords.map(record => record.steps);
    const water = healthRecords.map(record => record.water);
    const sleep = healthRecords.map(record => record.sleep);
    const mood = healthRecords.map(record => record.mood);

    createChart('weightChart', 'Weight (kg)', dates, weights);
    createChart('stepsChart', 'Steps', dates, steps);
    createChart('waterChart', 'Water Intake (ml)', dates, water);
    createChart('sleepChart', 'Sleep Duration (hours)', dates, sleep);
    createChart('moodChart', 'Mood', dates, mood);
}

function createChart(id, label, labels, data) {
    const ctx = document.getElementById(id).getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
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

    // Simple correlation analysis
    correlations.innerHTML = '<h3>Correlations</h3>';
    if (healthRecords.length > 5) {
        const stepsVsMood = calculateCorrelation(
            healthRecords.map(r => r.steps),
            healthRecords.map(r => r.mood)
        );
        correlations.innerHTML += `<p>Steps vs Mood correlation: ${stepsVsMood.toFixed(2)}</p>`;
    } else {
        correlations.innerHTML += '<p>Not enough data for correlation analysis.</p>';
    }

    // Simple trend analysis
    trends.innerHTML = '<h3>Trends</h3>';
    if (healthRecords.length > 5) {
        const weightTrend = calculateTrend(healthRecords.map(r => r.weight));
        trends.innerHTML += `<p>Weight trend: ${weightTrend > 0 ? 'Increasing' : 'Decreasing'}</p>`;
    } else {
        trends.innerHTML += '<p>Not enough data for trend analysis.</p>';
    }

    // Simple prediction
    predictions.innerHTML = '<h3>Predictions</h3>';
    if (healthRecords.length > 5) {
        const nextWeight = predictNextValue(healthRecords.map(r => r.weight));
        predictions.innerHTML += `<p>Predicted next weight: ${nextWeight.toFixed(2)} kg</p>`;
    } else {
        predictions.innerHTML += '<p>Not enough data for predictions.</p>';
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
        };
        reader.readAsText(file);
    }
});