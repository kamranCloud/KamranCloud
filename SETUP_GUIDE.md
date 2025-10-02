# 🚀 Quick Setup Guide

## ✅ Project Status: 100% Complete!

Your Next.js application is **fully converted** and ready to run!

---

## 📦 Step 1: Install Dependencies

```bash
npm install
```

---

## 🔧 Step 2: Setup Environment Variables

Create `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` and add your Firebase credentials:

```env
# Firebase Configuration (Get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Google Drive API (for file uploads - optional for now)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-callback
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

**Note:** Google Drive credentials are only needed for the file upload feature in admin panel.

---

## 🏃 Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 🎯 What's Working

### ✅ Student Pages (Public)
- `/` - Homepage
- `/courses` - Browse courses
- `/courses/[courseId]` - Years
- `/courses/[courseId]/[yearId]` - Subjects
- `/courses/[courseId]/[yearId]/[subjectId]` - Chapters
- `/learn/...` - View content (videos/notes)

### ✅ Admin Pages
- `/admin` - Admin dashboard
- `/admin/add` - Add content
- `/admin/upload-notes` - Upload files to Google Drive
- `/admin/manage` - Manage course structure
- `/admin/all` - View all content

### ✅ API Routes (Work in Development!)
- `/api/google-upload` - Initialize file upload
- `/api/google-auth` - Get refresh token
- `/api/google-callback` - OAuth callback

---

## 📚 Quick Test

1. **Visit Homepage:** `http://localhost:3000`
2. **Browse Courses:** Click "Start Learning Journey"
3. **Admin Panel:** Go to `http://localhost:3000/admin`

---

## 🔥 Firebase Setup (If needed)

### Option 1: Use Existing Firebase Project
If you already have a Firebase project from oldbase, just copy the credentials to `.env.local`

### Option 2: Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable **Firestore Database**
4. Go to **Project Settings** → **General**
5. Scroll down to "Your apps" → Click Web app icon
6. Copy the config values to `.env.local`

### Firestore Security Rules (for testing)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ⚠️ DEVELOPMENT ONLY!
    }
  }
}
```

**⚠️ For production, add proper authentication!**

---

## 🐛 Common Issues

### Issue: "Firebase not configured"
**Solution:** Make sure all `NEXT_PUBLIC_FIREBASE_*` variables are in `.env.local`

### Issue: "Module not found"
**Solution:** Run `npm install` again

### Issue: API routes not working
**Solution:** API routes only work when dev server is running (`npm run dev`)

---

## 🚀 Deploy to Vercel

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# 2. Go to vercel.com
# 3. Import your repository
# 4. Add environment variables from .env.local
# 5. Deploy!
```

---

## 📖 Need More Help?

- **Full Documentation:** See `README.md`
- **Architecture:** See `PROJECT_ARCHITECTURE.md`
- **Migration Details:** See `MIGRATION_STATUS.md`

---

## 🎉 You're Ready!

Your complete educational platform is now running with Next.js! 

**All features from oldbase are working:**
- ✅ Course navigation
- ✅ Video/Notes display
- ✅ Admin content management
- ✅ Google Drive file uploads
- ✅ Beautiful UI with animations

**Enjoy!** 🚀 