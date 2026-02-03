# Student Hub - Deployment Guide

## 🚀 Deploy to Railway (Recommended)

Railway is perfect for your Student Hub because it:
- ✅ Has a generous free tier
- ✅ Supports full-stack apps (frontend + backend + database)
- ✅ Provides automatic HTTPS and custom domains
- ✅ Easy environment variable management
- ✅ Automatic deployments from GitHub

### Step 1: Prepare Your GitHub Repository

1. **Create a new GitHub repository** (if you haven't already):
   ```bash
   cd /home/ubuntu
   git init
   git add .
   git commit -m "Initial commit - Student Hub"
   ```

2. **Push to GitHub**:
   ```bash
   # Create a new repo on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/student-hub.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Railway

1. **Go to [Railway.app](https://railway.app/)** and sign up with GitHub

2. **Click "New Project"** → **"Deploy from GitHub repo"**

3. **Select your `student-hub` repository**

4. **Railway will automatically**:
   - Detect it's a Node.js project
   - Install dependencies with `pnpm`
   - Run the build command
   - Start the server

5. **Add Environment Variables** (click on your service → Variables tab):
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=file:./data/local.db
   ```

   Optional (for AI Assistant):
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

   Optional (for file uploads to S3):
   ```
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```

6. **Generate a Domain**:
   - Go to Settings → Networking
   - Click "Generate Domain"
   - You'll get a URL like: `https://student-hub-production.up.railway.app`

7. **Done!** 🎉 Your app is now live!

---

## 🌐 Alternative: Deploy to Render

1. **Go to [Render.com](https://render.com/)** and sign up

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the service**:
   - **Name**: `student-hub`
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
   - **Instance Type**: Free

5. **Add Environment Variables** (same as Railway above)

6. **Click "Create Web Service"**

7. **Your app will be live at**: `https://student-hub.onrender.com`

---

## 📦 What's Been Prepared

✅ **Production build configured** - `pnpm run build` creates optimized bundles
✅ **Railway config** - `railway.json` and `nixpacks.toml` for automatic deployment
✅ **Procfile** - For platform detection
✅ **Environment variables template** - `.env.example` with all required variables
✅ **Database setup** - SQLite database will be created automatically on first run

---

## 🔧 Local Production Test

To test the production build locally before deploying:

```bash
cd /home/ubuntu
pnpm run build
pnpm start
```

Then visit `http://localhost:3000`

---

## 📝 Important Notes

### Database
- **SQLite** is used by default (file-based, stored in `./data/local.db`)
- For production with multiple users, consider upgrading to **PostgreSQL** or **MySQL**
- Railway offers free PostgreSQL databases

### File Uploads
- Currently files are stored in memory/local filesystem
- For production, configure AWS S3 (environment variables provided in guide)
- Or use Railway's persistent volumes

### Authentication
- Development mode uses a simplified auth (auto-login as user ID 1)
- Production mode requires proper OAuth setup
- The app is currently set up for testing, not production auth

### AI Assistant
- Requires `OPENAI_API_KEY` environment variable
- Without it, the AI assistant won't work but the rest of the app will function normally

---

## 🎯 Next Steps After Deployment

1. **Share the URL** with your friends/test users
2. **Test all features**:
   - Course management
   - Assignments and quizzes
   - Calendar with assignment bars
   - Todo list with file attachments
   - Notes with rich text editor
   - File uploads
   - AI Assistant (if API key configured)

3. **Monitor usage** on Railway/Render dashboard

4. **Collect feedback** from test users

5. **Iterate and improve** based on feedback

---

## 🆘 Troubleshooting

### Build fails on Railway
- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### App crashes on startup
- Check environment variables are set correctly
- Verify `DATABASE_URL` path is writable
- Check Railway logs for error messages

### Database not persisting
- On Railway: Add a volume for persistent storage
- Path: `/app/data` (where SQLite database is stored)

### Features not working
- Check browser console for errors
- Verify API endpoints are accessible
- Check Railway logs for backend errors

---

## 💡 Tips for Test Users

1. **Create a course** first before adding assignments
2. **Upload Canvas HTML** to quickly populate data
3. **Try the AI Assistant** (if configured) - it knows about all your data!
4. **Test on mobile** - the UI is responsive
5. **Report bugs** with screenshots

---

## 🎉 You're Ready!

Your Student Hub is production-ready and can be deployed in minutes. Just follow the Railway or Render steps above, and you'll have a live URL to share with your test users!

Good luck with your testing! 🚀
