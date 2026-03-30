import { Routes, Route } from "react-router-dom";
import Home from "../pages/LandingPage";
import SignIn from "../pages/signin";
import SignUp from "../pages/AuthPage";
import BuyerDashboard from "../pages/CustomerDashboard";
import SellerDashboard from "../pages/SellerDashboard";

const appRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/buyer" element={<BuyerDashboard />} />
      <Route path="/seller" element={<SellerDashboard />} />
    </Routes>
  );
};

export default appRoutes;
