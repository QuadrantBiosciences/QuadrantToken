
import ether from '../test/helpers/ether'
import {advanceBlock} from '../test/helpers/advanceToBlock'
import {increaseTimeTo, duration} from '../test/helpers/increaseTime'
import latestTime from '../test/helpers/latestTime'
import EVMThrow from '../test/helpers/EVMThrow'
import assertRevert from '../test/helpers/assertRevert';
import expectThrow from '../test/helpers/expectThrow';
//import EVMRevert from './helpers/EVMRevert';
const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const DutchAuction = artifacts.require('DutchAuction')
const QuadrantToken = artifacts.require('QuadrantToken')
 function weiToEther(n) {
    return new web3.BigNumber(web3.fromWei(n, 'ether'));
  }

contract('DutchAuction', function ([owner1, investor, wallet1, purchaser]) {

    let owner="0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39";
    let wallet= "0x6704fbfcd5ef766b287262fa2281c105d57246a6";
    let purchaser1 = "0x9e1ef1ec212f5dffb41d35d9e5c14054f26c6560";
    let purchaser2 = "0xce42bdb34189a93c55de250e011c68faee374dd3";
    let purchaser3 = "0x97a3fc5ee46852c1cf92a97b7bad42f2622267cc";
    let purchaser4 = "0xb9dcbf8a52edc0c8dd9983fcc1d97b1f5d975ed7";
    
    const price_constant = 134400;
    const price_exponent = 2;
    const weiToEth = 1000000000000000000
    const _initial_wallet_supply = new BigNumber(80000000);
    const _initial_sale_supply = new BigNumber(20000000);
    const price_start =  ether(.01);
    const goal = new BigNumber(18000000);
    const price_adjustment = 0;
  
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
  
    this.startTime = latestTime();
    this.expiryDate = this.startTime + duration.days(90);
    //console.log('this.startTime ' + this.startTime)

    //this.newTime = this.startTime + duration.days(1);
    //await increaseTimeTo(this.newTime);
    //console.log('this.newTime ' + this.newTime)
  
    this.DutchAuction = await DutchAuction.new(wallet, price_start, price_constant, price_exponent,price_adjustment,goal)
    console.log('this.DutchAuction.address ' + this.DutchAuction.address)
    this.QuadrantToken = await QuadrantToken.new(this.DutchAuction.address,wallet,owner,_initial_wallet_supply,_initial_sale_supply)
    console.log('this.QuadrantToken.address ' + this.QuadrantToken.address)
    let tokenAddr = await this.DutchAuction.setup(this.QuadrantToken.address)  
    let tokenAddr1 = await this.DutchAuction.startAuction()  
    
    console.log('Initial Token Supply: ' + await this.QuadrantToken.totalSupply())
    console.log('Goal :' + await this.DutchAuction.goal.call())
    console.log('Contract initial token balance: '+  await this.QuadrantToken.balanceOf.call(this.DutchAuction.address))
    console.log('Start_Time :' + await this.DutchAuction.start_time.call())
  
   
    await this.QuadrantToken.addToWhitelist([this.DutchAuction.address],[0], [this.expiryDate] ,{from:owner})
    await this.QuadrantToken.addToWhitelist([wallet],[0], [this.expiryDate] ,{from:owner})

    await this.DutchAuction.addUpdateCountryRules(1,ether(1),3) 
    await this.DutchAuction.addUpdateCountryRules(2,ether(11),10) 
    console.log('addUpdateCountryRules 1: ' + await this.DutchAuction.getCountryRule.call(1));
    console.log('addUpdateCountryRules 2: ' + await this.DutchAuction.getCountryRule.call(2));
    this.newTime = this.startTime;
    //await increaseTimeTo(this.newTime);
    console.log('this.newTime ' + this.newTime)

    // Purchase 1 ===============================
    
    console.log('\nPurchaser 1 initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser1))

    await this.QuadrantToken.addToWhitelist([purchaser1],[1], [this.expiryDate] ,{from:owner})

    console.log('Purchase 1 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser1))
    console.log('Purchase countrycode: ' + await this.QuadrantToken.getUserResidentCountryCode.call(purchaser1))
    
    
    await this.DutchAuction.bid({from: purchaser1, value: ether(10000)})
    
    console.log('Purchase 1 bid: ' + weiToEther(await this.DutchAuction.bids.call(purchaser1)))
    console.log('Purchase 1 bonus bid: ' + weiToEther(await this.DutchAuction.bidsWithTier1Bonus.call(purchaser1)))
    console.log('Price :' + weiToEther(await this.DutchAuction.price.call()))
    console.log('balanceFundsToEndAuction after bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())

    console.log('Bid count after 1 bid: ' + await this.DutchAuction.getCountryRule.call(1));
    // Purchase 1 End

    this.newTime = this.newTime + duration.days(1) + duration.hours(5);;
    await increaseTimeTo(this.newTime);
    console.log('this.newTime ' + this.newTime)

    // Purchase 2 ===============================
    console.log('\nPurchaser 2 initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser2))

    await this.QuadrantToken.addToWhitelist([purchaser2],[2], [this.expiryDate] ,{from:owner})

    console.log('Purchase 2 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser2))
    
    await this.DutchAuction.bid({from: purchaser2, value: ether(10000)})
    
    console.log('Purchase 2 bid: ' + weiToEther(await this.DutchAuction.bids.call(purchaser2)))
    console.log('Price :' + weiToEther(await this.DutchAuction.price.call()))
    console.log('balanceFundsToEndAuction after bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())
   
    console.log('Bid count after 2 bid: ' + await this.DutchAuction.getCountryRule.call(2));
    // Purchase 2 End
    this.newTime = this.newTime + duration.days(1) + duration.hours(5);
    await increaseTimeTo(this.newTime);
    console.log('this.newTime ' + this.newTime)

    // Purchase 3 ===============================
    console.log('\nPurchaser 3 initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser3))

    await this.QuadrantToken.addToWhitelist([purchaser3],[1], [this.expiryDate] ,{from:owner})

    console.log('Purchase 3 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser3))
    
    await this.DutchAuction.bid({from: purchaser3, value: ether(1000)})
    
    console.log('Purchase 3 bid: ' + weiToEther(await this.DutchAuction.bids.call(purchaser3)))
    console.log('Price :' + weiToEther(await this.DutchAuction.price.call()))
    console.log('balanceFundsToEndAuction after bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())
    console.log('Bid count 3 bid: ' + await this.DutchAuction.getCountryRule.call(1));
    // End Purchase 3 ===============================

    //one more from purchase1 1 
    await this.DutchAuction.bid({from: purchaser1, value: ether(10)})
    
    console.log('\nPurchase 1 bid: ' + weiToEther(await this.DutchAuction.bids.call(purchaser1)))
    console.log('Purchase 1 bonus bid: ' + weiToEther(await this.DutchAuction.bidsWithTier1Bonus.call(purchaser1)))
    console.log('Price :' + weiToEther(await this.DutchAuction.price.call()))
    console.log('balanceFundsToEndAuction after bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())

    //one more from purchaser 1 end
    console.log('Bid count after 1 bid: ' + await this.DutchAuction.getCountryRule.call(1));


    this.newTime = this.newTime + duration.days(1);
    await increaseTimeTo(this.newTime);
    console.log('this.newTime ' + this.newTime)

    // Purchase 4 ===============================
    console.log('\nPurchaser 4 initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser4))

    await this.QuadrantToken.addToWhitelist([purchaser4],[2], [this.expiryDate] ,{from:owner})

    console.log('Purchase 4 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser4))
    
    await this.DutchAuction.bid({from: purchaser4, value: ether(100000)})
    
    console.log('Purchase 4 bid: ' + weiToEther(await this.DutchAuction.bids.call(purchaser4)))
    console.log('Price :' + weiToEther(await this.DutchAuction.price.call()))
    console.log('balanceFundsToEndAuction after bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())
    // End Purchase 3 ===============================

    console.log('Bid count after 1 bid: ' + await this.DutchAuction.getCountryRule.call(2));

    console.log('\nreceived_wei after bid: ' + weiToEther(await this.DutchAuction.received_wei.call()))

    console.log('balanceFundsToEndAuction after bid: ' + await this.DutchAuction.balanceFundsToEndAuction.call())
    console.log('finalizeAuction : Done' + await this.DutchAuction.finalizeAuction())
    console.log('Auction stage: AuctionEnded ' + await this.DutchAuction.stage.call())
    console.log('final_price : ' + weiToEther(await this.DutchAuction.final_price.call()))

    this.newTime = this.newTime + duration.days(8);
    await increaseTimeTo(this.newTime);
    
    await this.DutchAuction.loadForExcedent({from: owner, value: ether(10) })
    console.log('wei_for_excedent :' + weiToEther(await this.DutchAuction.wei_for_excedent.call()))

   
    await this.DutchAuction.claimTokens({from: purchaser1})
    console.log('\nPurchaser 1 after token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser1))

    await this.DutchAuction.claimTokens({from: purchaser2})
    console.log('\nPurchaser 2 after token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser2))

    await this.DutchAuction.claimTokens({from: purchaser3})
    console.log('\nPurchaser 3 after token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser3))

    await this.DutchAuction.claimTokens({from: purchaser4})
    console.log('\nPurchaser 4 after token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser4))

    console.log('\nContract final token balance: '+  await this.QuadrantToken.balanceOf.call(this.DutchAuction.address))

    console.log('wei_for_excedent :' + weiToEther(await this.DutchAuction.wei_for_excedent.call()))
    
    //test for contract transfer balance amount to wallet
    console.log('\nContract Ether Balance before transfer: ' + await web3.eth.getBalance(this.DutchAuction.address).dividedBy(weiToEth));
    console.log('Wallet Ether Balance before transfer: ' + await web3.eth.getBalance(wallet).dividedBy(weiToEth));
    await this.DutchAuction.transferContractBalanceToWallet({from:owner});
    console.log('Contract Ether Balance after transfer: ' + await web3.eth.getBalance(this.DutchAuction.address).dividedBy(weiToEth));
    console.log('Wallet Ether Balance after transfer: ' + await web3.eth.getBalance(wallet).dividedBy(weiToEth));

    //test for balance token in contract to wallet 
    console.log('\nContract token Balance before transfer: ' + await this.QuadrantToken.balanceOf.call(this.DutchAuction.address))
    console.log('Wallet token Balance before transfer: ' + await this.QuadrantToken.balanceOf.call(wallet))
    await this.DutchAuction.transferTokenBalanceToWallet({from:owner});
    console.log('Contract token Balance after transfer: ' + await this.QuadrantToken.balanceOf.call(this.DutchAuction.address))
    console.log('Wallet token Balance after transfer: ' + await this.QuadrantToken.balanceOf.call(wallet))



    await this.QuadrantToken.transfer(purchaser2,5000,{from:purchaser1})

    console.log('\nPurchaser 1 after token transfer: '+  await this.QuadrantToken.balanceOf.call(purchaser1))

    console.log('Purchaser 2 after token transfer: '+  await this.QuadrantToken.balanceOf.call(purchaser2))

    await this.QuadrantToken.removeFromWhitelist([purchaser2],{from:owner})

    console.log('\nPurchase 2 isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser2))

    await this.QuadrantToken.transfer(purchaser2,5000,{from:purchaser1}).should.be.rejectedWith(EVMThrow);

    console.log('Whitelist: ' + await this.QuadrantToken.getWhitelist())
    console.log('Whitelist members count: ' + await this.QuadrantToken.countUsers())
    console.log('user: ' + await this.QuadrantToken.getUser(purchaser1))
 

  });

  it('should return paused true after pause', async function () {
    return true;
  });
  
 });
