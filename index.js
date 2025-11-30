/* LINKS: your provided profiles */
const LINKS = {
    linkedinProfile: "https://www.linkedin.com/in/dhyeylukhi90",
    githubProfile: "https://github.com/DhyeyLukhi"
};

/* DOM refs */
const linkedinBook = document.getElementById('linkedinBook');
const githubBook = document.getElementById('githubBook');
const bookModal = document.getElementById('bookModal');
const bookInner = document.getElementById('bookInner');
const closeBook = document.getElementById('closeBook');
const pageIndicator = document.getElementById('pageIndicator');

let currentPages = [];    // array of {title, url}
let currentIndex = 0;     // page number visible (0 means first page showing)
let activeBookType = null;

/* fetch helper with fallback */
async function fetchJsonWithFallback(path, fallback) {
    try {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) throw new Error('no');
        return await res.json();
    } catch (e) {
        return fallback;
    }
}

/* parse array element which may be "url,title" or just "url" */
function parseLineItem(item, defaultTitle) {
    if (!item) return { url: null, title: defaultTitle };
    if (typeof item !== 'string') return { url: item, title: defaultTitle };
    if (item.includes(',')) {
        const parts = item.split(',');
        const url = parts[0].trim();
        const title = parts.slice(1).join(',').trim() || defaultTitle;
        return { url, title };
    } else {
        return { url: item.trim(), title: defaultTitle };
    }
}

/* prepare pages for linkedin/github */
async function preparePages(type) {
    const pages = [];
    if (type === 'linkedin') {
        const fallback = {
            profile: LINKS.linkedinProfile,
            posts: [
                "https://www.linkedin.com/feed/update/sample-post-1,Sample Post One",
                "https://www.linkedin.com/feed/update/sample-post-2,Sample Post Two"
            ]
        };
        const data = await fetchJsonWithFallback('linkedin.json', fallback);

        pages.push({ title: "LinkedIn — Profile", url: data.profile || LINKS.linkedinProfile });

        const arr = Array.isArray(data.posts) ? data.posts : [];
        if (arr.length === 0) {
            pages.push({ title: "No posts", url: null });
        } else {
            arr.forEach((p, i) => {
                const parsed = parseLineItem(p, `Post ${i + 1}`);
                pages.push({ title: parsed.title, url: parsed.url });
            });
        }
    } else if (type === 'github') {
        const fallback = {
            profile: LINKS.githubProfile,
            repos: [
                "https://github.com/DhyeyLukhi/sample-repo-1,Sample Repo One",
                "https://github.com/DhyeyLukhi/sample-repo-2,Sample Repo Two"
            ]
        };
        const data = await fetchJsonWithFallback('github.json', fallback);

        pages.push({ title: "GitHub — Profile", url: data.profile || LINKS.githubProfile });

        const arr = Array.isArray(data.repos) ? data.repos : [];
        if (arr.length === 0) {
            pages.push({ title: "No repos", url: null });
        } else {
            arr.forEach((r, i) => {
                const parsed = parseLineItem(r, `Repository ${i + 1}`);
                pages.push({ title: parsed.title, url: parsed.url });
            });
        }
    }
    return pages;
}

/* build DOM pages and set dynamic stacking + offset */
function buildPagesDom(pages) {
    bookInner.innerHTML = '';
    const total = pages.length;
    for (let i = 0; i < total; i++) {
        const pg = pages[i];
        const el = document.createElement('div');
        el.className = 'book-page' + (i % 2 ? ' page-back' : '');
        el.dataset.page = i;
        // zIndex: first page should be on top (highest z) so subtract i
        el.style.zIndex = (total - i) + 100;
        // set x-offset visually (small offset per page)
        const offset = 0; // adjust as you like
        el.style.setProperty('--tx', `${offset}px`);

        el.innerHTML = `
      <div class="page-content">
        <h1>${escapeHtml(pg.title)}</h1>
        ${pg.url ? `<p><a href="${escapeAttr(pg.url)}" target="_blank" rel="noopener noreferrer">Open link</a></p>` : `<p>${escapeHtml(pg.url === null ? '—' : '')}</p>`}
      </div>
    `;
        bookInner.appendChild(el);
    }
}

/* escape helpers */
function escapeHtml(s) { if (!s) return ''; return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function escapeAttr(s) { if (!s) return ''; return String(s).replaceAll('"', '&quot;'); }

/* open book */
async function openBook(type) {
    activeBookType = type;
    currentIndex = 0;
    currentPages = await preparePages(type);
    buildPagesDom(currentPages);

    updatePagesVisual();
    updateIndicator();

    // Hide the specific book on shelf
    if (type === 'linkedin') linkedinBook.classList.add('hidden');
    if (type === 'github') githubBook.classList.add('hidden');

    bookModal.style.display = 'flex';
    bookModal.setAttribute('aria-hidden', 'false');

    // small entrance animation
    bookInner.style.transform = 'translateY(6px) scale(.98)';
    setTimeout(() => bookInner.style.transform = 'translateY(0) scale(1)', 10);
}

/* close */
function closeViewer() {
    bookModal.style.display = 'none';
    bookModal.setAttribute('aria-hidden', 'true');

    // Show the book again
    if (activeBookType === 'linkedin') linkedinBook.classList.remove('hidden');
    if (activeBookType === 'github') githubBook.classList.remove('hidden');

    activeBookType = null;
    currentPages = [];
    currentIndex = 0;
    bookInner.innerHTML = '';
}

/* update which pages are turned; pages keep their own dataset.page which is real page number */
function updatePagesVisual() {
    // Every book-page will check its dataset.page vs currentIndex
    const pages = Array.from(bookInner.querySelectorAll('.book-page'));
    pages.forEach(p => {
        const n = Number(p.dataset.page);
        if (n < currentIndex) {
            p.classList.add('turn');
        } else {
            p.classList.remove('turn');
        }
    });
}

/* indicator */
function updateIndicator() {
    pageIndicator.textContent = `${currentIndex + 1}`;
}

/* navigation */
function nextPage() {
    if (currentIndex < currentPages.length - 1) {
        currentIndex++;
        updatePagesVisual();
        updateIndicator();
    }
}
function prevPage() {
    if (currentIndex > 0) {
        currentIndex--;
        updatePagesVisual();
        updateIndicator();
    }
}

/* event wiring */
linkedinBook.addEventListener('click', () => openBook('linkedin'));
githubBook.addEventListener('click', () => openBook('github'));
closeBook.addEventListener('click', closeViewer);
bookModal.addEventListener('click', (e) => { if (e.target === bookModal) closeViewer(); });

/* keyboard nav (arrow keys still work) */
document.addEventListener('keydown', (e) => {
    if (bookModal.style.display === 'flex') {
        if (e.key === 'ArrowRight') nextPage();
        if (e.key === 'ArrowLeft') prevPage();
        if (e.key === 'Escape') closeViewer();
    }
});

/* place books on shelf (small helper, you can change CSS left/top to reposition) */
/* JS positioning removed in favor of CSS for responsiveness */

/* Photo Modal Logic */
const photoFrame = document.querySelector('.photo-frame');
const photoModal = document.getElementById('photoModal');
const closePhotoModal = document.getElementById('closePhotoModal');

function openPhotoModal() {
    photoModal.style.display = 'flex';
    // Force reflow
    photoModal.offsetHeight;
    photoModal.classList.add('active');
    photoFrame.classList.add('hidden');
}

function closePhotoModalFunc() {
    photoModal.classList.remove('active');
    photoFrame.classList.remove('hidden');
    setTimeout(() => {
        photoModal.style.display = 'none';
    }, 300);
}

photoFrame.addEventListener('click', openPhotoModal);
closePhotoModal.addEventListener('click', closePhotoModalFunc);
photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) closePhotoModalFunc();
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && photoModal.classList.contains('active')) {
        closePhotoModalFunc();
    }
});
