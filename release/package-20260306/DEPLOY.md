# Deployment Guide (2026-03-06)

## Package Contents
- backend/               Node backend with preinstalled node_modules
- dist-pro/              Built frontend assets (deploy as static site)
- db/migrations/         Upgrade SQL scripts for this release
- db/sql/                Full schema & seed SQL (reference only)

## Deployment Steps
1) Backup
   - Backup database (e.g. mysqldump) and backend/uploads if needed.

2) Stop running backend
   - Stop the node process or Windows service that runs backend.

3) Replace backend code
   - Copy new backend/ over the old backend folder.
   - KEEP old runtime data:
     * backend/uploads (attachments)
     * backend/config.json (DB config)
     * any MariaDB data directories

4) Deploy frontend
   - Replace your web server root with dist-pro/ (or copy dist-pro to your existing frontend location).
   - If you used nginx or IIS before, keep the same web server config and just update the static files.

5) Database upgrade
   - Run: db/migrations/2026-03-06-mediation-updates.sql
   - Example:
     mysql -u root -p village < db/migrations/2026-03-06-mediation-updates.sql

6) Start backend
   - From backend/ folder:
     node app.js
   - If port 3002 is occupied, run:
     node kill-port.js 3002
     node app.js

7) Verify
   - Open the web UI and check mediation case create/delete/attachments.

## Notes
- dist-pro is the production frontend build output.
- No npm/pnpm install is required on target machine.
