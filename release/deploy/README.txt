Vue Element Plus Admin - Portable Installation Package
=======================================

This installation package contains the complete Vue Element Plus Admin application, including the frontend interface and backend services.

Prerequisites:
- You need to separately download portable versions of Node.js and MariaDB
- Extract Node.js portable to: node-portable/
- Extract MariaDB portable to: mariadb-portable/
- These folders should be in the same parent directory as this package

Directory Structure:
- backend/: Backend service files and startup scripts
- frontend/: Frontend build files
- node-portable/: (User to provide) Portable Node.js installation
- mariadb-portable/: (User to provide) Portable MariaDB installation
- docs/: Documentation files

Installation and Operation:
1. Ensure the system meets the following requirements:
   - Windows 10 or higher
   - At least 4GB free disk space
   
2. Download portable Node.js (LTS version) and extract to node-portable/ directory
3. Download portable MariaDB (10.6 or newer) and extract to mariadb-portable/ directory
4. Extract the entire folder to the desired installation path, for example: E:\vue-app\

5. Double-click to run backend/check-and-setup-env.bat script
   - This script will check for portable Node.js and MariaDB
   - Automatically install all required dependencies
   - Start the database service
   - Initialize the database structure and data
   - Start the backend service
   - Open the browser to access the application

Port Information:
- Backend Service Port: 3002
- Database Port: 3307

Access Application:
- Browser Access: http://localhost:3002
- Admin Account: admin
- Initial Password: admin123

Notes:
- Do not modify or delete any files in the backend directory
- The first run may take a few minutes to complete dependency installation and database initialization
- Database files are stored in the backend/data directory, please back up this directory regularly
