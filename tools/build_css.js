/* ==========================================================================
   FILE: tools/build_css.js
   DESCRIPTION: Production CSS bundler that concatenates and minifies all source CSS files into dist/style.min.css.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');


const SOURCES = [
    'css/main.css',
    'css/components/navbar.css',
    'css/components/landing.css',
    'css/components/archives.css',
    'css/components/about.css',
    'css/components/journey.css',
    'css/components/contact.css',
    'css/components/parallax.css',
    'css/components/modal.css',
    'css/components/depth-experience.css',
    'css/responsive.css',
];

const OUTPUT_REL = path.join('dist', 'style.min.css');


function minifyCss(input) {
    let out = '';
    let i = 0;
    const n = input.length;

    const BOUNDARY_BEFORE = new Set(['{', '}', ',', ';', '>', ')']);
    const BOUNDARY_AFTER = new Set(['{', '}', ',', ';', '>', ':', '(']);

    while (i < n) {
        const c = input[i];

        
        if (c === '/' && input[i + 1] === '*') {
            const isImportant = input[i + 2] === '!';
            const end = (function () {
                let k = i + 2;
                while (k < n && !(input[k] === '*' && input[k + 1] === '/')) k++;
                return k + 2;
            })();
            if (isImportant) {
                out += input.slice(i, end);
            }
            i = end;
            continue;
        }

        
        if (c === '"' || c === "'") {
            const quote = c;
            let j = i + 1;
            let s = c;
            while (j < n) {
                const ch = input[j];
                s += ch;
                j++;
                if (ch === '\\') { if (j < n) { s += input[j]; j++; } continue; }
                if (ch === quote) break;
            }
            out += s;
            i = j;
            continue;
        }

        
        if (/\s/.test(c)) {
            let j = i;
            while (j < n && /\s/.test(input[j])) j++;
            const prev = out[out.length - 1];
            const next = input[j];
            const keep =
                prev !== undefined && prev !== '(' &&
                next !== undefined && next !== ')' &&
                !BOUNDARY_AFTER.has(prev) &&
                !BOUNDARY_BEFORE.has(next);
            if (keep) out += ' ';
            i = j;
            continue;
        }

        
        if (BOUNDARY_BEFORE.has(c) && out[out.length - 1] === ' ') {
            out = out.slice(0, -1);
        }
        
        if (c === '(' && out[out.length - 1] === ' ') {
            out = out.slice(0, -1);
        }

        out += c;
        i++;
    }

    return out.trim();
}


function checkBalance(css) {
    let depth = 0;
    for (const ch of css) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth < 0) return false;
    }
    return depth === 0;
}


function main() {
    let combined = '';
    for (const rel of SOURCES) {
        const filePath = path.join(ROOT, rel);
        if (!fs.existsSync(filePath)) {
            console.error(`[build_css] Missing source: ${rel}`);
            process.exit(1);
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        const header = raw.split(/\r?\n/).slice(0, 1).join(' ');
        combined += `/*! src: ${rel} */\n` + raw + '\n\n';
    }

    const minified = minifyCss(combined);
    if (!minified) {
        console.error('[build_css] Build failed: output is empty.');
        process.exit(1);
    }
    if (!checkBalance(minified)) {
        console.error('[build_css] Build failed: unbalanced braces in minified output.');
        process.exit(1);
    }

    const outPath = path.join(ROOT, OUTPUT_REL);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, minified, 'utf8');

    console.log('[build_css] OK - ' + OUTPUT_REL);
    console.log('[build_css] Source CSS : ' + combined.length.toLocaleString() + ' chars (incl. comments)');
    console.log('[build_css] Bundle      : ' + minified.length.toLocaleString() + ' chars');
    console.log('[build_css] Reduction   : ' + Math.round((1 - minified.length / combined.length) * 100) + '%');
}

main();