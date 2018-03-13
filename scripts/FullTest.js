const DutchAuction = artifacts.require("./DutchAuction.sol");
const QuadrantToken = artifacts.require("./QuadrantToken.sol");

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

   //Kovan
  //  let owner="0x37D93cc2A7629866cAd88a5BbCf939767f9B9B94";
  //  let wallet= "0xeF9C3af79D736E631CC67F347F2A06Dd5bEc34BC";
  //  let purchaser1 = "0xa2107e4649F19B77e375B116EF138a7120F88A8d";
  //  let purchaser2 = "0x8B31592400497A97961FB7c9993f1AcA0b036998";
 
   //local
   let owner="0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39";
   let wallet= "0x6704fbfcd5ef766b287262fa2281c105d57246a6";
   let purchaser1 = "0x9e1ef1ec212f5dffb41d35d9e5c14054f26c6560";
   let purchaser2 = "0xce42bdb34189a93c55de250e011c68faee374dd3";
   let purchaser3 = "0x97a3fc5ee46852c1cf92a97b7bad42f2622267cc";
   
   const price_constant = 1;
    const price_exponent =1;
    const weiToEth = 1000000000000000000
    const _initial_wallet_supply = new BigNumber(80000000);
    const _initial_sale_supply = new BigNumber(20000000);

    const price_start =  (1*weiToEth);
    const goal = new BigNumber(18000000);


  

   this.DutchAuction = await DutchAuction.new(wallet, price_start, price_constant, price_exponent,goal)
   console.log('this.DutchAuction.address ' + this.DutchAuction.address)
   
   this.QuadrantToken = await QuadrantToken.new(this.DutchAuction.address,wallet,owner,_initial_wallet_supply,_initial_sale_supply)
   console.log('this.QuadrantToken.address ' + this.QuadrantToken.address)
   


   console.log('this.DutchAuction.owner ' + await this.DutchAuction.owner.call())
   console.log('this.DutchAuction.goal_time ' + await this.DutchAuction.goal_time.call())
   //console.log('this.DutchAuction.owner_address ' + await this.DutchAuction.owner_address.call())

   console.log('\nAuction stage: AuctionDeployed ' + await this.DutchAuction.stage.call())

  

   let tokenAddr = await this.DutchAuction.setup(this.QuadrantToken.address)  
    console.log('\nAuction stage: AuctionSetUp ' + await this.DutchAuction.stage.call())

    console.log('this.DutchAuction.address isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(this.DutchAuction.address))
    console.log('getWhitelist: ' + await this.QuadrantToken.getWhitelist.call())
    console.log('received_wei: ' + await this.DutchAuction.received_wei.call())
    console.log('Tokens for sale in contract: ' + await this.DutchAuction.targetTokens.call())
    console.log('Price at Start in wei: ' + await this.DutchAuction.price.call())
    console.log('Total Token Supply: ' + await this.QuadrantToken.totalSupply())
    //await this.DutchAuction.pause() 
    //await this.DutchAuction.unpause() 

    let tokenAddr1 = await this.DutchAuction.startAuction()  
    console.log('Auction stage: AuctionStarted ' + await this.DutchAuction.stage.call())

    const walletBalanceInit = await this.QuadrantToken.balanceOf.call(wallet)
    console.log(`wallet initial  token balance = ${walletBalanceInit}`)
    
    //const walletEtherBalanceInit = await web3.eth.getBalance(wallet);
    //console.log('walletEtherBalanceInit =' +  walletEtherBalanceInit.dividedBy(weiToEth))

    console.log('balanceFundsToEndAuction before bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())
    
    
    // Purchase 1 ===============================
    
    console.log('\nPurchaser 1 initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser1))

    await this.QuadrantToken.addToWhitelist([purchaser1],0,{from:owner})

    console.log('Purchase 1 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser1))
    
    await this.DutchAuction.bid({from: purchaser1, value: new BigNumber(100000* weiToEth) })
    
    console.log('Purchase 1 bid: ' + await this.DutchAuction.bids.call(purchaser1))
    console.log('Price :' + await this.DutchAuction.price.call())
    // Purchase 1 End

    // Purchase 2 ===============================
    console.log('\nPurchaser 2 initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser2))

    await this.QuadrantToken.addToWhitelist([purchaser2],0,{from:owner})

    console.log('Purchase 2 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser2))
    
    await this.DutchAuction.bid({from: purchaser2, value: new BigNumber(10000* weiToEth) })
    
    console.log('Purchase 2 bid: ' + await this.DutchAuction.bids.call(purchaser2))
    console.log('Price :' + await this.DutchAuction.price.call())
   
    
    // Purchase 2 End
  // Purchase 3 ===============================

  console.log('Purchaser 3 Initial Wallet Balance : ' + web3.eth.getBalance(purchaser3).dividedBy(weiToEth));

  console.log('\nPurchaser 3 initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser3))

  await this.QuadrantToken.addToWhitelist([purchaser3],1,{from:owner})

  console.log('Purchase 3 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser3))
  
  await this.DutchAuction.bid({from: purchaser3, value: new BigNumber(1000* weiToEth) })
  
  console.log('Purchase 3 bid: ' + await this.DutchAuction.bids.call(purchaser3))
  console.log('Price :' + await this.DutchAuction.price.call())
  console.log('Purchaser 3 Initial Wallet Balance after bid: ' + web3.eth.getBalance(purchaser3).dividedBy(weiToEth));
  
  // Purchase 2 End
    
    
    console.log('\nreceived_wei after bid: ' + await this.DutchAuction.received_wei.call())

    //const walletBalanceInit2 = await web3.eth.getBalance(wallet);
    //console.log('wallet initial  balance =' +  walletBalanceInit2)
    console.log('balanceFundsToEndAuction after bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())
    console.log('finalizeAuction : Done' + await this.DutchAuction.finalizeAuction())
    console.log('Auction stage: AuctionEnded ' + await this.DutchAuction.stage.call())
    console.log('final_price :' + await this.DutchAuction.final_price.call())


    
    await this.DutchAuction.loadForExcedent({from: owner, value: new BigNumber(10* weiToEth) })
    console.log('wei_for_excedent :' + await this.DutchAuction.wei_for_excedent.call())


    await this.DutchAuction.claimTokens({from: purchaser1})
    console.log('\nPurchaser 1 after token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser1))

    await this.DutchAuction.claimTokens({from: purchaser2})
    console.log('\nPurchaser 2 after token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser2))

    await this.DutchAuction.claimTokens({from: purchaser3})
    console.log('\nPurchaser 3 after token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser3))

    console.log('\nAuction stage: TokensDistributed ' + await this.DutchAuction.stage.call())

    console.log('Initial Token Supply after disbursement: ' + await this.QuadrantToken.totalSupply())

    console.log('wei_for_excedent :' + await this.DutchAuction.wei_for_excedent.call())
    
    await this.QuadrantToken.burnTokens(purchaser2,500000000000000000,{from:owner})
    console.log('\nPurchaser 2 after token balance after burn: '+  await this.QuadrantToken.balanceOf.call(purchaser2))
    console.log('Initial Token Supply after burn: ' + await this.QuadrantToken.totalSupply())

    await this.QuadrantToken.mint(purchaser2,800000000000000000,{from:owner})
    console.log('\nPurchaser 2 after token balance after mint: '+  await this.QuadrantToken.balanceOf.call(purchaser2))
    console.log('Initial Token Supply after mint: ' + await this.QuadrantToken.totalSupply())
    console.log('Whitelist: ' + await this.QuadrantToken.getWhitelist())

  }
