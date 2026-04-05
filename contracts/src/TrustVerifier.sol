// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITrustVerifier {
    error InvalidProof();
    error PolicyNotFound();
    error ExpiredTrustScore();
    error InsufficientTrust(address user, uint256 required, uint256 actual);

    event TrustVerified(address indexed user, uint256 score, uint256 band, uint256 timestamp);
    event TrustRejected(address indexed user, string reason, uint256 timestamp);
}

contract TrustVerifier is ITrustVerifier {
    struct Trust_score {
        uint256 score;
        uint256 band;
        uint256 timestamp;
        uint256 expiry;
    }

    mapping(address => Trust_score) public trustScores;

    uint256 public constant SCORE_MAX = 100;
    uint256 public constant BAND_THRESHOLD_1 = 20;
    uint256 public constant BAND_THRESHOLD_2 = 40;
    uint256 public constant BAND_THRESHOLD_3 = 60;
    uint256 public constant BAND_THRESHOLD_4 = 80;

    uint256 public constant SCORE_EXPIRY = 24 hours;

    mapping(bytes32 => bool) public usedNullifiers;

    event TrustScoreUpdated(address indexed user, uint256 score, uint256 band);

    function updateTrustScore(
        address user,
        uint256 score,
        uint256 band
    ) external {
        require(score <= SCORE_MAX, "Score too high");
        require(band >= 1 && band <= 5, "Invalid band");

        trustScores[user] = Trust_score({
            score: score,
            band: band,
            timestamp: block.timestamp,
            expiry: block.timestamp + SCORE_EXPIRY
        });

        emit TrustScoreUpdated(user, score, band);
    }

    function verify(address user, uint256 minBand) external view returns (bool) {
        Trust_score memory ts = trustScores[user];

        if (block.timestamp > ts.expiry) {
            revert ExpiredTrustScore();
        }

        if (ts.band < minBand) {
            revert InsufficientTrust(user, minBand, ts.band);
        }

        return true;
    }

    function getTrustScore(address user) external view returns (uint256 score, uint256 band, bool isValid) {
        Trust_score memory ts = trustScores[user];
        return (ts.score, ts.band, block.timestamp <= ts.expiry);
    }

    function checkTrust(address user, uint256 minScore) external view returns (bool allowed, uint256 actualScore, uint256 actualBand) {
        Trust_score memory ts = trustScores[user];
        
        if (block.timestamp > ts.expiry || ts.score < minScore) {
            return (false, ts.score, ts.band);
        }
        
        return (true, ts.score, ts.band);
    }

    function getBand(uint256 score) public pure returns (uint256 band) {
        if (score >= BAND_THRESHOLD_4) return 4;
        if (score >= BAND_THRESHOLD_3) return 3;
        if (score >= BAND_THRESHOLD_2) return 2;
        if (score >= BAND_THRESHOLD_1) return 1;
        return 0;
    }

    function useNullifier(bytes32 nullifier) external {
        require(!usedNullifiers[nullifier], "Nullifier already used");
        usedNullifiers[nullifier] = true;
    }

    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
}