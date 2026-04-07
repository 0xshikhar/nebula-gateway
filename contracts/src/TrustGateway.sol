// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TrustGateway {
    struct Decision {
        uint8 decision;
        uint256 trustScore;
        string policyVersion;
        bytes32 proofId;
        uint256 timestamp;
    }

    string public policyVersion;
    uint256 public decisionCount;

    mapping(address => Decision) private _decisions;

    event DecisionRecorded(
        address indexed wallet,
        uint8 decision,
        uint256 trustScore,
        bytes32 indexed proofId,
        string policyVersion
    );

    event PolicyPublished(string policyVersion);

    constructor() {
        policyVersion = "nebula-trust-v1";
    }

    function recordDecision(
        address wallet,
        uint8 decision,
        uint256 trustScore,
        bytes32 proofId,
        string calldata newPolicyVersion
    ) external {
        _decisions[wallet] = Decision({
            decision: decision,
            trustScore: trustScore,
            policyVersion: newPolicyVersion,
            proofId: proofId,
            timestamp: block.timestamp
        });

        decisionCount += 1;
        policyVersion = newPolicyVersion;

        emit DecisionRecorded(wallet, decision, trustScore, proofId, newPolicyVersion);
    }

    function publishPolicy(string calldata newPolicyVersion) external {
        policyVersion = newPolicyVersion;
        emit PolicyPublished(newPolicyVersion);
    }

    function lastDecision(address wallet)
        external
        view
        returns (uint8 decision, uint256 trustScore, string memory currentPolicyVersion, bytes32 proofId)
    {
        Decision memory decisionData = _decisions[wallet];
        return (
            decisionData.decision,
            decisionData.trustScore,
            decisionData.policyVersion,
            decisionData.proofId
        );
    }

    function getDecision(address wallet) external view returns (Decision memory) {
        return _decisions[wallet];
    }
}
