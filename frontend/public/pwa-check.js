// PWA Installability Check Script
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    console.log('🔍 Checking PWA Installability...');
    
    // Check 1: Manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      try {
        const response = await fetch(manifestLink.href);
        const manifest = await response.json();
        console.log('✅ Manifest found:', manifest);
        
        // Check required fields
        const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missing = required.filter(field => !manifest[field]);
        if (missing.length > 0) {
          console.error('❌ Manifest missing fields:', missing);
        } else {
          console.log('✅ Manifest has all required fields');
        }
        
        // Check icons
        if (manifest.icons && manifest.icons.length > 0) {
          const has192 = manifest.icons.some(icon => icon.sizes.includes('192'));
          const has512 = manifest.icons.some(icon => icon.sizes.includes('512'));
          if (has192 && has512) {
            console.log('✅ Icons: Has 192x192 and 512x512');
          } else {
            console.warn('⚠️ Icons: Missing 192x192 or 512x512');
          }
        }
      } catch (error) {
        console.error('❌ Manifest error:', error);
      }
    } else {
      console.error('❌ Manifest link not found');
    }
    
    // Check 2: Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        console.log('✅ Service Worker ready:', registration);
        console.log('✅ Service Worker scope:', registration.scope);
      } catch (error) {
        console.error('❌ Service Worker not ready:', error);
      }
    } else {
      console.error('❌ Service Worker not supported');
    }
    
    // Check 3: Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('✅ Install prompt available!');
      console.log('✅ PWA is installable!');
    });
    
    // Check 4: HTTPS
    if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.log('✅ HTTPS/localhost: OK');
    } else {
      console.warn('⚠️ Not HTTPS - PWA may not be installable');
    }
    
    console.log('🔍 PWA Check Complete');
  });
}

