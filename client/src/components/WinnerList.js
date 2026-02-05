import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Lottery from '../contracts/Lottery.json';

export const WinnerList = ({ lotteries, web3 }) => {
  const [winners, setWinners] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to safely convert Wei to ETH
  const safeFromWei = (web3, value) => {
    try {
      if (!value || value === '0' || value === 'undefined') return '0';
      return web3.utils.fromWei(value.toString(), 'ether');
    } catch (err) {
      console.error("Error converting from Wei:", err);
      return '0';
    }
  };

  useEffect(() => {
    const loadWinners = async () => {
      if (!lotteries || lotteries.length === 0) return;
      
      setIsLoading(true);
      try {
        const currentWeb3 = web3 || new Web3(window.ethereum);
        
        const results = await Promise.all(
          lotteries.map(async (addr) => {
            try {
              if (!addr) return null;
              
              const instance = new currentWeb3.eth.Contract(Lottery.abi, addr);
              
              // Use try-catch for each contract call
              let name, winner, prize, claimed, deadline;
              
              try { name = await instance.methods.name().call(); } catch { name = 'Unknown Lottery'; }
              try { winner = await instance.methods.winner().call(); } catch { winner = '0x0000000000000000000000000000000000000000'; }
              try { prize = await instance.methods.prize().call(); } catch { prize = '0'; }
              try { claimed = await instance.methods.claimed().call(); } catch { claimed = false; }
              try { 
                deadline = await instance.methods.deadline().call();
                
                // Handle BigInt properly
                if (typeof deadline === 'bigint') {
                  deadline = deadline.toString();
                } else if (typeof deadline === 'string' && deadline.endsWith('n')) {
                  deadline = deadline.slice(0, -1);
                }
              } catch { deadline = '0'; }
              
              if (winner && winner !== "0x0000000000000000000000000000000000000000") {
                return { 
                  name: name || 'Unknown', 
                  winner, 
                  address: addr,
                  prize: safeFromWei(currentWeb3, prize),
                  claimed,
                  deadline
                };
              }
            } catch (err) {
              console.error(`Error loading lottery at ${addr}:`, err);
            }
            return null;
          })
        );
        
        // Filter out null results and sort by most recent
        const validWinners = results.filter(w => w !== null);
        setWinners(validWinners.reverse()); // Show most recent winners first
      } catch (err) {
        console.error("Error loading winners:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWinners();
  }, [lotteries, web3]);

  if (isLoading) {
    return (
      <div className="winner-section">
        <h2>Past Winners</h2>
        <p>Loading winners...</p>
      </div>
    );
  }

  return (
    <div className="winner-section">
      <h2>Past Winners</h2>
      {winners.length === 0 ? (
        <p>No winners yet</p>
      ) : (
        <ul className="winners-list">
          {winners.map((w, i) => (
            <li key={i} className={`winner-item ${w.claimed ? 'claimed' : 'unclaimed'}`}>
              <div className="winner-lottery">{w.name}</div>
              <div className="winner-address">
                Winner: {w.winner.substring(0, 6)}...{w.winner.substring(38)}
              </div>
              <div className="winner-prize">
                Prize: {w.prize} ETH {w.claimed ? '(Claimed)' : '(Unclaimed)'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};