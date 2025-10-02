# 🎓 Kamran's Playful Learn - Next.js Version

**Complete Educational Learning Platform** built with **Next.js 14**, **Firebase**, and **Google Drive API**.

---

## ✨ Features

- 📚 **Hierarchical Course Structure** - Course → Year → Subject → Chapter
- 🎥 **Video Lectures** - YouTube integration with thumbnails
- 📄 **Study Notes** - PDF/DOC files from Google Drive
- 👨‍💼 **Admin Dashboard** - Manage courses, upload content
- 🚀 **Next.js API Routes** - No separate backend needed
- 🎨 **Beautiful UI** - shadcn/ui components with Tailwind CSS
- ⚡ **Fast** - Optimized with Next.js App Router

---

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **Tanstack Query** - Data fetching

### Backend
- **Next.js API Routes** - Serverless functions
- **Firebase Firestore** - Database
- **Google Drive API** - File storage
- **Google OAuth 2.0** - Authentication for uploads

---

## 📁 Project Structure

```
kamrans-nextjs/
├── app/                           # Next.js App Router
│   ├── api/                       # API Routes (Serverless)
│   │   ├── google-auth/          # OAuth flow
│   │   ├── google-callback/      # OAuth callback
│   │   └── google-upload/        # File upload to Drive
│   ├── courses/                   # Student pages
│   │   ├── [courseId]/
│   │   │   ├── [yearId]/
│   │   │   │   ├── [subjectId]/
│   │   │   │   │   └── page.tsx  # Chapters
│   │   │   │   └── page.tsx      # Subjects
│   │   │   └── page.tsx          # Years
│   │   └── page.tsx              # Courses list
│   ├── learn/[...params]/        # Learning page (content view)
│   ├── admin/                     # Admin pages
│   │   ├── add/                   # Add content
│   │   ├── upload-notes/          # Upload to Drive
│   │   ├── manage/                # Manage structure
│   │   ├── all/                   # View all content
│   │   └── page.tsx               # Admin dashboard
│   ├── globals.css                # Global styles + theme
│   └── layout.tsx                 # Root layout
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── NavigationCard.tsx         # Course/Year/Subject cards
│   ├── ContentCard.tsx            # Video/Notes cards
│   ├── FloatingMath.tsx           # Animated background
│   └── DeveloperProfile.tsx       # Footer profile
├── lib/
│   ├── firebase.ts                # Firebase config
│   └── utils.ts                   # Utility functions
├── hooks/                         # Custom hooks
├── types/                         # TypeScript types
├── public/                        # Static assets
└── oldbase/                       # Original Vite+React code (reference)
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database**
3. Copy Firebase config from **Project Settings**
4. Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Setup Google Drive API (for file uploads)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Drive API**
4. Create **OAuth 2.0 Client ID** credentials:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/google-callback`
5. Add to `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-callback
```

### 4. Get Refresh Token

```bash
npm run dev
```

Visit: `http://localhost:3000/api/google-auth`

- Authorize with your Google account
- Copy the **Refresh Token**
- Add to `.env.local`:

```env
GOOGLE_REFRESH_TOKEN=1//your-refresh-token-here
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📝 Environment Variables

### Required (Frontend - NEXT_PUBLIC_ prefix)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Required (Backend - Server-side only)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_REFRESH_TOKEN`

---

## 🎯 Key Differences from Old Base (Vite + React)

### ✅ **FIXED: API Routes Work in Dev Mode**
- **Old**: Vercel serverless functions only worked in production
- **New**: Next.js API routes work perfectly in `npm run dev`

### ✅ **No More Vercel Backend Limits**
- **Old**: 10s timeout, 4.5MB payload limit
- **New**: Same limits but routes are testable locally

### ✅ **Better Routing**
- **Old**: React Router with manual configuration
- **New**: File-based routing (automatic)

### ✅ **Environment Variables**
- **Old**: `VITE_` prefix
- **New**: `NEXT_PUBLIC_` prefix for client-side

---

## 📦 Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Framework Preset: **Next.js**
4. Add environment variables (all from `.env.local`)
5. Update `GOOGLE_REDIRECT_URI` to production URL:
   ```
   GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/google-callback
   ```
6. Deploy!

### 3. Get Production Refresh Token

Visit: `https://your-app.vercel.app/api/google-auth`

- Copy the refresh token
- Add to Vercel environment variables
- Redeploy

---

## 🗂 Firebase Firestore Structure

```
courses/ (collection)
  └── {courseId} (document)
      ├── id: string
      ├── name: string
      ├── description: string
      ├── icon: string (emoji)
      ├── order: number
      └── years/ (subcollection)
          └── {yearId} (document)
              ├── id: string
              ├── name: string
              ├── description: string
              ├── icon: string
              ├── order: number
              └── subjects/ (subcollection)
                  └── {subjectId} (document)
                      ├── id: string
                      ├── name: string
                      ├── description: string
                      ├── icon: string
                      ├── order: number
                      └── chapters/ (subcollection)
                          └── {chapterId} (document)
                              ├── id: string
                              ├── name: string
                              ├── description: string
                              ├── order: number
                              └── content: array [
                                  {
                                    id: string
                                    type: 'video' | 'playlist' | 'notes'
                                    title: string
                                    url: string
                                    thumbnail?: string
                                    description?: string
                                  }
                                ]
```

---

## 🔧 Admin Pages (Migration Status)

Admin pages are copied from oldbase but need manual conversion. Here's the checklist:

### ✅ Completed
- [x] Main Admin Dashboard (`/admin`)
- [x] Project Structure Setup
- [x] API Routes (google-upload, google-auth, google-callback)
- [x] All Student Pages (/, /courses, /courses/[courseId], etc.)

### ⚠️ TODO: Convert Admin Pages (in `app/admin/`)

The admin pages are currently in `app/admin/` folder but need to be converted from React Router to Next.js:

1. **`AddContent.tsx`** → **`app/admin/add/page.tsx`**
   - Change `useNavigate()` to `useRouter()` from 'next/navigation'
   - Change `navigate('/path')` to `router.push('/path')`
   - Add `"use client"` at top

2. **`UploadNotes.tsx`** → **`app/admin/upload-notes/page.tsx`**
   - Same router changes
   - Add `"use client"`

3. **`ManageStructure.tsx`** → **`app/admin/manage/page.tsx`**
   - Same router changes
   - Add `"use client"`

4. **`AllContent.tsx`** → **`app/admin/all/page.tsx`**
   - Same router changes
   - Add `"use client"`

5. **`Admin.tsx`** → **`app/admin/page.tsx`**
   - Create simple dashboard with cards linking to above pages
   - Add `"use client"`

### Quick Conversion Pattern:

```typescript
// OLD (React Router)
import { useNavigate } from "react-router-dom";
const Component = () => {
  const navigate = useNavigate();
  // ...
  navigate('/admin/add');
}
export default Component;

// NEW (Next.js)
"use client";
import { useRouter } from "next/navigation";
export default function ComponentPage() {
  const router = useRouter();
  // ...
  router.push('/admin/add');
}
```

---

## 🎨 Theming & Design

The project uses **Google Doodle-inspired colors**:

- **Primary (Blue)**: `hsl(217 89% 61%)`
- **Secondary (Red)**: `hsl(4 90% 58%)`
- **Accent (Yellow)**: `hsl(45 100% 51%)`
- **Success (Green)**: `hsl(145 63% 42%)`

All colors are defined in `app/globals.css` using CSS variables.

---

## 📚 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🔥 Firebase Setup (Detailed)

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access
    match /{document=**} {
      allow read: if true;
    }
    
    // Admin write access (add authentication later)
    match /{document=**} {
      allow write: if true; // TODO: Add auth
    }
  }
}
```

### Firestore Indexes

Create composite indexes for sorting:

```json
{
  "indexes": [
    {
      "collectionGroup": "courses",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 🐛 Known Issues & Limitations

1. **No Authentication Yet** - Admin pages are public
2. **No Content Editing** - Can only add content, not edit/delete (via UI)
3. **Admin Pages Need Manual Conversion** - See TODO section above

---

## 🎯 Next Steps (Future Enhancements)

1. Add Firebase Authentication
2. Role-based access control (Admin/Student)
3. Content editing/deletion UI
4. Search & filter functionality
5. Student progress tracking
6. Video player embed (instead of external links)
7. Analytics dashboard

---

## 📞 Support

For issues or questions, contact the developer or check the `PROJECT_ARCHITECTURE.md` for detailed documentation.

---

## 📄 License

Private educational project.

---

**Built with ❤️ for Mathematics Education by Dr. Kamran Khan** 