// /StackFusionZiyiliuTop/frontend/src/App.tsx
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Home from "@/pages/Home.tsx";
import AboutMe from "@/pages/AboutMe";
// import Contact from "@/pages/Contact";

const App = () => (
    <Router>
        <Routes>
            <Route path="/" element={<Home/>}/>
            <Route path="/about-me" element={<AboutMe/>}/>
            {/*<Route path="/contact" element={<Contact />} />*/}
        </Routes>
    </Router>
);

export default App;

