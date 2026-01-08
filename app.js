// app.js - Live transcription + AI + fallback
(() => {
  const toggleBtn = document.getElementById('toggleBtn');
  const transcriptEl = document.getElementById('transcript');
  const summaryEl = document.getElementById('summary');
  const summaryStyle = document.getElementById('summaryStyle');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const canvasPane = document.getElementById('canvasPane');
  const canvasEl = document.getElementById('canvas');
  const captureBtn = document.getElementById('captureBtn');
  const saveBtn = document.getElementById('saveBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  // Clean noisy transcript before sending to AI
  function cleanTextForAI(text) {
    return text
      .replace(/--- captured.*?---/gi, "")   // remove timestamps
      .replace(/\n+/g, " ")                 // collapse newlines
      .replace(/\s+/g, " ")                 // fix excess spaces
      .trim();
  }

  // ----------------- Fallback summarizer --------------------
  const STOPWORDS = new Set([
    'a','an','and','are','as','at','be','by','for','from','in','is','it','of','on',
    'or','that','the','this','to','was','with','will','we','you','i','they','he',
    'she','but','if','so','than','then','their','there','these','those'
  ]);

  function splitSentences(text) {
    return text.replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim()).filter(Boolean);
  }

  function tokenizeWords(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .split(/\s+/).filter(Boolean);
  }

  function scoreSentences(sentences) {
    const freq = Object.create(null);
    for (const s of sentences) {
      for (const w of tokenizeWords(s)) {
        if (!STOPWORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
      }
    }
    return sentences.map(s => {
      let score = 0;
      for (const w of tokenizeWords(s)) if (freq[w]) score += freq[w];
      const words = tokenizeWords(s).length || 1;
      return { s, score: score/Math.sqrt(words) };
    });
  }

  function localSummarize(text) {
    const sentences = splitSentences(text);
    if (!sentences.length) return "";
    const scored = scoreSentences(sentences);
    const best = scored.sort((a,b)=>b.score-a.score).slice(0,3).map(x=>x.s);
    return best.join(" ");
  }

  // ----------------- Speech Recognition --------------------
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    transcriptEl.textContent = "Your browser doesn't support speech recognition.";
    toggleBtn.disabled = true;
    return;
  }

  let recognition = null, listening = false, finalTranscript = "";

  function setBtn(state) {
    listening = state;
    toggleBtn.textContent = state ? "Stop Microphone" : "Start Microphone";
  }

  function initRecognition() {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setBtn(true);
    recognition.onend   = () => setBtn(false);

    recognition.onresult = e => {
      let interim = "";
      for (let i=e.resultIndex; i<e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      transcriptEl.textContent = finalTranscript + (interim ? "\n" + interim : "");
    };
  }

  function startListening() {
    if (!recognition) initRecognition();
    finalTranscript = "";
    transcriptEl.textContent = "Listening…";
    summaryEl.textContent = "";
    canvasPane.style.display = "block";
    try { recognition.start(); } catch(e){}
  }

  function stopListening() { if (recognition) recognition.stop(); }

  toggleBtn.addEventListener("click", () => listening ? stopListening() : startListening());

  // ----------------- Summarize Button --------------------
  async function generateSummary() {
    let raw = canvasEl.value.trim();
    let text = cleanTextForAI(raw);

    if (!text) {
      summaryEl.textContent = "Please capture transcript first.";
      return;
    }

    const style = summaryStyle.value || "concise";

    // 🔥 Try AI summarizer first
    try {
      summaryEl.textContent = "Summarizing using AI…";

      const resp = await fetch("http://127.0.0.1:5005/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style })
      });

      if (!resp.ok) throw new Error("AI not available");

      const data = await resp.json();
      summaryEl.textContent = data.summary || "AI returned no summary.";
      return;
    } 
    catch (err) {
      console.warn("AI offline → using fallback summarizer.", err);
    }

    // fallback
    summaryEl.textContent = "Summarizing (fallback)…";
    summaryEl.textContent = localSummarize(text);
  }

  summarizeBtn.addEventListener("click", generateSummary);

  // ----------------- Capture Transcript --------------------
  captureBtn.addEventListener("click", () => {
    const current = finalTranscript || transcriptEl.textContent || "";
    if (!current.trim()) {
      canvasEl.value += "\n[No transcript captured]\n";
    } else {
      canvasEl.value += `\n--- captured ${new Date().toLocaleString()} ---\n${current.trim()}\n`;
    }
    canvasEl.focus();
  });

  // ----------------- Save File --------------------
  saveBtn.addEventListener("click", () => {
    const text = canvasEl.value.trim();
    if (!text) return alert("Nothing to save.");

    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
  });

  downloadBtn.addEventListener("click", () => {
    const text = canvasEl.value.trim();
    if (!text) return alert("Nothing to download.");

    const blob = new Blob([text], { type:"text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
  });

})();
