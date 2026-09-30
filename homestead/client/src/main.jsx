import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/auth.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Join from './pages/Join.jsx'
import Catalog from './pages/Catalog.jsx'
import Community from './pages/Community.jsx'
import Market from './pages/Market.jsx'
import ProposeTrade from './pages/ProposeTrade.jsx'
import Me from './pages/Me.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/community" element={<Community />} />
          <Route path="/market" element={<Market />} />
          <Route path="/trade/new" element={<ProposeTrade />} />
          <Route path="/me" element={<Me />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
