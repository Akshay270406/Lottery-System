
# Decentralized Lottery System

A decentralized lottery application built using Solidity, Truffle, Ganache, React, Web3.js, and MetaMask.

---

## Quick Setup Instructions

### 1. Clone the Project

```bash
git clone https://github.com/Lathika-Priya/lottery_system.git
cd lottery-system
```

### 2. Install Truffle Globally

```bash
npm install -g truffle
```

### 3. Install Backend & Frontend Dependencies

```bash
npm install
cd client
npm install
```

### 4. Start Ganache

- Open another terminal and run 
```bash
cd lottery-system
ganache
```


### 5. Compile and Deploy Smart Contracts

- Open another terminal and run
```bash
truffle compile
truffle migrate --network development
```

(Make sure Ganache is running.)

### 6. Connect MetaMask to Ganache

- Open MetaMask extension
- Add a new network:
  - Network Name: Localhost 8545
  - RPC URL: `http://127.0.0.1:8545`
  - Chain ID: `1337` 


-Change the REACT_APP_ADMIN in ../client/env/ as the address given in ganache 
-Import a Ganache account into MetaMask using the private key.(The private key of the same account in .env file)
-run this command 
```bash
Copy-Item -Path build\contracts\* -Destination client\src\contracts\
```
-Add more accounts for participants

### 7. Start the Frontend

```bash
cd client
npm start
```

Frontend will run at [http://localhost:3000](http://localhost:3000).

### 8. Ready to Play!

- Admin can create lotteries
- Users can buy tickets
- Admin can pick winners
- Results are automatically shown
- And fund will be automatically transferred
---

#  Quick Notes

- Web3 is initialized automatically with MetaMask.
- Ganache must be kept running during development.
- MetaMask account must match the admin address for creating/picking winners.

---
# Team Members
- Lathika Priya Eedubilli (230001026)
- Harshitha Goskula (230001027)
- Sai Babu (230001036)
- Devi Sri Prasad (230001015)
- Rishitha (230001028)
- Gnanika (230041007)
---
# Instructor
- Subhra Mazumdar

