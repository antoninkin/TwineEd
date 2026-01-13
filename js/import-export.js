// =====================================================
// IMPORT / EXPORT - TWINE FORMAT HANDLING
// =====================================================

import { esc, download } from './utils.js';

// =====================================================
// TWINE IMPORT PARSER
// =====================================================
export function parseTwine(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const storyData = doc.querySelector('tw-storydata');
    if (!storyData) return null;

    const title = storyData.getAttribute('name') || 'Imported';
    const startNode = storyData.getAttribute('startnode');
    const passages = {};
    let startPassage = 'Start';
    let i = 0;

    doc.querySelectorAll('tw-passagedata').forEach(p => {
        const name = p.getAttribute('name');
        const pos = p.getAttribute('position')?.split(',') || [100 + i * 200, 100];
        passages[name] = {
            name,
            content: p.textContent,
            x: parseInt(pos[0]) || 100 + i * 200,
            y: parseInt(pos[1]) || 100 + Math.floor(i / 4) * 150
        };
        if (p.getAttribute('pid') === startNode) startPassage = name;
        i++;
    });

    return { title, startPassage, passages };
}

// =====================================================
// PLAYABLE HTML EXPORT
// =====================================================
export function exportAsHtml(story) {
    const html = generatePlayableHtml(story);
    download(story.title + '.html', html);
}

function generatePlayableHtml(story) {
    const passages = story.passages || {};
    const passagesJson = JSON.stringify(passages);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(story.title)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: Georgia, 'Times New Roman', serif;
    background: linear-gradient(135deg, #1e1e3f 0%, #151529 100%);
    color: #e8e8f0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}
#story {
    max-width: 650px;
    background: rgba(45, 45, 90, 0.5);
    backdrop-filter: blur(10px);
    padding: 3rem;
    border-radius: 16px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    line-height: 1.9;
    font-size: 1.15rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
#story p { margin-bottom: 1.25rem; }
.link {
    color: #a78bfa;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.15s;
}
.link:hover { color: #c4b5fd; }
h1 {
    font-size: 1.75rem;
    margin-bottom: 2rem;
    color: #a78bfa;
    font-weight: normal;
}
</style>
</head>
<body>
<div id="story"></div>
<script>
const passages = ${passagesJson};
const startPassage = "${story.startPassage || 'Start'}";

function showPassage(name) {
    const p = passages[name];
    if (!p) {
        document.getElementById('story').innerHTML = '<p>Passage not found: ' + name + '</p>';
        return;
    }

    let content = p.content || '';
    content = content.replace(/\\[\\[([^\\]]+)\\]\\]/g, (match, inner) => {
        const parts = inner.split('|');
        const display = parts[0];
        const target = parts[1] || parts[0];
        return '<span class="link" onclick="showPassage(\\'' + target.replace(/'/g, "\\\\'") + '\\')">' + display + '</span>';
    });

    content = content.split('\\n\\n').map(p => '<p>' + p.replace(/\\n/g, '<br>') + '</p>').join('');
    document.getElementById('story').innerHTML = '<h1>${esc(story.title)}</h1>' + content;
}

showPassage(startPassage);
</script>
</body>
</html>`;
}

// =====================================================
// JSON EXPORT (for backup)
// =====================================================
export function exportAsJson(story) {
    const json = JSON.stringify(story, null, 2);
    download(story.title + '.json', json);
}

// =====================================================
// JSON IMPORT
// =====================================================
export function parseJson(content) {
    try {
        const data = JSON.parse(content);
        if (!data.title || !data.passages) return null;
        return {
            title: data.title,
            startPassage: data.startPassage || 'Start',
            passages: data.passages
        };
    } catch {
        return null;
    }
}
