import UploadPage from "./UploadPage.jsx";
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-inner">
          <span className="logo-icon">🏗️</span>
          <div>
            <h1 className="app-title">DDR Generator</h1>
            <p className="app-tagline">Detailed Diagnostic Report — AI Powered</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <UploadPage />
      </main>

      <footer className="app-footer">
        Built with Flask + Gemini AI · BuildSafe Engineering
      </footer>
    </div>
  );
}

export default App;