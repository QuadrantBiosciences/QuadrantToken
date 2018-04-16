pragma solidity ^0.4.21;

import "./QuadrantToken.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./Whitelister.sol";
/// @title Dutch auction contract - distribution of a fixed number of tokens using an auction.
/// The auction contract code is based on the Raiden auction contract code.   Main differences are: we added rewards tiers to the auction;  
/// we added country based rules to the auction; and we added an individual and full refund process.    


contract DutchAuction is Pausable {
    /*
     * Auction for the Quadrant Token.
     *
     * Terminology:
     * 1 token unit = QBI
     * token_multiplier set from token's number of decimals (i.e. 10 ** decimals)
     */

    using SafeMath for uint;

    // Wait 7 days after the end of the auction, before anyone can claim tokens
    uint constant private token_claim_waiting_period = 7 days;
    uint constant private goal_plus_8 = 8 hours;
    uint constant private auction_duration = 14 days;
    
    //Bonus tiers and percentange bonus per tier  
    uint constant private tier1Time = 24 hours;
    uint constant private tier2Time = 48 hours;
    uint constant private tier1Bonus = 10;
    uint constant private tier2Bonus = 5;
    
    //we need multiplier to keep track of fractional tokens temporarily
    uint constant private token_adjuster = 10**18;
    //Storage    
    QuadrantToken public token;
    
    //address public owner_address;
    address public wallet_address;
   
    
    bool public refundIsStopped = true;
    bool public refundForIndividualsIsStopped = true;

    // Price decay function parameters to be changed depending on the desired outcome

    // Starting price in WEI; e.g. 2 * 10 ** 18
    uint public price_start;

    // Divisor constant; e.g. 524880000
    uint public price_constant;

    // Divisor exponent; e.g. 3
    uint public price_exponent;

    //Price adjustment to make sure price doesn't go below pre auction investor price
    uint public price_adjustment = 0;

    // For calculating elapsed time for price
    uint public start_time;
    uint public end_time;
    uint public start_block;
    uint public goal_time = now + 365 days;

    // Keep track of all ETH received in the bids
    uint public received_wei;

    uint public wei_for_excedent;
    
    uint public refundValueForIndividuals;
    uint public refundValueForAll;

    // Keep track of all ETH received during Tier 1 bonus duration 
    uint public recievedTier1BonusWei;

    // Keep track of all ETH received during Tier 2 bonus duration 
    uint public recievedTier2BonusWei;

    // Keep track of cumulative ETH funds for which the tokens have been claimed
    uint public funds_claimed;
    
    //uint public elapsed;
    uint public token_multiplier;

    // Once this goal (# tokens) is met, auction will close after 8 hours
    uint public goal;

    // Total number of QBI tokens that will be auctioned
    uint public targetTokens;

    // Price of QBI token at the end of the auction: Wei per QBI token
    uint public final_price;

    // Bidder address => bid value
    mapping (address => uint) public bids;
 
    //Bidder address => bid that are received during Tier 1 bonus duration
    mapping (address => uint) public bidsWithTier1Bonus;
    
    //Bidder address => bid that are received during Tier 2 bonus duration
    mapping (address => uint) public bidsWithTier2Bonus;

    // Whitelist of individual addresses that are allowed to get refund
    mapping (address => bool) public refundForIndividualsWhitelist;

    Stages public stage;

    struct CountryLimit {
        // minimum amount needed to place the bid
        uint minAmount;
        //max no of people who can bid from this country
        uint maxBids;
        //counter for no of bids for this country
        uint bidCount;

    }


    mapping (uint => CountryLimit) public countryRulesList;
    /*
     * Enums
     */
    enum Stages {
        AuctionDeployed,
        AuctionSetUp,
        AuctionStarted,
        AuctionEnded,
        TokensDistributed
    }

    /*
     * Modifiers
     */
    modifier atStage(Stages _stage) {
        require(stage == _stage);
        _;
    }
    
    modifier refundIsRunning() {
        assert(refundIsStopped == false);
        _;
    }

    modifier refundForIndividualsIsRunning() {
        assert(refundForIndividualsIsStopped == false);
        _;
    }

  

    /*
     * Events
     */
    event Deployed(uint indexed _price_start,uint indexed _price_constant,uint32 indexed _price_exponent ,uint _price_adjustment);
    event Setup();
    event AuctionStarted(uint indexed _start_time, uint indexed _block_number);
    event BidSubmission(address indexed _sender, uint _amount, uint _balanceFunds);
    event ReturnedExcedent(address indexed _sender, uint _amount);
    event ClaimedTokens(address indexed _recipient, uint _sent_amount);
    event ClaimedBonusTokens(address indexed _recipient, uint _sent_amount);
    event AuctionEnded(uint _final_price);
    event TokensDistributed();
    event Refunded(address indexed beneficiary, uint256 weiAmount);
    
    /*
     * Public functions
     */

    /// @dev Contract constructor function sets the starting price, divisor constant and
    /// divisor exponent for calculating the Dutch Auction price.
    /// @param _wallet_address Wallet address to which all contributed ETH will be forwarded.
    /// @param _price_start High price in WEI at which the auction starts.
    /// @param _price_constant Auction price divisor constant.
    /// @param _price_exponent Auction price divisor exponent.
    function DutchAuction(
        address _wallet_address,
        uint _price_start,
        uint _price_constant,
        uint32 _price_exponent,
        uint _price_adjustment,
        uint _goal)
        public
    {
        require(_wallet_address != 0x0);
        wallet_address = _wallet_address;
       

        //owner_address = msg.sender;
        stage = Stages.AuctionDeployed;
        changeSettings(_price_start, _price_constant, _price_exponent, _price_adjustment, _goal);
        emit Deployed(_price_start, _price_constant, _price_exponent, _price_adjustment);
    }

 /// @dev Fallback function for the contract, which calls bid() if the auction has started.
    function loadForExcedent() public payable whenNotPaused atStage(Stages.AuctionEnded) {
       wei_for_excedent = wei_for_excedent.add(msg.value);
    }
    /// @dev Fallback function for the contract, which calls bid() if the auction has started.
    function () public payable atStage(Stages.AuctionStarted) whenNotPaused {
        bid();
    }

    /// @notice Set `tokenAddress` as the token address to be used in the auction.
    /// @dev Setup function sets external contracts addresses.
    /// @param tokenAddress Token address.
    function setup(address tokenAddress) public onlyOwner atStage(Stages.AuctionDeployed) {
        require(tokenAddress != 0x0);
        token = QuadrantToken(tokenAddress);

        // Get number of QBI to be auctioned from token auction balance
        targetTokens = token.balanceOf(address(this));

        // Set the number of the token multiplier for its decimals
        token_multiplier = 10 ** uint(token.decimals());

        stage = Stages.AuctionSetUp;
        emit Setup();
    }

    /// @notice Set `_price_start`, `_price_constant` and `_price_exponent` as
    /// the new starting price, price divisor constant and price divisor exponent.
    /// @dev Changes auction price function parameters before auction is started.
    /// @param _price_start Updated start price.
    /// @param _price_constant Updated price divisor constant.
    /// @param _price_exponent Updated price divisor exponent.
    function changeSettings(
        uint _price_start,
        uint _price_constant,
        uint32 _price_exponent,
        uint _price_adjustment,
        uint _goal
        )
        internal
    {
        require(stage == Stages.AuctionDeployed || stage == Stages.AuctionSetUp);
        require(_price_start > 0);
        require(_price_constant > 0);

        price_start = _price_start;
        price_constant = _price_constant;
        price_exponent = _price_exponent;
        price_adjustment = _price_adjustment;
        goal = _goal;
    }

    /// @notice Start the auction.
    /// @dev Starts auction and sets start_time.
    function startAuction() public onlyOwner atStage(Stages.AuctionSetUp) {
        stage = Stages.AuctionStarted;
        start_time = now;
        end_time = now + auction_duration;
        start_block = block.number;
        emit AuctionStarted(start_time, start_block);
    }

    /// @notice Finalize the auction - sets the final QBI token price and changes the auction
    /// stage after no bids are allowed anymore.
    /// @dev Finalize auction and set the final QBI token price.
    function finalizeAuction() public onlyOwner whenNotPaused atStage(Stages.AuctionStarted) {
        // Missing funds should be 0 at this point
        uint balanceFunds;
        uint tokensCommitted;
        uint bonusTokensCommitted;
        (balanceFunds, tokensCommitted, bonusTokensCommitted) = balanceFundsToEndAuction();
        require(balanceFunds == 0 || tokensCommitted.add(bonusTokensCommitted) >= goal || end_time < now );

        // Calculate the final price = WEI / QBI
        // Reminder: targetTokens is the number of QBI that are auctioned
        // we do not consider bonus tokens to calculate price
        final_price = token_multiplier.mul(received_wei.add(getBonusWei())).div(targetTokens);

        end_time = now;
        stage = Stages.AuctionEnded;
        emit AuctionEnded(final_price);

        assert(final_price > 0);
    }

    /// --------------------------------- Auction Functions ------------------


    /// @notice Send `msg.value` WEI to the auction from the `msg.sender` account.
    /// @dev Allows to send a bid to the auction.
    function bid() public payable atStage(Stages.AuctionStarted) whenNotPaused {
        
        require(end_time >= now);    
        require((goal_time.add(goal_plus_8)) > now);    
        require(msg.value > 0);
        
        require(token.isWhitelisted(msg.sender));

        uint userCountryCode = token.getUserResidentCountryCode(msg.sender);
        checkCountryRules(userCountryCode);
        
        assert(bids[msg.sender].add(msg.value) >= msg.value);

        uint weiAmount = msg.value;

        // Missing funds, Tokens Committed, and Bonus Tokens Committed without the current bid value
        uint balanceFunds;
        uint tokensCommitted;
        uint bonusTokensCommitted;
        (balanceFunds, tokensCommitted, bonusTokensCommitted) = balanceFundsToEndAuction();
       

        uint bidAmount = weiAmount;
        uint returnExcedent = 0;
        if (balanceFunds < weiAmount) {
           returnExcedent = weiAmount.sub(balanceFunds);
           bidAmount = balanceFunds;
        }
      
        bool bidBefore = (bids[msg.sender] > 0);
        // We require bid values to be less than the funds missing to end the auction
        // at the current price.
        require((bidAmount <= balanceFunds) && bidAmount > 0);

        bids[msg.sender] += bidAmount;
        
        //if bid is recieved during bonus tier 1 duration       
        if (isInTier1BonusTime() == true) {
            recievedTier1BonusWei = recievedTier1BonusWei.add(bidAmount);
            bidsWithTier1Bonus[msg.sender] = bidsWithTier1Bonus[msg.sender].add(bidAmount);
        //if bid is recieved during bonus tier 2 duration       
        } else if (isInTier2BonusTime() == true) {
            recievedTier2BonusWei = recievedTier2BonusWei.add(bidAmount);
            bidsWithTier2Bonus[msg.sender] = bidsWithTier2Bonus[msg.sender].add(bidAmount);
        }
        
        // increase the counter for no of bids from that country
        if (userCountryCode > 0 && bidBefore == false) {
            countryRulesList[userCountryCode].bidCount = countryRulesList[userCountryCode].bidCount.add(1);
        }
        received_wei = received_wei.add(bidAmount);
        // Send bid amount to wallet
        wallet_address.transfer(bidAmount);

        emit BidSubmission(msg.sender, bidAmount, balanceFunds);

        assert(received_wei >= bidAmount);
      

        if (returnExcedent > 0) {
            msg.sender.transfer(returnExcedent);
            emit ReturnedExcedent(msg.sender, returnExcedent);
        }

 
        //Check if auction goal is met. Goal means 90% of total tokens to be auctioned.
       hasGoalReached();
    }

    // This is refund if for any reason auction is cancelled and we refund everyone's money
    function refund() public refundIsRunning whenPaused {
        uint256 depositedValue = bids[msg.sender];
        require(refundValueForAll >= depositedValue);
        internalRefund(depositedValue);
        refundValueForAll = refundValueForAll.sub(depositedValue);
    }

     // This is refund if for any reason, we refund particular individual's money
    function refundForIndividuals() public refundForIndividualsIsRunning {
        
        require(refundForIndividualsWhitelist[msg.sender]);
        uint256 depositedValue = bids[msg.sender];
        require(refundValueForIndividuals >= depositedValue);
        internalRefund(depositedValue);
        refundValueForIndividuals = refundValueForIndividuals.sub(depositedValue);

    }

    function internalRefund(uint256 depositedValue) private {
        
        
        uint256 depositedTier1Value = bidsWithTier1Bonus[msg.sender];
        uint256 depositedTier2Value = bidsWithTier2Bonus[msg.sender];
       
        require(depositedValue > 0);
        bids[msg.sender] = 0;
        bidsWithTier1Bonus[msg.sender] = 0;
        bidsWithTier2Bonus[msg.sender] = 0;
        assert(bids[msg.sender] == 0);
        assert(bidsWithTier1Bonus[msg.sender] == 0);
        assert(bidsWithTier2Bonus[msg.sender] == 0);
        
        received_wei = received_wei.sub(depositedValue);
        recievedTier1BonusWei = recievedTier1BonusWei.sub(depositedTier1Value);
        recievedTier2BonusWei = recievedTier2BonusWei.sub(depositedTier2Value);
        
        msg.sender.transfer(depositedValue);
        emit Refunded(msg.sender, depositedValue);
     }

    /// @notice Claim auction tokens for `msg.sender` after the auction has ended.
    /// @dev Claims tokens for `msg.sender` after auction. To be used if tokens can
    /// be claimed by beneficiaries, individually.


    function claimTokens() public whenNotPaused atStage(Stages.AuctionEnded) returns (bool) {
        // Waiting period after the end of the auction, before anyone can claim tokens
        // Ensures enough time to check if auction was finalized correctly
        // before users start transacting tokens

        address receiver_address = msg.sender;
       
        require(now > end_time + token_claim_waiting_period);
        require(receiver_address != 0x0);
        
        // Check if the wallet address of requestor is in the whitelist
        require(token.isWhitelisted(address(this)));
        require(token.isWhitelisted(receiver_address));

        // Make sure there is enough wei for the excedent value of the bid
        require(wei_for_excedent > final_price);

        if (bids[receiver_address] == 0) {
            return false;
        }

        // Number of QBI = bid_wei / final price
        uint tokens = token_adjuster.mul(token_multiplier.mul(bids[receiver_address])).div(final_price);
        
       // Calculate total tokens = tokens + bonus tokens
       // Calculate total effective bid including bonus
        uint totalBid; 
        uint totalTokens;
        (totalBid, totalTokens) = calculateBonus(tokens);

        totalTokens = totalTokens.div(token_adjuster);
        uint returnExcedent = totalBid.sub(totalTokens.mul(final_price));
        
        // Update the total amount of funds for which tokens have been claimed
        funds_claimed += bids[receiver_address];

        // Set receiver bid to 0 before assigning tokens
        bids[receiver_address] = 0;
        bidsWithTier1Bonus[receiver_address] = 0;
        bidsWithTier2Bonus[receiver_address] = 0;
        
        // After the last tokens are claimed, we change the auction stage
        // Due to the above logic, rounding errors will not be an issue
        if (funds_claimed == received_wei) {
            stage = Stages.TokensDistributed;
            emit TokensDistributed();
        }

        //assert(final_price > returnExcedent);
        if (returnExcedent > 0) {
            wei_for_excedent = wei_for_excedent.sub(returnExcedent);
            msg.sender.transfer(returnExcedent);            
            emit ReturnedExcedent(msg.sender, returnExcedent);
        }

        assert(token.transfer(receiver_address, totalTokens));
        
        emit ClaimedTokens(receiver_address, totalTokens);

        assert(token.balanceOf(receiver_address) >= totalTokens);
        
        assert(bids[receiver_address] == 0);
        assert(bidsWithTier1Bonus[receiver_address] == 0);
        assert(bidsWithTier2Bonus[receiver_address] == 0);


        return true;
    }

    function calculateBonus(uint tokens) private constant returns (uint totalBid, uint  totalTokens) {

        // This function returns the total effective bid = bid + bonus bid
        // This function returns the total number of tokens = tokens + bonus tokens
        address receiver_address = msg.sender;
        uint tier1bonusBid = (bidsWithTier1Bonus[receiver_address].mul(tier1Bonus)).div(100);
        uint tier2bonusBid = (bidsWithTier2Bonus[receiver_address].mul(tier2Bonus)).div(100);

        uint tier1bonusTokens = token_adjuster.mul(token_multiplier.mul(bidsWithTier1Bonus[receiver_address])).mul(tier1Bonus).div(final_price.mul(100));
        uint tier2bonusTokens = token_adjuster.mul(token_multiplier.mul(bidsWithTier2Bonus[receiver_address])).mul(tier2Bonus).div(final_price.mul(100));

        uint bonusBid = tier1bonusBid.add(tier2bonusBid);
        uint bonusTokens = tier1bonusTokens.add(tier2bonusTokens);
     
        totalBid = bids[receiver_address].add(bonusBid);
        totalTokens = tokens.add(bonusTokens);
        
    }
    /// @notice Get the QBI price in WEI during the auction, at the time of
    /// calling this function. Returns `0` if auction has ended.
    /// Returns `price_start` before auction has started.
    /// @dev Calculates the current QBI token price in WEI.
    /// @return Returns WEI per QBI.
    function price() public view returns (uint) {
        if (stage == Stages.AuctionEnded ||
            stage == Stages.TokensDistributed) {
            return 0;
        }
        return calcTokenPrice();
    }

    /// @notice Get the missing funds needed to end the auction,
    /// calculated at the current QBI price in WEI.
    /// @dev The missing funds amount necessary to end the auction at the current QBI price in WEI.
    /// @return Returns the missing funds amount in WEI.
    function balanceFundsToEndAuction()  public view returns (uint balanceFunds, uint tokensCommitted, uint bonusTokensCommitted) {

        uint tokenPrice = 0;
        // targetTokens = total number of Rei (QCOIN * token_multiplier) that is auctioned
        
        //we need to consider bonus wei also in missing funds 
        uint bonusWeiSoFar = 0;        
        (tokenPrice, tokensCommitted, bonusTokensCommitted, bonusWeiSoFar) = tokenCommittedSoFar();  
        uint required_wei_at_price = targetTokens.mul(tokenPrice).div(token_multiplier);  
        if (required_wei_at_price <= received_wei.add(bonusWeiSoFar)) {
            balanceFunds = 0;
        } else {
            balanceFunds = required_wei_at_price.sub(received_wei.add(bonusWeiSoFar));
            if (isInTier1BonusTime() == true) {
                // Missing Funds are effectively smaller
                balanceFunds = (balanceFunds.mul(100)).div(tier1Bonus.add(100));
            } else if (isInTier2BonusTime()) {
                //Missing Funds are effectively smaller
                balanceFunds = (balanceFunds.mul(100)).div(tier2Bonus.add(100));
            }
        }
            
        // assert(required_wei_at_price - received_wei > 0);
       // return (required_wei_at_price - received_wei, received_wei/tokenPrice);
    }

    function tokenCommittedSoFar() public view  returns (uint tokenPrice, uint tokensCommitted, uint bonusTokensCommitted, uint bonusWeiSoFar) {
        tokenPrice = price();
        tokensCommitted = received_wei.div(tokenPrice);
        //amount comitted in bonus
        bonusWeiSoFar = getBonusWei();
        bonusTokensCommitted = bonusWeiSoFar.div(tokenPrice);
    }

    

    function loadRefundForIndividuals() public payable refundForIndividualsIsRunning onlyOwner {
        require (msg.value > 0);
        refundValueForIndividuals = refundValueForIndividuals.add(msg.value);
    }

    function loadRefundForAll() public payable refundIsRunning whenPaused onlyOwner {
        require (msg.value > 0);
        refundValueForAll = refundValueForAll.add(msg.value);
    }
    
    /// @notice Adds account addresses to individual refund whitelist.
    /// @dev Adds account addresses to individual refund whitelist.
    /// @param _bidder_addresses Array of addresses.
    function addToRefundForIndividualsWhitelist(address[] _bidder_addresses) public onlyOwner  {
        for (uint32 i = 0; i < _bidder_addresses.length; i++) {
            refundForIndividualsWhitelist[_bidder_addresses[i]] = true;
        }
    }

    /// @notice Removes account addresses from individual refund whitelist.
    /// @dev Removes account addresses from  individual refund whitelist.
    /// @param _bidder_addresses Array of addresses.
    function removeFromToRefundForIndividualsWhitelist(address[] _bidder_addresses) public onlyOwner  {
        for (uint32 i = 0; i < _bidder_addresses.length; i++) {
            refundForIndividualsWhitelist[_bidder_addresses[i]] = false;
        }
    }

     ///change white lister 
    function changeWalletAddress(address walletAddress) public onlyOwner {
        require(walletAddress != 0);
        wallet_address = walletAddress;
    }
  ///change Start Price  
    function changeStartPrice(uint priceStart) public onlyOwner {
        require(priceStart != 0);
        require(stage == Stages.AuctionDeployed || stage == Stages.AuctionSetUp);
        price_start = priceStart;
    }

    ///change Price Constant  
    function changePriceConstant(uint priceConstant) public onlyOwner {
        require(priceConstant != 0);
        require(stage == Stages.AuctionDeployed || stage == Stages.AuctionSetUp);
        price_constant = priceConstant;
    }

      ///change Price Exponent  
    function changePriceExponent(uint32 priceExponent) public onlyOwner {
        require(priceExponent != 0);
        require(stage == Stages.AuctionDeployed || stage == Stages.AuctionSetUp);
        price_exponent = priceExponent;
    }
        ///change Price Exponent  
    function changePriceAdjustment(uint32 priceAdjustment) public onlyOwner {
        require(priceAdjustment != 0);
        require(stage == Stages.AuctionDeployed || stage == Stages.AuctionSetUp);
        price_adjustment = priceAdjustment;
    }
    
   ///change Token Multiplier
    function changeTokenMultiplier(uint32 tokenMultiplier) public onlyOwner {
        require(tokenMultiplier != 0);
        require(stage == Stages.AuctionDeployed || stage == Stages.AuctionSetUp);
        token_multiplier = tokenMultiplier;
    }
    // start stop refund to everyone
    function refundToggle() public onlyOwner {
        refundIsStopped = !refundIsStopped;
    }
    // start stop refund to particular individuals
    function refundForIndividualsToggle() public onlyOwner {
        refundForIndividualsIsStopped = !refundForIndividualsIsStopped;
    }
    
    function transferContractBalanceToWallet() public onlyOwner {
        wallet_address.transfer(address(this).balance);
    }
    function transferTokenBalanceToWallet() public onlyOwner {
        assert(token.transfer(wallet_address, token.balanceOf(this)));
    }
    
    function getBonusWei() private view returns (uint) {
        // Returns effective Wei amount that gives the bidder bonus tokens
        uint tier1bonusWeiSoFar = (recievedTier1BonusWei.mul(tier1Bonus)).div(100);
        uint tier2bonusWeiSoFar = (recievedTier2BonusWei.mul(tier2Bonus)).div(100);
        return tier1bonusWeiSoFar.add(tier2bonusWeiSoFar);
    }

    function isInTier1BonusTime() public view returns(bool) {
        return (now <= start_time.add(tier1Time));
    }

    function isInTier2BonusTime() public view returns(bool) {
        return (now <= start_time.add(tier2Time));
    }

    function hasGoalReached() public  returns  (bool) {
        if( goal_time > now) {

            uint tokensCommitted;
            uint bonusTokensCommitted;
            uint tokenPrice = 0;
            uint bonusWeiSoFar = 0;        
            (tokenPrice, tokensCommitted, bonusTokensCommitted, bonusWeiSoFar) = tokenCommittedSoFar(); 
            //We consider bonus tokens while checking if goal is met
            if (tokensCommitted.add(bonusTokensCommitted) >= goal){
                goal_time = now;    
            }
        }    
        return (goal_time < now);
    } 

    function getAuctionInfo() public view returns (uint receivedWei, uint startPrice, uint currentPrice, uint finalPrice, uint tokenSupply, uint auctionStartTime, uint auctionEndTime) {
        receivedWei = received_wei;
        startPrice = price_start;
        currentPrice = price();
        tokenSupply = targetTokens;
        auctionStartTime = start_time;
        auctionEndTime = end_time;
        finalPrice = final_price;

    } 
    
    function addUpdateCountriesRules(uint[] countries, uint[] minAmounts, uint[] maxBids) public onlyOwner {
        for (uint32 i = 0; i < countries.length; i++) {
            addUpdateCountryRules(countries[i], minAmounts[i], maxBids[i]);
        }
    }
    ///add rules for a country  
    function addUpdateCountryRules(uint countryCode, uint minAmount, uint maxBids) public onlyOwner {
        CountryLimit storage countryLimit = countryRulesList[countryCode];
  
        if (countryLimit.minAmount != minAmount) {
            countryLimit.minAmount = minAmount;
        }
        if (countryLimit.maxBids != maxBids) {
            countryLimit.maxBids = maxBids;
        }
       
    }

    function getCountryRule(uint countryCode)  public view returns (uint, uint, uint) {
        return (countryRulesList[countryCode].minAmount, countryRulesList[countryCode].maxBids, countryRulesList[countryCode].bidCount);
    }

    function checkCountryRules(uint countryCode) private view {
        
         CountryLimit storage countryRule = countryRulesList[countryCode];
  
        if (countryRule.minAmount > 0) {
            require(countryRule.minAmount <= msg.value);
        }
        if (countryRule.maxBids > 0) {
            require(countryRule.bidCount < countryRule.maxBids);
            
        }
        
    }

    /*
     *  Private functions
     */

    /// @dev Calculates the token price (WEI / QBI) at the current timestamp
    /// during the auction; elapsed time = 0 before auction starts.
    /// Based on the provided parameters, the price does not change in the first
    /// `price_constant^(1/price_exponent)` seconds due to rounding.
    /// Rounding in `decay_rate` also produces values that increase instead of decrease
    /// in the beginning; these spikes decrease over time and are noticeable
    /// only in first hours. This should be calculated before usage.
    /// @return Returns the token price - Wei per QBI.

    function calcTokenPrice() private view returns (uint) {
        uint elapsed;
        if (stage == Stages.AuctionStarted) {
            elapsed = now.sub(start_time);
        }
        
        uint decay_rate = (elapsed ** price_exponent).div(price_constant);
        return (price_start.mul(elapsed.add(1)).div(elapsed.add(1).add(decay_rate))).add(price_adjustment);
    }   
}

