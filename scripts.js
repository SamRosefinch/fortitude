/* =========================================================
   CALISTHENICS COLLECTION LOG
   ========================================================= */

let currentPage = 0;

const totalPages = 18;

const STORAGE_PREFIX = 'calisthenics-progress-';

const PAGE_STORAGE_KEY =
    'calisthenics-current-page';


/* =========================================================
   MARKDOWN PAGE MAP
   ========================================================= */

const markdownPages = {

    7: 'content/milestones/part-1.md',

    8: 'content/milestones/part-2.md',

    9: 'content/milestones/part-3.md',

    10: 'content/milestones/part-4.md',

    11: 'content/milestones/part-5.md',

    12: 'content/challenges/easy.md',

    13: 'content/challenges/medium.md',

    14: 'content/challenges/hard.md',

    15: 'content/challenges/elite.md',

    16: 'content/challenges/master.md',

    17: 'content/challenges/grandmaster.md'

};


/* =========================================================
   LOCAL STORAGE KEYS
   ========================================================= */

function getProgressKey(id) {

    return STORAGE_PREFIX + id;

}


function getDateKey(id) {

    return STORAGE_PREFIX + id + '-date';

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

async function updatePage() {

    const pages =
        document.querySelectorAll('.print-page');

    const navLinks =
        document.querySelectorAll('.nav-link');


    pages.forEach((page, index) => {

        if (index === currentPage) {

            page.classList.add('active');

        } else {

            page.classList.remove('active');

        }

    });


    navLinks.forEach((link, index) => {

        if (index === currentPage) {

            link.classList.add('active');

        } else {

            link.classList.remove('active');

        }

    });


    document.getElementById('pageIndicator').innerText =
        `Page ${currentPage + 1} of ${totalPages}`;


    document.getElementById('prevBtn').disabled =
        currentPage === 0;


    document.getElementById('nextBtn').disabled =
        currentPage === totalPages - 1;


    localStorage.setItem(
        PAGE_STORAGE_KEY,
        currentPage
    );


    /*
     * Load Markdown only when that page is visited.
     */

    if (markdownPages[currentPage]) {

        await loadMarkdownPage(currentPage);

    }

}


/* =========================================================
   NEXT / PREVIOUS
   ========================================================= */

function nextPage() {

    if (currentPage < totalPages - 1) {

        currentPage++;

        updatePage();

    }

}


function prevPage() {

    if (currentPage > 0) {

        currentPage--;

        updatePage();

    }

}


function goToPage(index) {

    if (
        index < 0 ||
        index >= totalPages
    ) {

        return;

    }

    currentPage = index;

    updatePage();

}


/* =========================================================
   MARKDOWN LOADING
   ========================================================= */

async function loadMarkdownPage(pageIndex) {

    const page =
        document.querySelector(
            `.print-page[data-index="${pageIndex}"]`
        );


    if (!page) {

        return;

    }


    /*
     * Don't download the same Markdown file repeatedly.
     */

    if (page.dataset.loaded === 'true') {

        initializeDynamicContent(page);

        return;

    }


    const path = markdownPages[pageIndex];


    if (!path) {

        return;

    }


    /*
     * Loading state.
     */

    page.innerHTML = `
        <div class="loading-message">
            <div class="loading-spinner"></div>
            <p>Loading collection data...</p>
        </div>
    `;


    try {

        const response = await fetch(path);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status} — ${response.statusText}`
            );

        }


        const markdown =
            await response.text();


        /*
         * Marked converts Markdown into HTML.
         */

        page.innerHTML =
            marked.parse(markdown);


        page.dataset.loaded = 'true';


        /*
         * Restore saved checkbox state.
         */

        initializeDynamicContent(page);


    } catch (error) {

        console.error(
            `Unable to load ${path}`,
            error
        );


        page.innerHTML = `

            <div class="page-main-content">

                <h2>
                    Unable to Load Content
                </h2>

                <div class="callout error-callout">

                    <p>
                        The Markdown content could not be loaded.
                    </p>

                    <p>
                        <strong>File:</strong>
                        ${escapeHtml(path)}
                    </p>

                    <p>
                        If you are testing locally, make sure
                        you are running the project through a
                        local web server rather than opening
                        the HTML file directly with
                        <code>file://</code>.
                    </p>

                    <p>
                        <strong>Technical error:</strong>
                        ${escapeHtml(error.message)}
                    </p>

                </div>

            </div>

        `;

    }

}


/* =========================================================
   CHECKBOX INITIALIZATION
   ========================================================= */

function initializeDynamicContent(container) {

    const checkboxes =
        container.querySelectorAll(
            'input[type="checkbox"]'
        );


    checkboxes.forEach(checkbox => {

        loadCheckbox(checkbox);

        addCompletionMetadata(checkbox);

    });

}


/* =========================================================
   CHECKBOX PERSISTENCE
   ========================================================= */

function saveCheckbox(checkbox) {

    if (
        !checkbox ||
        !checkbox.id
    ) {

        return;

    }


    const progressKey =
        getProgressKey(checkbox.id);

    const dateKey =
        getDateKey(checkbox.id);


    if (checkbox.checked) {

        localStorage.setItem(
            progressKey,
            'true'
        );


        /*
         * Only create the completion date if one
         * doesn't already exist.
         */

        if (
            !localStorage.getItem(dateKey)
        ) {

            localStorage.setItem(
                dateKey,
                new Date().toISOString()
            );

        }

    } else {

        localStorage.setItem(
            progressKey,
            'false'
        );

        localStorage.removeItem(dateKey);

    }


    updateCompletionMetadata(checkbox);

}


/* =========================================================
   LOAD CHECKBOX
   ========================================================= */

function loadCheckbox(checkbox) {

    if (
        !checkbox ||
        !checkbox.id
    ) {

        return;

    }


    const savedState =
        localStorage.getItem(
            getProgressKey(checkbox.id)
        );


    if (savedState !== null) {

        checkbox.checked =
            savedState === 'true';

    }

}


/* =========================================================
   EVENT DELEGATION
   ========================================================= */

/*
 * This is important because the checkboxes don't exist
 * when doc1.html initially loads.
 *
 * They are created later when Markdown is converted
 * into HTML.
 */

document.addEventListener(
    'change',
    function(event) {

        if (
            event.target.matches(
                'input[type="checkbox"]'
            )
        ) {

            saveCheckbox(event.target);

        }

    }
);


/* =========================================================
   COMPLETION DATE
   ========================================================= */

function addCompletionMetadata(checkbox) {

    if (!checkbox.id) {

        return;

    }


    /*
     * Don't create duplicate metadata.
     */

    if (
        checkbox.parentElement.querySelector(
            `.completion-date[data-for="${checkbox.id}"]`
        )
    ) {

        updateCompletionMetadata(checkbox);

        return;

    }


    const metadata =
        document.createElement('span');


    metadata.className =
        'completion-date';


    metadata.dataset.for =
        checkbox.id;


    checkbox.parentElement.appendChild(
        metadata
    );


    updateCompletionMetadata(checkbox);

}


function updateCompletionMetadata(checkbox) {

    if (!checkbox.id) {

        return;

    }


    const metadata =
        checkbox.parentElement.querySelector(
            `.completion-date[data-for="${checkbox.id}"]`
        );


    if (!metadata) {

        return;

    }


    if (!checkbox.checked) {

        metadata.textContent = '';

        metadata.classList.remove(
            'completed'
        );

        return;

    }


    const savedDate =
        localStorage.getItem(
            getDateKey(checkbox.id)
        );


    if (!savedDate) {

        metadata.textContent = '';

        return;

    }


    const date =
        new Date(savedDate);


    if (Number.isNaN(date.getTime())) {

        metadata.textContent = '';

        return;

    }


    metadata.textContent =
        `Completed ${formatDate(date)}`;


    metadata.classList.add(
        'completed'
    );

}


/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatDate(date) {

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }
    ).format(date);

}


/* =========================================================
   CLEAR ALL PROGRESS
   ========================================================= */

function clearAllProgress() {

    const confirmed =
        window.confirm(
            'Are you sure you want to clear all milestone and challenge progress? This cannot be undone.'
        );


    if (!confirmed) {

        return;

    }


    /*
     * Remove all progress keys.
     */

    Object.keys(localStorage).forEach(key => {

        if (
            key.startsWith(
                STORAGE_PREFIX
            )
        ) {

            localStorage.removeItem(key);

        }

    });


    /*
     * Reset every checkbox currently loaded.
     */

    const checkboxes =
        document.querySelectorAll(
            'input[type="checkbox"]'
        );


    checkboxes.forEach(checkbox => {

        checkbox.checked = false;

        updateCompletionMetadata(
            checkbox
        );

    });


    /*
     * Return to the beginning.
     */

    currentPage = 0;

    updatePage();

}


/* =========================================================
   RESTORE LAST PAGE
   ========================================================= */

function loadSavedPage() {

    const savedPage =
        localStorage.getItem(
            PAGE_STORAGE_KEY
        );


    if (savedPage === null) {

        return;

    }


    const parsedPage =
        parseInt(savedPage, 10);


    if (
        !Number.isNaN(parsedPage) &&
        parsedPage >= 0 &&
        parsedPage < totalPages
    ) {

        currentPage = parsedPage;

    }

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* =========================================================
   KEYBOARD NAVIGATION
   ========================================================= */

document.addEventListener(
    'keydown',
    function(event) {

        /*
         * Don't hijack arrow keys while interacting
         * with form controls.
         */

        if (
            event.target.matches(
                'input, textarea, select, button'
            )
        ) {

            return;

        }


        if (
            event.key === 'ArrowRight'
        ) {

            nextPage();

        }


        if (
            event.key === 'ArrowLeft'
        ) {

            prevPage();

        }

    }
);


/* =========================================================
   APPLICATION STARTUP
   ========================================================= */

window.addEventListener(
    'DOMContentLoaded',
    function() {

        loadSavedPage();

        updatePage();

    }
);
