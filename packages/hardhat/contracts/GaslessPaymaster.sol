// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@opengsn/contracts/src/interfaces/IPaymaster.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract GaslessPaymaster is IPaymaster, OwnableUpgradeable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    event PreRelayed(bytes32 indexed txHash);
    event PostRelayed(bytes32 indexed txHash, bool success);

    address private _relayHub;
    address private _trustedForwarder;

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
    }

    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    ) external override returns (bytes memory context, bool rejectOnRecipientRevert) {
        bytes32 txHash = keccak256(abi.encode(relayRequest));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(txHash);
        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        
        require(signer == owner(), "GaslessPaymaster: Invalid signature");
        
        emit PreRelayed(txHash);
        return (abi.encode(txHash), false);
    }

    function postRelayedCall(
        bytes calldata context,
        bool success,
        uint256 gasUseWithoutPost,
        GsnTypes.RelayData calldata relayData
    ) external override {
        bytes32 txHash = abi.decode(context, (bytes32));
        emit PostRelayed(txHash, success);
    }

    function versionPaymaster() external pure override returns (string memory) {
        return "3.0.0";
    }

    function getGasAndDataLimits() external pure override returns (
        IPaymaster.GasAndDataLimits memory limits
    ) {
        return IPaymaster.GasAndDataLimits({
            acceptanceBudget: 100000,
            preRelayedCallGasLimit: 100000,
            postRelayedCallGasLimit: 100000,
            calldataSizeLimit: 10500
        });
    }

    function getRelayHub() external view override returns (address) {
        return _relayHub;
    }

    function getTrustedForwarder() external view override returns (address) {
        return _trustedForwarder;
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IPaymaster).interfaceId;
    }

    function setRelayHub(address relayHub) external onlyOwner {
        _relayHub = relayHub;
    }

    function setTrustedForwarder(address forwarder) external onlyOwner {
        _trustedForwarder = forwarder;
    }
}