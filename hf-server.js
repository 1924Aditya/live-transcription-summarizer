#!/usr/bin/env node
// hf-server.js - small summarization server (POST /api/summarize)
// This is a simple, local summarizer service which mimics an LLM endpoint.
// It accepts JSON: { text, style, lengthKey } and returns { summary }.
// CORS headers are added so you can call it from the app served by `mic.js`.

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 9000;

const STOPWORDS = new Set([
	'a','an','and','are','as','at','be','by','for','from','in','is','it','of','on','or','that','the','this','to','was','with','will','we','you','i','they','he','she','but','if','so','than','then','their','there','these','those'
]);

function splitSentences(text) {
	return text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

function tokenizeWords(text) {
	return text.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
}

function scoreSentences(sentences) {
	const freq = Object.create(null);
	for (const s of sentences) {
		for (const w of tokenizeWords(s)) {
			if (STOPWORDS.has(w)) continue;
			freq[w] = (freq[w] || 0) + 1;
		}
	}
	return sentences.map(s => {
		let score = 0;
		for (const w of tokenizeWords(s)) if (freq[w]) score += freq[w];
		const words = tokenizeWords(s).length || 1;
		return { s, score: score / Math.sqrt(words) };
	});
}

function makeSummary(text, style = 'concise', lengthKey = 'medium') {
	const sentences = splitSentences(text);
	if (!sentences.length) return '';
	let count = lengthKey === 'short' ? 1 : lengthKey === 'long' ? 6 : 3;
	count = Math.min(Math.max(1, count), sentences.length);
	const scored = scoreSentences(sentences);
	const topByScore = scored.slice().sort((a,b) => b.score - a.score);

	function clean(s) { return s.trim().replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1'); }
	function sentenceToLine(s) { const t = clean(s); return t.charAt(0).toUpperCase() + t.slice(1).replace(/^["']/, ''); }
	function topSentences(n) { const chosen = topByScore.slice(0,n).slice().sort((a,b) => sentences.indexOf(a.s) - sentences.indexOf(b.s)); return chosen.map(x => x.s); }

	if (style === 'concise') {
		const n = Math.min(count, Math.max(1, Math.floor(count)));
		const parts = topSentences(n);
		if (parts.length === 1) return sentenceToLine(parts[0]);
		const first = sentenceToLine(parts[0]);
		const follow = parts.slice(1).map(sentenceToLine).join(' ');
		return first + (follow ? ' ' + follow : '');
	}

	if (style === 'executive') {
		const items = topSentences(count).map(s => {
			let line = sentenceToLine(s); if (line.length > 120) line = line.slice(0,117).trim() + '…'; return '• ' + line;
		});
		return items.join('\n');
	}

	if (style === 'action') {
		const actionKeywords = ['should','will','need','plan','recommend','follow','action','next','implement','assign','review','consider','start'];
		const candidates = topByScore.filter(t => actionKeywords.some(k => t.s.toLowerCase().includes(k)));
		const seeds = (candidates.length ? candidates : topByScore.slice(0, Math.max(1, count))).slice(0, Math.max(1, count));
		const actionBullets = seeds.map(x => '- ' + sentenceToLine(x.s));
		const stepBase = topByScore.slice(0, Math.min(3, sentences.length)).map(x => x.s);
		const nextSteps = [];
		for (const s of stepBase) {
			const short = sentenceToLine(s).replace(/\.$/, '');
			if (/\b(review|audit|check|inspect|verify)\b/i.test(short)) nextSteps.push('- Review and confirm: ' + short + '.');
			else if (/\b(plan|schedule|set up|organize)\b/i.test(short)) nextSteps.push('- Schedule a follow-up to: ' + short + '.');
			else if (/\b(assign|delegate|appoint)\b/i.test(short)) nextSteps.push('- Assign ownership for: ' + short + '.');
			else nextSteps.push('- Consider: ' + short + '.');
		}
		const uniqSteps = Array.from(new Set(nextSteps)).slice(0,3);
		return actionBullets.concat(['', 'Suggested next steps:']).concat(uniqSteps).join('\n');
	}

	if (style === 'detailed') {
		const desired = Math.min(5, Math.max(3, count));
		const parts = topSentences(desired);
		return parts.map(sentenceToLine).join(' ');
	}

	return topSentences(count).map(sentenceToLine).join(' ');
}

const server = http.createServer((req, res) => {
	const u = url.parse(req.url, true);
	// Allow CORS from any origin for local testing
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.writeHead(204); res.end(); return;
	}

	if (req.method === 'POST' && u.pathname === '/api/summarize') {
		let body = '';
		req.on('data', chunk => body += chunk);
		req.on('end', () => {
			try {
				const obj = JSON.parse(body || '{}');
				const { text, style, lengthKey } = obj;
				if (!text || typeof text !== 'string') {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ error: 'Missing text field' }));
					return;
				}
				const summary = makeSummary(text, style, lengthKey);
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ summary }));
			} catch (e) {
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ error: String(e) }));
			}
		});
		return;
	}

	// Not found
	res.writeHead(404, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => console.log(`Summarizer server listening on http://localhost:${PORT}`));

