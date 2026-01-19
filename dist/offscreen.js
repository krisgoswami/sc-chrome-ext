/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/offscreen/offscreen.ts"
/*!************************************!*\
  !*** ./src/offscreen/offscreen.ts ***!
  \************************************/
() {


// Offscreen document for desktop capture using getDisplayMedia
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let video = null;
let canvas = null;
let stream = null;
function startDisplayCapture() {
    return __awaiter(this, void 0, void 0, function* () {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            // Use getDisplayMedia directly - this is the correct approach for offscreen documents
            // preferCurrentTab: false helps avoid tab selection
            stream = yield navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'window', // Prefer window over tab
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                preferCurrentTab: false // Don't default to current tab
            }); // Cast needed for preferCurrentTab
            if (!video)
                video = document.getElementById('stream');
            video.srcObject = stream;
            yield video.play();
            console.log('Display capture started successfully');
            // Wait a bit for video to be ready
            yield new Promise(resolve => setTimeout(resolve, 500));
        }
        catch (e) {
            console.error("Failed to start display capture", e);
            throw e;
        }
    });
}
function captureFrame() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!video || !stream) {
            console.error('Video or stream not ready');
            return null;
        }
        // Check if video has valid dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.error('Video not ready yet');
            return null;
        }
        if (!canvas)
            canvas = document.getElementById('capture');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return null;
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/png');
    });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INIT_DISPLAY_CAPTURE') {
        startDisplayCapture()
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
    else if (message.type === 'CAPTURE_FRAME') {
        captureFrame()
            .then(dataUrl => sendResponse({ dataUrl }))
            .catch(error => sendResponse({ dataUrl: null, error: error.message }));
        return true;
    }
    else if (message.type === 'STOP_CAPTURE') {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        sendResponse({ success: true });
    }
});


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/offscreen/offscreen.ts"].call(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=offscreen.js.map