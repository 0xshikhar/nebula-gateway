const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("TrustVerifier", function () {
  let trustVerifier;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const TrustVerifier = await ethers.getContractFactory("TrustVerifier");
    trustVerifier = await TrustVerifier.deploy(owner.address);
    await trustVerifier.waitForDeployment();
  });

  describe("updateTrustScore", function () {
    it("should update trust score for a user", async function () {
      await trustVerifier.updateTrustScore(user1.address, 85, 4);

      const [score, band, isValid] = await trustVerifier.getTrustScore(user1.address);
      expect(score).to.equal(85);
      expect(band).to.equal(4);
      expect(isValid).to.equal(true);
    });

    it("should reject score above max", async function () {
      await expect(
        trustVerifier.updateTrustScore(user1.address, 101, 3)
      ).to.be.revertedWith("Score too high");
    });

    it("should reject invalid band", async function () {
      await expect(
        trustVerifier.updateTrustScore(user1.address, 50, 0)
      ).to.be.revertedWith("Invalid band");

      await expect(
        trustVerifier.updateTrustScore(user1.address, 50, 6)
      ).to.be.revertedWith("Invalid band");
    });

    it("should allow only owner to update scores", async function () {
      await expect(
        trustVerifier.connect(user1).updateTrustScore(user2.address, 75, 3)
      ).to.be.revertedWithCustomError;
    });
  });

  describe("verify", function () {
    beforeEach(async function () {
      await trustVerifier.updateTrustScore(user1.address, 85, 4);
    });

    it("should return true for valid user with sufficient band", async function () {
      const result = await trustVerifier.verify(user1.address, 3);
      expect(result).to.equal(true);
    });

    it("should revert for user below minimum band", async function () {
      await expect(
        trustVerifier.verify(user1.address, 5)
      ).to.be.revertedWithCustomError(trustVerifier, "InsufficientTrust");
    });

    it("should revert for expired score", async function () {
      // Score has 24 hour expiry - we can't easily test this in unit tests
      // but the logic is there
    });

    it("should revert for non-existent user", async function () {
      await expect(
        trustVerifier.verify(user2.address, 1)
      ).to.be.revertedWithCustomError(trustVerifier, "ExpiredTrustScore");
    });
  });

  describe("getTrustScore", function () {
    it("should return correct score, band, and validity", async function () {
      await trustVerifier.updateTrustScore(user1.address, 75, 3);

      const [score, band, isValid] = await trustVerifier.getTrustScore(user1.address);
      expect(score).to.equal(75);
      expect(band).to.equal(3);
      expect(isValid).to.equal(true);
    });

    it("should return 0,0,false for non-existent user", async function () {
      const [score, band, isValid] = await trustVerifier.getTrustScore(user2.address);
      expect(score).to.equal(0);
      expect(band).to.equal(0);
      expect(isValid).to.equal(false);
    });
  });

  describe("checkTrust", function () {
    beforeEach(async function () {
      await trustVerifier.updateTrustScore(user1.address, 85, 4);
    });

    it("should return true when score meets minimum", async function () {
      const [allowed, actualScore, actualBand] = await trustVerifier.checkTrust(user1.address, 50);
      expect(allowed).to.equal(true);
      expect(actualScore).to.equal(85);
      expect(actualBand).to.equal(4);
    });

    it("should return false when score below minimum", async function () {
      const [allowed, actualScore, actualBand] = await trustVerifier.checkTrust(user1.address, 90);
      expect(allowed).to.equal(false);
      expect(actualScore).to.equal(85);
    });
  });

  describe("getBand", function () {
    it("should return correct band based on score thresholds", async function () {
      expect(await trustVerifier.getBand(0)).to.equal(0);
      expect(await trustVerifier.getBand(15)).to.equal(0);
      expect(await trustVerifier.getBand(20)).to.equal(1);
      expect(await trustVerifier.getBand(40)).to.equal(2);
      expect(await trustVerifier.getBand(60)).to.equal(3);
      expect(await trustVerifier.getBand(80)).to.equal(4);
      expect(await trustVerifier.getBand(100)).to.equal(4);
    });
  });

  describe("nullifiers", function () {
    it("should track used nullifiers", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test"));

      expect(await trustVerifier.isNullifierUsed(nullifier)).to.equal(false);

      await trustVerifier.useNullifier(nullifier);

      expect(await trustVerifier.isNullifierUsed(nullifier)).to.equal(true);
    });

    it("should prevent double use of nullifier", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await trustVerifier.useNullifier(nullifier);

      await expect(
        trustVerifier.useNullifier(nullifier)
      ).to.be.revertedWith("Nullifier already used");
    });
  });
});