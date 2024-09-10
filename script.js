let audioContext, analyser, microphone, scriptProcessor;
let minValue = Infinity, maxValue = 0, sum = 0, count = 0;
const measurementInterval = 1000; // Interval in milliseconds (1 second)

document.getElementById('startButton').addEventListener('click', init);
document.getElementById('resetButton').addEventListener('click', reset);

async function init() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
        
        scriptProcessor.onaudioprocess = processAudio;
        
        // Call the function periodically instead of every frame
        setInterval(processAudio, measurementInterval);
    } catch (error) {
        alert('Microphone access denied.');
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
    
    // Normalize dB to a range between 0 and 100
    const dB = Math.min(100, Math.max(0, 20 * Math.log10(rms + 0.0001) + 50));

    // Update min, max, and average
    if (dB < minValue) minValue = dB;
    if (dB > maxValue) maxValue = dB;
    sum += dB;
    count++;

    document.getElementById('minValue').innerText = minValue.toFixed(1);
    document.getElementById('avgValue').innerText = (sum / count).toFixed(1);
    document.getElementById('maxValue').innerText = maxValue.toFixed(1);
    document.getElementById('currentValue').innerText = dB.toFixed(1);

    drawGauge(dB);
}

function drawGauge(dB) {
    const canvas = document.getElementById('gaugeCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 300;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 120;

    // Draw Gauge Background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 0.25 * Math.PI, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#444';
    ctx.stroke();

    // Draw Gauge Fill
    const endAngle = (0.75 + (dB / 100) * 1.5) * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, endAngle, false);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#ffcc00';
    ctx.stroke();
}

function reset() {
    minValue = Infinity;
    maxValue = 0;
    sum = 0;
    count = 0;

    document.getElementById('minValue').innerText = '--';
    document.getElementById('avgValue').innerText = '--';
    document.getElementById('maxValue').innerText = '--';
    document.getElementById('currentValue').innerText = '--';
    
    drawGauge(0);
}
