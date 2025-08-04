import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { performSystemStartupCleanup } from './utils/systemCleanup'

// Clean system before startup
performSystemStartupCleanup();

createRoot(document.getElementById("root")!).render(<App />);
