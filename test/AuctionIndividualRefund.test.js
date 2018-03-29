import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber

const should = require('chai').use(require('chai-as-promised')).use(require('chai-bignumber')(BigNumber)).should()

const DutchAuction = artifacts.require('DutchAuction')
const QuadrantToken = artifacts.require('QuadrantToken')

contract('DutchAuction',function([owner, investor, wallet, purchaser, randomUser, wallet2]){
  const gas = 4700000
  const rate = new BigNumber(1)
  const value = ether(42)
  const cap = ether(300)
  const expectedTokenAmount = rate.mul(value)
  const priceConstant = 1
  const princeExponent = 1
  const weiToEth = 1000000000000000000
  const _initial_wallet_supply = new BigNumber(80000000);
  const _initial_sale_supply = new BigNumber(20000000);
  const priceStart = new BigNumber(.01*weiToEth)
  const goal = new BigNumber(18000000);
  const price_adjustment = 0;
  owner = "0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39";
  wallet= "0x6704fbfcd5ef766b287262fa2281c105d57246a6";  
  let purchaser1 = "0x9e1ef1ec212f5dffb41d35d9e5c14054f26c6560";
  let purchaser2 = "0xce42bdb34189a93c55de250e011c68faee374dd3";
  let purchaser3 = "0x97a3fc5ee46852c1cf92a97b7bad42f2622267cc";
  let purchaser4 = "0xb9dcbf8a52edc0c8dd9983fcc1d97b1f5d975ed7";
  let purchaser5 = "0x26064a2e2b568d9a6d01b93d039d1da9cf2a58cd";
  let purchaser6 = "0xe84da28128a48dd5585d1abb1ba67276fdd70776";
  

  
  before(async function(){
    await advanceBlock()
    this.DutchAuction = await DutchAuction.new(wallet, priceStart, priceConstant, princeExponent,price_adjustment,goal).should.not.be.rejected;
    console.log('Dutch Auction Contract Address : ' + DutchAuction.address);        
    this.QuadrantToken = await QuadrantToken.new(this.DutchAuction.address, wallet, owner, _initial_wallet_supply,_initial_sale_supply);
    console.log('Quadrant Token Contract Address : ' + this.QuadrantToken.address);
    console.log('Dutch Auction Owner address : ' + await this.DutchAuction.owner.call());

    let tokenAddr = await this.DutchAuction.setup(this.QuadrantToken.address).should.not.be.rejected; 
    let tokenAddr1 = await this.DutchAuction.startAuction().should.not.be.rejected;


    
    console.log(' Received WEI : ' + await this.DutchAuction.received_wei.call());
    console.log(' Tokens Auctioned : ' + await this.DutchAuction.targetTokens.call());
    console.log(' Price at Start : ' + await this.DutchAuction.price.call());
    console.log(' Wallet Balance : ' + (await this.QuadrantToken.balanceOf.call(wallet)).dividedBy(weiToEth));
    console.log('Funds Pending to End Auction : '+ await this.DutchAuction.balanceFundsToEndAuction.call());
  })

  beforeEach(async function(){
    this.startTime = latestTime() + duration.seconds(600)
    this.endTime = this.startTime + duration.weeks(1)
    this.afterEndTime = this.endTime + duration.seconds(1)
    this.expiryDate = this.startTime + duration.days(90);
  })

  
  describe('Bidding for Purchaser 1 : ', () => {
    it('should not let a purchaser bid without being added to the White List', async function(){
      await this.DutchAuction.bid({from: purchaser1, value: new BigNumber(1 * weiToEth)}).should.be.rejected;
    });
    it('should let a purchaser bid after being added to White List', async function(){
      console.log('Purchaser 1 wallet balance before purchase : ' + web3.eth.getBalance(purchaser1).dividedBy(weiToEth));
      await this.QuadrantToken.addToWhitelist([purchaser1], [0], [this.expiryDate] , {from: owner});
      await this.DutchAuction.bid({from: purchaser1, value: new BigNumber(1 * weiToEth)}).should.not.be.rejected;
      console.log('Purchaser 1 wallet balance after purchase : ' + await web3.eth.getBalance(purchaser1).dividedBy(weiToEth));
      console.log('Received Ether : ' + (await this.DutchAuction.received_wei.call()).dividedBy(weiToEth));
      console.log(' Wallet Balance : ' + (await this.QuadrantToken.balanceOf.call(wallet)).dividedBy(weiToEth));
      console.log('Funds Pending to End Auction : '+ await this.DutchAuction.balanceFundsToEndAuction.call());
      
    });
  });

  describe('Bidding for rest of the purchasers : ', () => {
    it('Purchaser 2 successfull bid', async function(){
      await this.QuadrantToken.addToWhitelist([purchaser2], [0], [this.expiryDate],  {from: owner});
      await this.DutchAuction.bid({from: purchaser2, value: new BigNumber(2*weiToEth)}).should.not.be.rejected;
      
    });
    it('Purchaser 3 successfull bid', async function(){
      await this.QuadrantToken.addToWhitelist([purchaser3], [0], [this.expiryDate] , {from: owner});
      await this.DutchAuction.bid({from: purchaser3, value: new BigNumber(3*weiToEth)}).should.not.be.rejected;
      return true;
    });
    it('Purchaser 4 successfull bid', async function(){
      await this.QuadrantToken.addToWhitelist([purchaser4], [0], [this.expiryDate] , {from: owner});
      await this.DutchAuction.bid({from: purchaser4, value: new BigNumber(4*weiToEth)}).should.not.be.rejected;
      return true;
    });
    it('Purchaser 5 successfull bid', async function(){
      await this.QuadrantToken.addToWhitelist([purchaser5], [0], [this.expiryDate] , {from: owner});
      await this.DutchAuction.bid({from: purchaser5, value: new BigNumber(5*weiToEth)}).should.not.be.rejected;
      return true;
    });
    it('Purchaser 6 successfull bid', async function(){
      await this.QuadrantToken.addToWhitelist([purchaser6], [0], [this.expiryDate] , {from: owner});
      await this.DutchAuction.bid({from: purchaser6, value: new BigNumber(6*weiToEth)}).should.not.be.rejected;
      console.log('Received Ether : ' + (await this.DutchAuction.received_wei.call()).dividedBy(weiToEth));
      console.log(' Wallet Balance : ' + (await this.QuadrantToken.balanceOf.call(wallet)).dividedBy(weiToEth));
      return true;
    });
  });

  describe('Testing Refund for Individuals', () => {
    it('Should not load refund when refund for individuals is not active', async function(){
      let refundValue = await this.DutchAuction.bids.call(purchaser1);
      console.log('Refund is Active : '+ !(await this.DutchAuction.refundForIndividualsIsStopped.call()))
      await this.DutchAuction.loadRefundForIndividuals({from:owner, value: refundValue}).should.be.rejected;
    });
    it('Should load refund when refund for individuals is active', async function(){
      this.DutchAuction.refundForIndividualsToggle({from:owner});
      let refundValue = await this.DutchAuction.bids.call(purchaser1);
      console.log('Refund is Active : '+ !(await this.DutchAuction.refundForIndividualsIsStopped.call()))
      await this.DutchAuction.loadRefundForIndividuals({from:owner, value: refundValue}).should.not.be.rejected;
      console.log('Refund Value for Individuals(Ethers) : ' + (await this.DutchAuction.refundValueForIndividuals.call()).dividedBy(weiToEth));
    });
    it('Should not allow individuals to claim refund when not added to the Refund White List', async function() {
      console.log('Refund is Active : '+ !(await this.DutchAuction.refundForIndividualsIsStopped.call()));
      console.log('Refund Value for Individuals(Ethers) : ' + (await this.DutchAuction.refundValueForIndividuals.call()).dividedBy(weiToEth));
      await this.DutchAuction.refundForIndividuals({from: purchaser1}).should.be.rejected;
    });
    it('Should allow owner to add a purchaser to Refund White List', async function(){
      await this.DutchAuction.addToRefundForIndividualsWhitelist([purchaser1],{from: owner}).should.not.be.rejected;
      let purchaserInRefundWhitelist = await this.DutchAuction.refundForIndividualsWhitelist.call(purchaser1);
      purchaserInRefundWhitelist.should.be.equal(true);
    });
    it('Should allow purchaser 1 to claim once added to Refund White List', async function(){
      console.log('Purchaser 1 Initial Wallet Balance : ' + web3.eth.getBalance(purchaser1).dividedBy(weiToEth));
      console.log('Purchaser 1 Bids(ETH) : ' + (await this.DutchAuction.bids.call(purchaser1)).dividedBy(weiToEth));
      console.log('refundValueForIndividuals : ' + (await this.DutchAuction.refundValueForIndividuals.call()));
      let refundValue = await this.DutchAuction.bids.call(purchaser1);
      await this.DutchAuction.loadRefundForIndividuals({from:owner, value: refundValue}).should.not.be.rejected;
      await this.DutchAuction.refundForIndividuals({from: purchaser1}).should.not.be.rejected;
      console.log('Purchaser 1 Wallet Balance after claim : ' + web3.eth.getBalance(purchaser1).dividedBy(weiToEth));
    });
    it('Adding Purchase 2 and Purchaser 3 to Refund White List', async function(){ 
      this.DutchAuction.addToRefundForIndividualsWhitelist([purchaser2],{from: owner}).should.not.be.rejected;
      this.DutchAuction.addToRefundForIndividualsWhitelist([purchaser3],{from: owner}).should.not.be.rejected;
      (await this.DutchAuction.refundForIndividualsWhitelist.call(purchaser2)).should.be.equal(true);
      (await this.DutchAuction.refundForIndividualsWhitelist.call(purchaser3)).should.be.equal(true);
    });
    it('Purchaser 2 and purchaser 3 claiming thier bids', async function(){
     
      let purchaser2Bid = await this.DutchAuction.bids.call(purchaser2);
      let purchaser3Bid = await this.DutchAuction.bids.call(purchaser3);
      console.log('Purchaser 2 Bids : ' + purchaser2Bid.dividedBy(weiToEth));
      console.log('Purchaser 3 Bids : ' + purchaser3Bid.dividedBy(weiToEth));
      let refundValue = purchaser2Bid.add(purchaser3Bid);
      console.log('Refund Value : ' + refundValue.dividedBy(weiToEth));
      await this.DutchAuction.loadRefundForIndividuals({from:owner, value: refundValue}).should.not.be.rejected;
      console.log('Purchaser 2 Initial Wallet balance : ' + web3.eth.getBalance(purchaser2).dividedBy(weiToEth));
      await this.DutchAuction.refundForIndividuals({from: purchaser2}).should.not.be.rejected;
      console.log('Purchaser 2 Wallet balance after claim : ' + web3.eth.getBalance(purchaser2).dividedBy(weiToEth));

      console.log('Purchaser 3 Initial Wallet balance : ' + web3.eth.getBalance(purchaser3).dividedBy(weiToEth));
      await this.DutchAuction.refundForIndividuals({from: purchaser3}).should.not.be.rejected;
      console.log('Purchaser 3 Wallet balance after claim : ' + web3.eth.getBalance(purchaser3).dividedBy(weiToEth)); 
      //true;     
    });
  });
})
