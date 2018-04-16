import ether from '../test/helpers/ether'
import {
  advanceBlock
} from '../test/helpers/advanceToBlock'
import {
  increaseTimeTo,
  duration
} from '../test/helpers/increaseTime'
import latestTime from '../test/helpers/latestTime'
import EVMThrow from '../test/helpers/EVMThrow'
const {
  expectThrow
} = require('../test/helpers/util');
const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const QuadrantToken = artifacts.require('QuadrantToken')
const token = artifacts.require('QuadrantToken')

const gas = 4700000
const _initial_wallet_supply = new BigNumber(80000000);
const _initial_sale_supply = new BigNumber(20000000);

const initialOwnerBalance = new BigNumber(20000000);
const initialTotalBalance = new BigNumber(100000000);
const tokenToMint = new BigNumber(500);
const accountaddress = "0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201"
contract('QuadrantToken:', function ([deployOwner, investor, wallet, purchaser]) {

  let ownerBalance;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now"
    // function interpreted by testrpc
    this.startTime = latestTime();
    this.endTime = this.startTime + duration.weeks();
    this.afterEndTime = this.endTime + duration.seconds(1);
    this.expiryDate = this.startTime + duration.days(90);
    await advanceBlock()
  })

  describe('MintableToken: ', () => {
    before(async function () {
      this.token = await token.new(deployOwner, wallet, deployOwner, _initial_wallet_supply,_initial_sale_supply)
    });

    it('should have mint function', async function () {
      this.token.mint.should.exist
      let type = typeof this.token.mint
      type
        .should
        .equal('function')
    });
    it('should have finishMinting function', async function () {
      this.token.finishMinting.should.exist
      let type = typeof this.token.finishMinting
      type
        .should
        .equal('function')
    });
    it('should have mintingFinished variable', async function () {
      this.token.mintingFinished.should.exist
      let type = typeof this.token.mintingFinished
      type
        .should
        .equal('function') // A function does get returned for variables
    });
    it("should return the correct totalSupply after construction", async function () {
      const totalSupply = await this
        .token
        .totalSupply();
      totalSupply
        .should
        .be
        .bignumber
        .equal(initialTotalBalance);
    });

    it("should return the correct balance of contract's owner after construction", async function () {
      // let token_owner = await  this.token.owner;
      ownerBalance = await this
        .token
        .balanceOf(deployOwner);
      ownerBalance
        .should
        .be
        .bignumber
        .equal(initialOwnerBalance);
    });

    it("should return correct balances after transfer", async function () {
      this.timeout(4500000);
      const tokenToTransfer = new BigNumber(200);
      let previousBalance = await this
        .token
        .balanceOf(deployOwner);
      await this
        .token
        .mint(deployOwner, tokenToMint);

      await this.token.addToWhitelist([accountaddress, deployOwner], [1,1],[this.expiryDate,this.expiryDate]  ,{
        from: deployOwner
      })

      await this
        .token
        .transfer(accountaddress, tokenToTransfer, {
          from: deployOwner
        });
      const owenershoudlHave = previousBalance.add(tokenToMint - tokenToTransfer);
      const accountBalance = await this
        .token
        .balanceOf(accountaddress);
      const currentBalance = await this
        .token
        .balanceOf(deployOwner);
      accountBalance
        .should
        .be
        .bignumber
        .equal(tokenToTransfer);
      currentBalance
        .should
        .be
        .bignumber
        .equal(owenershoudlHave);
    });

    it("should return currect owner balance after owner burning 100 tokens", async function () {
      let previousBalance = await this
        .token
        .balanceOf(deployOwner);
      await this
        .token
        .mint(deployOwner, tokenToMint);
      previousBalance = previousBalance.add(tokenToMint);
      const tokenToBurn = new BigNumber(100);
      await this
        .token
        .burnTokens(deployOwner, tokenToBurn, {
          from: deployOwner
        });
      previousBalance = previousBalance.sub(tokenToBurn);
      ownerBalance = await this
        .token
        .balanceOf(deployOwner)
      ownerBalance
        .should
        .be
        .bignumber
        .equal(previousBalance);
    });
    it("should return currect total balance after owner burns 100 tokens", async function () {
      let previousBalance = await this
        .token
        .balanceOf(deployOwner);
      await this
        .token
        .mint(deployOwner, tokenToMint);
      const tokenToBurn = new BigNumber(100);
      await this
        .token
        .burnTokens(deployOwner, tokenToBurn, {
          from: deployOwner
        });
      previousBalance = previousBalance.sub(tokenToMint);
      let totalSupply = await this
        .token
        .totalSupply();
      totalSupply
        .should
        .be
        .bignumber
        .equal(new BigNumber(100001300));
    });
    it('should throw an error when trying to transfer more than balance', async function () {
      let currentAccountBlance = await this
        .token
        .balanceOf(accountaddress);
      await this
        .token
        .mint(accountaddress, tokenToMint);
      currentAccountBlance = currentAccountBlance.add(tokenToMint + 1);
      await this
        .token
        .transfer(deployOwner, currentAccountBlance, {
          from: accountaddress
        })
        .should
        .be
        .rejected
    });
    it('should throw an error when trying to transfer to 0x0', async function () {
      await this
        .token
        .mint(deployOwner, 500);
      await this
        .token
        .transfer(0x0, 100, {
          from: deployOwner
        })
        .should
        .be
        .rejected

    });
    it('should throw an error when trying to burn more than owners balance', async function () {
      this.timeout(4500000);
      let currentAccountBlance = await this
        .token
        .balanceOf(deployOwner);
      // await this.token.mint(deployOwner, tokenToMint);
      await this
        .token
        .burnTokens(currentAccountBlance.add(new BigNumber(1)), {
          from: deployOwner
        })
        .should
        .be
        .rejected
    });
    it('should return paused false after construction', async function () {
      let paused = await this
        .token
        .paused();

      assert.equal(paused, false);
    });
    it('should return paused true after pause', async function () {
      await this
        .token
        .pause();
      let paused = await this
        .token
        .paused();

      assert.equal(paused, true);
    });
    it('should return paused false after pause and unpause', async function () {
      let paused = await this
        .token
        .paused();
      if (paused) {
        await this
          .token
          .unpause();
      }
      await this
        .token
        .pause();
      paused = await this
        .token
        .paused();

      assert.equal(paused, true);
    });
    it('should be able to transfer if transfers are unpaused', async function () {
      let paused = await this
        .token
        .paused();
      if (paused) {
        await this
          .token
          .unpause();
      }
      const tokenToTransfer = new BigNumber(100);
      let prebalance = await this
        .token
        .balanceOf(deployOwner);
      let prebalanceAcc = await this
        .token
        .balanceOf(accountaddress);
      await this
        .token
        .transfer(accountaddress, tokenToTransfer);
      let balance0 = await this
        .token
        .balanceOf(deployOwner);

      balance0
        .should
        .be
        .bignumber
        .equal(prebalance.sub(tokenToTransfer));
      let balance1 = await this
        .token
        .balanceOf(accountaddress);
      balance1
        .should
        .be
        .bignumber
        .equal(prebalanceAcc.add(tokenToTransfer));

    });

    it('should throw an error trying to transfer while transactions are paused', async function () {
      let paused = await this
        .token
        .paused();
      if (paused) {
        await this
          .token
          .unpause();
      }
      await this.token.pause();

      expectThrow(this.token.transfer(accountaddress, new BigNumber(100)));

    });
    it('should throw an error when trying to transfer to a non whitelisted user', async function () {
      await this.token.mint(deployOwner, 500);
      await this.token.transfer(purchaser, 100, {from: deployOwner}).should.be.rejected
    });
    it('should not throw an error when trying to transfer to a whitelisted user', async function () {
      await this.token.mint(deployOwner, 500);
      await this.token.addToWhitelist([purchaser], [1],[this.expiryDate]  ,{from: deployOwner})
      await this.token.unpause();
      await this.token.transfer(purchaser, 100, {from: deployOwner}).should.not.be.rejected
    });
  })

})