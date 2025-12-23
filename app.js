// ===== PRESENTATION DATA =====
const slides = [
    {
        text: "Virtual Twin of the Production System\n\nGuide: how do we meet higher production rates?\nAnd how do we adapt our lines to aerospace & defense products?",
        media: null
    },
    {
        text: "The virtual twin of the production system brings everything together:\n• machines, their kinematics and programs;\n• operators and their skills;\n• work instructions;\n• material flows;\n• manufacturing methods;\n• automation resources.\nInside this virtual world, we deploy virtual companions.",
        media: "PSY 1"
    },
    {
        text: "Here's a concrete example:\nan aerospace & defense contract requires a 40% capacity increase on a critical assembly line.\nThe Virtual Twin allows multiple layout scenarios, optimizes cycle times, proposes new line-balancing strategies, validates operator movements in simulation and anticipates ergonomic risks.",
        media: "PSY 2"
    },
    {
        text: "The virtual companion supports work instructions updates and execution.",
        media: "PSY 3"
    },
    {
        text: "Now virtual meets real — this is Sense Computing.\nOn an assembly station, machine vision detects in real time\npotential errors, missing tools, or incorrect component orientation.\nThe operator receives contextual guidance in a hybrid virtual–real environment.",
        media: "PSY 4"
    },
    {
        text: "",
        media: "PSY 5"
    },
    {
        text: "The result?\nErrors are prevented before they happen,\nand know-how is captured and continuously capitalized in order to ensure the right level of productivity to address the A&D market.",
        media: "PSY Content"
    }
];

// ===== STATE MANAGEMENT =====
let currentSlide = -1; // Start at -1 to show intro
let activeMedia = null; // Track currently visible media

// ===== SUPABASE REAL-TIME SYNC =====
let supabaseClient = null;
let realtimeChannel = null;
let sessionId = null; // Current session ID
let isLocalAction = false; // Flag to prevent loops

// ===== SDK INTEGRATION =====
// Function to send visibility messages to the SDK platform
function toggleVisibility(actorName, visible) {
    console.log("toggleVisibility:", actorName, visible);
    window.parent.postMessage(JSON.stringify({
        action: "toggleVisibility",
        actor: actorName,
        visible: visible
    }), "*");
}

// Function to show 3D media
function showMedia(mediaName) {
    if (mediaName) {
        toggleVisibility(mediaName, true);
        activeMedia = mediaName;
        console.log(`Showing 3D object: ${mediaName}`);
    }
}

// Function to hide 3D media
function hideMedia(mediaName) {
    if (mediaName) {
        toggleVisibility(mediaName, false);
        console.log(`Hiding 3D object: ${mediaName}`);
    }
}

// Function to hide all media
function hideAllMedia() {
    const allMedia = ["PSY 1", "PSY 2", "PSY 3", "PSY 4", "PSY 5", "PSY Content"];
    allMedia.forEach(media => {
        toggleVisibility(media, false);
    });
    activeMedia = null;
    console.log("All 3D objects hidden");
}

// Function to hide AS IS Production only when presentation starts
function hideASISProduction() {
    toggleVisibility("AS IS Production", false);
    console.log("AS IS Production hidden");
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    initStars();
    await initSupabase();
    initPresentation();

    console.log("Production System Presentation loaded - SDK ready");
    console.log("Supabase Real-time sync enabled - User ID:", window.USER_ID);
});

// ===== STARS CREATION =====
function initStars() {
    const starsContainer = document.getElementById('stars');
    const starCount = 150;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        const size = Math.random() * 2 + 0.5;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        star.style.animationDuration = (Math.random() * 2 + 2) + 's';

        starsContainer.appendChild(star);
    }
}

// ===== PRESENTATION LOGIC =====
function initPresentation() {
    const nextBtn = document.getElementById('nextBtn');
    const textContent = document.getElementById('textContent');

    // Hide all PSY media at start (but NOT AS IS Production yet)
    hideAllMedia();

    // Show intro state
    setTimeout(() => {
        textContent.classList.add('show');
        nextBtn.classList.add('show');
    }, 300);

    // Next button click handler
    nextBtn.addEventListener('click', nextSlide);

    // Update progress
    updateProgress();
}

async function nextSlide() {
    // Update Supabase to sync with all clients
    if (!isLocalAction) {
        await updateSession({ current_slide: currentSlide + 1 });
    }

    nextSlideLocal();
}

function nextSlideLocal() {
    const textContent = document.getElementById('textContent');
    const slideText = textContent.querySelector('.slide-text');
    const nextBtn = document.getElementById('nextBtn');

    // Don't hide previous media - keep them visible!
    // Each new media adds to the scene

    // Move to next slide
    currentSlide++;

    // Check if presentation is complete
    if (currentSlide >= slides.length) {
        // End of presentation
        showEndScreen();
        return;
    }

    // Animate out current text
    textContent.classList.remove('show');
    textContent.classList.add('slide-out');

    setTimeout(() => {
        // Update text content
        const slide = slides[currentSlide];
        slideText.textContent = slide.text;

        // Show new media if present (without hiding previous ones)
        if (slide.media) {
            showMedia(slide.media);

            // Hide AS IS Production when showing PSY Content (last media)
            if (slide.media === "PSY Content") {
                hideASISProduction();
            }
        }

        // Animate in new text
        textContent.classList.remove('slide-out');
        textContent.classList.add('slide-in');

        setTimeout(() => {
            textContent.classList.remove('slide-in');
            textContent.classList.add('show');
        }, 100);

        // Update button text
        if (currentSlide === slides.length - 1) {
            nextBtn.querySelector('.btn-text').textContent = 'Finish';
        } else {
            nextBtn.querySelector('.btn-text').textContent = 'Continue';
        }

        // Update progress
        updateProgress();
    }, 500);
}

function showEndScreen() {
    const textContent = document.getElementById('textContent');
    const slideText = textContent.querySelector('.slide-text');
    const nextBtn = document.getElementById('nextBtn');

    // Animate out
    textContent.classList.remove('show');
    nextBtn.classList.remove('show');

    setTimeout(() => {
        slideText.innerHTML = '<strong>Thank you</strong><br>Presentation Complete';

        textContent.classList.add('show');

        // Change button to restart
        nextBtn.querySelector('.btn-text').textContent = 'Restart Presentation';
        nextBtn.querySelector('.btn-icon').textContent = '↻';
        nextBtn.onclick = restartPresentation;

        setTimeout(() => {
            nextBtn.classList.add('show');
        }, 500);
    }, 600);
}

async function restartPresentation() {
    // Update Supabase to sync with all clients
    if (!isLocalAction) {
        await updateSession({ current_slide: -1 });
    }

    restartPresentationLocal();
}

function restartPresentationLocal() {
    // Hide all media
    hideAllMedia();

    // Show AS IS Production again when restarting
    toggleVisibility("AS IS Production", true);

    // Reset state
    currentSlide = -1;

    // Reset button
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.querySelector('.btn-text').textContent = 'Start Presentation';
    nextBtn.querySelector('.btn-icon').textContent = '→';
    nextBtn.onclick = nextSlide;

    // Reset content
    const textContent = document.getElementById('textContent');
    const slideText = textContent.querySelector('.slide-text');
    slideText.textContent = '';

    // Update progress
    updateProgress();

    console.log("Presentation restarted");
}

function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    const total = slides.length;
    const current = Math.max(0, currentSlide + 1);
    const percentage = (current / total) * 100;

    // Simpler approach - directly set width via inline style
    const barFill = document.createElement('div');
    barFill.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: ${percentage}%;
        background: linear-gradient(90deg, #1976d2, #4da6ff);
        border-radius: 10px;
        transition: width 0.6s ease;
        box-shadow: 0 0 10px rgba(77, 166, 255, 0.8);
    `;

    // Clear and add new fill
    progressBar.innerHTML = '';
    progressBar.appendChild(barFill);

    // Update text
    progressText.textContent = `${current} / ${total}`;
}

// ===== SUPABASE INITIALIZATION =====
async function initSupabase() {
    // Initialize Supabase client using the global supabase object from CDN
    const { createClient } = supabase;
    supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    // Get or create the production presentation session (should be only one row)
    const { data, error } = await supabaseClient
        .from('production_presentation_session')
        .select('*')
        .single();

    if (error) {
        console.error('Error fetching Production presentation session:', error);
        return;
    }

    sessionId = data.id;
    console.log('Connected to Production presentation session:', sessionId);

    // Subscribe to real-time changes
    realtimeChannel = supabaseClient
        .channel('production_presentation_session_changes')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'production_presentation_session'
            },
            handleSessionUpdate
        )
        .subscribe();

    console.log('Production Real-time subscription active');

    // Don't auto-sync when first joining - user must be present from the start
    // If presentation is already in progress, new users will see the intro screen
    // and only sync when they see real-time updates (someone clicks Next)
    console.log('Current session state:', data.current_slide);
    if (data.current_slide > -1) {
        console.log('Presentation already in progress - waiting for real-time updates');
    }
}

// ===== SUPABASE SYNC FUNCTIONS =====
async function updateSession(updates) {
    const { error } = await supabaseClient
        .from('production_presentation_session')
        .update(updates)
        .eq('id', sessionId);

    if (error) {
        console.error('Error updating Production session:', error);
    }
}

function handleSessionUpdate(payload) {
    const newData = payload.new;
    console.log('Presentation session updated:', newData);

    // Sync to new slide
    if (newData.current_slide !== currentSlide) {
        syncToSlide(newData.current_slide);
    }
}

function syncToSlide(targetSlide) {
    // Set flag to prevent loop
    isLocalAction = true;

    // Only sync if moving forward by 1 (normal progression)
    // or going back to -1 (restart)
    const diff = targetSlide - currentSlide;

    if (diff === 1) {
        // Normal next slide progression
        nextSlideLocal();
    } else if (targetSlide === -1 && currentSlide !== -1) {
        // Restart to beginning
        restartPresentationLocal();
    }
    // Ignore other cases - user wasn't present from the start

    // Reset flag
    isLocalAction = false;
}
