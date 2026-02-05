import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import LotteryFactory from './contracts/LotteryFactory.json';
import { AdminPanel } from './components/AdminPanel';
import { UserHome } from './components/UserHome';
import './style.css';

function App() {
  const [account, setAccount] = useState('');
  const [factory, setFactory] = useState(null);
  const [lotteries, setLotteries] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        if (!window.ethereum) {
          setError("Please install MetaMask to use this dApp");
          setIsLoading(false);
          return;
        }
    
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3Instance.eth.getAccounts();
        const currentAccount = accounts[0];
        setAccount(currentAccount);
    
        const networkId = await web3Instance.eth.net.getId();
        console.log("Network ID:", networkId);
    
        const deployedNetwork = LotteryFactory.networks[networkId];
        if (!deployedNetwork) {
          setError("Contract not deployed on this network. Please switch to the correct network.");
          setIsLoading(false);
          return;
        }
      
        const instance = new web3Instance.eth.Contract(
          LotteryFactory.abi,
          deployedNetwork.address
        );
        setFactory(instance);
        
        const onChainAdmin = await instance.methods.admin().call();
        console.log("🔐 Admin from contract (on-chain):", onChainAdmin);
        console.log("🦊 Connected MetaMask account:", currentAccount);
        // Check if current account is the admin
        const adminAddress = process.env.REACT_APP_ADMIN;
        console.log("Admin address from env:", adminAddress);
        console.log("Current account:", currentAccount);
        
        // Check if the current account is the admin
        if (adminAddress && currentAccount && 
            adminAddress.toLowerCase() === currentAccount.toLowerCase()) {
          console.log("User is admin");
          setIsAdmin(true);
        } else {
          console.log("User is not admin");
          setIsAdmin(false);
        }
    
        // Fetch all lotteries
        await refreshLotteries(instance);
    
        // Listen for account changes
        window.ethereum.on("accountsChanged", async (accounts) => {
          const newAccount = accounts[0] || "";
          setAccount(newAccount);
          
          // Check admin status on account change
          if (adminAddress && newAccount && 
              adminAddress.toLowerCase() === newAccount.toLowerCase()) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          
          // Refresh lotteries when account changes
          await refreshLotteries(instance);
        });
        
        // Listen for network changes
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setError(`Failed to initialize: ${err.message}`);
        setIsLoading(false);
      }
    };
  
    init();
  }, []);
  
  const refreshLotteries = async (contractInstance = null) => {
    try {
      const instance = contractInstance || factory;
      if (instance) {
        console.log("Fetching all lotteries from factory contract...");
        const all = await instance.methods.getAllLotteries().call();
        console.log("Lotteries fetched:", all);
        
        // Verify the data is not empty or invalid
        if (!all || !Array.isArray(all)) {
          console.error("Invalid lottery data returned:", all);
          setError("Failed to load lotteries: Invalid data format");
          return;
        }
        
        // Filter out any invalid addresses (empty, null, etc.)
        const validLotteries = all.filter(addr => 
          addr && addr !== '0x0000000000000000000000000000000000000000'
        );
        
        console.log("Valid lotteries:", validLotteries);
        setLotteries(validLotteries);
      }
    } catch (err) {
      console.error("Error fetching lotteries:", err);
      setError(`Failed to load lotteries: ${err.message}`);
    }
  };
  return (
    <div className="app">
      <h1>Decentralized Lottery System</h1>
      
      {isLoading ? (
        <p>Loading application...</p>
      ) : (
        <>
          {error && <div className="error-message">{error}</div>}
          
          <div className="account-info">
            <p>Connected Wallet: {account || "Not connected"}</p>
            {isAdmin && <p className="admin-badge">Admin Account</p>}
          </div>

          {isAdmin && (
            <AdminPanel 
              factory={factory} 
              account={account} 
              web3={web3}
              refreshLotteries={refreshLotteries}
              lotteries={lotteries}
            />
          )}

          <UserHome 
            lotteries={lotteries} 
            account={account} 
            web3={web3}
            refreshLotteries={refreshLotteries}
          />
        </>
      )}
    </div>
  );
}

export default App;