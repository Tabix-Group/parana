# Railway Configuration

## Environment Variables

### Backend Service
No additional configuration needed - uses Railway's built-in PostgreSQL.

### Frontend Service
Set the following environment variable:

```
VITE_API_URL=https://[backend-service-name].up.railway.app
```

Replace `[backend-service-name]` with your actual Railway backend service name.

## Service Configuration

### Backend
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: 8080 (Railway auto-detects)

### Frontend
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run preview`
- **Port**: 4173 (Vite default)

## Health Checks

- **Backend**: `https://[backend-service-name].up.railway.app/health`
- **Frontend**: `https://[frontend-service-name].up.railway.app`

## Troubleshooting

1. **Check backend health**:
   ```bash
   curl https://[backend-service-name].up.railway.app/health
   ```

2. **Check frontend environment**:
   - Open browser dev tools
   - Check `console.log(import.meta.env.VITE_API_URL)`

3. **Verify CORS**:
   - Backend allows all origins: `origin: '*'`
   - Check network tab for CORS errors