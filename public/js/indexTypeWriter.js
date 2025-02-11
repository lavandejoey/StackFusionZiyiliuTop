document.addEventListener("DOMContentLoaded", function () {
    const textElement = document.getElementById('typewriter-text');
    const cursorElement = document.getElementById("cursor");
    const lang = document.documentElement.lang || "en";
    const texts = {
        "en": "Zeniths in Yielding Intelligence to Leverage Youthful Ideas",
        "fr": "Zèle en Ymaginant l'Intelligence pour Libérer les Idées Uniques"
    };
    const currentText = texts[lang] || texts["en"];
    let letterIndex = 0;
    let typing = true; // Controls whether we are typing or deleting
    let typingInterval;
    let wrongLetterInserted = false;

    function typeWriter() {
        if (typing) {
            if (letterIndex < currentText.length) {
                let displayText = currentText.slice(0, letterIndex);
                // Simulate a wrong letter sometimes, except for the last letter and punctuation
                if (!wrongLetterInserted && Math.random() < 0.1 && letterIndex < currentText.length - 1) {
                    displayText += String.fromCharCode(97 + Math.floor(Math.random() * 26));
                    wrongLetterInserted = true;
                } else {
                    letterIndex++;
                    wrongLetterInserted = false;
                }
                textElement.innerHTML = displayText;
                updateCursorPosition();
            } else {
                typing = false;
                setTimeout(() => {
                    clearInterval(typingInterval);
                    setTimeout(startTyping, 1000); // Pause after finishing typing before starting deletion
                }, 1000);
            }
        } else {
            if (letterIndex > 0) {
                letterIndex--;
                textElement.innerHTML = currentText.slice(0, letterIndex);
                updateCursorPosition();
            } else {
                typing = true;
                setTimeout(() => clearInterval(typingInterval), 800);
            }
        }
    }

    function startTyping() {
        const randomDelay = Math.floor(Math.random() * (200 - 100 + 1)) + 100; // Random delay between 100ms and 200ms
        typingInterval = setInterval(typeWriter, randomDelay);
    }

    function blinkCursor() {
        setInterval(() => {
            cursorElement.style.visibility = cursorElement.style.visibility === "hidden" ? "visible" : "hidden";
        }, 500); // Cursor blink every 500ms
    }

    function updateCursorPosition() {
        const textRect = textElement.getBoundingClientRect();
        cursorElement.style.left = `${textRect.right}px`;
        cursorElement.style.top = `${textRect.top}px`;
    }

    startTyping();
    blinkCursor();
});