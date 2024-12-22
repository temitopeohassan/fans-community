// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract CreatorSubscriptionManager is Initializable, OwnableUpgradeable, PausableUpgradeable {
    struct SubscriptionTier {
        uint256 price;
        string metadata;
        bool active;
    }

    struct Subscription {
        address subscriber;
        uint256 tierId;
        uint256 startTime;
        uint256 expirationTime;
    }

    mapping(address => SubscriptionTier[]) public creatorTiers;
    mapping(address => mapping(address => Subscription)) public subscriptions;
    mapping(address => uint256) public creatorEarnings;

    event TierCreated(address creator, uint256 tierId, uint256 price);
    event SubscriptionPurchased(address creator, address subscriber, uint256 tierId);
    event SubscriptionRenewed(address creator, address subscriber, uint256 tierId);
    event CreatorWithdraw(address creator, uint256 amount);

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __Pausable_init();
    }

    function createSubscriptionTier(
        uint256 price, 
        string memory metadata
    ) external returns (uint256) {
        SubscriptionTier memory newTier = SubscriptionTier({
            price: price,
            metadata: metadata,
            active: true
        });
        
        creatorTiers[msg.sender].push(newTier);
        emit TierCreated(msg.sender, creatorTiers[msg.sender].length - 1, price);
        return creatorTiers[msg.sender].length - 1;
    }

    function purchaseSubscription(
        address creator, 
        uint256 tierId
    ) external payable whenNotPaused {
        require(tierId < creatorTiers[creator].length, "Invalid tier");
        SubscriptionTier storage tier = creatorTiers[creator][tierId];
        require(tier.active, "Tier not active");
        require(msg.value >= tier.price, "Insufficient payment");

        Subscription storage sub = subscriptions[creator][msg.sender];
        sub.subscriber = msg.sender;
        sub.tierId = tierId;
        sub.startTime = block.timestamp;
        sub.expirationTime = block.timestamp + 30 days;

        creatorEarnings[creator] += msg.value;

        emit SubscriptionPurchased(creator, msg.sender, tierId);
    }

    function withdrawEarnings() external {
        uint256 earnings = creatorEarnings[msg.sender];
        require(earnings > 0, "No earnings");
        
        creatorEarnings[msg.sender] = 0;
        payable(msg.sender).transfer(earnings);

        emit CreatorWithdraw(msg.sender, earnings);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}