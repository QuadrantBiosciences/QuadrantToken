const dutchAuction = artifacts.require("./DutchAuction.sol");

const fs = require('fs');
const BN = require('bn.js');
const BigNumber = web3.BigNumber

 const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

module.exports = function(deployer) {

    return Migrate(deployer);

};
async function Migrate(deployer) {

    this.DutchAuction = await dutchAuction.at('0x28b291e74bce603004b52921ec9ad3ddb6f85e44');

    const weiToEth = 1000000000000000000

    const price_start = await this.DutchAuction.price_start.call();
    console.log('Sale price_start  ' + price_start);

    const price_constant = await this.DutchAuction.price_constant.call();
    console.log('Sale price_constant  ' + price_constant)

    const price_exponent = await this.DutchAuction.price_exponent.call();
    console.log('Sale price_exponent  ' + price_exponent)

    const wallet = await this.DutchAuction.wallet_address.call();
    console.log('Sale wallet ' + wallet);

    const owner = await this.DutchAuction.owner_address.call();
    console.log('Sale owner ' + owner);

  }
