/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/offscreen/offscreen.ts"
/*!************************************!*\
  !*** ./src/offscreen/offscreen.ts ***!
  \************************************/
() {


// Offscreen document for desktop capture
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
function startStream(streamId) {
    return __awaiter(this, void 0, void 0, function* () {
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
            stream = yield navigator.mediaDevices.getUserMedia(constraints);
            if (!video)
                video = document.getElementById('stream');
            video.srcObject = stream;
            yield video.play();
            console.log('Stream started successfully');
        }
        catch (e) {
            console.error("Failed to start stream", e);
        }
    });
}
function captureFrame() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!video || !stream) {
            console.error('Video or stream not ready');
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
    if (message.type === 'INIT_STREAM') {
        startStream(message.streamId).then(() => sendResponse({ success: true }));
        return true;
    }
    else if (message.type === 'CAPTURE_FRAME') {
        captureFrame().then(dataUrl => sendResponse({ dataUrl }));
        return true;
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