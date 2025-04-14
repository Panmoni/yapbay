import { useEffect } from "react";
import { useDynamicContext, getAuthToken } from "@dynamic-labs/sdk-react-core";

import './App.css';

function App() {
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    if (primaryWallet) {
      const token = getAuthToken();
      if (token) {
        console.log("JWT Token:", token); // Log the token here
      } else {
        console.error("No JWT token found after wallet connect!");
      }
    }
  }, [primaryWallet]);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Hello Vite + React!
        </p>
      </header>
    </div>
  );
}

export default App;