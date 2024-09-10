let audioContext, analyser, microphone, scriptProcessor;
let minValue = Infinity, maxValue = 0, sum = 0, count = 0;
const measurementInterval = 1000; // Interval in milliseconds (1 second)
const smoothingFactor = 0.9; // Smoothing factor for the moving average
let smoothedDB = 0; // Initialize smoothedDB
let peakValue = 0; // Add this at the top with other variables
function processAudio() {
    // ... existing code ...
    
    if (dB > peakValue) peakValue = dB;
    document.getElementById('peakValue').innerText = peakValue.toFixed(1);
    
    // ... existing code ...
}
document.getElementById('startButton').addEventListener('click', requestMicAccess);
document.getElementById('resetButton').addEventListener('click', resetMeasurements);

async function init() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Your browser does not support the MediaDevices interface.');
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        scriptProcessor.onaudioprocess = processAudio;

        setInterval(processAudio, measurementInterval);
    } catch (error) {
        alert('Microphone access denied. Please enable microphone access in your browser settings.');
        console.error('Microphone access error:', error);
    }
}

function processAudio() {
    const bufferLength = analyser.fftSize;
    const inputData = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(inputData);

    let sumSquares = 0.0;
    for (let i = 0; i < bufferLength; i++) {
        sumSquares += inputData[i] * inputData[i];
    }

    const rms = Math.sqrt(sumSquares / bufferLength);
    const dB = Math.min(50, Math.max(0, 20 * Math.log10(rms + 0.0001) + 50));

    // Apply smoothing to dB values
    smoothedDB = (smoothingFactor * smoothedDB) + ((1 - smoothingFactor) * dB);

    // Update min, max, and average
    if (smoothedDB < minValue) minValue = smoothedDB;
    if (smoothedDB > maxValue) maxValue = smoothedDB;
    sum += smoothedDB;
    count++;

    document.getElementById('minValue').innerText = minValue.toFixed(1);
    document.getElementById('avgValue').innerText = (sum / count).toFixed(1);
    document.getElementById('maxValue').innerText = maxValue.toFixed(1);
    document.getElementById('currentValue').innerText = smoothedDB.toFixed(1);

    drawGauge(smoothedDB);
}

function drawGauge(dB) {
    const canvas = document.getElementById('gaugeCanvas');
    const ctx = canvas.getContext('2d');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(canvasWidth, canvasHeight) / 2.5; // Adjust radius for better visibility
    const lineWidth = 20;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Gauge Background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 0.25 * Math.PI, false);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = '#444'; // Background color
    ctx.stroke();

    // Draw Gauge Fill
    const endAngle = (0.75 + (dB / 50) * 1.5) * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, endAngle, false);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = '#ffcc00'; // Fill color
    ctx.stroke();
}


function requestMicAccess() {
    navigator.permissions.query({ name: 'microphone' }).then(result => {
        if (result.state === 'denied') {
            alert('Microphone access is blocked. Please enable it in your browser settings.');
        } else {
            init();
        }
    }).catch(error => {
        alert('An error occurred while checking microphone permissions.');
        console.error('Permissions error:', error);
    });
}

function resetMeasurements() {
    minValue = Infinity;
    maxValue = 0;
    sum = 0;
    count = 0;

    document.getElementById('minValue').innerText = '--';
    document.getElementById('avgValue').innerText = '--';
    document.getElementById('maxValue').innerText = '--';
    document.getElementById('currentValue').innerText = '--';

    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
}
function exportToCSV() {
    const csvContent = `data:text/csv;charset=utf-8,Min,Avg,Max,Current,Peak\n${minValue.toFixed(1)},${(sum / count).toFixed(1)},${maxValue.toFixed(1)},${document.getElementById('currentValue').innerText},${peakValue.toFixed(1)}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'noise_level_data.csv');
    document.body.appendChild(link);
    link.click();
}

document.getElementById('exportButton').addEventListener('click', exportToCSV);
function exportToJSON() {
    const data = {
        minValue: minValue.toFixed(1),
        avgValue: (sum / count).toFixed(1),
        maxValue: maxValue.toFixed(1),
        currentValue: document.getElementById('currentValue').innerText,
        peakValue: peakValue.toFixed(1)
    };
    const jsonContent = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute('download', 'noise_level_data.json');
    document.body.appendChild(link);
    link.click();
}

document.getElementById('exportJSONButton').addEventListener('click', exportToJSON);
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString(); // Format date and time based on locale
    document.getElementById('dateTime').innerText = dateTimeString;
}

// Update date and time every second
setInterval(updateDateTime, 1000);
