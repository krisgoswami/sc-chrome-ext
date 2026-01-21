
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface Status {
  isCapturing: boolean;
  progress: string | null;
  successCount: number;
  failureCount: number;
  skippedCount: number;
}

const Popup = () => {
  const [status, setStatus] = useState<Status>({
    isCapturing: false,
    progress: null,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0
  });

  const [captureMode, setCaptureMode] = useState<'page' | 'window'>('page');

  useEffect(() => {
    // Load saved preference
    chrome.storage.local.get(['captureMode'], (result) => {
      if (result.captureMode && (result.captureMode === 'page' || result.captureMode === 'window')) {
        setCaptureMode(result.captureMode as 'page' | 'window');
      }
    });

    // Poll for status
    const checkStatus = () => {
      chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
        if (response) {
          setStatus(response);
        }
      });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 500);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mode = e.target.value as 'page' | 'window';
    setCaptureMode(mode);
    chrome.storage.local.set({ captureMode: mode });
  };

  const handleStart = () => {
    chrome.runtime.sendMessage({ type: 'START_CAPTURE', mode: captureMode });
    setStatus({ ...status, isCapturing: true });
    window.close();
  };

  const handleCancel = () => {
    chrome.runtime.sendMessage({ type: 'CANCEL_CAPTURE' });
  };

  return (
    <div>
      <h2>Tab Screenshot Capture</h2>
      {status.isCapturing ? (
        <div>
          <div className="status">
            <strong>Capturing:</strong> {status.progress}
          </div>
          <div className="stats">
            <div>✓ Success: {status.successCount}</div>
            {status.skippedCount > 0 && <div>⏭ Skipped: {status.skippedCount}</div>}
            {status.failureCount > 0 && <div>✗ Failed: {status.failureCount}</div>}
          </div>
          <button onClick={handleCancel} style={{ backgroundColor: '#d93025', marginTop: '10px' }}>
            Cancel Capture
          </button>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            Captures current tab and all tabs to the right
          </p>

          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#5f6368' }}>
              Capture Mode:
            </div>
            <label style={{ display: 'block', marginBottom: '6px', cursor: 'pointer', fontSize: '12px' }}>
              <input
                type="radio"
                name="mode"
                value="page"
                checked={captureMode === 'page'}
                onChange={handleModeChange}
                style={{ marginRight: '6px' }}
              />
              <strong>Page Only</strong> - Fast, no dialogs
            </label>
            <label style={{ display: 'block', cursor: 'pointer', fontSize: '12px' }}>
              <input
                type="radio"
                name="mode"
                value="window"
                checked={captureMode === 'window'}
                onChange={handleModeChange}
                style={{ marginRight: '6px' }}
              />
              <strong>Full Window</strong> - Includes URL bar
            </label>
          </div>

          {captureMode === 'window' && (
            <p style={{ fontSize: '10px', color: '#ff6b00', marginBottom: '12px', fontWeight: 'bold' }}>
              ⚠️ Select "Window" (not "Tab") in the share dialog
            </p>
          )}

          <button onClick={handleStart}>Start Capture Sequence</button>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
