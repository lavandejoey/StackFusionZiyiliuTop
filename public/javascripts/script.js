// Basic Colour Codes
const primary = '#606c38';
const secondary = '#283618';
const tertiary = '#fefae0';
const quaternary = '#dda15e';
const quinary = '#bc6c25';
const frameColor = '#ffc9b9';

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
applyAnnotation(underline, 'underline', quaternary);
// Circle
const circle = document.querySelector('.circle');
applyAnnotation(circle, 'circle', quaternary);
// Box
const box = document.querySelector('.box');
applyAnnotation(box, 'box', quaternary);
// Highlight
const highlight = document.querySelector('.highlight');
applyAnnotation(highlight, 'highlight', quaternary);
// Bracket
const bracket = document.querySelector('.bracket');
applyAnnotation(bracket, 'bracket', quaternary);