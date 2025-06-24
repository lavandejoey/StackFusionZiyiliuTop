// /frontend/src/components/MathJaxProvider.tsx
/**
 * MathJaxProvider.tsx
 * Provides a React context for MathJax configuration and rendering.
 * Fully supported by MathJax v3 with OpenAI and GitHub Copilot.
 */
import React from 'react';
import {MathJaxContext} from 'better-react-mathjax';

// MathJax configuration options
const config = {
    loader: {load: ['[tex]/color', '[tex]/mathtools']},
    tex: {
        packages: {'[+]': ['color', 'mathtools']},
        inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"]
        ],
        displayMath: [
            ["$$", "$$"],
            ["\\[", "\\]"]
        ],
        processEscapes: true,
        processEnvironments: true
    },
    options: {
        skipHtmlTags: [
            'script', 'noscript', 'style', 'textarea', 'pre', 'code'
        ],
        // Important: This ensures MathJax doesn't ignore content inside other HTML tags
        ignoreHtmlClass: 'no-mathjax',
        processHtmlClass: 'has-mathjax'
    },
    startup: {
        typeset: true
    }
};

interface MathJaxProviderProps {
    children: React.ReactNode;
}

const MathJaxProvider: React.FC<MathJaxProviderProps> = ({children}) => {
    return (
        <MathJaxContext config={config}>
            {children}
        </MathJaxContext>
    );
};

export default MathJaxProvider;
