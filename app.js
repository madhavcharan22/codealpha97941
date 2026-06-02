/**
 * LingoSphere - Premium Language Translation Application
 * Core Script Logic
 * Focuses on high performance, dynamic dropdowns, search capability, and robust API integration.
 */

// Comprehensive dictionary of 28 major international languages
const languages = {
    "en": { name: "English", flag: "🇺🇸" },
    "es": { name: "Spanish (Español)", flag: "🇪🇸" },
    "fr": { name: "French (Français)", flag: "🇫🇷" },
    "de": { name: "German (Deutsch)", flag: "🇩🇪" },
    "it": { name: "Italian (Italiano)", flag: "🇮🇹" },
    "pt": { name: "Portuguese (Português)", flag: "🇵🇹" },
    "ru": { name: "Russian (Русский)", flag: "🇷🇺" },
    "zh": { name: "Chinese (中文)", flag: "🇨🇳" },
    "ja": { name: "Japanese (日本語)", flag: "🇯🇵" },
    "ko": { name: "Korean (한국어)", flag: "🇰🇷" },
    "hi": { name: "Hindi (हिन्दी)", flag: "🇮🇳" },
    "te": { name: "Telugu (తెలుగు)", flag: "🇮🇳" },
    "ar": { name: "Arabic (العربية)", flag: "🇸🇦" },
    "bn": { name: "Bengali (বাংলা)", flag: "🇧🇩" },
    "tr": { name: "Turkish (Türkçe)", flag: "🇹🇷" },
    "vi": { name: "Vietnamese (Tiếng Việt)", flag: "🇻🇳" },
    "nl": { name: "Dutch (Nederlands)", flag: "🇳🇱" },
    "pl": { name: "Polish (Polski)", flag: "🇵🇱" },
    "sv": { name: "Swedish (Svenska)", flag: "🇸🇪" },
    "th": { name: "Thai (ไทย)", flag: "🇹🇭" },
    "uk": { name: "Ukrainian (Українська)", flag: "🇺🇦" },
    "el": { name: "Greek (Ελληνικά)", flag: "🇬🇷" },
    "he": { name: "Hebrew (עברית)", flag: "🇮🇱" },
    "id": { name: "Indonesian (Bahasa Indonesia)", flag: "🇮🇩" },
    "ms": { name: "Malay (Bahasa Melayu)", flag: "🇲🇾" },
    "fa": { name: "Persian (فارسی)", flag: "🇮🇷" },
    "ta": { name: "Tamil (தமிழ்)", flag: "🇮🇳" }
};

// Document Elements
const sourceDropdownWrapper = document.getElementById('source-dropdown-wrapper');
const sourceDropdownBtn = document.getElementById('source-dropdown-btn');
const sourceDropdownPanel = document.getElementById('source-dropdown-panel');
const sourceSearchInput = document.getElementById('source-search');
const sourceOptionsList = document.getElementById('source-options-list');

const targetDropdownWrapper = document.getElementById('target-dropdown-wrapper');
const targetDropdownBtn = document.getElementById('target-dropdown-btn');
const targetDropdownPanel = document.getElementById('target-dropdown-panel');
const targetSearchInput = document.getElementById('target-search');
const targetOptionsList = document.getElementById('target-options-list');

const sourceTextArea = document.getElementById('source-text');
const targetTextArea = document.getElementById('target-text');
const translateBtn = document.getElementById('translate-btn');
const swapBtn = document.getElementById('swap-btn');
const clearBtn = document.getElementById('clear-btn');
const charCounter = document.getElementById('char-counter');
const translationStatus = document.getElementById('translation-status');

// Current App States
let currentSourceLang = 'auto'; // Default: Auto-Detect
let currentTargetLang = 'es';   // Default: Spanish
let debounceTimer = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Populate Dropdown Menus
    buildCustomDropdowns();
    
    // Add Event Listeners
    setupDropdownEvents();
    setupTranslationEvents();
    
    // Initial trigger to update UI labels
    updateDropdownTriggerUI('source', 'auto');
    updateDropdownTriggerUI('target', 'es');
    setStatus('ready', 'Ready');
});

// Build Custom Dropdown HTML Elements
function buildCustomDropdowns() {
    // 1. Populate Source Dropdown (Includes Detect Language)
    sourceOptionsList.innerHTML = '';
    
    // Add "Detect Language" option at the top of source select
    const detectLi = createDropdownOptionItem('auto', 'Detect Language', '🌐', true);
    sourceOptionsList.appendChild(detectLi);
    
    // Add the rest of languages
    for (const [code, info] of Object.entries(languages)) {
        const li = createDropdownOptionItem(code, info.name, info.flag, false);
        sourceOptionsList.appendChild(li);
    }
    
    // 2. Populate Target Dropdown (Excludes Detect Language)
    targetOptionsList.innerHTML = '';
    for (const [code, info] of Object.entries(languages)) {
        const li = createDropdownOptionItem(code, info.name, info.flag, code === 'es');
        targetOptionsList.appendChild(li);
    }
}

// Helper to create an Option List Item Element
function createDropdownOptionItem(code, name, flag, isSelected) {
    const li = document.createElement('li');
    li.className = `dropdown-option${isSelected ? ' selected' : ''}`;
    li.dataset.value = code;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    
    li.innerHTML = `
        <div>
            <span class="option-flag">${flag}</span>
            <span class="option-text">${name}</span>
        </div>
        ${isSelected ? '<span class="option-check">✓</span>' : ''}
    `;
    
    return li;
}

// Event Listeners for Custom Dropdowns
function setupDropdownEvents() {
    // Source dropdown click toggler
    sourceDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(sourceDropdownWrapper);
        closeDropdown(targetDropdownWrapper);
        sourceSearchInput.focus();
    });
    
    // Target dropdown click toggler
    targetDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(targetDropdownWrapper);
        closeDropdown(sourceDropdownWrapper);
        targetSearchInput.focus();
    });
    
    // Prevent closing when typing in search input
    sourceSearchInput.addEventListener('click', (e) => e.stopPropagation());
    targetSearchInput.addEventListener('click', (e) => e.stopPropagation());
    
    // Dropdown Search Filtering
    sourceSearchInput.addEventListener('input', (e) => filterDropdownOptions('source', e.target.value));
    targetSearchInput.addEventListener('input', (e) => filterDropdownOptions('target', e.target.value));
    
    // Dropdown Selection handlers
    sourceOptionsList.addEventListener('click', (e) => {
        const option = e.target.closest('.dropdown-option');
        if (!option) return;
        
        const code = option.dataset.value;
        selectLanguage('source', code);
        closeDropdown(sourceDropdownWrapper);
    });
    
    targetOptionsList.addEventListener('click', (e) => {
        const option = e.target.closest('.dropdown-option');
        if (!option) return;
        
        const code = option.dataset.value;
        selectLanguage('target', code);
        closeDropdown(targetDropdownWrapper);
    });
    
    // Document global click to close open dropdown panels
    document.addEventListener('click', () => {
        closeDropdown(sourceDropdownWrapper);
        closeDropdown(targetDropdownWrapper);
    });
}

// Open or Close specific dropdown panel
function toggleDropdown(wrapper) {
    wrapper.classList.toggle('active');
    const isExpanded = wrapper.classList.contains('active');
    const trigger = wrapper.querySelector('.dropdown-trigger');
    trigger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
}

// Explicit close helper
function closeDropdown(wrapper) {
    wrapper.classList.remove('active');
    const trigger = wrapper.querySelector('.dropdown-trigger');
    trigger.setAttribute('aria-expanded', 'false');
    
    // Clear search filter after closing
    const searchInput = wrapper.querySelector('.dropdown-search');
    if (searchInput) {
        searchInput.value = '';
        const listItems = wrapper.querySelectorAll('.dropdown-option');
        listItems.forEach(item => item.classList.remove('hidden'));
    }
}

// Filter language list dynamically based on search string
function filterDropdownOptions(type, query) {
    const list = type === 'source' ? sourceOptionsList : targetOptionsList;
    const items = list.querySelectorAll('.dropdown-option');
    const cleanQuery = query.toLowerCase().trim();
    
    items.forEach(item => {
        const text = item.querySelector('.option-text').textContent.toLowerCase();
        const value = item.dataset.value.toLowerCase();
        
        if (text.includes(cleanQuery) || value.includes(cleanQuery)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// Handle actual selection update
function selectLanguage(type, code) {
    const list = type === 'source' ? sourceOptionsList : targetOptionsList;
    
    // Update selected styling in UI list
    const items = list.querySelectorAll('.dropdown-option');
    items.forEach(item => {
        const isSel = item.dataset.value === code;
        item.classList.toggle('selected', isSel);
        item.setAttribute('aria-selected', isSel ? 'true' : 'false');
        
        // Remove old checkmarks, append to the new one
        const check = item.querySelector('.option-check');
        if (check) check.remove();
        if (isSel) {
            const checkSpan = document.createElement('span');
            checkSpan.className = 'option-check';
            checkSpan.textContent = '✓';
            item.appendChild(checkSpan);
        }
    });
    
    // Update internal state variable
    if (type === 'source') {
        currentSourceLang = code;
    } else {
        currentTargetLang = code;
    }
    
    // Update trigger UI label
    updateDropdownTriggerUI(type, code);
    
    // Re-trigger translation if there is source text
    if (sourceTextArea.value.trim() !== '') {
        performTranslation();
    }
}

// Sync Dropdown Trigger button styling
function updateDropdownTriggerUI(type, code) {
    const btn = type === 'source' ? sourceDropdownBtn : targetDropdownBtn;
    const flagSpan = btn.querySelector('.selected-lang-flag');
    const textSpan = btn.querySelector('.selected-lang-text');
    
    if (code === 'auto') {
        flagSpan.textContent = '🌐';
        textSpan.textContent = 'Detect Language';
    } else {
        const info = languages[code];
        if (info) {
            flagSpan.textContent = info.flag;
            textSpan.textContent = info.name;
        }
    }
}

// Setup Translation core operations
function setupTranslationEvents() {
    // 1. Core trigger translation button
    translateBtn.addEventListener('click', () => {
        performTranslation(true); // force immediate translation, bypass debounce
    });
    
    // 2. Real-time automatic translation with smart Debounce
    sourceTextArea.addEventListener('input', () => {
        updateCharCount();
        
        // Clear previous timer
        if (debounceTimer) clearTimeout(debounceTimer);
        
        const text = sourceTextArea.value.trim();
        if (!text) {
            targetTextArea.value = '';
            setStatus('ready', 'Ready');
            return;
        }
        
        // Start smart 800ms debounce
        setStatus('ready', 'Typing...');
        debounceTimer = setTimeout(() => {
            performTranslation(false);
        }, 800);
    });
    
    // 3. Clear buttons
    clearBtn.addEventListener('click', () => {
        sourceTextArea.value = '';
        targetTextArea.value = '';
        updateCharCount();
        setStatus('ready', 'Ready');
        targetTextArea.classList.remove('translating-pulse');
        sourceTextArea.focus();
    });
    
    // 4. Swap button behavior
    swapBtn.addEventListener('click', handleLanguageSwap);
}

// Update character counter
function updateCharCount() {
    const currentLength = sourceTextArea.value.length;
    charCounter.textContent = `${currentLength} / 5000`;
}

// Status manager helper
function setStatus(state, message) {
    // Reset all state classes
    translationStatus.className = 'status-indicator';
    translationStatus.classList.add(state);
    
    const msgSpan = translationStatus.querySelector('.status-message');
    msgSpan.textContent = message;
}

// Main Core Translation Processor
async function performTranslation(force = false) {
    const text = sourceTextArea.value.trim();
    if (!text) {
        targetTextArea.value = '';
        setStatus('ready', 'Ready');
        return;
    }
    
    // If source and target languages are equal, no api call needed
    if (currentSourceLang === currentTargetLang) {
        targetTextArea.value = text;
        setStatus('success', 'Translated');
        return;
    }
    
    try {
        // Set loading states
        setStatus('loading', 'Translating...');
        targetTextArea.classList.add('translating-pulse');
        translateBtn.disabled = true;
        
        // Google Translate free REST API client endpoint
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${currentSourceLang}&tl=${currentTargetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Translation API HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Assemble final translation (combines multiple sentences or paragraphs returned as rows)
        let translatedText = '';
        if (data && data[0]) {
            data[0].forEach(row => {
                if (row[0]) {
                    translatedText += row[0];
                }
            });
        }
        
        if (translatedText) {
            targetTextArea.value = translatedText;
            setStatus('success', 'Translated');
        } else {
            throw new Error("Unable to parse API response structure.");
        }
        
    } catch (error) {
        console.error("LingoSphere Translation Failure:", error);
        targetTextArea.value = "Unable to process translation. Please check your network connection and try again.";
        setStatus('error', 'Translation Failed');
    } finally {
        targetTextArea.classList.remove('translating-pulse');
        translateBtn.disabled = false;
    }
}

// Swap languages logic
function handleLanguageSwap() {
    // Custom button click rotation micro-animation
    const svgIcon = swapBtn.querySelector('svg');
    svgIcon.style.transform = svgIcon.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';

    // If source is auto (Detect Language), we cannot easily swap since target cannot be auto.
    // In this case, we detect the current source text, or fall back:
    if (currentSourceLang === 'auto') {
        // Let's swap: source becomes the current target (e.g. Spanish) and target becomes English (or Spanish if current target is English)
        const oldTarget = currentTargetLang;
        const newTarget = oldTarget === 'en' ? 'es' : 'en';
        
        // Swap inputs
        const oldSourceText = sourceTextArea.value;
        const oldTargetText = targetTextArea.value;
        
        // Select languages
        selectLanguage('source', oldTarget);
        selectLanguage('target', newTarget);
        
        sourceTextArea.value = oldTargetText;
        targetTextArea.value = oldSourceText;
    } else {
        // Standard swap
        const oldSource = currentSourceLang;
        const oldTarget = currentTargetLang;
        const oldSourceText = sourceTextArea.value;
        const oldTargetText = targetTextArea.value;
        
        selectLanguage('source', oldTarget);
        selectLanguage('target', oldSource);
        
        sourceTextArea.value = oldTargetText;
        targetTextArea.value = oldSourceText;
    }
    
    updateCharCount();
    
    // Perform translation immediately
    if (sourceTextArea.value.trim() !== '') {
        performTranslation(true);
    }
}
