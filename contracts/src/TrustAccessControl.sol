// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract TrustAccessControl is Ownable {
    ITrustVerifier public verifier;
    ITrustPolicy public policy;

    error AccessDenied(address user, uint256 required, uint256 actual);
    error PolicyNotConfigured();
    error TrustVerificationFailed(address user, string reason);
    error PolicyEvaluationFailed(address user, string reason);

    constructor(address _owner) Ownable(_owner) {}

    modifier onlyTrusted(address user) {
        if (address(verifier) == address(0)) revert PolicyNotConfigured();
        if (address(policy) == address(0)) revert PolicyNotConfigured();
        
        (uint256 score, uint256 band, bool isValid) = verifier.getTrustScore(user);
        
        if (!isValid) {
            revert TrustVerificationFailed(user, "Trust score expired");
        }

        bytes32 policyId = getPolicyId();
        (, uint256 minTrustScore, uint256 minBand, bool requireHuman, bool requireCredential, bool active) = policy.getPolicy(policyId);
        if (!active) revert PolicyNotConfigured();

        (bool allowed, string[] memory reasons) = policy.evaluatePolicy(
            user,
            policyId,
            score,
            band,
            false,
            false
        );

        if (!allowed) {
            if (score < minTrustScore || band < minBand) {
                revert AccessDenied(user, minBand, band);
            }

            string memory policyReason = reasons.length > 0 ? reasons[0] : "Policy requirements not met";
            revert PolicyEvaluationFailed(user, policyReason);
        }
        _;
    }

    function getRequiredBand() internal view virtual returns (uint256);
    function getPolicyId() internal view virtual returns (bytes32);

    function setVerifier(address _verifier) external onlyOwner {
        verifier = ITrustVerifier(_verifier);
    }

    function setPolicy(address _policy) external onlyOwner {
        policy = ITrustPolicy(_policy);
    }
}

interface ITrustVerifier {
    function verify(address user, uint256 minBand) external view returns (bool);
    function getTrustScore(address user) external view returns (uint256 score, uint256 band, bool isValid);
}

interface ITrustPolicy {
    function getPolicy(bytes32 policyId) external view returns (
        string memory name,
        uint256 minTrustScore,
        uint256 minBand,
        bool requireHuman,
        bool requireCredential,
        bool active
    );

    function evaluatePolicy(
        address user,
        bytes32 policyId,
        uint256 userTrustScore,
        uint256 userBand,
        bool isHuman,
        bool hasCredential
    ) external view returns (bool allowed, string[] memory reasons);
}

contract TrustVault is TrustAccessControl {
    mapping(address => uint256) public deposits;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor(address _owner) TrustAccessControl(_owner) {}

    function getRequiredBand() internal view override returns (uint256) {
        return 2;  // Minimum band 2 for vault access
    }

    function getPolicyId() internal pure override returns (bytes32) {
        return keccak256(bytes("lending-pool-v1"));
    }

    function deposit() external payable onlyTrusted(msg.sender) {
        deposits[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external onlyTrusted(msg.sender) {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount);
    }

    function getDeposit(address user) external view returns (uint256) {
        return deposits[user];
    }
}

contract TrustPool is TrustAccessControl {
    mapping(address => bool) public hasJoined;
    uint256 public totalMembers;
    
    event UserJoined(address indexed user);
    event UserLeft(address indexed user);

    constructor(address _owner) TrustAccessControl(_owner) {}

    function getRequiredBand() internal view override returns (uint256) {
        return 3;  // Minimum band 3 for pool access
    }

    function getPolicyId() internal pure override returns (bytes32) {
        return keccak256(bytes("premium-pool-v1"));
    }

    function join() external onlyTrusted(msg.sender) {
        require(!hasJoined[msg.sender], "Already joined");
        hasJoined[msg.sender] = true;
        totalMembers++;
        emit UserJoined(msg.sender);
    }

    function leave() external {
        require(hasJoined[msg.sender], "Not a member");
        hasJoined[msg.sender] = false;
        totalMembers--;
        emit UserLeft(msg.sender);
    }

    function hasAccess(address user) external view returns (bool) {
        return hasJoined[user];
    }
}

contract TrustAirdrop is TrustAccessControl {
    mapping(address => bool) public claimed;
    uint256 public totalClaimed;
    
    event Claimed(address indexed user);

    constructor(address _owner) TrustAccessControl(_owner) {}

    function getRequiredBand() internal view override returns (uint256) {
        return 1;  // Minimum band 1 for airdrop
    }

    function getPolicyId() internal pure override returns (bytes32) {
        return keccak256(bytes("airdrop-2026"));
    }

    function claim() external onlyTrusted(msg.sender) {
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;
        totalClaimed++;
        emit Claimed(msg.sender);
    }

    function hasClaimed(address user) external view returns (bool) {
        return claimed[user];
    }
}
