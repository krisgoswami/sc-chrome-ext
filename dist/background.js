/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background.ts"
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/
() {


// Background script with fixed desktop capture support
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let state = {
    isCapturing: false,
    originalTabId: null,
    tabsToCapture: [],
    currentIndex: 0,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    isCancelled: false
};
// Utilities
function getTimestamp() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
}
function showNotification(title, message, type = 'basic') {
    chrome.notifications.create({
        type: type,
        iconUrl: 'icons/icon.png',
        title: title,
        message: message
    });
}
function isRestrictedUrl(url) {
    if (!url)
        return true;
    return url.startsWith('chrome://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:') ||
        url.startsWith('chrome-extension://');
}
function setupOffscreenDocument(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingContexts = yield chrome.runtime.getContexts({
            contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
        });
        if (existingContexts.length > 0) {
            return;
        }
        yield chrome.offscreen.createDocument({
            url: path,
            reasons: [chrome.offscreen.Reason.DISPLAY_MEDIA],
            justification: 'Recording window for screenshot sequence'
        });
    });
}
function captureNext() {
    return __awaiter(this, void 0, void 0, function* () {
        if (state.isCancelled) {
            yield finishCapture(true);
            return;
        }
        if (state.currentIndex >= state.tabsToCapture.length) {
            yield finishCapture(false);
            return;
        }
        const tab = state.tabsToCapture[state.currentIndex];
        if (!tab.id) {
            state.failureCount++;
            state.currentIndex++;
            captureNext();
            return;
        }
        chrome.action.setBadgeText({ text: `${state.currentIndex + 1}/${state.tabsToCapture.length}` });
        if (isRestrictedUrl(tab.url)) {
            console.warn(`Skipping restricted URL: ${tab.url}`);
            state.skippedCount++;
            state.currentIndex++;
            captureNext();
            return;
        }
        // Activate tab
        try {
            yield chrome.tabs.update(tab.id, { active: true });
        }
        catch (e) {
            console.error(`Failed to activate tab ${tab.id}:`, e);
            state.failureCount++;
            state.currentIndex++;
            captureNext();
            return;
        }
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        yield wait(1200); // Longer wait for window capture to settle
        try {
            // Request frame from offscreen
            const response = yield chrome.runtime.sendMessage({ type: 'CAPTURE_FRAME' });
            if (!response || !response.dataUrl) {
                throw new Error((response === null || response === void 0 ? void 0 : response.error) || "Failed to capture frame from offscreen");
            }
            const folderName = `tab-screenshots/${state.timestamp}`;
            const fileName = `${folderName}/tab-${(state.currentIndex + 1).toString().padStart(2, '0')}.png`;
            yield chrome.downloads.download({
                url: response.dataUrl,
                filename: fileName,
                saveAs: false
            });
            state.successCount++;
        }
        catch (e) {
            console.error(`Failed to process tab ${tab.id}:`, e);
            state.failureCount++;
        }
        state.currentIndex++;
        captureNext();
    });
}
function startCapture() {
    return __awaiter(this, void 0, void 0, function* () {
        if (state.isCapturing) {
            showNotification('Already Capturing', 'A capture session is already in progress.');
            return;
        }
        const [currentTab] = yield chrome.tabs.query({ active: true, currentWindow: true });
        if (!currentTab || currentTab.index === undefined) {
            showNotification('Error', 'Could not identify the current tab.');
            return;
        }
        const allTabs = yield chrome.tabs.query({ currentWindow: true });
        const sortedTabs = allTabs.sort((a, b) => a.index - b.index);
        const targetTabs = sortedTabs.filter(t => t.index >= currentTab.index);
        if (targetTabs.length === 0) {
            showNotification('No Tabs', 'No tabs found to capture.');
            return;
        }
        const capturableTabs = targetTabs.filter(t => !isRestrictedUrl(t.url));
        if (capturableTabs.length === 0) {
            showNotification('No Capturable Tabs', 'All tabs are restricted URLs and cannot be captured.');
            return;
        }
        state = {
            isCapturing: true,
            originalTabId: currentTab.id || null,
            tabsToCapture: targetTabs,
            currentIndex: 0,
            successCount: 0,
            failureCount: 0,
            skippedCount: 0,
            isCancelled: false
        };
        // @ts-ignore
        state.timestamp = getTimestamp();
        chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
        try {
            yield setupOffscreenDocument('offscreen.html');
            // Initialize display capture in offscreen document
            const initResponse = yield chrome.runtime.sendMessage({ type: 'INIT_DISPLAY_CAPTURE' });
            if (!initResponse || !initResponse.success) {
                throw new Error((initResponse === null || initResponse === void 0 ? void 0 : initResponse.error) || 'Failed to initialize display capture');
            }
            // Give stream time to fully initialize
            yield new Promise(r => setTimeout(r, 800));
            captureNext();
        }
        catch (e) {
            console.error("Failed to setup offscreen", e);
            showNotification('Error', 'Failed to initialize screen capture. Make sure you selected a window to share.');
            state.isCapturing = false;
            chrome.action.setBadgeText({ text: '' });
        }
    });
}
function cancelCapture() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!state.isCapturing)
            return;
        state.isCancelled = true;
        showNotification('Capture Cancelled', 'Screenshot capture has been cancelled.');
    });
}
function finishCapture(cancelled) {
    return __awaiter(this, void 0, void 0, function* () {
        state.isCapturing = false;
        chrome.action.setBadgeText({ text: '' });
        // Stop and close offscreen
        try {
            yield chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
            yield chrome.offscreen.closeDocument();
        }
        catch (e) {
            // Ignore if already closed
        }
        // Restore original tab
        if (state.originalTabId) {
            try {
                yield chrome.tabs.update(state.originalTabId, { active: true });
            }
            catch (e) {
                console.error("Failed to restore tab", e);
            }
        }
        if (!cancelled) {
            let message = `✓ ${state.successCount} captured`;
            if (state.skippedCount > 0) {
                message += ` | ⏭ ${state.skippedCount} skipped`;
            }
            if (state.failureCount > 0) {
                message += ` | ✗ ${state.failureCount} failed`;
            }
            showNotification('Capture Complete', message);
        }
    });
}
// Listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
        startCapture();
        sendResponse({ success: true });
    }
    else if (message.type === 'CANCEL_CAPTURE') {
        cancelCapture();
        sendResponse({ success: true });
    }
    else if (message.type === 'GET_STATUS') {
        sendResponse({
            isCapturing: state.isCapturing,
            progress: state.isCapturing ? `${state.currentIndex}/${state.tabsToCapture.length}` : null,
            successCount: state.successCount,
            failureCount: state.failureCount,
            skippedCount: state.skippedCount
        });
    }
    return true;
});


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/background.ts"].call(__webpack_exports__);
/******/ 	
/******/ })()
;
//# sourceMappingURL=background.js.map