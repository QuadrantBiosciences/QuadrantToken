const DutchAuction = artifacts.require("./DutchAuction.sol");

module.exports = function (deployer, network, accounts) {
  return liveDeploy(deployer, network, accounts);
};


async function liveDeploy(deployer, network, accounts) {
  let saleConf;
  const [edward,
    james,
    miguel,
    edwhale] = accounts;


  //DutchAuction(address _wallet_address, address _whitelister_address, uint _price_start, uint _price_constant,   uint32 _price_exponent)
  //Kovan
  //let owner="0x37D93cc2A7629866cAd88a5BbCf939767f9B9B94";
  //let wallet= "0xeF9C3af79D736E631CC67F347F2A06Dd5bEc34BC";


  //local
  let owner="0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39";
  let wallet= "0x6704fbfcd5ef766b287262fa2281c105d57246a6";

  deployer.deploy(DutchAuction, wallet, 20000000000000000000, 524880000, 3,0,18000000000000000000,{gas:4700000}) //, {gas:7829561}increased only for local development
    // .then(() => vidamintSale.deployed())
    .then( async function() {
      const DutchAuctionInsta = await DutchAuction.deployed();
     // const token = await vidaInsta.token.call();
     // console.log('DutchAuctionInsta Address 1', DutchAuctionInsta);
    });



  }

