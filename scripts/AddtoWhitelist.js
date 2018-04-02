const DutchAuction = artifacts.require("./DutchAuction.sol");
const QuadrantToken = artifacts.require("./QuadrantToken.sol");

const fs = require('fs');
const BN = require('bn.js');
const BigNumber = web3.BigNumber

function weiToEther(n) {
    return new web3.BigNumber(web3.fromWei(n, 'ether'));
  }

 const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

module.exports = function(deployer) {

    return Migrate(deployer);

};
async function Migrate(deployer) {

  let usersConf = JSON.parse(fs.readFileSync('./conf/addWallets.json'));
 
  const wallets = [];
  const resident = [];
  const expiry = [];
  for (user in usersConf) {
    wallets.push(usersConf[user].address);
    resident.push(usersConf[user].resident);
    expiry.push(usersConf[user].expiry);
  }
 

//this.DutchAuction = await DutchAuction.at('0x56FF15657dE23AE5CDb20E2E7C67c4Dcd65C8e91');
this.QuadrantToken = await QuadrantToken.at('0x4f13c9d75803abdeee6416208df2030d800c9876');

await this.QuadrantToken.addToWhitelist(wallets,resident,expiry);
//console.log('isWhite listed  ' + await this.QuadrantToken.isWhitelisted('0xe84da28128a48dd5585d1abb1ba67276fdd70800'));

//console.log('User List  ' + JSON.stringify(await this.QuadrantToken.getUsers()));
console.log('User getWhitelist  ' + JSON.stringify(await this.QuadrantToken.getWhitelist()));
}