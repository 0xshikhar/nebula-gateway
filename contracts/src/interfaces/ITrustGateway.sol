// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITrustVerifier {
    event TrustScoreUpdated(address indexed user, uint256 score, uint256 band);

    function updateTrustScore(address user, uint256 score, uint256 band) external;
    function verify(address user, uint256 minBand) external view returns (bool);
    function getTrustScore(address user) external view returns (uint256 score, uint256 band, bool isValid);
    function checkTrust(address user, uint256 minScore) external view returns (bool allowed, uint256 actualScore, uint256 actualBand);
    function getBand(uint256 score) external pure returns (uint256 band);
    function useNullifier(bytes32 nullifier) external;
    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
}

interface ITrustPolicy {
    event PolicyCreated(bytes32 indexed policyId, string name, uint256 minScore, uint256 minBand);
    event PolicyUpdated(bytes32 indexed policyId);
    event PolicyDeleted(bytes32 indexed policyId);
    event UserApproved(address indexed user, bytes32 indexed policyId, uint256 score, uint256 band);
    event UserDenied(address indexed user, bytes32 indexed policyId, string reason);

    function createPolicy(
        bytes32 policyId,
        string memory name,
        uint256 _minTrustScore,
        uint256 _minBand,
        bool _requireHuman,
        bool _requireCredential
    ) external;
    function updatePolicy(
        bytes32 policyId,
        uint256 _minTrustScore,
        uint256 _minBand,
        bool _requireHuman,
        bool _requireCredential
    ) external;
    function deletePolicy(bytes32 policyId) external;
    function getPolicy(bytes32 policyId) external view returns (
        string memory name,
        uint256 minTrustScore,
        uint256 minBand,
        bool requireHuman,
        bool requireCredential,
        bool active
    );
    function listPolicies() external view returns (bytes32[] memory);
    function evaluatePolicy(
        address user,
        bytes32 policyId,
        uint256 userTrustScore,
        uint256 userBand,
        bool isHuman,
        bool hasCredential
    ) external view returns (bool allowed, string[] memory reasons);
    function approveUser(
        address user,
        bytes32 policyId,
        uint256 userTrustScore,
        uint256 userBand,
        bool isHuman,
        bool hasCredential
    ) external returns (bool allowed);
    function checkApproval(address user, bytes32 policyId) external view returns (bool);
    function hashPolicy(string memory name, address protocol, uint256 minScore) external pure returns (bytes32);
}

interface ITrustAccessControl {
    function setVerifier(address _verifier) external;
    function setPolicy(address _policy) external;
}

interface ITrustVault {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function getDeposit(address user) external view returns (uint256);
}

interface ITrustPool {
    function join() external;
    function leave() external;
    function hasAccess(address user) external view returns (bool);
}

interface ITrustAirdrop {
    function claim() external;
    function hasClaimed(address user) external view returns (bool);
}

interface ITrustGateway {
    event DecisionRecorded(
        address indexed wallet,
        uint8 decision,
        uint256 trustScore,
        bytes32 indexed proofId,
        string policyVersion
    );

    event PolicyPublished(string policyVersion);

    function policyVersion() external view returns (string memory);
    function decisionCount() external view returns (uint256);
    function lastDecision(address wallet) external view returns (
        uint8 decision,
        uint256 trustScore,
        string memory policyVersion,
        bytes32 proofId
    );
    function recordDecision(
        address wallet,
        uint8 decision,
        uint256 trustScore,
        bytes32 proofId,
        string calldata policyVersion
    ) external;
    function publishPolicy(string calldata policyVersion) external;
}
