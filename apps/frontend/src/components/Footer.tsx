// /StackFusionZiyiliuTop/frontend/src/components/Footer.tsx
import React from "react";

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    return (
        <footer className="w-100 d-flex justify-content-center py-3 mt-auto" style={{color: 'gray', zIndex: 100}}>
            <div className="text-center">
                <p className="mb-0">
                    <a href="/auth" style={{textDecoration: 'none', color: 'gray'}}>
                        {`Copyright © 2021-${currentYear}`}
                    </a>
                    <a href="/" style={{textDecoration: 'none', color: 'gray'}}>
                        {' Ziyi LIU'}
                    </a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
