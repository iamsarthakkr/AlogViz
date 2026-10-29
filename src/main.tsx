// Authored by - Sarthak Kumar
//
// main: entry point. Loads the fonts and global CSS, and renders <App /> in StrictMode into #root
// (fails loudly if index.html is missing it).

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/montserrat';
import '@fontsource-variable/geist-mono';
import './index.css';
import App from './App';

const root = document.getElementById('root');
if (!root) {
    throw new Error('Root element #root not found in index.html');
}

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
