const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("TrustGateway", function () {
  let trustGateway;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const TrustGateway = await ethers.getContractFactory("TrustGateway");
    trustGateway = await TrustGateway.deploy();
    await trustGateway.waitForDeployment();
  });

  it("should initialize with the default policy version", async function () {
    expect(await trustGateway.policyVersion()).to.equal("nebula-trust-v1");
    expect(await trustGateway.decisionCount()).to.equal(0);
  });

  it("should record and return the latest decision", async function () {
    const proofId = ethers.keccak256(ethers.toUtf8Bytes("proof-1"));

    await trustGateway.recordDecision(user1.address, 2, 87, proofId, "nebula-trust-v1");

    expect(await trustGateway.decisionCount()).to.equal(1);

    const [decision, trustScore, policyVersion, storedProofId] = await trustGateway.lastDecision(user1.address);
    expect(decision).to.equal(2);
    expect(trustScore).to.equal(87);
    expect(policyVersion).to.equal("nebula-trust-v1");
    expect(storedProofId).to.equal(proofId);
  });

  it("should update the published policy version", async function () {
    await trustGateway.publishPolicy("nebula-trust-v2");
    expect(await trustGateway.policyVersion()).to.equal("nebula-trust-v2");
  });
});
