import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Mines } from './pages/Mines';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/mining" element={<Mines />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
