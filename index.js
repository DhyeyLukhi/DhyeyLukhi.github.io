/* Photo Modal Logic */
const photoFrame = document.querySelector('.photo-frame');
const photoModal = document.getElementById('photoModal');

function openPhotoModal() {
    photoModal.style.display = 'flex';
    // Force reflow to enable transition
    photoModal.offsetHeight;
    photoModal.classList.add('active');

    // Optional: Hide the original frame visually if desired, 
    // but usually keeping it there maintains layout stability. 
    // We can add a class to make it invisible if the user wants it to "move" entirely.
    photoFrame.style.opacity = '0';
    document.body.style.overflow = 'hidden'; // no-scroll
}

function closePhotoModal() {
    photoModal.classList.remove('active');
    photoFrame.style.opacity = '1';

    setTimeout(() => {
        photoModal.style.display = 'none';
        document.body.style.overflow = '';
    }, 300); // match transition duration
}

if (photoFrame) {
    photoFrame.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent immediate close
        openPhotoModal();
    });
}

if (photoModal) {
    photoModal.addEventListener('click', () => {
        closePhotoModal();
    });
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (photoModal.classList.contains('active')) closePhotoModal();
        if (bookModal.classList.contains('active')) closeViewer();
    }
});

/* Book Modal Logic */
const bookModal = document.getElementById('bookModal');
const bookInner = document.getElementById('bookInner');
const closeBook = document.getElementById('closeBook');
const books = document.querySelectorAll('.book');

let currentPages = [];    // array of {title, url, desc}
let currentIndex = 0;     // page number visible (0 means first page showing)

/* Helper: Escape HTML */
function escapeHtml(s) { if (!s) return ''; return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function escapeAttr(s) { if (!s) return ''; return String(s).replaceAll('"', '&quot;'); }

/* build DOM pages */
function buildPagesDom(pages) {
    // Clear content
    bookInner.innerHTML = '';

    // Note: We removed the close button. Adding escape/click-outside listeners was already handling close.

    const total = pages.length;
    for (let i = 0; i < total; i++) {
        const pg = pages[i];
        const el = document.createElement('div');
        el.className = 'book-page' + (i % 2 ? ' page-back' : '');
        el.dataset.page = i;
        // zIndex: first page should be on top (highest z)
        el.style.zIndex = (total - i) + 100;

        el.innerHTML = `
      <div class="page-content">
        <h1>${escapeHtml(pg.title)}</h1>
        ${pg.url ? `<a href="${escapeAttr(pg.url)}" target="_blank" rel="noopener noreferrer">Open Link</a>` : ''}
        <p>${escapeHtml(pg.desc)}</p>
        <div class="page-number">${i + 1}</div>
      </div>
    `;
        bookInner.appendChild(el);
    }
}

/* update which pages are turned */
function updatePagesVisual() {
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

function nextPage() {
    if (currentIndex < currentPages.length) { // allow turning last page to show empty back? Or stop at length-1?
        // Reference logic: if (currentIndex < currentPages.length - 1)
        // If we want to read the last page, we don't turn it away unless we want to close?
        // Let's stick to reference: stop at last page
        if (currentIndex < currentPages.length - 1) {
            currentIndex++;
            updatePagesVisual();
        }
    }
}

function prevPage() {
    if (currentIndex > 0) {
        currentIndex--;
        updatePagesVisual();
    }
}

async function openBook(file) {
    try {
        const response = await fetch(file);
        const pages = await response.json();

        if (Array.isArray(pages) && pages.length > 0) {
            currentPages = pages;
            currentIndex = 0;
            buildPagesDom(currentPages);
            updatePagesVisual();

            bookModal.style.display = 'flex';
            // Force reflow
            bookModal.offsetHeight;
            bookModal.classList.add('active'); // CSS opacity transition if any

            // tiny entrance animation
            bookInner.style.transform = 'translateY(6px) scale(.98)';
            setTimeout(() => bookInner.style.transform = 'translateY(0) scale(1)', 10);

            document.body.style.overflow = 'hidden';
        } else {
            console.error('No valid pages found');
        }
    } catch (err) {
        console.error('Failed to load book data:', err);
    }
}

function closeViewer() {
    bookModal.classList.remove('active');
    setTimeout(() => {
        bookModal.style.display = 'none';
        document.body.style.overflow = '';
        bookInner.innerHTML = ''; // Request to clear content
    }, 300);
}

/* Event Wiring */
books.forEach(book => {
    book.addEventListener('click', (e) => {
        e.stopPropagation();
        const file = book.dataset.file;
        if (file) openBook(file);
    });
});

/* Close on click outside */
bookModal.addEventListener('click', (e) => {
    // If clicking the modal background directly
    if (e.target === bookModal || e.target.classList.contains('book-scene')) {
        closeViewer();
    }
});

/* Tap Navigation */
bookInner.addEventListener('click', function (e) {
    // If clicking a link or close button, do nothing here
    if (e.target.closest('a') || e.target.closest('.close-btn')) return;

    const rect = bookInner.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const leftZone = width * 0.30;
    const rightZone = width * 0.70;

    if (x < leftZone) {
        prevPage();
    } else if (x > rightZone) {
        nextPage();
    }
});

/* Keyboard Navigation */
document.addEventListener('keydown', (e) => {
    if (bookModal.style.display === 'flex') {
        if (e.key === 'ArrowRight') nextPage();
        if (e.key === 'ArrowLeft') prevPage();
        if (e.key === 'Escape') closeViewer();
    }
});
