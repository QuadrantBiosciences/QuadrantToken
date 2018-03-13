const DutchAuction = artifacts.require("./DutchAuction.sol");

module.exports = function (deployer, network, accounts) {
  return liveDeploy(deployer, network, accounts);
};


async function liveDeploy(deployer, network, accounts) {
  let saleConf;
  const [owner,
    wallet,
    miguel,
    edwhale] = accounts;

  //local
  //let owner="0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39";
  //let wallet= "0x6704fbfcd5ef766b287262fa2281c105d57246a6";

  deployer.deploy(DutchAuction, wallet, 20000000000000000000, 524880000, 3,18000000000000000000,{gas:4700000}) //, {gas:7829561}increased only for local development
    .then( async function() {
      const DutchAuctionInsta = await DutchAuction.deployed();
    });
  }

