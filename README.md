# Live Transcription + Professional Summary

A web application for real-time speech-to-text transcription with intelligent summarization. Record audio, view live transcripts, and generate professional summaries - all in your browser.

## ✨ Features

- 🎤 Live microphone transcription using Web Speech API
- 📝 Built-in local summarizer (no API keys required)
- 📋 Notes canvas for editing and annotations
- 💾 Export transcripts to desktop
- 🤖 Optional server-side or OpenAI integration

## 📋 Prerequisites & Requirements

Before running this project, ensure you have the following installed:

### Required Software

1. **Node.js (v14.0.0 or higher)**
   - Download: https://nodejs.org/
   - Verify installation: `node --version`
   - Also installs npm (Node Package Manager)

2. **Modern Browser**
   - Chrome/Chromium (recommended)
   - Edge
   - Firefox (limited support for Web Speech API)

### System Requirements
- Microphone access (for speech recognition)
- Minimum 100MB free disk space
- Internet connection (first-time npm install only)

## 🚀 Installation & Running the Project

### Step 1: Install Node.js
Download and install from https://nodejs.org/ (choose LTS version)

### Step 2: Clone the Repository
```bash
git clone https://github.com/1924Aditya/live-transcription-summarizer.git
cd live-transcription-summarizer
```

### Step 3: Install Dependencies
```bash
npm install
```
This installs all required packages listed in `package.json`

### Step 4: Run the Application

**Option A: Basic Local Server (Recommended)**
```bash
npm start
```
- Server runs on: `http://localhost:8000`
- Open in browser: `http://localhost:8000/index.html`

**Option B: Direct Browser (No Server)**
- Simply open `index.html` in your browser
- Note: Some features may be limited without a server

**Option C: With Summarization Server (Advanced)**

Terminal 1 (Static file server):
```bash
npm start
```

Terminal 2 (Summarization API server):
```bash
npm run start-server
```
- API runs on: `http://localhost:9000`
- Open app: `http://localhost:8000/index.html`
- Select "Server / LLM" option in the app for enhanced summaries

## 📖 How to Use the Application

Once the server is running and you've opened `http://localhost:8000/index.html`:

### Basic Workflow

1. **Allow Microphone Access**
   - Click "Start Microphone" button
   - Browser will ask for microphone permission
   - Click "Allow"

2. **Record Your Speech**
   - Speak naturally into your microphone
   - You'll see live transcription appearing in real-time

3. **Stop Recording**
   - Click "Stop Microphone" button
   - Summary will be generated automatically

4. **View Results**
   - Live transcript: Shows everything you said
   - Professional Summary: Auto-generated summary of your speech

5. **Optional: Edit & Save**
   - Click "Capture Transcript" to add to Notes Canvas
   - Edit text manually in the canvas
   - Click "Save to Desktop" to export as text file

### Summary Options

- **Style**: Choose from Professional, Executive, Action-focused, or Detailed
- **Length**: Short, Medium, or Long
- **Source**: Local (default) or Server (if running)

## 📦 Project Structure

```
├── index.html           # Main web app UI
├── app.js              # Core transcription & summarization logic
├── style.css           # Styling
├── mic.js              # Static file server
├── hf-server.js        # Optional summarization server
├── package.json        # Dependencies & npm scripts
└── README.md           # This file
```

## 🌐 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Chromium | ✅ Full | Recommended, all features work |
| Edge | ✅ Full | Chromium-based, all features work |
| Firefox | ⚠️ Limited | Web Speech API limited support |
| Safari | ❌ None | No Web Speech API support |

## 🔧 Troubleshooting

### Issue: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: Port 8000 already in use
**Solution:** Change port in `mic.js` file (line 5)

### Issue: Microphone not working
**Solution:** 
- Check browser permissions
- Ensure microphone is connected
- Try Chrome/Edge browser
- Check microphone isn't muted

### Issue: Summary not generating
**Solution:**
- Ensure you spoke clearly
- Try with longer audio (10+ seconds)
- Check browser console for errors (F12)

## 📝 Dependencies

All dependencies are listed in `package.json`:

```json
{
  "dependencies": {
    // No external npm dependencies required!
    // Pure Node.js HTTP server
  }
}
```

**Why no npm dependencies?**
- Frontend uses native Web Speech API (browser built-in)
- Backend uses Node.js built-in `http` module
- Minimal setup = fewer potential issues

## 🚀 Stopping the Server

Press `Ctrl+C` in the terminal where `npm start` is running.

## 📄 License

MIT License - Free to use and modify

## 🤝 Contributing

Feel free to fork and submit pull requests for improvements!
