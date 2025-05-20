// /StackFusionZiyiliuTop/frontend/src/pages/Contact.tsx
import React from 'react';
import PageHead from '@/components/PageHead';
import MainLayout from '@/components/MainLayout';
import ContactForm from '@/components/ContactForm';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGithub, faLinkedin, faWhatsapp, faInstagram} from "@fortawesome/free-brands-svg-icons";
import {useTranslation} from "react-i18next";

const Contact: React.FC = () => {
    const {t} = useTranslation();
    return (
        <MainLayout activePage="Contact">
            <PageHead
                title="Contact"
                description="Reach out via form or social links"
            />
            <div className="container-fluid flex-grow-1 d-flex justify-content-center align-items-center">
                <div className="container mt-3 px-3">
                    <div className="row d-flex justify-content-evenly">
                        {/* Left Column */}
                        <div className="col-md-5 my-auto d-flex flex-column align-items-stretch">
                            <h1 className="mb-2 text-center">{t('Hiiiiiiiii!')}</h1>
                            <h2 className="mb-3 mb-md-5 text-center">{t("I'm glad you're here!")}</h2>
                            <p className="text-center text-muted mb-4 fs-6 fs-md-5">
                                {t("Got questions, feedback, or want to connect? Reach out via my social media channels or email. Let's collaborate!")}
                            </p>
                            <div className="d-flex justify-content-evenly my-3">
                                <a href="https://github.com/lavandejoey" target="_blank" rel="noopener">
                                    <FontAwesomeIcon icon={faGithub} size="2x" style={{color: '#333'}}/>
                                </a>
                                <a href="https://www.linkedin.com/in/ziyi-liu-ai/" target="_blank" rel="noopener">
                                    <FontAwesomeIcon icon={faLinkedin} size="2x" style={{color: '#0077B5'}}/>
                                </a>
                                <a href="https://wa.me/330749976242" target="_blank" rel="noopener">
                                    <FontAwesomeIcon icon={faWhatsapp} size="2x" style={{color: '#25D366'}}/>
                                </a>
                                <a href="https://www.instagram.com/lavandecn/" target="_blank" rel="noopener">
                                    <FontAwesomeIcon icon={faInstagram} size="2x" style={{color: '#E4405F'}}/>
                                </a>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="d-none d-md-flex justify-content-center align-items-center col-md-2">
                            <hr className="bg-secondary my-0" style={{width: '2px', height: '80%'}}/>
                        </div>
                        <div className="d-block d-md-none col-12">
                            <hr className="bg-secondary"/>
                        </div>

                        {/* Right Column */}
                        <div className="col-md-5 my-auto">
                            <h4 className="mb-4 text-center">{t('or, start a chat ~')}</h4>
                            <ContactForm/>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

export default Contact;
