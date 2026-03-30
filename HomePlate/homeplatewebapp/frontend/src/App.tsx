import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/LandingPage';
import SignIn from './pages/signin';
import SignUp from './pages/AuthPage';
import BuyerPage from './pages/CustomerDashboard';
import SellerPage from './pages/SellerDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/buyer" element={<BuyerPage />} />
        <Route path="/seller" element={<SellerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;