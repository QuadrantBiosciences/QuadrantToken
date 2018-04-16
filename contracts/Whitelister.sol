pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Whitelister is Ownable {

    address public whitelister_address;
   
    //User: can be buyer or seller 
    struct User {
        //code for country of citizenship
        uint  countryCode;
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
    
    function addToWhitelist(address[] bidderAddresses, uint[] countryCode, uint[] expiryDate) public isWhitelister {
        for (uint32 i = 0; i < bidderAddresses.length; i++) {
            setUser(bidderAddresses[i], countryCode[i], expiryDate[i], false);
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
        User storage user = users[_address];
        setUser(_address, user.countryCode, expiryDate, user.isRemoved);
    }

    function setResident(address _address, uint  countryCode) public isWhitelister {
        User storage user = users[_address];
        setUser(_address, countryCode, user.expiryDate, user.isRemoved);
    } 

    function setUser(address _address, uint countryCode, uint expiryDate, bool isRemoved) public isWhitelister  {
        
        User storage user = users[_address];
        if (user.expiryDate == 0) {
            whitelist.push(_address)-1;
        }
        if (user.countryCode != countryCode) {
            user.countryCode = countryCode;
        }
        if (user.isRemoved != isRemoved) {
            user.isRemoved = isRemoved;
        }
        if ( user.expiryDate < expiryDate || user.expiryDate == 0 ) {
            user.expiryDate = expiryDate;
        }
        
        
    }

    function getWhitelist()  public view isWhitelister returns (address[]) {
        return whitelist;
    }
        
    function getUserResidentCountryCode(address ins)  public view returns (uint) {
        return (uint(users[ins].countryCode));
    }
    function isWhitelisted(address ins) public view  returns (bool) {
        return ((now < users[ins].expiryDate) && (!users[ins].isRemoved));
    }
    function getUser(address ins)  public view returns (uint, uint) {
        return (users[ins].countryCode, users[ins].expiryDate);
    }
    function countUsers()  public view returns (uint) {
        return whitelist.length;
    }
       ///change whitelister Address
    function changeWhiteLister(address whitelisterAddress) public onlyOwner {
        require(whitelisterAddress != 0);
        whitelister_address = whitelisterAddress;
    }
  }
