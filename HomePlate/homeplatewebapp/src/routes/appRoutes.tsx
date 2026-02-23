import { Routes, Route } from "react-router-dom";
import Home from "../pages/home";
import SignIn from "../pages/signin";
import SignUp from "../pages/signup";
import BuyerDashboard from "../pages/buyerPage";
import SellerDashboard from "../pages/sellerPage";

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
