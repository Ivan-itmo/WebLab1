document.getElementById('pointForm').addEventListener('submit', function(e) {
    e.preventDefault();
    hideError();

    const x = parseInt(document.getElementById("x").value);
    const y = document.getElementById('y').value;
    if (isNaN(y) || y < -3 || y > 3) {
        showError('Y должен быть числом от -3 до 3');
        return;
    }
    const rCheckboxes = document.querySelectorAll('input[name="r"]:checked');
    if (rCheckboxes.length === 0) {
        showError('Выберите хотя бы одно значение R');
        return;
    }

    rCheckboxes.forEach(checkbox => {
        const r = parseFloat(checkbox.value);
        sendToServer(x, y, r);
    });
});

function sendToServer(x, y, r) {
    const yRaw = document.getElementById('y').value;
    const url = `/fcgi-bin/check?x=${encodeURIComponent(x)}&y=${encodeURIComponent(yRaw)}&r=${encodeURIComponent(r)}`;

    fetch(url, {
        method: 'GET',
        headers: {'Accept': 'application/json'}
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const isHit = Boolean(data.isShoot === "HIT");
            const fullData = {
                x: parseFloat(x),
                y: parseFloat(yRaw),
                r: parseFloat(r),
                hit: isHit,
                timestamp: new Date().toISOString()
            };
            displayResult(fullData);
            hideError();
            saveToHistory(fullData);
        })
        .catch(error => {
            const localData = {
                x: parseFloat(x),
                y: parseFloat(yRaw),
                r: parseFloat(r),
                hit: undefined,
                timestamp: new Date().toISOString(),
                error: error.message
            };
            displayResult(localData);
            saveToHistory(localData);
            showError('Ошибка: ' + error.message);
        });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

function drawAreaGraph() {
    const canvas = document.getElementById('areaGraph');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50;
    const tickLength = 8;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(centerX - scale * 4, centerY);
    ctx.lineTo(centerX + scale * 4, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - scale * 4);
    ctx.lineTo(centerX, centerY + scale * 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + scale * 4 - 8, centerY - 5);
    ctx.lineTo(centerX + scale * 4, centerY);
    ctx.lineTo(centerX + scale * 4 - 8, centerY + 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX - 5, centerY - scale * 4 + 8);
    ctx.lineTo(centerX, centerY - scale * 4);
    ctx.lineTo(centerX + 5, centerY - scale * 4 + 8);
    ctx.fill();

    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText('X', centerX + scale * 4 + 10, centerY - 10);
    ctx.fillText('Y', centerX + 10, centerY - scale * 4 - 10);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';

    for (let i = -4; i <= 4; i++) {
        const x = centerX + i * scale;
        ctx.beginPath();
        ctx.moveTo(x, centerY - tickLength);
        ctx.lineTo(x, centerY + tickLength);
        ctx.stroke();

        if (i === -4) ctx.fillText('-R', x - 12, centerY + 20);
        if (i === -2) ctx.fillText('-R/2', x - 12, centerY + 20);
        if (i === 2)  ctx.fillText('R/2', x - 12, centerY + 20);
        if (i === 4)  ctx.fillText('R', x - 6, centerY + 20);
    }

    for (let i = -4; i <= 4; i++) {
        const y = centerY - i * scale;
        ctx.beginPath();
        ctx.moveTo(centerX - tickLength, y);
        ctx.lineTo(centerX + tickLength, y);
        ctx.stroke();

        if (i === -4) ctx.fillText('-R', centerX + 15, y + 4);
        if (i === -2) ctx.fillText('-R/2', centerX + 15, y + 4);
        if (i === 2)  ctx.fillText('R/2', centerX + 15, y + 4);
        if (i === 4)  ctx.fillText('R', centerX + 15, y + 4);
    }

    ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, scale * 4, Math.PI, Math.PI * 1.5);
    ctx.closePath();

    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + scale * 4, centerY);
    ctx.lineTo(centerX, centerY - scale * 4);
    ctx.closePath();

    ctx.rect(centerX, centerY, scale * 4, scale * 2);
    ctx.fill();
}

function displayResult(data) {
    const tbody = document.getElementById('resultsBody');
    const row = document.createElement('tr');

    if (data.hit === undefined) {
        row.className = 'error';
    } else {
        row.className = data.hit ? 'hit' : 'miss';
    }

    const timestamp = new Date(data.timestamp).toLocaleString();

    let resultText;
    if (data.hit === undefined) {
        resultText = 'ERROR';
    } else {
        resultText = data.hit ? 'HIT' : 'MISS';
    }

    row.innerHTML = `
        <td>${data.x}</td>
        <td>${data.y}</td>
        <td>${data.r}</td>
        <td>${resultText}</td>
        <td>${timestamp}</td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
}

function saveToHistory(data) {
    let history = JSON.parse(sessionStorage.getItem('pointHistory')) || [];
    history.unshift(data);
    sessionStorage.setItem('pointHistory', JSON.stringify(history));
}

function loadHistory() {
    const history = JSON.parse(sessionStorage.getItem('pointHistory')) || [];
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    history.forEach(displayResult);
}

document.addEventListener('DOMContentLoaded', function() {
    drawAreaGraph();
    loadHistory();
});