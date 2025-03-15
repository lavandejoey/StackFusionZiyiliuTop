import "/typewriter-effect/dist/core.js";

document.addEventListener("DOMContentLoaded", () => {
    const lang = document.documentElement.lang || "en";
    const texts = {
        "en": [
            "I am <b>ZiYi Liu</b>",
            "I am <b>Zeniths</b> in <b>Yielding</b> Intelligence to Leverage Youthful Ideas"
        ],
        "fr": [
            "Je suis <b>ZiYi Liu</b>",
            "Je suis <b>Zeniths</b> in <b>Yielding</b> l'Intelligence pour Libérer les Idées Uniques"
        ]
    };
    const currentTexts = texts[lang] || texts["en"];

    const typewriter = new Typewriter('#typewriter-text', {
        loop: true,
        delay: 75,
        cursor: '|',
        autoStart: true,
        html: true
    });

    if (lang === "fr") {
        typewriter
            .typeString(currentTexts[0])
            .pauseFor(1500)
            .deleteChars(8) // Delete back to "I am"
            .pauseFor(100)
            .typeString(currentTexts[1].substring(8))
            .pauseFor(1500)
            .deleteAll()
            .pauseFor(1000)
            .start();
    } else {
        typewriter
            .typeString(currentTexts[0])
            .pauseFor(1500)
            .deleteChars(8) // Delete back to "Je suis"
            .pauseFor(100)
            .typeString(currentTexts[1].substring(5))
            .pauseFor(1500)
            .deleteAll()
            .pauseFor(1000)
            .start();
    }
});
