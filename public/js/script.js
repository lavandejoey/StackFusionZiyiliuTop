// Basic Colour Codes
const primary = '#606c38';
const secondary = '#283618';
const tertiary = '#fefae0';
const quaternary = '#dda15e';
const quinary = '#bc6c25';
const frameColor = '#ffc9b9';

/************************************************** Rough Notation **************************************************/
// import {annotate} from '../../node_modules/rough-notation/lib/rough-notation.esm.js';
import {annotate} from 'https://unpkg.com/rough-notation?module';

// Function to safely apply annotation if the element exists
function applyAnnotation(target, type, color) {
    if (target) {
        const annotation = annotate(target, {type, color});
        annotation.show();
    }
}

// Underline
const underline = document.querySelector('.underline');
applyAnnotation(underline, "underline", quaternary);
// Circle
const circle = document.querySelector('.circle');
applyAnnotation(circle, "circle", quaternary);
// Box
const box = document.querySelector('.box');
applyAnnotation(box, "box", quaternary);
// Highlight
const highlight = document.querySelector('.highlight');
applyAnnotation(highlight, "highlight", quaternary);
// Bracket
const bracket = document.querySelector('.bracket');
applyAnnotation(bracket, "bracket", quaternary);

// Select initial elements and info box
let copyToClipboardElements = document.querySelectorAll('.user-select-all');
const copyToClipboardInfo = document.querySelector('#copyInfoBox');


/************************************************** Copy to Clipboard **************************************************/
// Hide the info box initially
// copyToClipboardInfo.style.display = 'none';

// Function to handle the copy event
function handleCopyClick(event) {
    const text = event.target.innerText.trim();  // Trim whitespace from copied text
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard:', text);
        copyToClipboardInfo.style.display = 'block';
        copyToClipboardInfo.classList.remove('fade');

        // Trigger reflow to restart animation
        void copyToClipboardInfo.offsetWidth;

        // Add fade-out effect after 3 seconds
        setTimeout(() => {
            copyToClipboardInfo.classList.add('fade');
            setTimeout(() => {
                copyToClipboardInfo.style.display = 'none';
            }, 500);
        }, 3000);
    }).catch((err) => {
        console.error('Error copying to clipboard:', err);
    });
}

// Function to attach click event listeners to elements
function attachEventListeners() {
    copyToClipboardElements.forEach((element) => {
        element.removeEventListener('click', handleCopyClick);  // Prevent duplicate listeners
        element.addEventListener('click', handleCopyClick);
    });
}

// Attach listeners to initial elements
attachEventListeners();

// Update elements and reattach listeners when the DOM changes
const observer = new MutationObserver(() => {
    copyToClipboardElements = document.querySelectorAll('.user-select-all');
    attachEventListeners();
});

observer.observe(document.body, {subtree: true, childList: true});
