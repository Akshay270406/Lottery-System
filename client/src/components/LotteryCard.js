import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import Lottery from '../contracts/Lottery.json';

export const LotteryCard = ({ address, account, web3, refreshLotteries, filterMode, isAdminView }) => {
  const [contract, setContract] = useState(null);
  const [data, setData] = useState({
    name: '',
    ticketPrice: '0',
    deadline: '0',
    prize: '0',
    manager: '',
    winner: '0x0000000000000000000000000000000000000000',
    players: [],
    claimed: false
  });
  const [isWinner, setIsWinner] = useState(false);
  const [status, setStatus] = useState('Loading...');
  const [hasTicket, setHasTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);
  const [isPickingWinner, setIsPickingWinner] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [shouldDisplay, setShouldDisplay] = useState(true);
  const [error, setError] = useState('');
  const [isValidLottery, setIsValidLottery] = useState(false);
  // Function to reload lottery data
  const loadLotteryData = async () => {
    try {
      if (!contract) return;
      
      console.log(`Loading lottery data for ${address}...`);
      
      // Use Promise.all with individual try/catch blocks to prevent one failure from stopping all
      let name = null;
      let ticketPrice = '0';
      let deadline = '0';
      let prize = '0';
      let manager = null;
      let winner = '0x0000000000000000000000000000000000000000';
      let players = [];
      let claimed = false;
      
      try { name = await contract.methods.name().call(); } catch (e) { console.error("Error getting name:", e); }
      try { ticketPrice = await contract.methods.ticketPrice().call(); } catch (e) { console.error("Error getting ticketPrice:", e); }
      
      try { 
        deadline = await contract.methods.deadline().call();
        console.log("Raw deadline from contract:", deadline);
        // Convert BigInt to string if needed
        if (typeof deadline === 'bigint' || deadline.toString().includes('n')) {
          deadline = deadline.toString().replace('n', '');
        }
        console.log("Processed deadline:", deadline);
        console.log("Current timestamp:", Math.floor(Date.now() / 1000));
        console.log("Deadline as date:", new Date(parseInt(deadline) * 1000).toLocaleString());
      } catch (e) { 
        console.error("Error getting deadline:", e); 
      }
      
      try { prize = await contract.methods.prize().call(); } catch (e) { console.error("Error getting prize:", e); }
      try { manager = await contract.methods.manager().call(); } catch (e) { console.error("Error getting manager:", e); }
      try { winner = await contract.methods.winner().call(); } catch (e) { console.error("Error getting winner:", e); }
      try { players = await contract.methods.getPlayers().call(); } catch (e) { console.error("Error getting players:", e); players = []; }
      try { claimed = await contract.methods.claimed().call(); } catch (e) { console.error("Error getting claimed status:", e); }
      
      // Verify this is a valid lottery by checking if required fields exist
      if (!name || !deadline || !manager || !ticketPrice) {
        console.error(`Invalid lottery at ${address} - missing required fields`);
        setIsValidLottery(false);
        setShouldDisplay(false);
        setIsLoading(false);
        return;
      }
      
      setIsValidLottery(true);
      
      console.log(`Lottery data loaded:`, {
        name,
        ticketPrice,
        deadline,
        prize,
        manager,
        winner,
        playersCount: players ? players.length : 0,
        claimed
      });

      // Check if current account has a ticket
      const hasTicket = players && Array.isArray(players) && 
        players.some(player => player && player.toLowerCase() === account.toLowerCase());
      setHasTicket(hasTicket);

      // Check if current user is admin/manager
      const isCurrentUserAdmin = manager && account && 
        manager.toLowerCase() === account.toLowerCase();
      setIsAdmin(isCurrentUserAdmin);

      // Set lottery status
      const now = Math.floor(Date.now() / 1000);
      const deadlineTime = parseInt(deadline);
      
      let currentStatus;
      const hasWinner = winner && winner !== "0x0000000000000000000000000000000000000000";
      
      if (hasWinner) {
        currentStatus = claimed ? "Completed - Prize Claimed" : "Completed - Prize Available";
      } else if (now >= deadlineTime) {
        currentStatus = "Closed - Pending Winner Selection";
      } else {
        currentStatus = "Open - Accepting Tickets";
      }
      setStatus(currentStatus);

      // Check if current account is the winner
      if (winner && account) {
        setIsWinner(winner.toLowerCase() === account.toLowerCase());
      }
      
      // Apply filter logic - but only if not in admin view
      if (!isAdmin) {
        const isOpen = !hasWinner && now < (deadlineTime);
        const isClosed = hasWinner || now >= (deadlineTime);
        
        if (filterMode === 'open' && !isOpen) {
          setShouldDisplay(false);
        } else if (filterMode === 'closed' && !isClosed) {
          setShouldDisplay(false);
        } else {
          setShouldDisplay(true);
        }
      } else {
        // Always display valid lotteries in admin view
        setShouldDisplay(true);
      }
      
      setData({ 
        name: name || 'Unknown Lottery', 
        ticketPrice, 
        deadline, 
        prize, 
        manager, 
        winner, 
        players: players || [], 
        claimed
      });
      
      setError('');
    } catch (err) {
      console.error(`Error loading lottery data for ${address}:`, err);
      setError('Failed to load lottery data. This may not be a valid lottery contract.');
      setShouldDisplay(false);
      setIsValidLottery(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        
        if (!address || !web3) {
          console.error("Missing address or web3 instance");
          setIsLoading(false);
          setShouldDisplay(false);
          return;
        }
        
        const currentWeb3 = web3 || new Web3(window.ethereum);
        const instance = new currentWeb3.eth.Contract(Lottery.abi, address);
        setContract(instance);
        
        // Initial data load
        await loadLotteryData();
        
        setIsLoading(false);
      } catch (err) {
        console.error(`Error loading lottery at ${address}:`, err);
        setError(`Failed to load lottery: ${err.message}`);
        setIsLoading(false);
        setShouldDisplay(false);
        setIsValidLottery(false);
      }
    };

    if (address && account) {
      load();
    }
  }, [address, account, web3]);
  
  // Reload when filterMode changes
  useEffect(() => {
    if (contract) {
      loadLotteryData();
    }
  }, [filterMode]);

  const buyTicket = async () => {
    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }
    
    try {
      setIsBuying(true);
      console.log("Buying ticket for lottery:", data.name);
      console.log("Ticket price:", data.ticketPrice);
      console.log("Sender account:", account);
      
      // Send transaction to smart contract
      await contract.methods.buyTicket().send({ 
        from: account, 
        value: data.ticketPrice,
        gas: 300000 
      });
      
      alert("🎉 Ticket purchased successfully!");
      
      // Refresh lottery data
      await loadLotteryData();
      
      // Refresh all lotteries
      if (refreshLotteries) refreshLotteries();
    } catch (err) {
      console.error("Buy ticket error:", err);
      alert(`Failed to buy ticket: ${err.message || "Transaction failed"}`);
    } finally {
      setIsBuying(false);
    }
  };

  const pickWinner = async () => {
    try {
      setIsPickingWinner(true);
      console.log("Picking winner for lottery:", data.name);
      console.log("Manager account:", account);
      
      // Ensure we have players
      if (!data.players || data.players.length === 0) {
        alert("No players in this lottery. Cannot select a winner.");
        setIsPickingWinner(false);
        return;
      }
      
      // Ensure deadline has passed
      const now = Math.floor(Date.now() / 1000);
      if (now < parseInt(data.deadline)) {
        alert("Cannot pick winner before the deadline.");
        setIsPickingWinner(false);
        return;
      }
      
      // Call the smart contract's pickWinner method
      const tx = await contract.methods.pickWinner().send({ 
        from: account,
        gas: 500000 
      });
      
      console.log("Winner selection transaction:", tx);
      
      // Wait for transaction to complete and refresh data
      await loadLotteryData();
      
      // Show success alert with winner info
      const winnerAddress = await contract.methods.getWinner().call();
      alert(`🎉 Winner has been selected: ${winnerAddress.substring(0, 6)}...${winnerAddress.substring(38)}`);
      
      // Refresh all lotteries to update winner lists
      if (refreshLotteries) refreshLotteries();
    } catch (err) {
      console.error("Pick winner error:", err);
      alert(`Failed to pick winner: ${err.message}`);
    } finally {
      setIsPickingWinner(false);
    }
  };

  const claimPrize = async () => {
    try {
      setIsClaiming(true);
      
      if (data.claimed) {
        alert("Prize already claimed!");
        setIsClaiming(false);
        return;
      }
      
      console.log("Claiming prize for lottery:", data.name);
      console.log("Winner account:", account);
      
      // Send transaction to claim prize
      const receipt = await contract.methods.claimPrize().send({ 
        from: account,
        gas: 300000 
      });
      
      console.log("Prize claim transaction:", receipt);
      alert("🎉 Prize claimed successfully! Check your wallet balance.");
      
      // Update lottery data
      await loadLotteryData();
      
      // Refresh all lotteries
      if (refreshLotteries) refreshLotteries();
    } catch (err) {
      console.error("Claim prize error:", err);
      alert(`Failed to claim prize: ${err.message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  // Helper function to safely convert Wei to ETH
  const safeFromWei = (value) => {
    try {
      if (!value || value === '0' || value === 'undefined') return '0';
      const currentWeb3 = web3 || new Web3(window.ethereum);
      return currentWeb3.utils.fromWei(value.toString(), 'ether');
    } catch (err) {
      console.error("Error converting from Wei:", err);
      return '0';
    }
  };

  // Calculate if the deadline has passed
  const now = Math.floor(Date.now() / 1000);
  const deadlinePassed = parseInt(data.deadline) > 0 && now >= parseInt(data.deadline);
  console.log("pass", deadlinePassed);
  // Check if lottery is open (deadline not passed and no winner yet)
  const isOpen = !deadlinePassed && data.winner === '0x0000000000000000000000000000000000000000';
  
  // Check if lottery needs winner selection
  const needsWinnerSelection = isAdmin && 
                               deadlinePassed && 
                               data.winner === '0x0000000000000000000000000000000000000000' && 
                               data.players && 
                               data.players.length > 0;
  console.log(needsWinnerSelection)
  // Check if user is the winner and can claim prize
  const canClaimPrize = isWinner && 
                        data.winner !== '0x0000000000000000000000000000000000000000' && 
                        !data.claimed;

  if (isLoading) {
    return <div className="lottery-card loading">Loading lottery details...</div>;
  }
  
  // Don't render anything if this lottery shouldn't be displayed based on filter
  // or if it's not a valid lottery contract
  if (!shouldDisplay || !isValidLottery) {
    return null;
  }
  
  // Show error message if there was a problem loading this lottery
  if (error) {
    return null; // Don't show error cards, just skip them
  }

  return (
    <div className={`lottery-card ${status.toLowerCase().includes('completed') ? 'completed' : ''}`}>
      <h3>{data.name || 'Unknown Lottery'}</h3>
      <div className={`status-badge ${isOpen ? 'open' : 'closed'}`}>
        {status}
      </div>
      
      <div className="lottery-details">
        <p><b>Ticket:</b> {safeFromWei(data.ticketPrice)} ETH</p>
        <p><b>Prize Pool:</b> {safeFromWei(data.prize)} ETH</p>
        <p><b>Deadline:</b> {new Date(parseInt(data.deadline) * 1000).toLocaleString()}</p>
        <p><b>Participants:</b> {data.players?.length || 0}</p>
        {hasTicket && <p className="ticket-note">You have a ticket for this lottery</p>}
        {isAdmin && <p className="admin-note">You are the manager of this lottery</p>}
      </div>

      <div className="lottery-actions">
        {/* Buy Ticket button */}
        {isOpen && !hasTicket && (
          <button 
            className="primary-btn" 
            onClick={buyTicket} 
            disabled={isBuying}
          >
            {isBuying ? 'Processing...' : 'Buy Ticket'}
          </button>
        )}

        {/* Admin Pick Winner button */}
        {needsWinnerSelection && isAdmin && (
          <button 
            className="admin-btn" 
            onClick={pickWinner}
            disabled={isPickingWinner || !deadlinePassed}
          >
            {isPickingWinner ? 'Selecting...' : 'Pick Winner'}
          </button>
        )}

        {/* Winner info display */}
        {data.winner && data.winner !== '0x0000000000000000000000000000000000000000' && (
          <div className="winner-info">
            <p><b>Winner:</b> {data.winner.substring(0, 6)}...{data.winner.substring(38)}</p>
            {data.claimed 
              ? <p><b>Status:</b> Prize claimed</p>
              : <p><b>Status:</b> Prize available for claiming</p>
            }
            {isWinner && (
              <p className="winner-highlight">🏆 Congratulations! You are the winner! 🏆</p>
            )}
          </div>
        )}

        {/* Claim Prize button - show if current user is the winner and prize not claimed yet */}
        {canClaimPrize && (
          <button 
            className="claim-btn" 
            onClick={claimPrize}
            disabled={isClaiming}
          >
            {isClaiming ? 'Claiming...' : 'Claim Prize'}
          </button>
        )}
      </div>
    </div>
  );
};