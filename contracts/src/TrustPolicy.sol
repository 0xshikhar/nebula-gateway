// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TrustPolicy is Ownable {
    struct Policy {
        string name;
        uint256 minTrustScore;
        uint256 minBand;
        bool requireHuman;
        bool requireCredential;
        bool active;
    }

    mapping(bytes32 => Policy) public policies;
    bytes32[] public policyIds;

    mapping(address => mapping(bytes32 => bool)) public userPolicyApprovals;

    event PolicyCreated(bytes32 indexed policyId, string name, uint256 minScore, uint256 minBand);
    event PolicyUpdated(bytes32 indexed policyId);
    event PolicyDeleted(bytes32 indexed policyId);
    event UserApproved(address indexed user, bytes32 indexed policyId, uint256 score, uint256 band);
    event UserDenied(address indexed user, bytes32 indexed policyId, string reason);

    error PolicyAlreadyExists();
    error PolicyDoesNotExist();
    error InvalidPolicyConfig();
    error UserNotEligible(address user, string reason);

    constructor(address _owner) Ownable(_owner) {}

    function createPolicy(
        bytes32 policyId,
        string memory name,
        uint256 _minTrustScore,
        uint256 _minBand,
        bool _requireHuman,
        bool _requireCredential
    ) external onlyOwner {
        if (policies[policyId].active) revert PolicyAlreadyExists();
        if (_minBand > 5) revert InvalidPolicyConfig();

        policies[policyId] = Policy({
            name: name,
            minTrustScore: _minTrustScore,
            minBand: _minBand,
            requireHuman: _requireHuman,
            requireCredential: _requireCredential,
            active: true
        });

        policyIds.push(policyId);

        emit PolicyCreated(policyId, name, _minTrustScore, _minBand);
    }

    function updatePolicy(
        bytes32 policyId,
        uint256 _minTrustScore,
        uint256 _minBand,
        bool _requireHuman,
        bool _requireCredential
    ) external onlyOwner {
        if (!policies[policyId].active) revert PolicyDoesNotExist();
        if (_minBand > 5) revert InvalidPolicyConfig();

        Policy storage p = policies[policyId];
        p.minTrustScore = _minTrustScore;
        p.minBand = _minBand;
        p.requireHuman = _requireHuman;
        p.requireCredential = _requireCredential;

        emit PolicyUpdated(policyId);
    }

    function deletePolicy(bytes32 policyId) external onlyOwner {
        if (!policies[policyId].active) revert PolicyDoesNotExist();
        
        policies[policyId].active = false;
        
        emit PolicyDeleted(policyId);
    }

    function getPolicy(bytes32 policyId) external view returns (
        string memory name,
        uint256 minTrustScore,
        uint256 minBand,
        bool requireHuman,
        bool requireCredential,
        bool active
    ) {
        Policy memory p = policies[policyId];
        return (
            p.name,
            p.minTrustScore,
            p.minBand,
            p.requireHuman,
            p.requireCredential,
            p.active
        );
    }

    function listPolicies() external view returns (bytes32[] memory) {
        return policyIds;
    }

    function _evaluatePolicyChecks(
        Policy memory p,
        uint256 userTrustScore,
        uint256 userBand,
        bool isHuman,
        bool hasCredential
    ) internal pure returns (bool allowed, string[] memory reasons) {
        string[] memory _reasons = new string[](4);
        uint256 reasonCount = 0;
        bool canCheck = true;

        if (userTrustScore < p.minTrustScore) {
            _reasons[reasonCount++] = "Trust score below minimum";
            canCheck = false;
        }

        if (userBand < p.minBand) {
            _reasons[reasonCount++] = "Trust band below minimum";
            canCheck = false;
        }

        if (p.requireHuman && !isHuman) {
            _reasons[reasonCount++] = "Human verification required";
            canCheck = false;
        }

        if (p.requireCredential && !hasCredential) {
            _reasons[reasonCount++] = "Credential required";
            canCheck = false;
        }

        string[] memory finalReasons = new string[](reasonCount);
        for (uint256 i = 0; i < reasonCount; i++) {
            finalReasons[i] = _reasons[i];
        }

        return (canCheck, finalReasons);
    }

    function evaluatePolicy(
        address user,
        bytes32 policyId,
        uint256 userTrustScore,
        uint256 userBand,
        bool isHuman,
        bool hasCredential
    ) external view returns (bool allowed, string[] memory reasons) {
        Policy memory p = policies[policyId];
        user;
        if (!p.active) revert PolicyDoesNotExist();
        return _evaluatePolicyChecks(p, userTrustScore, userBand, isHuman, hasCredential);
    }

    function approveUser(
        address _user,
        bytes32 policyId,
        uint256 userTrustScore,
        uint256 userBand,
        bool isHuman,
        bool hasCredential
    ) external onlyOwner returns (bool allowed) {
        Policy memory p = policies[policyId];
        
        if (!p.active) revert PolicyDoesNotExist();

        (bool isAllowed, string[] memory reasons) = _evaluatePolicyChecks(
            p,
            userTrustScore,
            userBand,
            isHuman,
            hasCredential
        );

        if (!isAllowed) {
            string memory reason = reasons.length > 0 ? reasons[0] : "Policy requirements not met";
            emit UserDenied(_user, policyId, reason);
            return false;
        }

        userPolicyApprovals[_user][policyId] = true;
        emit UserApproved(_user, policyId, userTrustScore, userBand);
        
        return true;
    }

    function checkApproval(address user, bytes32 policyId) external view returns (bool) {
        return userPolicyApprovals[user][policyId];
    }

    function hashPolicy(
        string memory name,
        address protocol,
        uint256 minScore
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(name, protocol, minScore));
    }
}
