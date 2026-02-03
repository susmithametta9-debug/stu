# 🚀 Quick Deploy to Railway - 5 Minutes

## Prerequisites
- GitHub account
- Railway account (sign up free at https://railway.app)

## Step-by-Step (Copy & Paste)

### 1. Initialize Git Repository
```bash
cd /home/ubuntu
git init
git add .
git commit -m "Initial commit - Student Hub ready for deployment"
```

### 2. Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `student-hub`
3. Make it **Public** or **Private** (your choice)
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

### 3. Push to GitHub
```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/student-hub.git
git branch -M main
git push -u origin main
```

### 4. Deploy on Railway
1. Go to https://railway.app
2. Click **"Login"** → Sign in with GitHub
3. Click **"New Project"**
4. Click **"Deploy from GitHub repo"**
5. Select **"student-hub"** repository
6. Railway will automatically start building! ⚡

### 5. Configure Environment Variables (Optional but Recommended)
While it's building, click on your service, then go to **"Variables"** tab:

**Required:**
```
NODE_ENV=production
```

**Optional (for AI Assistant):**
```
OPENAI_API_KEY=sk-your-key-here
```

### 6. Get Your Public URL
1. Go to **"Settings"** tab
2. Click **"Networking"** section
3. Click **"Generate Domain"**
4. Copy your URL: `https://student-hub-production-xxxx.up.railway.app`

### 7. Share with Friends! 🎉
Your Student Hub is now live and accessible to anyone with the URL!

---

## ⚡ Even Faster: One-Click Deploy

Click this button to deploy directly:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/YOUR_USERNAME/student-hub)

*(Replace YOUR_USERNAME with your GitHub username after pushing to GitHub)*

---

## 🎯 What Your Test Users Can Do

1. **Create courses** and organize their academic life
2. **Add assignments and quizzes** with due dates
3. **Upload Canvas HTML files** to auto-populate data
4. **Take notes** with rich text formatting
5. **Manage todos** with file attachments and day-of-week organization
6. **View calendar** with assignment bars and course tabs
7. **Upload and organize files** by course
8. **Chat with AI Assistant** (if API key configured) about their coursework

---

## 📊 Monitor Your App

**Railway Dashboard:**
- View real-time logs
- Monitor resource usage
- See deployment history
- Check uptime

**Free Tier Limits:**
- $5 credit per month
- 500 hours of runtime
- 512 MB RAM
- 1 GB disk space

This is more than enough for testing with friends!

---

## 🐛 If Something Goes Wrong

**Check Railway Logs:**
1. Go to your project on Railway
2. Click on your service
3. Click "Deployments" tab
4. Click on the latest deployment
5. View logs for error messages

**Common Issues:**
- **Build fails**: Check that all files are committed to GitHub
- **App crashes**: Verify environment variables are set
- **Database errors**: Railway will create the database automatically on first run

---

## 💡 Pro Tips

1. **Custom Domain**: Railway lets you add your own domain (e.g., `studenthub.yourdomain.com`)
2. **Auto-Deploy**: Every time you push to GitHub, Railway automatically redeploys
3. **Rollback**: Can instantly rollback to previous deployments if something breaks
4. **Logs**: Real-time logs help debug issues quickly

---

## 🎉 You're Done!

Total time: **~5 minutes**

Now you have a live, production-ready Student Hub that you can share with anyone!

Share the URL and start collecting feedback! 🚀
