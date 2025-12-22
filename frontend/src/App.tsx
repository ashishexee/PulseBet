import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Mines } from './pages/Mines';
import Faucets from './pages/Faucets';
import Sports from './pages/Sports';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/mining" element={<Mines />} />
          <Route path="/mining/faucets" element={<Faucets />} />
          <Route path="/sports/betting" element={<Sports />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
