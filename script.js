document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        collectFingerprint();
    }, 500);
});

function collectFingerprint() {
    const options = {
        excludes: {
            // Include all components for maximum fingerprinting
        },
        enabledFeatures: [
            'canvas', 'webgl', 'audio', 'fonts'
        ]
    };

    if (window.requestIdleCallback) {
        requestIdleCallback(function() {
            Fingerprint2.get(options, function(components) {
                processFingerprint(components);
            });
        });
    } else {
        setTimeout(function() {
            Fingerprint2.get(options, function(components) {
                processFingerprint(components);
            });
        }, 500);
    }

    // Collect additional information not covered by Fingerprint2
    collectAdditionalInfo();
}

function processFingerprint(components) {
    // Generate a hash from all components
    const values = components.map(function(component) {
        return component.value;
    });
    
    // Create a hash using the murmur hash algorithm
    const fingerprintHash = Fingerprint2.x64hash128(values.join(''), 31);
    
    // Display the fingerprint hash
    document.getElementById('fingerprintHash').textContent = fingerprintHash;
    
    // Process and display each component
    displayComponents(components);
    
    // Show results and hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    // Draw canvas fingerprint
    drawCanvasFingerprint();
    
    // Setup export button
    setupExportButton();
}

function displayComponents(components) {
    // Display raw components data
    document.getElementById('rawComponentsData').textContent = JSON.stringify(components, null, 2);
    
    // Process components by category
    const browserInfo = document.getElementById('browserInfo');
    const hardwareInfo = document.getElementById('hardwareInfo');
    const networkInfo = document.getElementById('networkInfo');
    const featuresInfo = document.getElementById('featuresInfo');
    const webglInfo = document.getElementById('webglInfo');
    const fontsInfo = document.getElementById('fontsInfo');
    const audioInfo = document.getElementById('audioInfo');
    
    components.forEach(component => {
        const div = document.createElement('div');
        const strong = document.createElement('strong');
        strong.textContent = component.key;
        div.appendChild(strong);
        
        // Format the value based on the component type
        let valueElement;
        if (typeof component.value === 'object') {
            valueElement = document.createElement('pre');
            valueElement.textContent = JSON.stringify(component.value, null, 2);
        } else if (component.key === 'availableFonts') {
            // Handle fonts specially
            fontsInfo.innerHTML = '';
            const fontsList = component.value;
            fontsList.slice(0, 100).forEach(font => {
                const fontDiv = document.createElement('div');
                fontDiv.textContent = font;
                fontDiv.style.fontFamily = font;
                fontsInfo.appendChild(fontDiv);
            });
            return;
        } else {
            valueElement = document.createElement('span');
            valueElement.textContent = component.value;
        }
        
        div.appendChild(valueElement);
        
        // Add to appropriate category
        switch (component.key) {
            case 'userAgent':
            case 'language':
            case 'colorDepth':
            case 'deviceMemory':
            case 'hardwareConcurrency':
            case 'screenResolution':
            case 'availableScreenResolution':
            case 'timezone':
            case 'timezoneOffset':
            case 'sessionStorage':
            case 'localStorage':
            case 'indexedDb':
            case 'addBehavior':
            case 'openDatabase':
            case 'doNotTrack':
            case 'plugins':
                browserInfo.appendChild(div);
                break;
                
            case 'cpuClass':
            case 'platform':
            case 'devicePixelRatio':
            case 'touchSupport':
                hardwareInfo.appendChild(div);
                break;
                
            case 'adBlock':
            case 'hasLiedLanguages':
            case 'hasLiedResolution':
            case 'hasLiedOs':
            case 'hasLiedBrowser':
            case 'cookiesEnabled':
                featuresInfo.appendChild(div);
                break;
                
            case 'webglVendorAndRenderer':
            case 'webgl':
                webglInfo.appendChild(div);
                break;
                
            case 'audio':
                audioInfo.appendChild(div);
                break;
                
            default:
                // Add to hardware by default
                hardwareInfo.appendChild(div);
        }
    });
}

function drawCanvasFingerprint() {
    const canvas = document.getElementById('fingerprintCanvas');
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('Canvas Fingerprint', 10, 10);
    
    // Draw shapes
    ctx.beginPath();
    ctx.arc(75, 75, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(150, 75, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(225, 75, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(46, 204, 113, 0.5)';
    ctx.fill();
    
    // Draw emoji (this can vary across browsers and OS)
    ctx.font = '30px Arial';
    ctx.fillText('😊', 135, 50);
    
    // Get data URL and hash
    const dataURL = canvas.toDataURL();
    const hash = Fingerprint2.x64hash128(dataURL, 31);
    
    // Display hash
    document.getElementById('canvasHash').textContent = hash;
}

// Add this function to your existing script.js file
function detectDeviceInfo() {
    const deviceIdentification = document.getElementById('deviceIdentification');
    
    // Use UAParser to get detailed device information
    if (window.UAParser) {
        const parser = new UAParser();
        const result = parser.getResult();
        
        // Device model and vendor
        const deviceVendor = result.device.vendor || 'Unknown';
        const deviceModel = result.device.model || 'Unknown';
        const deviceType = result.device.type || 'Unknown';
        
        // Add to the device identification section
        addInfoItem(deviceIdentification, 'Device Vendor', deviceVendor);
        addInfoItem(deviceIdentification, 'Device Model', deviceModel);
        addInfoItem(deviceIdentification, 'Device Type', deviceType);
        
        // Try to get more specific information based on user agent
        const ua = navigator.userAgent;
        
        // Extract more detailed information from user agent
        let detailedModel = 'Unknown';
        
        // Check for iPhone/iPad models
        if (ua.includes('iPhone') || ua.includes('iPad')) {
            const matches = ua.match(/(iPhone|iPad)(\d+),(\d+)/);
            if (matches) {
                detailedModel = `${matches[1]} ${matches[2]},${matches[3]}`;
            } else {
                // Try alternative pattern for newer iOS devices
                const altMatches = ua.match(/(iPhone|iPad).*OS (\d+)_(\d+)/);
                if (altMatches) {
                    detailedModel = `${altMatches[1]} running iOS ${altMatches[2]}.${altMatches[3]}`;
                }
            }
        }
        
        // Check for Android device models - enhanced pattern matching
        else if (ua.includes('Android')) {
            // Try multiple patterns for Android devices
            let modelMatch = ua.match(/; ([^;)]+) Build\//);
            if (!modelMatch) {
                modelMatch = ua.match(/Android.*; ([^;)]+)\)/);
            }
            if (modelMatch) {
                detailedModel = modelMatch[1].trim();
            }
            
            // Try to extract Android version
            const versionMatch = ua.match(/Android (\d+(?:\.\d+)+)/);
            if (versionMatch) {
                addInfoItem(deviceIdentification, 'Android Version', versionMatch[1]);
            }
        }
        
        // Check for Windows devices
        else if (ua.includes('Windows')) {
            const windowsMatch = ua.match(/Windows NT (\d+\.\d+)/);
            if (windowsMatch) {
                let windowsVersion = 'Unknown';
                switch (windowsMatch[1]) {
                    case '10.0': windowsVersion = 'Windows 10/11'; break;
                    case '6.3': windowsVersion = 'Windows 8.1'; break;
                    case '6.2': windowsVersion = 'Windows 8'; break;
                    case '6.1': windowsVersion = 'Windows 7'; break;
                    case '6.0': windowsVersion = 'Windows Vista'; break;
                    case '5.2': windowsVersion = 'Windows XP 64-bit/Server 2003'; break;
                    case '5.1': windowsVersion = 'Windows XP'; break;
                    default: windowsVersion = `Windows NT ${windowsMatch[1]}`;
                }
                detailedModel = windowsMatch[1] === '10.0' && ua.includes('Windows 11') ? 'Windows 11' : windowsVersion;
            }
        }
        
        // Check for Mac devices
        else if (ua.includes('Macintosh')) {
            const macMatch = ua.match(/Macintosh; Intel Mac OS X (\d+[._]\d+[._]\d+)/);
            if (macMatch) {
                const macVersion = macMatch[1].replace(/_/g, '.');
                detailedModel = `Mac OS X ${macVersion}`;
            }
        }
        
        // Add detailed model if found
        if (detailedModel !== 'Unknown') {
            addInfoItem(deviceIdentification, 'Detailed Model', detailedModel);
        }
        
        // Add OS information to device identification
        addInfoItem(deviceIdentification, 'Operating System', `${result.os.name || 'Unknown'} ${result.os.version || ''}`);
        
        // Add CPU architecture if available
        if (navigator.cpuClass || navigator.platform) {
            addInfoItem(deviceIdentification, 'CPU Architecture', navigator.cpuClass || navigator.platform);
        }
        
        // Add browser engine information
        addInfoItem(deviceIdentification, 'Browser Engine', `${result.engine.name || 'Unknown'} ${result.engine.version || ''}`);
    } else {
        addInfoItem(deviceIdentification, 'Device Information', 'UAParser library not available');
    }
    
    // Try to get screen size and pixel density
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const pixelRatio = window.devicePixelRatio || 1;
    
    addInfoItem(deviceIdentification, 'Screen Resolution', `${screenWidth}x${screenHeight} pixels`);
    addInfoItem(deviceIdentification, 'Pixel Density', `${pixelRatio.toFixed(2)}x`);
    addInfoItem(deviceIdentification, 'Color Depth', `${window.screen.colorDepth} bits`);
    
    // Try to determine if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    addInfoItem(deviceIdentification, 'Mobile Device', isMobile ? 'Yes' : 'No');
    
    // Try to detect device memory
    if (navigator.deviceMemory) {
        addInfoItem(deviceIdentification, 'Device Memory', `${navigator.deviceMemory} GB`);
    }
    
    // Try to detect number of logical processors
    if (navigator.hardwareConcurrency) {
        addInfoItem(deviceIdentification, 'CPU Cores', navigator.hardwareConcurrency);
    }
    
    // Try to detect if device has touch support
    addInfoItem(deviceIdentification, 'Touch Support', 'ontouchstart' in window ? 'Yes' : 'No');
    
    // Try to detect if device has accelerometer
    if (window.DeviceMotionEvent) {
        addInfoItem(deviceIdentification, 'Accelerometer', 'Yes');
    }
    
    // Try to detect if device has gyroscope
    if (window.DeviceOrientationEvent) {
        addInfoItem(deviceIdentification, 'Gyroscope', 'Yes');
    }
    
    // Try to detect if device has ambient light sensor
    if ('AmbientLightSensor' in window) {
        addInfoItem(deviceIdentification, 'Light Sensor', 'Yes');
    }
    
    // Try to detect if device has proximity sensor
    if ('ProximitySensor' in window) {
        addInfoItem(deviceIdentification, 'Proximity Sensor', 'Yes');
    }
    
    // Try to detect if device has GPS
    if ('geolocation' in navigator) {
        addInfoItem(deviceIdentification, 'GPS', 'Yes');
    }
    
    // Try to detect if device has camera
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const hasCamera = devices.some(device => device.kind === 'videoinput');
                addInfoItem(deviceIdentification, 'Camera', hasCamera ? 'Yes' : 'No');
            })
            .catch(err => {
                console.error('Error detecting camera:', err);
            });
    }
    
    // Try to detect if device has microphone
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const hasMicrophone = devices.some(device => device.kind === 'audioinput');
                addInfoItem(deviceIdentification, 'Microphone', hasMicrophone ? 'Yes' : 'No');
            })
            .catch(err => {
                console.error('Error detecting microphone:', err);
            });
    }
    
    // Try to detect if device supports WebGL
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                addInfoItem(deviceIdentification, 'GPU Vendor', vendor);
                addInfoItem(deviceIdentification, 'GPU Model', renderer);
            }
        }
    } catch (e) {
        console.error('Error detecting GPU:', e);
    }
}

// Modify the collectAdditionalInfo function to call our new function
function collectAdditionalInfo() {
    const batteryInfo = document.getElementById('batteryInfo');
    const sensorsInfo = document.getElementById('sensorsInfo');
    const networkInfo = document.getElementById('networkInfo');
    
    // Call our new device detection function
    detectDeviceInfo();
    
    // Enhanced Network information
    if (navigator.connection) {
        const connection = navigator.connection;
        addInfoItem(networkInfo, 'Effective Type', connection.effectiveType || 'Unknown');
        addInfoItem(networkInfo, 'Downlink', (connection.downlink || 'Unknown') + ' Mbps');
        addInfoItem(networkInfo, 'RTT', (connection.rtt || 'Unknown') + ' ms');
        addInfoItem(networkInfo, 'Save Data', connection.saveData ? 'Enabled' : 'Disabled');
        
        // Add event listener for connection changes
        connection.addEventListener('change', function() {
            updateInfoItem(networkInfo, 'Effective Type', connection.effectiveType || 'Unknown');
            updateInfoItem(networkInfo, 'Downlink', (connection.downlink || 'Unknown') + ' Mbps');
            updateInfoItem(networkInfo, 'RTT', (connection.rtt || 'Unknown') + ' ms');
            updateInfoItem(networkInfo, 'Save Data', connection.saveData ? 'Enabled' : 'Disabled');
        });
    }
    
    // Try to detect if online
    addInfoItem(networkInfo, 'Online Status', navigator.onLine ? 'Online' : 'Offline');
    window.addEventListener('online', function() {
        updateInfoItem(networkInfo, 'Online Status', 'Online');
    });
    window.addEventListener('offline', function() {
        updateInfoItem(networkInfo, 'Online Status', 'Offline');
    });
    
    // IP Address detection using a third-party service
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            if (data.ip) {
                updateInfoItem(networkInfo, 'IP Address', data.ip);
            }
        })
        .catch(error => {
            console.error('Error fetching IP:', error);
        });
    
    // Try alternative IP detection service if the first one fails
    setTimeout(() => {
        const ipElement = Array.from(networkInfo.querySelectorAll('span[data-label]'))
            .find(el => el.getAttribute('data-label') === 'IP Address');
        
        if (ipElement && ipElement.textContent === 'Requires server-side detection') {
            fetch('https://api.ipgeolocation.io/getip')
                .then(response => response.json())
                .then(data => {
                    if (data.ip) {
                        updateInfoItem(networkInfo, 'IP Address', data.ip);
                    }
                })
                .catch(error => {
                    console.error('Error fetching IP from alternative source:', error);
                });
        }
    }, 3000);
    
    // Battery information
    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            addInfoItem(batteryInfo, 'Battery Charging', battery.charging ? 'Yes' : 'No');
            addInfoItem(batteryInfo, 'Battery Level', Math.round(battery.level * 100) + '%');
            addInfoItem(batteryInfo, 'Battery Charging Time', battery.chargingTime === Infinity ? 'Infinity' : battery.chargingTime + ' seconds');
            addInfoItem(batteryInfo, 'Battery Discharging Time', battery.dischargingTime === Infinity ? 'Infinity' : battery.dischargingTime + ' seconds');
            
            // Battery events
            battery.addEventListener('chargingchange', function() {
                updateInfoItem(batteryInfo, 'Battery Charging', battery.charging ? 'Yes' : 'No');
            });
            
            battery.addEventListener('levelchange', function() {
                updateInfoItem(batteryInfo, 'Battery Level', Math.round(battery.level * 100) + '%');
            });
        });
    } else {
        addInfoItem(batteryInfo, 'Battery API', 'Not supported');
    }
    
    // Device orientation and motion
    if (window.DeviceOrientationEvent) {
        addInfoItem(sensorsInfo, 'Device Orientation', 'Supported');
        
        window.addEventListener('deviceorientation', function(event) {
            updateInfoItem(sensorsInfo, 'Alpha', Math.round(event.alpha || 0) + '°');
            updateInfoItem(sensorsInfo, 'Beta', Math.round(event.beta || 0) + '°');
            updateInfoItem(sensorsInfo, 'Gamma', Math.round(event.gamma || 0) + '°');
        });
    } else {
        addInfoItem(sensorsInfo, 'Device Orientation', 'Not supported');
    }
    
    if (window.DeviceMotionEvent) {
        addInfoItem(sensorsInfo, 'Device Motion', 'Supported');
        
        window.addEventListener('devicemotion', function(event) {
            if (event.acceleration) {
                updateInfoItem(sensorsInfo, 'Acceleration X', Math.round((event.acceleration.x || 0) * 100) / 100 + ' m/s²');
                updateInfoItem(sensorsInfo, 'Acceleration Y', Math.round((event.acceleration.y || 0) * 100) / 100 + ' m/s²');
                updateInfoItem(sensorsInfo, 'Acceleration Z', Math.round((event.acceleration.z || 0) * 100) / 100 + ' m/s²');
            }
        });
    } else {
        addInfoItem(sensorsInfo, 'Device Motion', 'Not supported');
    }
    
    // Additional browser information using UAParser
    if (window.UAParser) {
        const parser = new UAParser();
        const result = parser.getResult();
        
        // Browser info
        addInfoItem(browserInfo, 'Browser Name', result.browser.name || 'Unknown');
        addInfoItem(browserInfo, 'Browser Version', result.browser.version || 'Unknown');
        addInfoItem(browserInfo, 'Engine Name', result.engine.name || 'Unknown');
        addInfoItem(browserInfo, 'Engine Version', result.engine.version || 'Unknown');
        
        // OS info
        addInfoItem(hardwareInfo, 'OS Name', result.os.name || 'Unknown');
        addInfoItem(hardwareInfo, 'OS Version', result.os.version || 'Unknown');
        
        // Device info
        addInfoItem(hardwareInfo, 'Device Vendor', result.device.vendor || 'Unknown');
        addInfoItem(hardwareInfo, 'Device Model', result.device.model || 'Unknown');
        addInfoItem(hardwareInfo, 'Device Type', result.device.type || 'Unknown');
    }
    
    // Media devices information
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
            .then(function(devices) {
                const audioInputs = devices.filter(device => device.kind === 'audioinput').length;
                const audioOutputs = devices.filter(device => device.kind === 'audiooutput').length;
                const videoInputs = devices.filter(device => device.kind === 'videoinput').length;
                
                addInfoItem(hardwareInfo, 'Microphones', audioInputs);
                addInfoItem(hardwareInfo, 'Speakers', audioOutputs);
                addInfoItem(hardwareInfo, 'Cameras', videoInputs);
            })
            .catch(function(err) {
                addInfoItem(hardwareInfo, 'Media Devices', 'Error: ' + err.message);
            });
    }
    
    // Additional screen information
    addInfoItem(hardwareInfo, 'Screen Width', window.screen.width + 'px');
    addInfoItem(hardwareInfo, 'Screen Height', window.screen.height + 'px');
    addInfoItem(hardwareInfo, 'Screen Color Depth', window.screen.colorDepth + ' bits');
    addInfoItem(hardwareInfo, 'Screen Pixel Depth', window.screen.pixelDepth + ' bits');
    addInfoItem(hardwareInfo, 'Window Width', window.innerWidth + 'px');
    addInfoItem(hardwareInfo, 'Window Height', window.innerHeight + 'px');
    addInfoItem(hardwareInfo, 'Pixel Ratio', window.devicePixelRatio || 'Unknown');
    
    // Browser features detection
    addInfoItem(featuresInfo, 'Cookies Enabled', navigator.cookieEnabled ? 'Yes' : 'No');
    addInfoItem(featuresInfo, 'Do Not Track', navigator.doNotTrack ? 'Enabled' : 'Disabled');
    addInfoItem(featuresInfo, 'Java Enabled', navigator.javaEnabled ? (navigator.javaEnabled() ? 'Yes' : 'No') : 'Unknown');
    addInfoItem(featuresInfo, 'Language', navigator.language || 'Unknown');
    addInfoItem(featuresInfo, 'Languages', navigator.languages ? navigator.languages.join(', ') : 'Unknown');
    
    // Check for various browser features
    const features = {
        'localStorage': 'localStorage' in window,
        'sessionStorage': 'sessionStorage' in window,
        'indexedDB': 'indexedDB' in window,
        'webSockets': 'WebSocket' in window,
        'webWorkers': 'Worker' in window,
        'serviceWorkers': 'serviceWorker' in navigator,
        'webRTC': 'RTCPeerConnection' in window,
        'webGL': 'WebGLRenderingContext' in window,
        'webVR': 'getVRDisplays' in navigator,
        'webXR': 'xr' in navigator,
        'geolocation': 'geolocation' in navigator,
        'touchScreen': 'ontouchstart' in window,
        'bluetooth': 'bluetooth' in navigator,
        'usb': 'usb' in navigator,
        'nfc': 'nfc' in navigator,
        'batteryAPI': 'getBattery' in navigator,
        'webNotifications': 'Notification' in window,
        'webShare': 'share' in navigator,
        'credentials': 'credentials' in navigator,
        'paymentRequest': 'PaymentRequest' in window,
        'speechSynthesis': 'speechSynthesis' in window,
        'speechRecognition': 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
        'clipboard': 'clipboard' in navigator,
        'mediaSession': 'mediaSession' in navigator,
        'permissions': 'permissions' in navigator,
        'vibration': 'vibrate' in navigator,
        'fullscreen': 'fullscreenEnabled' in document || 'webkitFullscreenEnabled' in document || 'mozFullScreenEnabled' in document || 'msFullscreenEnabled' in document
    };
    
    for (const [feature, supported] of Object.entries(features)) {
        addInfoItem(featuresInfo, feature, supported ? 'Supported' : 'Not supported');
    }
}

function addInfoItem(container, label, value) {
    const div = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = label;
    div.appendChild(strong);
    
    const span = document.createElement('span');
    span.textContent = value;
    span.setAttribute('data-label', label);
    div.appendChild(span);
    
    container.appendChild(div);
}

function updateInfoItem(container, label, value) {
    const items = container.querySelectorAll('span[data-label]');
    for (const item of items) {
        if (item.getAttribute('data-label') === label) {
            item.textContent = value;
            break;
        }
    }
}

// Add these functions to your script.js file

function setupExportButton() {
    const exportButton = document.getElementById('exportDoc');
    if (exportButton) {
        exportButton.addEventListener('click', exportAsText);
    }
}

function exportAsText() {
    // Create a text representation of all the fingerprint data
    let content = "=================================================\n";
    content += "           DEVICE FINGERPRINT REPORT               \n";
    content += "=================================================\n\n";
    content += "Generated: " + new Date().toLocaleString() + "\n\n";
    
    // Add fingerprint hash
    content += "UNIQUE DEVICE ID\n";
    content += "----------------\n";
    content += document.getElementById('fingerprintHash').textContent + "\n\n";
    
    // Add device identification
    content += "DEVICE IDENTIFICATION\n";
    content += "---------------------\n";
    content += extractSectionText('deviceIdentification') + "\n";
    
    // Add browser & OS info
    content += "BROWSER & OS\n";
    content += "------------\n";
    content += extractSectionText('browserInfo') + "\n";
    
    // Add hardware info
    content += "HARDWARE\n";
    content += "--------\n";
    content += extractSectionText('hardwareInfo') + "\n";
    
    // Add network info
    content += "NETWORK\n";
    content += "-------\n";
    content += extractSectionText('networkInfo') + "\n";
    
    // Add browser features
    content += "BROWSER FEATURES\n";
    content += "----------------\n";
    content += extractSectionText('featuresInfo') + "\n";
    
    // Add canvas fingerprint
    content += "CANVAS FINGERPRINT\n";
    content += "-----------------\n";
    content += "Canvas Hash: " + document.getElementById('canvasHash').textContent + "\n\n";
    
    // Add WebGL info
    content += "WEBGL INFORMATION\n";
    content += "-----------------\n";
    content += extractSectionText('webglInfo') + "\n";
    
    // Add fonts info
    content += "FONTS\n";
    content += "-----\n";
    const fontsSection = document.getElementById('fontsInfo');
    if (fontsSection) {
        const fontDivs = fontsSection.querySelectorAll('div');
        let fontsList = "";
        fontDivs.forEach((div, index) => {
            fontsList += div.textContent;
            if (index < fontDivs.length - 1) {
                fontsList += ", ";
            }
            // Add line breaks every 5 fonts for readability
            if ((index + 1) % 5 === 0) {
                fontsList += "\n";
            }
        });
        content += fontsList + "\n\n";
    } else {
        content += "No font information available\n\n";
    }
    
    // Add audio fingerprint
    content += "AUDIO FINGERPRINT\n";
    content += "----------------\n";
    content += extractSectionText('audioInfo') + "\n";
    
    // Add battery info
    content += "BATTERY\n";
    content += "-------\n";
    content += extractSectionText('batteryInfo') + "\n";
    
    // Add sensors info
    content += "SENSORS & DEVICE ORIENTATION\n";
    content += "---------------------------\n";
    content += extractSectionText('sensorsInfo') + "\n";
    
    // Add raw components data
    content += "RAW FINGERPRINT COMPONENTS\n";
    content += "-------------------------\n";
    const rawData = document.getElementById('rawComponentsData');
    if (rawData && rawData.textContent) {
        content += rawData.textContent + "\n";
    } else {
        content += "No raw component data available\n";
    }
    
    // Helper function to extract text from a section
    function extractSectionText(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return "Section not found\n";
        
        let text = "";
        const items = section.querySelectorAll('div');
        
        items.forEach(item => {
            const strong = item.querySelector('strong');
            const span = item.querySelector('span');
            
            if (strong && span) {
                text += strong.textContent + ": " + span.textContent + "\n";
            } else if (item.textContent) {
                // For items that don't follow the strong/span pattern
                text += item.textContent + "\n";
            }
        });
        
        return text;
    }
    
    // Create a blob and download it
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Full_Device_Fingerprint_Report.txt';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Make sure to call setupExportButton in your processFingerprint function
// Add this line to your existing processFingerprint function:
// setupExportButton();
