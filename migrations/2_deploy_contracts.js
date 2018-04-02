const DutchAuction = artifacts.require("./DutchAuction.sol");
const BigNumber = web3.BigNumber


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

  const gas = 4700000
  const weiToEth = 1000000000000000000

  const price_start = 0.0000015418947*weiToEth;
  const price_adjustment = 458105300000;

  
  const price_constant = 400;
  const price_exponent = 2;

  const goal = new BigNumber(9000000);

  deployer.deploy(DutchAuction, wallet, price_start, price_constant,price_exponent,price_adjustment,goal) //, {gas:7829561}increased only for local development
    // .then(() => vidamintSale.deployed())
    .then( async function() {
      const DutchAuctionInsta = await DutchAuction.deployed();
     // const token = await vidaInsta.token.call();
     // console.log('DutchAuctionInsta Address 1', DutchAuctionInsta);
    });



  }

