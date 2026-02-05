// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    string public name;
    uint public ticketPrice;
    uint public deadline;
    uint public prize;
    address public manager;
    address[] public players;
    address public winner;
    bool public claimed;

    constructor(
        string memory _name,
        uint _ticketPrice,
        uint _deadline,
        uint _prize,
        address _creator
    ) payable{ 
        require(_ticketPrice > 0, "Ticket price must be > 0");
        require(_prize > 0, "Prize must be > 0");
        require(_deadline > 0, "Duration must be > 0");
        name = _name;
        ticketPrice = _ticketPrice;
        deadline = _deadline;
        prize = _prize;
        manager = _creator;
    }

    function buyTicket() public payable {
        require(block.timestamp < deadline, "Lottery closed");
        require(msg.value == ticketPrice, "Incorrect ETH");
        require(winner == address(0), "Winner already selected");
        
        // Check if user already bought a ticket
        bool hasTicket = false;
        for (uint i = 0; i < players.length; i++) {
            if (players[i] == msg.sender) {
                hasTicket = true;
                break;
            }
        }
        require(!hasTicket, "You already bought a ticket");
        
        players.push(msg.sender);
    }

    function pickWinner() public {
        require(msg.sender == manager, "Only manager can pick winner");
        require(block.timestamp >= deadline, "Too early");
        require(players.length > 0, "No players");
        require(winner == address(0), "Winner already picked");

        // Generate a random index using a more secure approach
        uint index = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % players.length;
        winner = players[index];
        
        // Mark prize as not claimed yet, it will be claimed separately
        claimed = false;
    }
    
    function claimPrize() public {
        require(msg.sender == winner, "Only winner can claim");
        require(!claimed, "Prize already claimed");
        
        claimed = true;
        // Transfer the prize to the winner
        payable(winner).transfer(prize);
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    function getWinner() public view returns (address) {
        return winner;
    }
}

