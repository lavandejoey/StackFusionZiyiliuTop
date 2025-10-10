// /frontend/src/components/MathJaxProvider.tsx
/**
 * MathJaxProvider.tsx
 * Provides a React context for MathJax configuration and rendering.
 * Fully supported by MathJax v3 with OpenAI and GitHub Copilot.
 */
// import React from 'react';
import React, {useRef, useEffect} from 'react';
import {MathJaxContext} from 'better-react-mathjax';

// MathJax configuration options
const config = {
    loader: {load: ['[tex]/color', '[tex]/mathtools']},
    tex: {
        packages: {'[+]': ['color', 'mathtools']},
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoreHtmlClass: 'no-mathjax',
        processHtmlClass: 'has-mathjax',
    },
    startup: {
        typeset: true,
    },
};

const MathJaxProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const w = window as any;
        const MJ = w?.MathJax;
        const root = rootRef.current;
        if (!MJ || !root) return;

        let scheduled = false;
        let disconnected = false;
        const observer = new MutationObserver(() => {
            if (scheduled || disconnected) return;
            scheduled = true;
            // batch multiple mutations
            queueMicrotask(async () => {
                if (!root) return;
                scheduled = false;
                // pause observing while MathJax mutates DOM to prevent loops
                disconnected = true;
                observer.disconnect();
                try {
                    await MJ.typesetPromise([root]);
                } catch {
                    // no-op
                } finally {
                    // resume observing
                    observer.observe(root, {childList: true, subtree: true});
                    disconnected = false;
                }
            });
        });

        // observe only within this provider
        observer.observe(root, {childList: true, subtree: true});

        return () => observer.disconnect();
    }, []);

    return (
        <MathJaxContext config={config}>
            {/* limit processing to this subtree */}
            <div ref={rootRef} className="has-mathjax">
                {children}
            </div>
        </MathJaxContext>
    );
};

export default MathJaxProvider;
