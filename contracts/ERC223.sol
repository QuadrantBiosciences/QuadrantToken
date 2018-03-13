pragma solidity ^0.4.18;

 /*
  ERC223 additions to ERC20

  Interface wise is ERC20 + data paramenter to transfer and transferFrom.
 */

import "../zeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract ERC223 is ERC20 {
  function transfer(address to, uint value, bytes data) public returns (bool ok);
  function transferFrom(address from, address to, uint value, bytes data) public returns (bool ok);
}