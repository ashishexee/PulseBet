import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Mines } from './pages/Mines/Mines';
import { MemoryGame } from './pages/MemoryGame';
import { ColorTrading } from './pages/ColorTrading';
import Faucets from './pages/Faucets/Faucets';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/mining" element={<Mines />} />
          <Route path="/games/memory" element={<MemoryGame />} />
          <Route path="/games/color-trading" element={<ColorTrading />} />
          <Route path="/mining/faucets" element={<Faucets />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
