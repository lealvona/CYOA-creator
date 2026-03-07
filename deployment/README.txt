# CYOA Creator Server

Complete server package for the CYOA Creator application. This package includes everything needed to run the backend API server for story uploads and imports.

## What's Included

- **Server Files**: Complete Node.js/Express server with ZIP import functionality
- **Interactive Setup Scripts**: Automated setup for Windows, macOS, and Linux
- **Web Frontend**: Pre-built web UI for browsing stories
- **API Endpoints**: REST API for story uploads, imports, and management

## Quick Start

### Option 1: Automated Setup (Recommended)

We provide interactive setup scripts that handle everything automatically:

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
./setup.sh
```

The script will:
1. Check your system requirements
2. Install Node.js if needed (with your permission)
3. Install all dependencies
4. Set up data directories
5. Start the server

### Option 2: Manual Setup

If you prefer to set up manually:

1. **Install Node.js 18+**
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm run dev:api
   ```

4. **Start Frontend + Backend Together** (optional)
   ```bash
   npm run dev:all
   ```

## System Requirements

- **Node.js**: Version 18 or higher
- **Operating System**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 500MB for installation, plus space for stories
- **Network**: Internet connection for initial setup

## File Structure

```
CYOA-Creator-Server/
├── server/                 # API server code
│   ├── index.mjs          # Main server entry
│   ├── zip-importer.mjs   # ZIP import logic
│   ├── catalog-store.mjs  # Story catalog management
│   ├── validate-story.mjs # Story validation
│   └── constants.mjs      # Server configuration
├── dist/                  # Pre-built web frontend
├── data/                  # Data storage (created on first run)
│   ├── stories/          # Imported stories
│   ├── tmp/              # Temporary upload files
│   └── catalog.json      # Story catalog
├── docs/                  # Documentation
├── package.json          # Node.js dependencies
├── setup.sh              # macOS/Linux setup script
├── setup.bat             # Windows setup script
└── README.txt            # This file
```

## API Endpoints

Once running, the server provides these endpoints:

- `GET /api/health` - Health check
- `GET /api/stories` - List all stories
- `POST /api/import` - Upload and import a story ZIP file

Default server URL: `http://localhost:8787`

## Using with the Android App

1. Make sure the server is running on your computer
2. Connect your Android device to the same WiFi network
3. In the Android app, use your computer's IP address in the import URL
4. Example: If your computer is at 192.168.1.100, the API URL is:
   ```
   http://192.168.1.100:8787
   ```

To find your computer's IP:
- **Windows**: Run `ipconfig` in Command Prompt
- **macOS**: Run `ifconfig` in Terminal
- **Linux**: Run `ip addr` or `ifconfig`

## Troubleshooting

### Port Already in Use

If port 8787 is already in use:

```bash
# Find and kill the process (Linux/macOS)
lsof -ti:8787 | xargs kill -9

# Or use a different port
PORT=3000 npm run dev:api
```

### Permission Denied (Linux/macOS)

If you get permission errors:

```bash
# Fix permissions
sudo chown -R $(whoami) .

# Or run setup with sudo
sudo ./setup.sh
```

### Node.js Not Found

If setup can't find Node.js:

1. Download from https://nodejs.org/
2. Install it
3. Close and reopen your terminal
4. Run setup again

### Dependencies Fail to Install

If npm install fails:

1. Check internet connection
2. Clear npm cache: `npm cache clean --force`
3. Try again: `npm install`
4. If still failing, check antivirus isn't blocking npm

## Security Notes

- The server runs on localhost by default (not accessible from internet)
- To allow external connections, set `HOST=0.0.0.0` before starting
- For production use, consider:
  - Running behind a reverse proxy (nginx, Apache)
  - Enabling HTTPS/TLS
  - Adding authentication
  - Setting up proper firewall rules

## Customization

### Change Port

```bash
PORT=3000 npm run dev:api
```

### Change Data Directory

Edit `server/constants.mjs`:
```javascript
export const DATA_DIR = path.resolve(process.cwd(), "your-custom-data-dir");
```

### Change File Size Limits

Edit `server/constants.mjs`:
```javascript
export const LIMITS = {
  maxZipBytes: 4 * 1024 * 1024 * 1024,  // 4GB
  maxEntries: 10000,
  maxExpandedBytes: 16 * 1024 * 1024 * 1024,  // 16GB
};
```

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Look at the server logs for error messages
3. Run with verbose logging: `DEBUG=* npm run dev:api`
4. Open an issue on GitHub: https://github.com/lealvona/CYOA-creator/issues

## Development

To modify the server:

1. Edit files in the `server/` directory
2. Restart the server to see changes
3. Run tests: `npm test`

## License

See LICENSE file in the repository.

## Version

This is CYOA Creator Server v1.0.0
