# 📦 Complete NPM Installation Commands

## 🎯 Install Everything in One Go

Copy and paste these commands in your VSCode terminal:

---

## **Option 1: Install Root + All Workspaces (RECOMMENDED)**

```bash
# Navigate to project root
cd reeyo-backend

# Install root dependencies and all workspaces
npm install

# This will automatically install dependencies for:
# - Root workspace
# - All apps (user-api, vendor-api, rider-api, admin-api)
# - All libs (shared-utils, core-db, wallet-engine, notifications, socket-server)
```

---

## **Option 2: Install Each Workspace Separately** 

If the above doesn't work or you want more control:

```bash
# Navigate to project root
cd reeyo-backend

# Install root dependencies
npm install

# Install shared libraries
cd libs/shared-utils && npm install && cd ../..
cd libs/core-db && npm install && cd ../..
cd libs/wallet-engine && npm install && cd ../..
cd libs/notifications && npm install && cd ../..
cd libs/socket-server && npm install && cd ../..

# Install API services
cd apps/vendor-api && npm install && cd ../..
cd apps/rider-api && npm install && cd ../..
cd apps/user-api && npm install && cd ../..
cd apps/admin-api && npm install && cd ../..
```

---

## **Option 3: One-Line Command (All at Once)**

```bash
cd reeyo-backend && npm install && cd libs/shared-utils && npm install && cd ../core-db && npm install && cd ../wallet-engine && npm install && cd ../notifications && npm install && cd ../socket-server && npm install && cd ../../apps/vendor-api && npm install && cd ../rider-api && npm install && cd ../user-api && npm install && cd ../admin-api && npm install && cd ../..
```

---

## 🔧 **After Installation, Build Shared Libraries**

```bash
# Must build libraries before using them in APIs
cd reeyo-backend

# Build all libraries
npm run build:libs

# Or build individually
cd libs/shared-utils && npm run build && cd ../..
cd libs/core-db && npm run build && cd ../..
cd libs/wallet-engine && npm run build && cd ../..
cd libs/notifications && npm run build && cd ../..
cd libs/socket-server && npm run build && cd ../..
```

---

## 🐛 **If You Get Errors**

### Error: "Cannot find module"
```bash
# Clear all node_modules and reinstall
cd reeyo-backend
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
npm install
npm run build:libs
```

### Error: "EACCES permission denied"
```bash
# Fix npm permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### Error: TypeScript errors after install
```bash
# Rebuild TypeScript projects
cd reeyo-backend
npm run build:libs
```

---

## ✅ **Verify Installation**

```bash
# Check if all dependencies installed
cd reeyo-backend
npm list --depth=0

# Check workspaces
npm list --workspaces --depth=0

# Verify builds
ls -la libs/shared-utils/dist
ls -la libs/core-db/dist
ls -la libs/wallet-engine/dist
ls -la libs/notifications/dist
ls -la libs/socket-server/dist
```

---

## 📋 **What Gets Installed**

### Root Dependencies:
```
- TypeScript
- ESLint
- Prettier
- Concurrently (run multiple services)
```

### Shared Libraries Dependencies:
```
- winston (logging)
- joi (validation)
- bcryptjs (password hashing)
- jsonwebtoken (JWT tokens)
- @aws-sdk/client-dynamodb (database)
- @aws-sdk/client-s3 (file storage)
- @aws-sdk/client-sns (push notifications)
- ioredis (Redis client)
- axios (HTTP requests)
- twilio (SMS)
- nodemailer (Email)
- socket.io (WebSockets)
```

### API Dependencies:
```
- express (web framework)
- helmet (security)
- cors (cross-origin)
- compression (response compression)
- express-rate-limit (rate limiting)
- express-validator (input validation)
- multer (file uploads)
- dotenv (environment variables)
```

---

## 🚀 **Quick Start After Installation**

```bash
# 1. Install everything
cd reeyo-backend
npm install

# 2. Build libraries
npm run build:libs

# 3. Copy environment variables
cp .env.example .env

# 4. Edit .env with your values
code .env

# 5. Start Docker services (DynamoDB + Redis)
docker-compose up -d

# 6. Start development servers
npm run dev

# Or start individual APIs
npm run dev:vendor  # Terminal 1
npm run dev:rider   # Terminal 2
npm run dev:user    # Terminal 3
npm run dev:admin   # Terminal 4
```

---

## 💡 **Pro Tips**

### Use VSCode Terminal
```
1. Open VSCode
2. Terminal → New Terminal (Ctrl + `)
3. Paste commands
4. Watch progress
```

### Split Terminal View
```
1. Click split terminal icon
2. Run different services in each panel
3. Monitor logs side-by-side
```

### Use Task Runner (Optional)
Create `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Install All Dependencies",
      "type": "shell",
      "command": "npm install && npm run build:libs",
      "group": "build"
    }
  ]
}
```

Then: `Ctrl+Shift+P` → "Run Task" → "Install All Dependencies"

---

## ⏱️ **Estimated Installation Time**

| Step | Time |
|------|------|
| Root install | 2-3 min |
| All workspaces | 5-8 min |
| Build libraries | 1-2 min |
| **Total** | **8-13 minutes** |

(Depends on internet speed and computer)

---

## 🆘 **Still Having Issues?**

Try this complete clean install:

```bash
# 1. Delete everything
cd reeyo-backend
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules apps/*/package-lock.json
rm -rf libs/*/node_modules libs/*/package-lock.json

# 2. Clear npm cache
npm cache clean --force

# 3. Fresh install
npm install

# 4. Build
npm run build:libs

# 5. Test
npm test
```

---

**That's it! Just run `npm install` and you're good to go! 🎉**