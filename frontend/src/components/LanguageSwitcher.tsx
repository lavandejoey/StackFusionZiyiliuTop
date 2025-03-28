// /StackFusionZiyiliuTop/frontend/src/components/LanguageSwitcher.tsx
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Dropdown} from "react-bootstrap";
import {faLanguage} from "@fortawesome/free-solid-svg-icons";

function LanguageSwitcher() {
    const languages = [
        {code: "en", label: "English"},
        {code: "fr", label: "Français"},
        {code: "zh-CN", label: "简体中文"},
        {code: "zh-HK", label: "繁體中文"},
    ];

    return (
        <Dropdown className="d-flex justify-content-center align-items-center mx-auto" style={{width: 100}}>
            <Dropdown.Toggle
                variant="outline-primary"
                className="no-caret d-flex align-items-center justify-content-center"
                style={{width: "100%", height: "100%"}}
                aria-label="Language Switcher"
            >
                <FontAwesomeIcon icon={faLanguage} size={"xl"}/>
            </Dropdown.Toggle>

            <Dropdown.Menu align="end" style={{minWidth: 0, width: "auto", whiteSpace: "nowrap"}}>
                {languages.map((lang) => (
                    <Dropdown.Item
                        key={lang.code}
                        className="d-flex justify-content-center"
                        href={`?lang=${lang.code}`}
                    >
                        {lang.label}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default LanguageSwitcher;
