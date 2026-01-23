import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Database from './pages/Database';
import AddSong from './pages/AddSong';
import SongDetail from './pages/SongDetail';
import Interactive from './pages/Interactive';
import AdminDashboard from './pages/AdminDashboard';
import LyricsPlayer from './pages/LyricsPlayer';
import AccessGate from './pages/AccessGate';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import { DataProvider } from './context/DataContext';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <UserProvider>
          <DataProvider>
              <HashRouter>
              <Layout>
                  <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/database" element={<Database />} />
                  <Route path="/add" element={<AddSong />} />
                  <Route path="/song/:id" element={<SongDetail />} />
                  <Route path="/interactive" element={<Interactive />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/payment-cancel" element={<PaymentCancel />} />
                  <Route path="/lyrics/:id" element={<LyricsPlayer />} />
                  <Route path="/access" element={<AccessGate />} />
                  </Routes>
              </Layout>
              </HashRouter>
          </DataProvider>
      </UserProvider>
    </LanguageProvider>
  );
};

export default App;
