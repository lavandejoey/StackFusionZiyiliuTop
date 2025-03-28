// /StackFusionZiyiliuTop/frontend/src/components/AnnotatedText.tsx
import React from "react";
import {RoughNotation} from "react-rough-notation";
import {types as roughNotationTypes} from "react-rough-notation/dist/RoughNotation/types";

interface AnnotatedTextProps {
    show: boolean;
    text: string;
    // 'underline' | 'box' | 'circle' | 'highlight' | 'strike-through' | 'crossed-off' | 'bracket'
    type?: roughNotationTypes
    color?: string;
}

const AnnotatedText: React.FC<AnnotatedTextProps> = ({text, type = "underline", color = "#dda15e", show}) => {
    return (
        <RoughNotation type={type} show={show} color={color}>
            {/* Render the text as HTML so any rich text (e.g. <b>) works */}
            <span dangerouslySetInnerHTML={{__html: text}}/>
        </RoughNotation>
    );
};

export default AnnotatedText;
