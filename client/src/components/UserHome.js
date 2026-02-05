import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { LotteryCard } from './LotteryCard';
import { WinnerList } from './WinnerList';

export const UserHome = ({ lotteries, account, web3, refreshLotteries }) => {
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    console.log("UserHome received lotteries:", lotteries);
  }, [lotteries]);
  
  // When filter changes, just use the original lottery list
  const changeFilter = (newFilter) => {
    setFilter(newFilter);
  };
  
  return (
    <div className="user-home">
      <div className="section-header">
        <h2>Available Lotteries</h2>
        <div className="filter-controls">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => changeFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'open' ? 'active' : ''} 
            onClick={() => changeFilter('open')}
          >
            Open
          </button>
          <button 
            className={filter === 'closed' ? 'active' : ''} 
            onClick={() => changeFilter('closed')}
          >
            Closed
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <p>Loading lotteries...</p>
        </div>
      ) : !lotteries || lotteries.length === 0 ? (
        <div className="no-lotteries">
          <p>No lotteries available at the moment.</p>
        </div>
      ) : (
        <div className="lottery-list">
          {lotteries.map((addr) => (
            <LotteryCard 
              key={addr} 
              address={addr} 
              account={account}
              web3={web3}
              refreshLotteries={refreshLotteries}
              filterMode={filter}
              isAdminView={false}
            />
          ))}
        </div>
      )}
      
      <WinnerList lotteries={lotteries} web3={web3} />
    </div>
  );
};