const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("TrustPolicy", function () {
  let trustPolicy;
  let owner;
  let user1;

  const LENDING_POOL_POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("lending-pool-v1"));
  const PREMIUM_POOL_POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("premium-pool-v1"));

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const TrustPolicy = await ethers.getContractFactory("TrustPolicy");
    trustPolicy = await TrustPolicy.deploy(owner.address);
    await trustPolicy.waitForDeployment();
  });

  describe("createPolicy", function () {
    it("should create a new policy", async function () {
      await trustPolicy.createPolicy(
        LENDING_POOL_POLICY_ID,
        "Lending Pool Access",
        50,   // minTrustScore
        2,     // minBand
        false, // requireHuman
        false  // requireCredential
      );

      const [name, minTrustScore, minBand, requireHuman, requireCredential, active] =
        await trustPolicy.getPolicy(LENDING_POOL_POLICY_ID);

      expect(name).to.equal("Lending Pool Access");
      expect(minTrustScore).to.equal(50);
      expect(minBand).to.equal(2);
      expect(requireHuman).to.equal(false);
      expect(requireCredential).to.equal(false);
      expect(active).to.equal(true);
    });

    it("should reject duplicate policy", async function () {
      await trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Test", 50, 2, false, false);

      await expect(
        trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Test 2", 60, 3, false, false)
      ).to.be.revertedWithCustomError(trustPolicy, "PolicyAlreadyExists");
    });

    it("should reject invalid band", async function () {
      await expect(
        trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Test", 50, 6, false, false)
      ).to.be.revertedWithCustomError(trustPolicy, "InvalidPolicyConfig");
    });

    it("should emit PolicyCreated event", async function () {
      await expect(
        trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Lending Pool", 50, 2, false, false)
      )
        .to.emit(trustPolicy, "PolicyCreated")
        .withArgs(LENDING_POOL_POLICY_ID, "Lending Pool", 50, 2);
    });
  });

  describe("updatePolicy", function () {
    beforeEach(async function () {
      await trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Lending Pool", 50, 2, false, false);
    });

    it("should update an existing policy", async function () {
      await trustPolicy.updatePolicy(LENDING_POOL_POLICY_ID, 60, 3, true, true);

      const [name, minTrustScore, minBand, requireHuman, requireCredential, active] =
        await trustPolicy.getPolicy(LENDING_POOL_POLICY_ID);

      expect(minTrustScore).to.equal(60);
      expect(minBand).to.equal(3);
      expect(requireHuman).to.equal(true);
      expect(requireCredential).to.equal(true);
    });

    it("should reject update for non-existent policy", async function () {
      await expect(
        trustPolicy.updatePolicy(PREMIUM_POOL_POLICY_ID, 60, 3, false, false)
      ).to.be.revertedWithCustomError(trustPolicy, "PolicyDoesNotExist");
    });
  });

  describe("deletePolicy", function () {
    beforeEach(async function () {
      await trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Lending Pool", 50, 2, false, false);
    });

    it("should delete a policy", async function () {
      await trustPolicy.deletePolicy(LENDING_POOL_POLICY_ID);

      const [, , , , , active] = await trustPolicy.getPolicy(LENDING_POOL_POLICY_ID);
      expect(active).to.equal(false);
    });

    it("should reject delete for non-existent policy", async function () {
      await expect(
        trustPolicy.deletePolicy(PREMIUM_POOL_POLICY_ID)
      ).to.be.revertedWithCustomError(trustPolicy, "PolicyDoesNotExist");
    });
  });

  describe("evaluatePolicy", function () {
    beforeEach(async function () {
      await trustPolicy.createPolicy(
        LENDING_POOL_POLICY_ID,
        "Lending Pool",
        50,   // minTrustScore
        2,     // minBand
        false, // requireHuman
        false  // requireCredential
      );
    });

    it("should approve user meeting all requirements", async function () {
      const [allowed, reasons] = await trustPolicy.evaluatePolicy(
        user1.address,
        LENDING_POOL_POLICY_ID,
        85,   // userTrustScore
        4,    // userBand
        false, // isHuman
        false  // hasCredential
      );

      expect(allowed).to.equal(true);
      expect(reasons.length).to.equal(0);
    });

    it("should deny user with insufficient score", async function () {
      const [allowed, reasons] = await trustPolicy.evaluatePolicy(
        user1.address,
        LENDING_POOL_POLICY_ID,
        30,   // userTrustScore - below 50
        4,
        false,
        false
      );

      expect(allowed).to.equal(false);
      expect(reasons.length).to.equal(1);
      expect(reasons[0]).to.equal("Trust score below minimum");
    });

    it("should deny user with insufficient band", async function () {
      const [allowed, reasons] = await trustPolicy.evaluatePolicy(
        user1.address,
        LENDING_POOL_POLICY_ID,
        80,   // sufficient score
        1,    // band 1 - below 2
        false,
        false
      );

      expect(allowed).to.equal(false);
      expect(reasons.length).to.equal(1);
      expect(reasons[0]).to.equal("Trust band below minimum");
    });

    it("should return multiple reasons for multiple failures", async function () {
      const [allowed, reasons] = await trustPolicy.evaluatePolicy(
        user1.address,
        LENDING_POOL_POLICY_ID,
        30,   // low score
        1,    // low band
        false,
        false
      );

      expect(allowed).to.equal(false);
      expect(reasons.length).to.equal(2);
    });
  });

  describe("approveUser", function () {
    beforeEach(async function () {
      await trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Lending Pool", 50, 2, false, false);
    });

    it("should approve eligible user", async function () {
      const tx = await trustPolicy.approveUser(
        user1.address,
        LENDING_POOL_POLICY_ID,
        85,
        4,
        false,
        false
      );
      
      // Check the transaction succeeded and approval was set
      const approved = await trustPolicy.checkApproval(user1.address, LENDING_POOL_POLICY_ID);
      expect(approved).to.equal(true);
    });

    it("should deny user with low score", async function () {
      const tx = await trustPolicy.approveUser(
        user1.address,
        LENDING_POOL_POLICY_ID,
        30,
        4,
        false,
        false
      );
      
      const approved = await trustPolicy.checkApproval(user1.address, LENDING_POOL_POLICY_ID);
      expect(approved).to.equal(false);
    });

    it("should deny user with low band", async function () {
      const tx = await trustPolicy.approveUser(
        user1.address,
        LENDING_POOL_POLICY_ID,
        80,
        1,
        false,
        false
      );
      
      const approved = await trustPolicy.checkApproval(user1.address, LENDING_POOL_POLICY_ID);
      expect(approved).to.equal(false);
    });
  });

  describe("listPolicies", function () {
    it("should return all created policy IDs", async function () {
      await trustPolicy.createPolicy(LENDING_POOL_POLICY_ID, "Lending Pool", 50, 2, false, false);
      await trustPolicy.createPolicy(PREMIUM_POOL_POLICY_ID, "Premium Pool", 75, 3, false, false);

      const policyIds = await trustPolicy.listPolicies();
      expect(policyIds.length).to.equal(2);
    });
  });

  describe("hashPolicy", function () {
    it("should return a bytes32 hash", async function () {
      const hash = await trustPolicy.hashPolicy("TestPolicy", owner.address, 50);
      
      // Should return a 64-character hex string (bytes32)
      expect(hash.length).to.equal(66);
      expect(hash.slice(0, 2)).to.equal("0x");
    });
  });
});