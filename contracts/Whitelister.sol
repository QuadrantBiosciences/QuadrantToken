pragma solidity ^0.4.18;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Whitelister is Ownable {

    address public whitelister_address;
   
    enum Resident {
        USA, NonUSA
    }

    //User: can be buyer or seller 
    struct User {
        //Flag for USA citizen
        Resident  status;
        //KYC AI approved date
        uint  expiryDate; 
        bool isRemoved;
       
    }
    
    mapping(address => User) public users;
   
    address[] public whitelist;

    event AddedToWhiteList(address indexed _account);

    modifier isWhitelister() {
        require(msg.sender == whitelister_address);
        _;
    }  
    
    function addToWhitelist(address[] bidderAddresses, uint[] status, uint[] expiryDate) public isWhitelister {
        for (uint32 i = 0; i < bidderAddresses.length; i++) {
            setUser(bidderAddresses[i], Resident(status[i]), expiryDate[i], false);
        }
    }

    /// @notice Removes account addresses from whitelist.
    /// @dev Removes account addresses from whitelist.
    /// @param bidderAddresses Array of addresses.
    function removeFromWhitelist(address[] bidderAddresses) public isWhitelister {
        for (uint32 i = 0; i < bidderAddresses.length; i++) {
            users[bidderAddresses[i]].isRemoved = true;
        }
    }

    function setExpiryDate(address _address, uint expiryDate) public isWhitelister {
        var user = users[_address];
        setUser(_address, user.status, expiryDate, user.isRemoved);
    }

    function setResident(address _address, Resident  status) public isWhitelister {
        var user = users[_address];
        setUser(_address, status, user.expiryDate, user.isRemoved);
    } 

    function setUser(address _address, Resident status, uint expiryDate, bool isRemoved) public isWhitelister  {
        
        var user = users[_address];
        if (user.expiryDate == 0) {
            whitelist.push(_address)-1;
        }
        if (user.status != status) {
            user.status = status;
        }
        if (user.isRemoved != isRemoved) {
            user.isRemoved = isRemoved;
        }
        if (user.expiryDate < expiryDate || user.expiryDate == 0 ) {
            user.expiryDate = expiryDate;
        }
        
        
    }

    function getWhitelist()  public view isWhitelister returns (address[]) {
        return whitelist;
    }
    
    function getUsers()  public view isWhitelister returns (address[], uint[], uint[]) {
        address[] memory addrs = new address[](whitelist.length);
        uint[]    memory resident = new uint[](whitelist.length);
        uint[]    memory expiry = new uint[](whitelist.length);
        
        for (uint i = 0; i < whitelist.length; i++) {
            var user = users[whitelist[i]];
            addrs[i] = whitelist[i];
            resident[i] = uint(user.status);
            expiry[i] = user.expiryDate;
        }
        
        return (addrs, resident, expiry);
    }

    function getUserResidentStatus(address ins)  public view returns (uint) {
        return (uint(users[ins].status));
    }
    function isWhitelisted(address ins) public view  returns (bool) {
        return ((now < users[ins].expiryDate) && (!users[ins].isRemoved));
    }
    function getUser(address ins)  public view returns (Resident, uint) {
        return (users[ins].status, users[ins].expiryDate);
    }
    function countUsers()  public view returns (uint) {
        return whitelist.length;
    }
       ///change Wallet Address
    function changeWhiteLister(address whitelisterAddress) public onlyOwner {
        require(whitelisterAddress != 0);
        whitelister_address = whitelisterAddress;
    }
  }
