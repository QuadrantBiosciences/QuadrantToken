pragma solidity ^0.4.21;
import "./BurnableToken.sol";
import "./Whitelister.sol";
import "zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";

import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract QuadrantToken is BurnableToken, MintableToken, PausableToken, Whitelister {
    string public constant  name="Quadrant";
    string public constant symbol = "QBI"; 
    uint8 public constant decimals =0 ;
    string public constant version="V1.0";
    uint constant multiplier = 10 ** uint(decimals);
    bool ignoreWhitelist = false;
    


   event Deployed(uint indexed _total_supply);
    using SafeMath for uint;


 
    function QuadrantToken(
        address _auction_address,
        address _wallet_address,
        address _whitelister_address,
        uint _initial_wallet_supply,
        uint _initial_sale_supply)
        public
    {
        // Auction address should not be null.
        require(_auction_address != 0x0);
        require(_wallet_address != 0x0);
        require(_whitelister_address != 0x0);

        // Initial supply 
        require(_initial_wallet_supply > 0);
        require(_initial_sale_supply > 0);

        whitelister_address = _whitelister_address;

        // Total supply of Qcoin at deployment
        totalSupply_ = _initial_wallet_supply.add(_initial_sale_supply);

        balances[_auction_address] = _initial_sale_supply;
        balances[_wallet_address] = _initial_wallet_supply;

        emit Transfer(0x0, _auction_address, balances[_auction_address]);
        emit Transfer(0x0, _wallet_address, balances[_wallet_address]);

        emit Deployed(totalSupply_);

        assert(totalSupply_ == balances[_auction_address].add(balances[_wallet_address]));
    }
    //function that is called when a user or another contract wants to transfer funds
  function transfer(address _to, uint _value) public returns (bool success) {
    
    require(ignoreWhitelist == true || (isWhitelisted(msg.sender) && isWhitelisted(_to)));
    
    //filtering if the target is a contract with bytecode inside it
    if (!super.transfer(_to, _value)) revert(); // do a normal token transfer
    return true;
  }

  function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
    
    require(ignoreWhitelist == true || (isWhitelisted(msg.sender) && isWhitelisted(_to)));

    if (!super.transferFrom(_from, _to, _value)) revert(); // do a normal token transfer
    return true;
  }
  
  function toggleIgnoreWhitelist() public onlyOwner {
    ignoreWhitelist = !ignoreWhitelist;
  }
    
}
