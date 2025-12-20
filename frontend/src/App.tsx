import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Mines } from './pages/Mines';
import Faucets from './pages/Faucets';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/mining" element={<Mines />} />
          <Route path="/mining/faucets" element={<Faucets />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
