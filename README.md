# Chrome Tab Sequence Capturer

A Chrome Extension (Manifest V3) that automates the process of capturing screenshots of multiple browser tabs. It starts from the currently active tab and captures all subsequent tabs to the right, saving them as an organized sequence of PNG files.

## Features

- **Sequential Capture**: Automatically switches through tabs starting from the current one.
- **Smart Waiting**: Waits for tabs to render before capturing (800ms default).
- **Robustness**: Includes retry logic (3 attempts per tab) to handle rendering issues.
- **Organized Output**: Saves screenshots in timestamped folders (e.g., `Downloads/tab-screenshots/2026-01-19_10-00-00/tab-01.png`).
- **Completion Notifications**: Browser notification when done with success/failure/skipped counts.
- **Error Handling**: Gracefully handles restricted URLs, permission issues, and edge cases.

## Tech Stack

- **TypeScript**: For type-safe logic.
- **React**: For the popup UI.
- **Webpack**: For bundling the extension.
- **Chrome Extension API (MV3)**: Uses `tabs`, `downloads`, and service workers (`background.ts`).

## Installation

### Prerequisites

- Node.js and npm installed.

### Build Steps

1.  **Clone the repository** (if applicable) or navigate to the project folder.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Build the extension**:
    ```bash
    npx webpack
    ```
    (Or `npm run build` if a script is set up, otherwise use `npx webpack` as the default build command).

    The build output will be generated in the `dist` folder.

## Loading in Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** in the top right corner.
3.  Click **Load unpacked**.
4.  Select the `dist` folder from the project directory.

## Usage

1.  Open the tabs you want to capture.
2.  Click the extension icon on the **first tab** you want to start capturing from.
3.  Click **Start Capture Sequence**.
4.  The extension will automatically:
    - Switch to the next tab.
    - Wait for it to render.
    - Capture the screenshot.
    - Download it.
    - Repeat until the last tab.

**Note**: Chrome internal pages (`chrome://`, `edge://`, `about:`) cannot be captured due to browser security restrictions and will be automatically skipped.

## Packaging for Distribution

To share the extension as a single installable file (like a `.exe` for Windows), you need to create a `.crx` file:

### Creating a .CRX File (Single-Click Install)

**Method 1: Using Chrome (Recommended)**

1.  Build the extension:
    ```bash
    npx webpack
    ```

2.  Open Chrome and go to `chrome://extensions`

3.  Enable **Developer mode** (top right)

4.  Click **Pack extension**

5.  In the dialog:
    - **Extension root directory**: Browse to your `dist` folder
    - **Private key file**: Leave empty for first time (Chrome will generate one)
    - Click **Pack Extension**

6.  Chrome will create two files in the parent directory:
    - `dist.crx` - This is the installable extension file (share this)
    - `dist.pem` - Private key (keep this secret, needed for updates)

7.  Rename `dist.crx` to something meaningful like `tab-screenshot-extension.crx`

**Method 2: Using Command Line (Advanced)**

```bash
# Install chrome-ext-pack
npm install -g chrome-ext-pack

# Create .crx file
chrome-ext-pack dist
```

### Installing the .CRX File

**For users receiving the .crx file:**

1.  Download the `.crx` file
2.  Open Chrome and go to `chrome://extensions`
3.  Enable **Developer mode**
4.  **Drag and drop** the `.crx` file onto the extensions page
5.  Click **Add extension** when prompted

**Note**: Chrome may show a warning for extensions not from the Web Store. This is normal for developer-distributed extensions.

### Alternative: ZIP Distribution (For Testing)

If .crx installation is blocked by Chrome policies:

1.  Create a ZIP of the `dist` folder:
    ```bash
    # Windows (PowerShell)
    Compress-Archive -Path dist\* -DestinationPath tab-screenshot-extension.zip
    ```
2.  Share the ZIP file
3.  Recipients extract it and load as unpacked extension

## Troubleshooting

### Icon Not Showing
If the extension icon doesn't appear after installation:
1.  **Remove and Reload**: Go to `chrome://extensions`, remove the extension completely, then reload it.
2.  **Clear Cache**: Sometimes Chrome caches the old icon. Try restarting Chrome.
3.  **Check dist folder**: Verify `dist/icons/icon.png` exists after building.

### Screenshots Not Capturing
- Ensure you've granted the `<all_urls>` permission when prompted.
- Chrome internal pages (`chrome://`, `edge://`) cannot be captured - this is normal.


## Permissions

- `tabs`: To query and switch tabs.
- `activeTab`: To access the initial tab.
- `downloads`: To save the screenshot files.
- `host_permissions` (`<all_urls>`): Required to programmatically capture visible tabs after switching to them. Without this, the extension can only capture the tab where the user explicitly clicked the icon.

## License

ISC
