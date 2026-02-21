# Windows installer packaging

This folder contains a simple, scriptable workflow to build a Windows installer
using Inno Setup. The installer stages a production build, installs a Windows
service for the backend, opens the firewall port, and adds a browser shortcut.

## Prerequisites
- Node.js + pnpm for building the frontend and backend dependencies
- Inno Setup (ISCC.exe) for compiling the installer
- Optional: a portable Node runtime to bundle with the app

## Quick start
1. Build and stage a release:
   - PowerShell:
     - `powershell -ExecutionPolicy Bypass -File deploy/windows/build-release.ps1 -Mode pro -SkipFrontendBuild`
     - Optional (bundle MariaDB portable):
       - `powershell -ExecutionPolicy Bypass -File deploy/windows/build-release.ps1 -Mode pro -SkipFrontendBuild -MariaDbDir "D:\mariadb-portable"`
2. Compile the installer:
   - Inno Setup:
     - `ISCC.exe deploy/windows/installer.iss`

The installer will be written to `release/installer`.

## Configuration
- Database config:
  - The installer writes `backend/config.json` based on the wizard inputs.
  - If you provide admin credentials and `mysql` is available in PATH, it will
    attempt to create the database and user automatically.
  - If you bundle MariaDB, the installer will use the bundled mysql client and
    auto-initialize the data directory when needed.
  - When MariaDB is bundled, the installer registers a Windows service named
    `VueElementPlusAdminDB` and starts it automatically.
  - If the configured port is already in use, the installer will choose a free
    port and update `backend/config.json`.
  - Any `.sql` files in `backend/sql` are imported after initialization.
- Backend port:
  - Edit `deploy/windows/bin/start-backend.cmd` and change `PORT=3001`.
  - If you change the port, update the firewall rule in `install-service.cmd`.
- Frontend:
  - The build output is copied into `backend/frontend` and served by the backend.

## Notes
- The backend runs as a Windows service named `VueElementPlusAdmin`.
- The default browser shortcut opens `http://localhost:3001`.
