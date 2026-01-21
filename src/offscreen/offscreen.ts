
// Offscreen document for desktop capture using getDisplayMedia

let video: HTMLVideoElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let stream: MediaStream | null = null;

async function startDisplayCapture() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  try {
    // Use getDisplayMedia directly - this is the correct approach for offscreen documents
    // preferCurrentTab: false helps avoid tab selection
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'window', // Prefer window over tab
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      preferCurrentTab: false // Don't default to current tab
    } as any); // Cast needed for preferCurrentTab

    if (!video) video = document.getElementById('stream') as HTMLVideoElement;

    video.srcObject = stream;
    await video.play();

    console.log('Display capture started successfully');

    // Wait a bit for video to be ready
    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (e) {
    console.error("Failed to start display capture", e);
    throw e;
  }
}

async function captureFrame() {
  if (!video || !stream) {
    console.error('Video or stream not ready');
    return null;
  }

  // Check if video has valid dimensions
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    console.error('Video not ready yet');
    return null;
  }

  if (!canvas) canvas = document.getElementById('capture') as HTMLCanvasElement;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/png');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INIT_DISPLAY_CAPTURE') {
    startDisplayCapture()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  } else if (message.type === 'CAPTURE_FRAME') {
    captureFrame()
      .then(dataUrl => sendResponse({ dataUrl }))
      .catch(error => sendResponse({ dataUrl: null, error: error.message }));
    return true;
  } else if (message.type === 'STOP_CAPTURE') {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    sendResponse({ success: true });
  }
});
