import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Lottery from '../contracts/Lottery.json';
import { LotteryCard } from './LotteryCard';

export const AdminPanel = ({ factory, account, web3, refreshLotteries, lotteries }) => {
  const [form, setForm] = useState({ name: '', ticketPrice: '', deadline: '', prize: '' });
  const [adminLotteries, setAdminLotteries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load lotteries managed by this admin
  useEffect(() => {
    const loadAdminLotteries = async () => {
      if (!factory || !account || !lotteries || lotteries.length === 0) return;

      try {
        setIsLoading(true);
        console.log("Loading admin lotteries for account:", account);
        console.log("All lotteries to check:", lotteries);

        const currentWeb3 = web3 || new Web3(window.ethereum);

        const adminOwnedLotteries = await Promise.all(
          lotteries.map(async (address) => {
            if (!address) return null;

            try {
              const lotteryContract = new currentWeb3.eth.Contract(Lottery.abi, address);
              const manager = await lotteryContract.methods.manager().call();

              if (manager.toLowerCase() === account.toLowerCase()) {
                return address;
              }
              return null;
            } catch (err) {
              console.error(`Error checking lottery at ${address}:`, err);
              return null;
            }
          })
        );

        const filteredLotteries = adminOwnedLotteries.filter(addr => addr !== null);
        setAdminLotteries(filteredLotteries);
      } catch (err) {
        console.error("Error loading admin lotteries:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminLotteries();
  }, [factory, account, web3, lotteries]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, ticketPrice, deadline, prize } = form;
    
    try {
      if (!name || !ticketPrice || !deadline || !prize) {
        alert("All fields are required.");
        return;
      }
    
      const ticketPriceWei = Web3.utils.toWei(ticketPrice, "ether");
      const prizeWei = Web3.utils.toWei(prize, "ether");
      
      // Calculate the deadline timestamp by adding the duration in seconds to the current time
      const now = Math.floor(Date.now() / 1000);
      const deadlineTimestamp = now + parseInt(deadline);
      
      console.log("Current timestamp:", now);
      console.log("Duration in seconds:", parseInt(deadline));
      console.log("Final deadline timestamp:", deadlineTimestamp);
      console.log("→ Sending createLottery from:", account);
      console.log("   Params:", { name, ticketPriceWei, deadlineTimestamp, prizeWei });
    
      // First get the current gas price from the network
      const networkGasPrice = await web3.eth.getGasPrice();
      console.log("Network gas price:", networkGasPrice);
      
      const receipt = await factory.methods
        .createLottery(name, ticketPriceWei, deadlineTimestamp, prizeWei)
        .send({ 
          from: account, 
          value: prizeWei,
          gasPrice: networkGasPrice, // Use the actual network gas price
          gas: 3000000 // Lower but still sufficient gas limit
        });
      
      console.log("Receipt:", receipt);
      // Check if LotteryCreated event exists
      if (receipt.events && receipt.events.LotteryCreated) {
        const event = receipt.events.LotteryCreated;
        const lotteryAddress = event.returnValues.lotteryAddress;
        const lotteryName = event.returnValues.name;
        console.log("✅ Lottery created at:", lotteryAddress);
        console.log("   Name:", lotteryName);
        alert(`🎉 Lottery "${name}" created successfully!`);
      } else {
        console.log("✅ Transaction successful but couldn't find LotteryCreated event");
        alert("🎉 Lottery created!");
      }
    
      setForm({ name: '', ticketPrice: '', deadline: '', prize: '' });
      refreshLotteries();
    } catch (err) {
      console.error("⛔ Full error object:", err);
    
      let reason = err.message;
      if (err?.data) {
        reason = err.data.message || JSON.stringify(err.data);
      }
    
      // Try to extract more specific error details
      if (reason.includes("execution reverted")) {
        const revertReason = err.reason || "Unknown reason";
        reason = `Transaction execution reverted: ${revertReason}`;
      }
    
      alert("❌ Transaction reverted: " + reason);
    }
  };
  
  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>

      <div className="create-lottery-section">
        <h3>Create New Lottery</h3>
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Lottery Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Ticket Price (ETH)"
            type="number"
            step="0.001"
            value={form.ticketPrice}
            onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
            required
          />
          <input
            placeholder="Deadline (in seconds from now)"
            type="number"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            required
          />
          <input
            placeholder="Prize (ETH)"
            type="number"
            step="0.001"
            value={form.prize}
            onChange={(e) => setForm({ ...form, prize: e.target.value })}
            required
          />
          <button type="submit">Create</button>
        </form>
      </div>
    </div>
  );
};