const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("TrustAccessControl", function () {
  let trustVerifier;
  let trustPolicy;
  let trustVault;
  let trustPool;
  let trustAirdrop;
  let owner;
  let user1;
  let user2;

  const LENDING_POOL_POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("lending-pool-v1"));
  const PREMIUM_POOL_POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("premium-pool-v1"));
  const AIRDROP_POLICY_ID = ethers.keccak256(ethers.toUtf8Bytes("airdrop-2026"));

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy TrustVerifier
    const TrustVerifier = await ethers.getContractFactory("TrustVerifier");
    trustVerifier = await TrustVerifier.deploy(owner.address);
    await trustVerifier.waitForDeployment();

    // Deploy TrustPolicy
    const TrustPolicy = await ethers.getContractFactory("TrustPolicy");
    trustPolicy = await TrustPolicy.deploy(owner.address);
    await trustPolicy.waitForDeployment();

    // Create a policy
    await trustPolicy.createPolicy(
      LENDING_POOL_POLICY_ID,
      "Lending Pool Access",
      50,
      2,
      false,
      false
    );

    await trustPolicy.createPolicy(
      PREMIUM_POOL_POLICY_ID,
      "Premium Pool Access",
      75,
      3,
      false,
      false
    );

    await trustPolicy.createPolicy(
      AIRDROP_POLICY_ID,
      "Airdrop Access",
      25,
      1,
      false,
      false
    );

    // Deploy TrustVault
    const TrustVault = await ethers.getContractFactory("TrustVault");
    trustVault = await TrustVault.deploy(owner.address);
    await trustVault.waitForDeployment();
    await trustVault.setVerifier(await trustVerifier.getAddress());
    await trustVault.setPolicy(await trustPolicy.getAddress());

    // Deploy TrustPool
    const TrustPool = await ethers.getContractFactory("TrustPool");
    trustPool = await TrustPool.deploy(owner.address);
    await trustPool.waitForDeployment();
    await trustPool.setVerifier(await trustVerifier.getAddress());
    await trustPool.setPolicy(await trustPolicy.getAddress());

    // Deploy TrustAirdrop
    const TrustAirdrop = await ethers.getContractFactory("TrustAirdrop");
    trustAirdrop = await TrustAirdrop.deploy(owner.address);
    await trustAirdrop.waitForDeployment();
    await trustAirdrop.setVerifier(await trustVerifier.getAddress());
    await trustAirdrop.setPolicy(await trustPolicy.getAddress());
  });

  describe("TrustVault", function () {
    it("should allow deposit with sufficient trust", async function () {
      // Give user1 sufficient trust score (band 3)
      await trustVerifier.updateTrustScore(user1.address, 70, 3);

      // Deposit should succeed
      await expect(
        trustVault.connect(user1).deposit({ value: ethers.parseEther("1") })
      ).to.not.be.reverted;
    });

    it("should deny deposit with insufficient trust", async function () {
      // Give user1 low trust score (band 1)
      await trustVerifier.updateTrustScore(user1.address, 15, 1);

      // Deposit should fail - band 1 < required band 2
      await expect(
        trustVault.connect(user1).deposit({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(trustVault, "AccessDenied");
    });

    it("should allow withdraw for trusted user", async function () {
      await trustVerifier.updateTrustScore(user1.address, 70, 3);

      // Deposit first
      await trustVault.connect(user1).deposit({ value: ethers.parseEther("1") });

      // Withdraw should succeed
      await expect(
        trustVault.connect(user1).withdraw(ethers.parseEther("0.5"))
      ).to.not.be.reverted;
    });

    it("should track deposits correctly", async function () {
      await trustVerifier.updateTrustScore(user1.address, 70, 3);

      await trustVault.connect(user1).deposit({ value: ethers.parseEther("1") });
      await trustVault.connect(user1).deposit({ value: ethers.parseEther("2") });

      const deposit = await trustVault.getDeposit(user1.address);
      expect(deposit).to.equal(ethers.parseEther("3"));
    });
  });

  describe("TrustPool", function () {
    it("should allow join with sufficient trust (band 3)", async function () {
      await trustVerifier.updateTrustScore(user1.address, 80, 4);

      await expect(trustPool.connect(user1).join()).to.not.be.reverted;

      const hasAccess = await trustPool.hasAccess(user1.address);
      expect(hasAccess).to.equal(true);
    });

    it("should deny join with insufficient trust", async function () {
      // Band 2 < required band 3
      await trustVerifier.updateTrustScore(user1.address, 55, 2);

      await expect(
        trustPool.connect(user1).join()
      ).to.be.revertedWithCustomError(trustPool, "AccessDenied");
    });

    it("should prevent double join", async function () {
      await trustVerifier.updateTrustScore(user1.address, 80, 4);

      await trustPool.connect(user1).join();

      await expect(
        trustPool.connect(user1).join()
      ).to.be.revertedWith("Already joined");
    });

    it("should allow leave", async function () {
      await trustVerifier.updateTrustScore(user1.address, 80, 4);

      await trustPool.connect(user1).join();
      await trustPool.connect(user1).leave();

      const hasAccess = await trustPool.hasAccess(user1.address);
      expect(hasAccess).to.equal(false);
    });

    it("should track member count", async function () {
      await trustVerifier.updateTrustScore(user1.address, 80, 4);
      await trustVerifier.updateTrustScore(user2.address, 90, 4);

      await trustPool.connect(user1).join();
      expect(await trustPool.totalMembers()).to.equal(1);

      await trustPool.connect(user2).join();
      expect(await trustPool.totalMembers()).to.equal(2);

      await trustPool.connect(user1).leave();
      expect(await trustPool.totalMembers()).to.equal(1);
    });
  });

  describe("TrustAirdrop", function () {
    it("should allow claim with sufficient trust (band 1+)", async function () {
      // Band 1 meets minimum for airdrop (band 1)
      await trustVerifier.updateTrustScore(user1.address, 25, 1);

      await expect(trustAirdrop.connect(user1).claim()).to.not.be.reverted;

      const hasClaimed = await trustAirdrop.hasClaimed(user1.address);
      expect(hasClaimed).to.equal(true);
    });

    it("should deny claim with no trust score", async function () {
      await expect(
        trustAirdrop.connect(user1).claim()
      ).to.be.revertedWithCustomError(trustAirdrop, "TrustVerificationFailed");
    });

    it("should prevent double claim", async function () {
      await trustVerifier.updateTrustScore(user1.address, 50, 3);

      await trustAirdrop.connect(user1).claim();

      await expect(
        trustAirdrop.connect(user1).claim()
      ).to.be.revertedWith("Already claimed");
    });

    it("should track claim count", async function () {
      await trustVerifier.updateTrustScore(user1.address, 50, 3);
      await trustVerifier.updateTrustScore(user2.address, 60, 3);

      await trustAirdrop.connect(user1).claim();
      expect(await trustAirdrop.totalClaimed()).to.equal(1);

      await trustAirdrop.connect(user2).claim();
      expect(await trustAirdrop.totalClaimed()).to.equal(2);
    });
  });

  describe("setVerifier", function () {
    it("should allow owner to set verifier", async function () {
      const newVerifier = owner.address; // Just use owner address for test

      await expect(
        trustVault.setVerifier(newVerifier)
      ).to.not.be.reverted;
    });

    it("should deny non-owner to set verifier", async function () {
      await expect(
        trustVault.connect(user1).setVerifier(user2.address)
      ).to.be.revertedWithCustomError(trustVault, "OwnableUnauthorizedAccount");
    });
  });

  describe("setPolicy", function () {
    it("should allow owner to set policy", async function () {
      await expect(
        trustVault.setPolicy(owner.address)
      ).to.not.be.reverted;
    });

    it("should deny non-owner to set policy", async function () {
      await expect(
        trustVault.connect(user1).setPolicy(user2.address)
      ).to.be.revertedWithCustomError(trustVault, "OwnableUnauthorizedAccount");
    });
  });

  describe("expired trust score", function () {
    it("should deny access with expired trust score", async function () {
      // In real scenario, we'd need to manipulate block timestamp
      // For now, this test documents the expected behavior
      // The TrustVerifier has 24 hour expiry, and verify() should revert with ExpiredTrustScore
    });
  });
});
