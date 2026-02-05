// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Lottery.sol";

contract LotteryFactory {
    address public admin;
    address[] public lotteries;
    
    event LotteryCreated(address lotteryAddress, string name);

    constructor() {
        admin = msg.sender;
    }

    function createLottery(
        string memory _name,
        uint _ticketPrice,
        uint _deadline,
        uint _prize
    ) external payable {
        require(msg.sender == admin, "Only admin can create lotteries");
        require(_ticketPrice > 0, "Ticket price must be greater than 0");
        require(_prize > 0, "Prize must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        require(msg.value >= _prize, "Must send enough ETH for the prize");
        
        // Create new lottery with explicit value parameter
        Lottery newLottery = new Lottery{value: _prize}(_name, _ticketPrice, _deadline, _prize, msg.sender);
        // Store the lottery address
        lotteries.push(address(newLottery));
        
        // Emit event
        emit LotteryCreated(address(newLottery), _name);
    }

    function getAllLotteries() external view returns (address[] memory) {
        return lotteries;
    }
    
    // Function to receive ETH
    receive() external payable {}
}