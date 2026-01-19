
// Offscreen document for desktop capture

let video: HTMLVideoElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let stream: MediaStream | null = null;

async function startStream(streamId: string) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  try {
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
          maxWidth: 1920,
          maxHeight: 1080
        }
      }
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints as any);

    if (!video) video = document.getElementById('stream') as HTMLVideoElement;

    video.srcObject = stream;
    await video.play();

    console.log('Stream started successfully');
  } catch (e) {
    console.error("Failed to start stream", e);
  }
}

async function captureFrame() {
  if (!video || !stream) {
    console.error('Video or stream not ready');
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
  if (message.type === 'INIT_STREAM') {
    startStream(message.streamId).then(() => sendResponse({ success: true }));
    return true;
  } else if (message.type === 'CAPTURE_FRAME') {
    captureFrame().then(dataUrl => sendResponse({ dataUrl }));
    return true;
  }
});
