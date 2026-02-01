import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Mines } from './pages/Mines/Mines';
import { Bingo } from './pages/Bingo/Bingo';
import { MemoryGame } from './pages/MemoryGame';
import { ColorTrading } from './pages/ColorTrading';
import { Wordle } from './pages/Wordle';
import { DotsAndBoxesGame } from './pages/DotsAndBoxes/Game';
import Faucets from './pages/Faucets/Faucets';
import { Plinko } from './pages/Plinko/Plinko';
import { Wheel } from './pages/Wheel/Wheel';
import Dice from './pages/Dice/Dice';
import { Keno } from './pages/Keno/Keno';
import { CoinToss } from './pages/CoinToss/CoinToss';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/mining" element={<Mines />} />
          <Route path="/games/bingo" element={<Bingo />} />
          <Route path="/games/plinko" element={<Plinko />} />
          <Route path="/games/memory" element={<MemoryGame />} />
          <Route path="/games/color-trading" element={<ColorTrading />} />
          <Route path="/games/wordle" element={<Wordle />} />
          <Route path="/games/dots-and-boxes" element={<DotsAndBoxesGame />} />
          <Route path="/games/wheel" element={<Wheel />} />
          <Route path="/games/dice" element={<Dice />} />
          <Route path="/games/keno" element={<Keno />} />
          <Route path="/games/coin-toss" element={<CoinToss />} />
          <Route path="/mining/faucets" element={<Faucets />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
