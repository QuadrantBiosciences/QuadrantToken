const DutchAuction = artifacts.require("./DutchAuction.sol");
const QuadrantToken = artifacts.require("./QuadrantToken.sol");

const fs = require('fs');
const BN = require('bn.js');

module.exports = function(deployer) {

    return Migrate(deployer);

};
async function Migrate(deployer) {

  let countriesConf = JSON.parse(fs.readFileSync('./conf/CountryRules.json'));
 
  const countries = [];
  const amounts = [];
  const bids = [];

  for (country in countriesConf) {
    countries.push(countriesConf[country].countryCode);
    amounts.push(countriesConf[country].minAmount);
    bids.push(countriesConf[country].maxBids);
  }
 

this.DutchAuction = await DutchAuction.at('0x52efde13ceab2b057878ecd9634e9b463b6445d8');

await this.DutchAuction.addUpdateCountriesRules(countries,amounts,bids);
console.log('getCountryRule  ' + JSON.stringify(await this.DutchAuction.getCountryRule(1)));

}