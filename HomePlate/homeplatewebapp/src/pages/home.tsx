import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to HomePlate</h1>
      <p>Looking for homemade meals near you? Just few clicks away.. </p>
      <div style={styles.buttonContainer}>
      <button style={styles.button} onClick={() => navigate("/signin")}>Sign In</button>
      <button style={{ ...styles.button, backgroundColor: "#28a745" }} onClick={() => navigate("/signup")}>Sign Up</button>
    </div>
    </div>
  );
};
const styles: { [key: string]: React.CSSProperties } = {
  buttonContainer: {
    marginTop: "30px",
    display: "flex",
    justifyContent: "center",
    gap: "16px",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#1e90ff",
    color: "white",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
};

export default Home;
