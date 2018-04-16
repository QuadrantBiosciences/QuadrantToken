pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract BurnableToken is StandardToken, Ownable {

  
  /** How many tokens we burned */
    event Burned(address burner, uint burnedAmount);

 
  /**
   * @dev Provides an internal function for destroying tokens. Useful for upgrades.
   */
    function burnTokens(address _account, uint _amount) public onlyOwner returns (bool) {
    
        require(_amount > 0);
        require(_account != 0x0);
        
        balances[_account] = balances[_account].sub(_amount);
        totalSupply_ = totalSupply_.sub(_amount);
      
        emit Burned(_account, _amount);
        emit Transfer(address(0), _account, _amount);
        return true;
    
    }
}
