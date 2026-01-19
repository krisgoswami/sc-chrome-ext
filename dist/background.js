/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background.ts"
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/
() {


// Background script with enhanced error handling and notifications
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
function captureNext() {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for cancellation
        if (state.isCancelled) {
            yield finishCapture(true);
            return;
        }
        if (state.currentIndex >= state.tabsToCapture.length) {
            // Done
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
        // Update Badge
        chrome.action.setBadgeText({ text: `${state.currentIndex + 1}/${state.tabsToCapture.length}` });
        // Check for restricted URLs
        if (isRestrictedUrl(tab.url)) {
            console.warn(`Skipping restricted URL: ${tab.url}`);
            state.skippedCount++;
            state.currentIndex++;
            captureNext();
            return;
        }
        // Activate tab
        try {
            const updateResult = yield chrome.tabs.update(tab.id, { active: true });
            if (updateResult && updateResult.status === 'loading') {
                // Tab is loading
            }
        }
        catch (e) {
            console.error(`Failed to activate tab ${tab.id}:`, e);
            state.failureCount++;
            state.currentIndex++;
            captureNext();
            return;
        }
        // Helper wait function
        const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        // Wait for render
        yield wait(800);
        try {
            // Retry logic for capture
            let dataUrl;
            let attempts = 0;
            while (!dataUrl && attempts < 3) {
                try {
                    dataUrl = yield chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
                }
                catch (captureErr) {
                    console.warn(`Capture attempt ${attempts + 1} failed for tab ${tab.id}:`, captureErr);
                    attempts++;
                    if (attempts < 3) {
                        yield wait(500);
                    }
                }
            }
            if (!dataUrl) {
                throw new Error("Failed to capture tab after 3 attempts");
            }
            const folderName = `tab-screenshots/${state.timestamp}`;
            const fileName = `${folderName}/tab-${(state.currentIndex + 1).toString().padStart(2, '0')}.png`;
            yield chrome.downloads.download({
                url: dataUrl,
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
        // Filter out restricted URLs for initial count
        const capturableTabs = targetTabs.filter(t => !isRestrictedUrl(t.url));
        if (capturableTabs.length === 0) {
            showNotification('No Capturable Tabs', 'All tabs are restricted URLs (chrome://, etc.) and cannot be captured.');
            return;
        }
        // Initialize state
        state = {
            isCapturing: true,
            originalTabId: currentTab.id || null,
            tabsToCapture: targetTabs, // Include all, we'll skip restricted ones
            currentIndex: 0,
            successCount: 0,
            failureCount: 0,
            skippedCount: 0,
            isCancelled: false
        };
        // @ts-ignore
        state.timestamp = getTimestamp();
        chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
        captureNext();
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
        // Restore original tab
        if (state.originalTabId) {
            try {
                yield chrome.tabs.update(state.originalTabId, { active: true });
            }
            catch (e) {
                console.error("Failed to restore tab", e);
            }
        }
        // Show completion notification
        if (!cancelled) {
            const total = state.successCount + state.failureCount + state.skippedCount;
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