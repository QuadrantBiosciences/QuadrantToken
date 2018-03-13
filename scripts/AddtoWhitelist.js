const quadrantToken = artifacts.require("./QuadrantToken.sol");

const fs = require('fs');
const BN = require('bn.js');
module.exports = function(deployer) {
  let owner="0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39";
  let usersConf;
 
  usersConf = JSON.parse(fs.readFileSync('./conf/addWallets.json'));
 
  const wallets = [];
  const resident = [];
  const expiry = [];
  for (user in usersConf) {
    wallets.push(usersConf[user].address);
    resident.push(usersConf[user].resident);
    expiry.push(usersConf[user].expiry);
  }
 
  var inst;
  
  quadrantToken.at('0x24d718f7d8af7d7a4abaa2b1cb7abbb36a23a00d').then(function(instance) {
    inst = instance;
    console.log('quadrantToken:' + instance.address);
    console.log('result: '+ JSON.stringify(wallets,null,2));
    console.log('result: '+ JSON.stringify(resident,null,2));
    console.log('result: '+ JSON.stringify(expiry,null,2));
    //return true;
    instance.addToWhitelist(wallets,resident,expiry ,{from: owner, gas: 4700000});
    //instance.removeFromWhitelist(['0xe84da28128a48dd5585d1abb1ba67276fdd70800']);
     
    return inst.isWhitelisted('0xe84da28128a48dd5585d1abb1ba67276fdd70800');
  }).then(function(result) {
    console.log('result: '+ JSON.stringify(result,null,2))
    return inst.getUsers();
  }).then(function(result) {
    // If this callback is called, the transaction was successfully processed.
    console.log('result: '+ JSON.stringify(result,null,2))
  }).catch(function(e) {
    console.log(e)
    // There was an error! Handle it.
  })
};
