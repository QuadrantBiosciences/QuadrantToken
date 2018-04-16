
import assertRevert from '../test/helpers/assertRevert';
import ether from '../test/helpers/ether'
const BigNumber = web3.BigNumber
var DutchAuction = artifacts.require('DutchAuction');
var QuadrantToken = artifacts.require('QuadrantToken');

contract('DutchAuction', function (accounts) {
  let ownable;
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

  beforeEach(async function () {

    this.DutchAuction = await DutchAuction.new(wallet, price_start, price_constant, price_exponent,price_adjustment,goal)
    this.QuadrantToken = await QuadrantToken.new(this.DutchAuction.address,wallet,owner,_initial_wallet_supply,_initial_sale_supply)
    //console.log('this.QuadrantToken.address ' + this.QuadrantToken.address)
   // console.log('this.DutchAuction.address ' + this.DutchAuction.address)
  });

  it('should have an owner', async function () {
    let owner = await this.QuadrantToken.owner();
    assert.isTrue(owner !== 0);
  });

  it('changes owner after transfer', async function () {
    
    await this.QuadrantToken.transferOwnership(purchaser1);
    let owner = await this.QuadrantToken.owner();

    assert.isTrue(owner === purchaser1);
  });

  it('should prevent non-owners from transfering', async function () {
   
    const owner = await this.QuadrantToken.owner.call();
    assert.isTrue(owner !== purchaser2);
    await this.QuadrantToken.transferOwnership(purchaser2, { from: purchaser1 }).should.be.rejected;
  });

  it('should guard ownership against stuck state', async function () {
    let originalOwner = await this.QuadrantToken.owner();
    await this.QuadrantToken.transferOwnership(null, { from: originalOwner }).should.be.rejected;
  });
});
