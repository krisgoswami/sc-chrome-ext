
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

  useEffect(() => {
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

  const handleStart = () => {
    chrome.runtime.sendMessage({ type: 'START_CAPTURE' });
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
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Captures current tab and all tabs to the right
          </p>
          <p style={{ fontSize: '11px', color: '#ff6b00', marginBottom: '12px', fontWeight: 'bold' }}>
            ⚠️ In the share dialog, select "Window" (not "Tab")
          </p>
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
