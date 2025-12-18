# Netlify Deployment Guide for Gestión Terapéutica

## 🚀 Deployment Steps

### 1. Environment Variables in Netlify

In your Netlify dashboard, go to **Site Settings > Environment Variables** and add:

```
VITE_APP_NAME=Gestión Terapéutica
VITE_API_URL=https://your-backend-api.herokuapp.com/api
NODE_ENV=production
VITE_DEMO_MODE=false
```

**Important**: Replace `https://your-backend-api.herokuapp.com/api` with your actual backend URL.

### 2. Build Settings

**Build command**: `npm run build`  
**Publish directory**: `dist`  
**Node version**: `18` or higher

### 3. Redirects for React Router

Create a `_redirects` file in the `public` folder:

```
/*    /index.html   200
```

### 4. Headers for Security

Create a `_headers` file in the `public` folder for security headers.

### 5. Backend Requirements

Make sure your backend supports:
- CORS for `https://gestionterapeutica.netlify.app`
- HTTPS endpoints
- Video call endpoints: `/video/notify-patient`, `/video/active-invitations`, `/video/accept-invitation`, `/video/decline-invitation`
- JWT authentication

### 6. Features Included

✅ **Authentication System**
- Login/Register for patients and professionals
- JWT token handling
- Protected routes

✅ **Video Call Notifications**  
- Real-time notifications for patients
- Accept/decline functionality
- Professional can notify patients
- Twilio Video integration

✅ **Patient Management**
- Patient dashboard
- Appointment booking
- Personal diary
- Professional access

✅ **Responsive Design**
- Mobile-friendly interface
- Smooth animations with Framer Motion
- Toast notifications

### 7. Post-Deployment Checklist

- [ ] Test login/register functionality
- [ ] Test patient-professional video calls  
- [ ] Test notification system
- [ ] Test appointment booking
- [ ] Test on mobile devices
- [ ] Check console for any errors
- [ ] Verify HTTPS redirects work

## 🛠️ Development vs Production

### Development (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_DEMO_MODE=true
NODE_ENV=development
```

### Production (Netlify Environment Variables)
```env
VITE_API_URL=https://your-backend-api.herokuapp.com/api
VITE_DEMO_MODE=false
NODE_ENV=production
```

## 📱 Features Ready for Production

Your app includes:

1. **Complete Authentication Flow**
2. **Video Call System with Real-time Notifications**
3. **Patient and Professional Dashboards**  
4. **Responsive Design**
5. **Error Handling and Loading States**
6. **Toast Notifications**
7. **Protected Routes**

**Next Step**: Deploy to Netlify and update the backend URL in environment variables!