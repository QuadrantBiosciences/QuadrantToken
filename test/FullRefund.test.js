import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const DutchAuction = artifacts.require('DutchAuction')
const QuadrantToken = artifacts.require('QuadrantToken')

contract('DutchAuction', function ([owner, investor, wallet, purchaser, randomUser, wallet2]) {

  const gas = 4700000
  const rate = new BigNumber(1)
  const value = ether(42)
  const cap = ether(300)
  const expectedTokenAmount = rate.mul(value)
  const price_constant = 1;
  const price_exponent = 1;
  const weiToEth = 1000000000000000000
  const _initial_wallet_supply = new BigNumber(80000000);
  const _initial_sale_supply = new BigNumber(20000000);
  const price_start = new BigNumber(.01*weiToEth)
  const goal = new BigNumber(18000000);
  const price_adjustment = 0;
  owner = "0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39";
  wallet= "0x6704fbfcd5ef766b287262fa2281c105d57246a6";  
  purchaser = "0x9e1ef1ec212f5dffb41d35d9e5c14054f26c6560";
 
  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
     await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.seconds(600);
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)
    this.expiryDate = this.startTime + duration.days(90);

    this.DutchAuction=await DutchAuction.new(wallet, price_start, price_constant, price_exponent,price_adjustment, goal);
    console.log('\n\nthis.DutchAuction.address ' + this.DutchAuction.address)
    
    this.QuadrantToken=await QuadrantToken.new(this.DutchAuction.address,wallet,owner,_initial_wallet_supply,_initial_sale_supply);
    console.log('this.QuadrantToken.address ' + this.QuadrantToken.address)

    console.log('this.DutchAuction.owner ' + await this.DutchAuction.owner.call());
    console.log('this.DutchAuction.goal_time ' + await this.DutchAuction.goal_time.call())

    console.log('\nAuction stage: AuctionDeployed ' + await this.DutchAuction.stage.call());

    let tokenAddr = await this.DutchAuction.setup(this.QuadrantToken.address)  
    console.log('\nAuction stage: AuctionSetUp ' + await this.DutchAuction.stage.call())

    console.log('Price at Start: ' + await this.DutchAuction.price.call())
    console.log('Initial Token Supply: ' + await this.QuadrantToken.totalSupply());
 
    let tokenAddr1 = await this.DutchAuction.startAuction()  
    console.log('Auction stage: AuctionStarted ' + await this.DutchAuction.stage.call())

    const walletBalanceInit = await this.QuadrantToken.balanceOf.call(wallet)
    console.log(`wallet initial  balance = ${walletBalanceInit.dividedBy(weiToEth)}`)

    // Purchase  Start ===============================
    console.log('\nPurchaser initial token balance: '+  await this.QuadrantToken.balanceOf.call(purchaser));
    await this.QuadrantToken.addToWhitelist([purchaser], [0], [this.expiryDate] , {from:owner})

    console.log('Purchase  isInWhiteList: ' + await this.QuadrantToken.isWhitelisted.call(purchaser))
    await this.DutchAuction.bid({from: purchaser, value: new BigNumber(1* weiToEth) })

    console.log('Purchase  bid: ' + await this.DutchAuction.bids.call(purchaser));
    // Purchase  End  ===============================

    console.log('Purchaser wallet balance after purchase : ' + await web3.eth.getBalance(purchaser).dividedBy(weiToEth));

    console.log('Dutch Auction Received Ether : ' + (await this.DutchAuction.received_wei.call()).dividedBy(weiToEth));
    console.log('Dutch Auction Wallet Balance : ' + (await this.QuadrantToken.balanceOf.call(wallet)).dividedBy(weiToEth));
    console.log('Dutch Auction Funds Pending to End Auction : '+ await this.DutchAuction.balanceFundsToEndAuction.call());

 })

  
  describe('DutchAuctionSale Constructor: Creating the DutchAuctionSale Contract', () => {
    it('should successfully create DutchAuctionSale contract', async function () {
      let DutchAuctionSale = await DutchAuction.new(wallet, price_start, price_constant, price_exponent,price_adjustment, goal).should.not.be.rejected
    })
  })


  describe('DutchAuctionSale Constructor: Check For Wallet', () => {
    it('should fail if wallet == 0x0', async function () {
      let DutchAuctionSale = await DutchAuction.new('0x0', price_start, price_constant, price_exponent).should.be.rejected
    })
  })

  describe('DutchAuctionSale Constructor: Check if Sale can be Pause for Refund', () => {
     it('should pause the sale before refund', async function () {
      let DutchAuctionSale = await this.DutchAuction.pause().should.not.be.rejected ;
     })
    })

  describe('DutchAuctionSale Constructor: Check if Refund Flag Set', () => {
     it('should set the Refund Flag True', async function () {
      let DutchAuctionSale = await this.DutchAuction.refundToggle().should.not.be.rejected ;
     })
    })

  
  describe('DutchAuctionSale Constructor: Test Refund For All Users', () => {

    it('should not load refund if Sale is not Pause', async function () {
      await this.DutchAuction.pause();
      await this.DutchAuction.unpause();
      let refundValueforAll=await this.DutchAuction.received_wei.call();
      console.log('Sale is Pause : '+ !(await this.DutchAuction.paused()));
      console.log('refundValueforAll : ' + refundValueforAll.dividedBy(weiToEth));
      let DutchAuctionSale = await this.DutchAuction.loadRefundForAll({from:owner,value:refundValueforAll}).should.be.rejected;
    })

    it('should not prepare refund if refund is not active', async function () {
      await this.DutchAuction.pause({from:owner});
      let refundValueforAll=await this.DutchAuction.received_wei.call();
      console.log('Refund is Active : '+ !(await this.DutchAuction.refundIsStopped.call()));
      console.log('refundValueforAll : ' + refundValueforAll.dividedBy(weiToEth));
      let DutchAuctionSale = await this.DutchAuction.loadRefundForAll({from:owner,value:refundValueforAll}).should.be.rejected;
    })

    it('should call load Refund to prepare for refund', async function () {
       await this.DutchAuction.pause({from:owner});
       await this.DutchAuction.refundToggle({from:owner});
       let refundValueforAll=await this.DutchAuction.received_wei.call();
       console.log('Refund is Active : '+ !(await this.DutchAuction.refundIsStopped.call()));
       console.log('refundValueforAll : ' + refundValueforAll.dividedBy(weiToEth));
       let DutchAuctionSale = await this.DutchAuction.loadRefundForAll({from:owner,value:refundValueforAll}).should.not.be.rejected;
     })

     it('should not be able to make successfull claim to refund by purchaser if not present in whitelist', async function () {
      await this.DutchAuction.pause({from:owner});
      await this.DutchAuction.refundToggle({from:owner});
      let refundValueforAll=await this.DutchAuction.received_wei.call();
      console.log('Refund is Active : '+ !(await this.DutchAuction.refundIsStopped.call()));
      console.log('refundValueforAll : ' + refundValueforAll.dividedBy(weiToEth));
      await this.DutchAuction.loadRefundForAll({from:owner,value:refundValueforAll}).should.not.be.rejected;
      let purchaserInWhitelist = !(await this.QuadrantToken.isWhitelisted.call(purchaser));
      purchaserInWhitelist.should.not.be.equal(true);

    })  

    it('should be able to make successfull claim to refund by purchaser if present in whitelist', async function () {
      await this.DutchAuction.pause({from:owner});
      await this.DutchAuction.refundToggle({from:owner});
      let refundValueforAll=await this.DutchAuction.received_wei.call();
      console.log('Refund is Active : '+ !(await this.DutchAuction.refundIsStopped.call()));
      console.log('refundValueforAll : ' + refundValueforAll.dividedBy(weiToEth));
      
      await this.DutchAuction.loadRefundForAll({from:owner,value:refundValueforAll}).should.not.be.rejected;
      
      let purchaserInWhitelist = await this.QuadrantToken.isWhitelisted.call(purchaser);
      purchaserInWhitelist.should.be.equal(true);

      console.log('Purchaser  Balance Before Refund : ' + web3.eth.getBalance(purchaser).dividedBy(weiToEth));
      console.log('Purchaser Bids(ETH) : ' + (await this.DutchAuction.bids.call(purchaser)).dividedBy(weiToEth));
      let DutchAuctionSale=await this.DutchAuction.refund({from:purchaser}).should.not.be.rejected;
      console.log('Purchaser  Balance After Refund : ' + web3.eth.getBalance(purchaser).dividedBy(weiToEth));
    })  



  })
})
