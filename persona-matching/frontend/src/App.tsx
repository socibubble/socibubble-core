import { useState } from 'react';
import icon from './assets/icon.png';
import RegistryPage from './pages/RegistryPage';
import PersonaPage from './pages/PersonaPage';
import MatrixPage from './pages/MatrixPage';
import CalculatorPage from './pages/CalculatorPage';
import './App.css';

type View = 'menu' | 'registry' | 'persona' | 'matrix' | 'calculator';

function App() {
  const [currentView, setCurrentView] = useState<View>('menu');
  const showMenu = () => setCurrentView('menu');

  if (currentView === 'menu') {
    return (
      <div className="container">
        <img src={icon} alt="App Icon" style={{ width: '100px', marginBottom: '20px' }} />
        <div className="main-menu">
          <h1>Main Menu</h1>
          <button className="menu-button" onClick={() => setCurrentView('registry')}>
            User Registry System
          </button>
          <button className="menu-button" onClick={() => setCurrentView('persona')}>
            User Persona Tables
          </button>
          <button className="menu-button" onClick={() => setCurrentView('matrix')}>
            Persona Tables
          </button>
          <button className="menu-button" onClick={() => setCurrentView('calculator')}>
            User Persona Calculate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="app-view">
        {currentView === 'registry' && <RegistryPage onBack={showMenu} />}
        {currentView === 'persona' && <PersonaPage onBack={showMenu} />}
        {currentView === 'matrix' && <MatrixPage onBack={showMenu} />}
        {currentView === 'calculator' && <CalculatorPage onBack={showMenu} />}
      </div>
    </div>
  );
}

export default App;
