module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      from: "0xd32dA7Ca1328165A5c721f6c7B55dBfb3829c233", // Match any network
    },
  },
  compilers: {
    solc: {
      version: "0.8.20",
    },
  },
};
