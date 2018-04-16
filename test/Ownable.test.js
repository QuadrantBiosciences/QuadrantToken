
import assertRevert from '../test/helpers/assertRevert';
import ether from '../test/helpers/ether'
const BigNumber = web3.BigNumber
var DutchAuction = artifacts.require('DutchAuction');

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
   // console.log('this.DutchAuction.address ' + this.DutchAuction.address)
  });

  it('should have an owner', async function () {
    let owner = await this.DutchAuction.owner();
    assert.isTrue(owner !== 0);
  });

  it('changes owner after transfer', async function () {
    
    await this.DutchAuction.transferOwnership(purchaser1);
    let owner = await this.DutchAuction.owner();

    assert.isTrue(owner === purchaser1);
  });

  it('should prevent non-owners from transfering', async function () {
   
    const owner = await this.DutchAuction.owner.call();
    assert.isTrue(owner !== purchaser2);
    await assertRevert(this.DutchAuction.transferOwnership(purchaser2, { from: purchaser2 }));
  });

  it('should guard ownership against stuck state', async function () {
    let originalOwner = await this.DutchAuction.owner();
    await assertRevert(this.DutchAuction.transferOwnership(null, { from: originalOwner }));
  });
});
