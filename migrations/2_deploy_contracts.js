const LotteryFactory = artifacts.require("LotteryFactory");

module.exports = function (deployer, network, accounts) {
  console.log("Deploying with:", accounts[0]);
  deployer.deploy(LotteryFactory, { from: accounts[0] });
};

