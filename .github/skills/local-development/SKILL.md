# Local Development Environment

## Overview

The Meal Planner app requires **two servers** running simultaneously:

| Server | Port | Purpose | Command |
|--------|------|---------|---------|
| FastAPI | 8000 | REST API backend | `uv run uvicorn api.main:app --reload --port 8000` |
| Expo | 8081 | React Native mobile/web app | `npx expo start --lan` |

## Quick Start (macOS/Linux)

### Step 1: Start Both Servers

Run these commands in **separate terminal processes** (use `isBackground: true`):

```bash
# Terminal 1: API Server (from project root)
cd /path/to/meal-planner && uv run uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Expo (from mobile directory)
cd /path/to/meal-planner/mobile && npx expo start --lan
```

### Step 2: Verify Servers Running

```bash
# Check API is running
curl -s http://localhost:8000/health
# Expected: {"status":"healthy"}

# Check API returns data
curl -s http://localhost:8000/api/v1/recipes | head -c 100
```

### Step 3: Access the App

- **Web**: http://localhost:8081
- **Mobile**: Scan QR code with Expo Go app

## Common Issues and Solutions

### Issue: "Address already in use" (Port Conflict)

**Cause**: Previous server process still running.

**Solution**:
```bash
# Kill processes on port 8000 (API)
pkill -f "uvicorn api.main:app"

# Kill processes on port 8081 (Expo)
pkill -f "expo start"

# Or kill by port number
lsof -ti:8000 | xargs kill -9
lsof -ti:8081 | xargs kill -9
```

### Issue: "No data" in the app

**Possible causes**:
1. API server not running
2. Wrong URL/port

**Diagnosis**:
```bash
# 1. Verify API is running
lsof -i:8000 | grep LISTEN

# 2. Verify API returns data
curl -s http://localhost:8000/api/v1/recipes | jq '.[0].title'

# 3. Check mobile/.env has correct API URL
cat mobile/.env
# Should show: EXPO_PUBLIC_API_URL=http://<YOUR_IP>:8000
```

### Issue: Expo server stops unexpectedly

**Cause**: Running terminal commands in the same terminal as Expo.

**Solution**: Always use **separate terminal IDs** for:
- API server (background)
- Expo server (background)
- Ad-hoc commands (foreground, separate terminal)

### Issue: Metro bundler errors / stale cache

**Solution**: Clear cache and restart:
```bash
cd mobile && npx expo start --lan --clear
```

### Issue: CORS errors in browser console

**Cause**: API not allowing requests from Expo's port.

**Check**: Verify `ALLOWED_ORIGINS` in `api/main.py` includes `http://localhost:8081`.

## Platform-Specific Notes

### macOS

- Use `--lan` mode for Expo (tunnel mode has issues)
- API binds to `0.0.0.0` to allow mobile device access
- Find your IP with: `ipconfig getifaddr en0`

### Windows

- Use PowerShell or Git Bash
- Replace `pkill` with: `taskkill /F /IM python.exe` (for API)
- Replace `lsof` with: `netstat -ano | findstr :8000`
- Expo commands are the same

### Linux

- Same as macOS
- May need `sudo` for killing processes on privileged ports

## Environment Variables

### mobile/.env

```bash
# Your machine's local IP (not localhost, for mobile device access)
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Find your IP:
- macOS: `ipconfig getifaddr en0`
- Windows: `ipconfig` → look for IPv4 Address
- Linux: `hostname -I`

## Verification Checklist

Before debugging "no data" issues, verify:

- [ ] API server running: `lsof -i:8000 | grep LISTEN`
- [ ] API returns data: `curl http://localhost:8000/api/v1/recipes`
- [ ] Expo running: `lsof -i:8081 | grep LISTEN`
- [ ] App accessed via correct URL (8081 for Expo, NOT 8000)
- [ ] Browser console has no CORS errors (F12 → Console)

## For AI Coding Agents

When starting the development environment:

1. **Check if servers already running** before starting new ones:
   ```bash
   lsof -i:8000 -i:8081 | grep LISTEN
   ```

2. **Start servers as background processes** with separate terminal IDs

3. **Never run commands in a terminal running Expo** - it will stop the server

4. **Verify with curl** before telling user to check the app:
   ```bash
   curl -s http://localhost:8000/api/v1/recipes | head -c 100
   ```

5. **If port conflict**, kill old processes first:
   ```bash
   pkill -f "uvicorn api.main:app"; pkill -f "expo start"; sleep 2
   ```
