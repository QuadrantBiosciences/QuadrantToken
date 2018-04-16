
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


contract('DutchAuction', function ([owner, investor, wallet, purchaser]) {

  const gas = 4700000
  const rate = new BigNumber(1)
  const value = ether(42)
  const cap = ether(300)
  const expectedTokenAmount = rate.mul(value)
  const price_start = ether(0.01);
  const price_adjustment = 0;

  
  const price_constant = 15440;
  const price_exponent = 2;
  const weiToEth = 1000000000000000000
  const _initial_wallet_supply = new BigNumber(90000000);
  const _initial_sale_supply = new BigNumber(10000000);
  const goal = new BigNumber(9000000);
  
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.startTime = latestTime();
    this.endTime = this.startTime + duration.weeks();
    this.afterEndTime = this.endTime + duration.seconds(1);
    this.expiryDate = this.startTime + duration.days(90);

    await increaseTimeTo(this.startTime);

    this.dutchAuction =  await DutchAuction.new(wallet, price_start, price_constant, price_exponent,price_adjustment,goal);
    this.quadrantToken = await QuadrantToken.new(this.dutchAuction.address,wallet,owner,_initial_wallet_supply,_initial_sale_supply)
    await this.dutchAuction.setup(this.quadrantToken.address) 
    await this.dutchAuction.startAuction()

  });

  it('should return paused true after pause', async function () {
    await this.dutchAuction.pause();
    let paused = await this.dutchAuction.paused();

    assert.equal(paused, true);
  });

  it('should return paused false after pause and unpause', async function () {
    await this.dutchAuction.pause();
    await this.dutchAuction.unpause();
    let paused = await this.dutchAuction.paused();

    assert.equal(paused, false);
  });

  it('Perform Sale process ', async function () {
    
    //  await this.dutchAuction.pause();
      
    await this.quadrantToken.addToWhitelist([purchaser],[0], [this.expiryDate]  ,{from:owner})
    await this.dutchAuction.bid({from: purchaser, value: ether(2)}).should.not.be.rejectedWith(EVMThrow);
   
  });

  it('Cannot perform Sale process in pause', async function () {
    
    await this.dutchAuction.pause();
      
    await this.quadrantToken.addToWhitelist([purchaser],[0], [this.expiryDate]  ,{from:owner})
    await expectThrow(this.dutchAuction.bid({from: purchaser, value: ether(2)}));
   
  });

  it('Price is changing', async function () {
    
    let price = await this.dutchAuction.price();
    
    console.log('\n==============================================')  ;
    console.log('\nTime: 0 ' + this.startTime  )  ;

   
    
    console.log('Price: 0 ' + price)  ;
    console.log('Ether Price: 0 ' + price.dividedBy(weiToEth))  ;
    
    let newTime;
/* 
    for (let i = 1; i <= 15; i++) {
      this.newTime = this.startTime + duration.days(i);
      await increaseTimeTo(this.newTime);
      price = await this.dutchAuction.price();
      //console.log('\nTime: ' + i + ' ' + this.newTime)  ;
      //console.log('Price: ' + i + ' ' + price.dividedBy(weiToEth))  ;
      //console.log(price.dividedBy(weiToEth))  ;
      console.log(`\,{\"date\": \"${this.newTime}\", \"price\": \"${price.dividedBy(weiToEth)}\"}`);
    } */ 

    for (let i = 1; i <= 15; i++) {
      this.newTime = this.startTime + duration.days(i);
      await increaseTimeTo(this.newTime);
      price = await this.dutchAuction.price();
     // console.log('\nTime: ' + i + ' ' + this.newTime)  ;
     // console.log('Price: ' + i + ' ' + price.dividedBy(weiToEth))  ;
      //console.log(price.dividedBy(weiToEth))  ;
     // {date: '2018-10-01', tokens: 100, price: 2}
    // console.log(`\,{\"date\": \"${this.newTime}\", \"price\": \"${price.dividedBy(weiToEth)}\"}`);
    // console.log(`\,{\"date\": \"${this.newTime}\", \"price\": \"${price}\"}`);
     console.log(`${this.newTime}, ${price}`);
    } 
    console.log('\n==============================================\n')  ;
    return true;
   
  });

 });
