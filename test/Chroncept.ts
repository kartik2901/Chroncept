import {
  ChronNFT,
  ChronNFT__factory,
  Marketplace,
  Marketplace__factory,
  Usd,
  Usd__factory,
  Vault,
  VaultFactory,
  VaultFactory__factory,
  Vault__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";
import "solidity-coverage";

import { expandTo15Decimals, expandTo16Decimals, expandTo17Decimals, expandTo18Decimals } from "./utilities/utilities";
import fractionSellerVoucher from "./utilities/fractionSeller";
import fractionBuyerVoucher from "./utilities/fractionBuyer";
import { usdtSol } from "../typechain-types/contracts/mock";
import NFTSellerVoucher from "./utilities/sellervoucher";

describe("chroncept", async () => {
  let NFT: ChronNFT;
  let vault: Vault;
  let factory: VaultFactory;
  let signers: SignerWithAddress[];
  let owner: SignerWithAddress;
  let USDT: Usd;
  let marketplace : Marketplace;
  

  beforeEach(async () => {
    signers = await ethers.getSigners();
    owner = signers[0];
    NFT = await new ChronNFT__factory(owner).deploy();
    USDT = await new Usd__factory(owner).deploy();
    vault = await new Vault__factory(owner).deploy();
    factory = await new VaultFactory__factory(owner).deploy();
    marketplace = await new Marketplace__factory(owner).deploy();
    await vault.initialize(
      "TestName",
      "TestSymbol",
      10,
      NFT.address,
      1,
      100,
      USDT.address,
      owner.address,
      owner.address,
      owner.address,
    );
    await factory.initialize(vault.address);
    await NFT.initialize("TestName", "TestSymbol", factory.address);
    await marketplace.initialize(USDT.address);

    // await marketplace.initialize(owner.address,USDT.address);
    //await factory.connect(owner).addOperator(NFT.address,true);
  });

  it("revert initialize", async () => {
    //   await factory.initialize(vault.address)
    await expect(
      vault.initialize(
        "TestName",
        "TestSymbol",
        10,
        NFT.address,
        1,
        expandTo18Decimals(100),
        USDT.address,
        owner.address,
        owner.address,
        owner.address
      )
    ).to.be.revertedWith("Initializable: contract is already initialized");
    //   await NFT.initialize("TestName","TestSymbol",factory.address);
    await expect(
      NFT.initialize("TestName", "TestSymbol", factory.address)
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("symbol", async () => {
    const symbol = await vault.symbol();
    expect("TestSymbol").to.be.eq(symbol);
  });

  it("name", async () => {
    const name = await vault.name();
    expect("TestName").to.be.eq(name);
  });

  it("NFT mint ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
  });

  it("NFT burn ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    await NFT.connect(owner).burn(1);
  });

  it("ERROR : Non Operator caller", async () => {
    await factory.connect(owner).addOperator(signers[1].address, true);
    await expect(
      NFT.connect(owner).safeMint(
        "test_name",
        "test_symbol",
        "test",
        1,
        expandTo18Decimals(30),
        expandTo18Decimals(10),
        USDT.address,
        owner.address,
        owner.address,
        owner.address
      )
    ).to.be.revertedWith("NO");
  });
  it("ERROR:zero address set as Operator ", async () => {
    await expect(
      factory
        .connect(owner)
        .addOperator("0x0000000000000000000000000000000000000000", true)
    ).to.be.revertedWith("ZA");
  });

  it("ERROR: Vault address updated to zero address ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    await expect(
      factory
        .connect(owner)
        .updateVault("0x0000000000000000000000000000000000000000")
    ).to.be.revertedWith("ZA");
  });

  it("Buy NFT", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(1));
  });
  it("ERROR:zero address for exclude from fee", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await expect(vault_instance.excludeFromFee("0x0000000000000000000000000000000000000000",true));
  });

  it("Buy NFT through multiple vault ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    await NFT.connect(owner).safeMint(
      "test_name2",
      "test_symbol2",
      "test",
      2,
      expandTo18Decimals(20),
      expandTo18Decimals(15),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );

    let v1 = await factory.connect(owner).viewVault(1);
    let v2 = await factory.connect(owner).viewVault(2);

    const vault_instance = await new Vault__factory(owner).attach(v1);
    const vault_instance2 = await new Vault__factory(owner).attach(v2);

    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance2.address,
      expandTo18Decimals(20)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(1));
    await vault_instance2.connect(signers[1]).buyFractions(expandTo18Decimals(1));
  });

  it("ERROR: all fractions sold", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );

    let v1 = await factory.connect(owner).viewVault(1);

    const vault_instance = await new Vault__factory(owner).attach(v1);

    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(400)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(30));
    await expect(
      vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(1))
    ).to.be.revertedWith("AFS");
  });
  it("ERROR: Not Enough Supply", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
          expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );

    let v1 = await factory.connect(owner).viewVault(1);

    const vault_instance = await new Vault__factory(owner).attach(v1);

    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(400)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await expect(
      vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(31))
    ).to.be.revertedWith("NES");
  });

  it("ERROR : No allowance ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
          expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(1));
    await expect(
      vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(1))
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });

  it("ERROR :insufficient allowance for buying fraction ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(1));
    await expect(
      vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(1))
    ).to.be.revertedWith("ERC20: insufficient allowance");
  });
  it("ERROR: Offer buyout before primary buy ends ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
          expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(300)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(29));
    await expect(
      vault_instance.connect(signers[1]).makeOffer(expandTo18Decimals(200)
    )).to.be.revertedWith("NAY");
  });

  it("ERROR: buyout price same as nft price ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
          expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(1000)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(30));
    await expect(
      vault_instance.connect(signers[1]).makeOffer(expandTo18Decimals(10)
    )).to.be.revertedWith("PL");
  });

  it("ERROR: buyout price too low", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
          expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(1000)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(30));
    await expect(
      vault_instance.connect(signers[1]).makeOffer(expandTo18Decimals(8)
    )).to.be.revertedWith("PL");
  });

  it("Buyout offer", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(300)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(30));
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(330)
    );
    await vault_instance.connect(signers[2]).makeOffer(expandTo18Decimals(11));
  });

  it("multiple Buyout offer ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(30),
          expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(300)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(30));
    // 1st buyout offer
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(330)
    );
    await vault_instance.connect(signers[2]).makeOffer(expandTo18Decimals(11));
    // 2nd buyout offer
    await USDT.connect(owner).mint(
      signers[3].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(390)
    );
    await vault_instance.connect(signers[3]).makeOffer(expandTo18Decimals(13));
    // 3rd buyout offer
    await USDT.connect(owner).mint(
      signers[4].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(450)
    );
    await vault_instance.connect(signers[4]).makeOffer(expandTo18Decimals(15));
    // 4th buyout offer, with same price
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(450)
    );
    await vault_instance.connect(signers[5]).makeOffer(expandTo18Decimals(15));
  });



  it("Secondary marketplace BUY NFT flow check ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      signers[9].address,
      signers[10].address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(50)
    );
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(60)
    );
    await USDT.connect(owner).mint(
      signers[3].address,
      expandTo18Decimals(30)
    );
    console.log("signers 3 ",await USDT.balanceOf(signers[3].address));

    await USDT.connect(owner).mint(
      signers[4].address,
      expandTo18Decimals(10)
    );
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(50)
    );


    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(60)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(30)
    );
    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    console.log("balance of tax wallet ",await USDT.balanceOf(signers[9].address));
    console.log("owner balance",await USDT.balanceOf(owner.address));


    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(5));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(6));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(3));
    console.log("signers 3 ",await USDT.balanceOf(signers[3].address));

    await vault_instance.connect(signers[4]).buyFractions(expandTo18Decimals(1));
    await vault_instance.connect(signers[5]).buyFractions(expandTo18Decimals(5));
    console.log("balance of market fee wallet 0 ",await USDT.balanceOf(signers[10].address));


    // USDT transferred
    expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));
    // USDT received
    expect(await USDT.balanceOf(owner.address)).to.be.eq(expandTo18Decimals(1000198));
    // fractions received
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(5));
    // 1% market fee received
    expect(await USDT.balanceOf(signers[10].address)).to.be.eq(expandTo18Decimals(2));

    // 1st buyout offer
    await USDT.connect(owner).mint(
      signers[6].address,
      expandTo18Decimals(220)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // 2nd buyout offer
    await USDT.connect(owner).mint(
      signers[7].address,
      expandTo18Decimals(260)
    );
    await USDT.connect(signers[7]).approve(
      vault_instance.address,
      expandTo18Decimals(260)
    );
    await vault_instance.connect(signers[7]).makeOffer(expandTo18Decimals(13));
    // 3rd buyout offer
    await USDT.connect(owner).mint(
      signers[8].address,
      expandTo18Decimals(300)
    );
    await USDT.connect(signers[8]).approve(
      vault_instance.address,
      expandTo18Decimals(300)
    );
    await vault_instance.connect(signers[8]).makeOffer(expandTo18Decimals(15));
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(5));


    //2.5% of tax received
    expect(await vault_instance.balanceOf(signers[9].address)).to.be.eq(expandTo15Decimals(125));
    await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(3));
    await vault_instance.connect(signers[2]).sellFraction(1,expandTo18Decimals(6));
    // await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(3));
    // await vault_instance.connect(signers[2]).sellFraction(2,expandTo18Decimals(6));
    // await vault_instance.connect(signers[4]).sellFraction(3,expandTo18Decimals(1));
    // await vault_instance.connect(signers[5]).sellFraction(3,expandTo18Decimals(5));
    // expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));
    // // 1% market fee received  
    // expect(await USDT.balanceOf(signers[10].address)).to.be.eq(expandTo16Decimals(456));
    // //2.5% of total tax received
    // expect(await vault_instance.balanceOf(signers[9].address)).to.be.eq(expandTo15Decimals(500));

    //market fee received
    expect(await USDT.balanceOf(signers[10].address)).to.be.eq(expandTo16Decimals(354));

    await vault_instance.connect(signers[6]).claimNFT(1);
    await vault_instance.connect(signers[4]).claimShare();
    await vault_instance.connect(signers[5]).claimShare();
    const NFTseller = await new NFTSellerVoucher({
      _contract: marketplace,
      _signer: signers[6],
    })
    const sellerVoucher = await NFTseller.createVoucher(
      NFT.address,
      signers[6].address,
      1,
      expandTo18Decimals(220),
    )
    await NFT.connect(signers[6]).approve(
      marketplace.address,
      1
    );
    await USDT.connect(owner).mint(
      signers[11].address,
      expandTo18Decimals(220)
    );
    await USDT.connect(signers[11]).approve(
      marketplace.address,
      expandTo18Decimals(220)
    );
    await  marketplace.connect(signers[11]).buyNFT(sellerVoucher);
    expect(await vault_instance.balanceOf(signers[9].address)).to.be.eq(expandTo16Decimals(35));

  });

  it("fraction trade after nft buyout  ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      signers[9].address,
      signers[10].address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(50)
    );
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(60)
    );
    await USDT.connect(owner).mint(
      signers[3].address,
      expandTo18Decimals(30)
    );
    console.log("signers 3 ",await USDT.balanceOf(signers[3].address));

    await USDT.connect(owner).mint(
      signers[4].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(50)
    );


    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(60)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(30)
    );
    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    console.log("balance of tax wallet ",await USDT.balanceOf(signers[9].address));
    console.log("owner balance",await USDT.balanceOf(owner.address));


    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(5));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(6));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(3));
    console.log("signers 3 ",await USDT.balanceOf(signers[3].address));

    await vault_instance.connect(signers[4]).buyFractions(expandTo18Decimals(1));
    await vault_instance.connect(signers[5]).buyFractions(expandTo18Decimals(5));
    console.log("balance of market fee wallet 0 ",await USDT.balanceOf(signers[10].address));


    // USDT transferred
    expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));
    // USDT received
    expect(await USDT.balanceOf(owner.address)).to.be.eq(expandTo18Decimals(1000198));
    // fractions received
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(5));
    // 1% market fee received
    expect(await USDT.balanceOf(signers[10].address)).to.be.eq(expandTo18Decimals(2));

    // 1st buyout offer
    await USDT.connect(owner).mint(
      signers[6].address,
      expandTo18Decimals(220)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // 2nd buyout offer
    await USDT.connect(owner).mint(
      signers[7].address,
      expandTo18Decimals(260)
    );
    await USDT.connect(signers[7]).approve(
      vault_instance.address,
      expandTo18Decimals(260)
    );
    await vault_instance.connect(signers[7]).makeOffer(expandTo18Decimals(13));
    // 3rd buyout offer
    await USDT.connect(owner).mint(
      signers[8].address,
      expandTo18Decimals(300)
    );
    await USDT.connect(signers[8]).approve(
      vault_instance.address,
      expandTo18Decimals(300)
    );
    await vault_instance.connect(signers[8]).makeOffer(expandTo18Decimals(15));
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(5));


    //2.5% of tax received
    expect(await vault_instance.balanceOf(signers[9].address)).to.be.eq(expandTo15Decimals(125));
    await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(3));
    await vault_instance.connect(signers[2]).sellFraction(1,expandTo18Decimals(6));
   
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));

    await vault_instance.connect(signers[6]).claimNFT(1);

    const seller = await new fractionSellerVoucher({
      _contract: marketplace,
      _signer: signers[5],
    });
    const sellerVoucher = await seller.createVoucher(
      signers[5].address,
      vault_instance.address,
      expandTo18Decimals(5),
      expandTo18Decimals(20),
      1
    )
    const buyer = await new fractionBuyerVoucher({
      _contract: marketplace,
      _signer: signers[4],
    });
    const buyerVoucher = await buyer.createVoucher(
      signers[4].address,
      vault_instance.address,
      expandTo18Decimals(4),
      expandTo18Decimals(150),      
    )
    await USDT.connect(signers[4]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
    );
    await vault_instance.connect(signers[5]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
    );
    await marketplace.fractionTrade(buyerVoucher,sellerVoucher);
  });

///////////////check.........
  it("Secondary marketplace fraction flow check ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      signers[9].address,
      signers[10].address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(50)
    );
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(60)
    );
    await USDT.connect(owner).mint(
      signers[3].address,
      expandTo18Decimals(1030)
    );
    console.log("signers 3 ",await USDT.balanceOf(signers[3].address));

    await USDT.connect(owner).mint(
      signers[4].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(1050)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(60)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(30)
    );
    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);
    console.log("balance of tax wallet ",await USDT.balanceOf(signers[9].address));
    console.log("owner balance",await USDT.balanceOf(owner.address));

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(5));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(6));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(3));
    await vault_instance.connect(signers[4]).buyFractions(expandTo18Decimals(1));
    await vault_instance.connect(signers[5]).buyFractions(expandTo18Decimals(5));
    console.log("balance of market fee wallet 0 ",await USDT.balanceOf(signers[10].address));

    // USDT transferred
    expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));
    // USDT received
    expect(await USDT.balanceOf(owner.address)).to.be.eq(expandTo18Decimals(1000198));
    // fractions received
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(5));
    // 1% market fee received
    expect(await USDT.balanceOf(signers[10].address)).to.be.eq(expandTo18Decimals(2));

    // 1st buyout offer
    await USDT.connect(owner).mint(
      signers[6].address,
      expandTo18Decimals(220)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // 2nd buyout offer
    await USDT.connect(owner).mint(
      signers[7].address,
      expandTo18Decimals(260)
    );
    await USDT.connect(signers[7]).approve(
      vault_instance.address,
      expandTo18Decimals(260)
    );
    await vault_instance.connect(signers[7]).makeOffer(expandTo18Decimals(13));
    // 3rd buyout offer
    await USDT.connect(owner).mint(
      signers[8].address,
      expandTo18Decimals(300)
    );
    await USDT.connect(signers[8]).approve(
      vault_instance.address,
      expandTo18Decimals(300)
    );
    await vault_instance.connect(signers[8]).makeOffer(expandTo18Decimals(15));
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(5));
    await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(3));
    await vault_instance.connect(signers[2]).sellFraction(2,expandTo18Decimals(6));
    await vault_instance.connect(signers[4]).sellFraction(3,expandTo18Decimals(1));
    await vault_instance.connect(signers[5]).sellFraction(3,expandTo18Decimals(5));
   
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));
    console.log("signers 6",await vault_instance.balanceOf(signers[6].address));
    console.log("signers 7",await vault_instance.balanceOf(signers[7].address));
    console.log("signers 8",await vault_instance.balanceOf(signers[8].address));

    const seller = await new fractionSellerVoucher({
      _contract: marketplace,
      _signer: signers[6],
    });
    const sellerVoucher = await seller.createVoucher(
      signers[6].address,
      vault_instance.address,
      expandTo17Decimals(78),
      expandTo18Decimals(20),
      1
    )
    const seller2 = await new fractionSellerVoucher({
      _contract: marketplace,
      _signer: signers[7],
    });
    const sellerVoucher2 = await seller2.createVoucher(
      signers[7].address,
      vault_instance.address,
      expandTo16Decimals(585),
      expandTo18Decimals(20),
      2
    )
    const seller3 = await new fractionSellerVoucher({
      _contract: marketplace,
      _signer: signers[8],
    });
    const sellerVoucher3 = await seller3.createVoucher(
      signers[8].address,
      vault_instance.address,
      expandTo16Decimals(585),
      expandTo18Decimals(20),
      3
    )
    const buyer = await new fractionBuyerVoucher({
      _contract: marketplace,
      _signer: signers[3],
    });
    const buyer2 = await new fractionBuyerVoucher({
      _contract: marketplace,
      _signer: signers[4],
    });
    const buyer3 = await new fractionBuyerVoucher({
      _contract: marketplace,
      _signer: signers[5],
    });
    
    const buyerVoucher = await buyer.createVoucher(
      signers[3].address,
      vault_instance.address,

       expandTo18Decimals(7),
      expandTo18Decimals(200),      
      )
      const buyerVoucher0 = await buyer.createVoucher(
        signers[3].address,
        vault_instance.address,
        expandTo17Decimals(8),
        expandTo18Decimals(20),      
        )
    const buyerVoucher2 = await buyer2.createVoucher(
      signers[4].address,
      vault_instance.address,
      expandTo16Decimals(585),
      expandTo18Decimals(200),      
    )
    const buyerVoucher3 = await buyer3.createVoucher(
      signers[5].address,
      vault_instance.address,
      expandTo18Decimals(4),
      expandTo18Decimals(100),      
    )
    const buyerVoucher4 = await buyer3.createVoucher(
      signers[5].address,
      vault_instance.address,
      expandTo16Decimals(185),
      expandTo18Decimals(100),      
    )
    await USDT.connect(signers[4]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[3]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[5]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
    );
    await vault_instance.connect(signers[6]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
    );
    await vault_instance.connect(signers[7]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
    );
    await vault_instance.connect(signers[8]).approve(
      marketplace.address,
      expandTo18Decimals(1000)
      );
   await marketplace.fractionTrade(buyerVoucher,sellerVoucher);
   await marketplace.fractionTrade(buyerVoucher0,sellerVoucher);
   await marketplace.fractionTrade(buyerVoucher2,sellerVoucher2);
   await marketplace.fractionTrade(buyerVoucher3,sellerVoucher3);
   await marketplace.fractionTrade(buyerVoucher4,sellerVoucher3);
   expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(expandTo15Decimals(7605));
   console.log("3",await vault_instance.balanceOf(signers[3].address));
   console.log("4",await vault_instance.balanceOf(signers[4].address));
   console.log("5",await vault_instance.balanceOf(signers[5].address));

   expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);
   expect(await vault_instance.balanceOf(signers[7].address)).to.be.eq(0);
   expect(await vault_instance.balanceOf(signers[8].address)).to.be.eq(0);
   await USDT.connect(signers[3]).approve(
    vault_instance.address,
    expandTo18Decimals(400)
  );
   await vault_instance.connect(signers[3]).makeOffer(expandTo18Decimals(20));
   await vault_instance.connect(signers[4]).sellFraction(4,expandTo17Decimals(57));
  //await vault_instance.connect(signers[5]).sellFraction(4,expandTo17Decimals(57));
  // await vault_instance.connect(signers[3]).sellFraction(4,expandTo17Decimals(57));

  console.log("4",await vault_instance.balanceOf(signers[4].address));
  console.log("5",await vault_instance.balanceOf(signers[5].address));

  await vault_instance.connect(signers[3]).claimNFT(4);
  console.log("signers 3",signers[3].address);
  });

  it("Claim offer amount ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      signers[9].address,
      signers[10].address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(50)
    );
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(60)
    );
    await USDT.connect(owner).mint(
      signers[3].address,
      expandTo18Decimals(1030)
    );
    console.log("signers 3 ",await USDT.balanceOf(signers[3].address));

    await USDT.connect(owner).mint(
      signers[4].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(1050)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(60)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(30)
    );
    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(10)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);
    console.log("balance of tax wallet ",await USDT.balanceOf(signers[9].address));
    console.log("owner balance",await USDT.balanceOf(owner.address));

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(5));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(6));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(3));
    await vault_instance.connect(signers[4]).buyFractions(expandTo18Decimals(1));
    await vault_instance.connect(signers[5]).buyFractions(expandTo18Decimals(5));
    console.log("balance of market fee wallet 0 ",await USDT.balanceOf(signers[10].address));

    // USDT transferred
    expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));
    // USDT received
    expect(await USDT.balanceOf(owner.address)).to.be.eq(expandTo18Decimals(1000198));
    // fractions received
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(5));
    // 1% market fee received
    expect(await USDT.balanceOf(signers[10].address)).to.be.eq(expandTo18Decimals(2));

    // 1st buyout offer
    await USDT.connect(owner).mint(
      signers[6].address,
      expandTo18Decimals(220)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(5));
    await vault_instance.connect(signers[6]).claimOfferAmount(1);
    });

    it("ERROR: buyout offer already claimed", async () => {
      await factory.connect(owner).addOperator(NFT.address, true);
      await NFT.connect(owner).safeMint(
        "test_name",
        "test_symbol",
        "test",
        1,
        expandTo18Decimals(20),
        expandTo18Decimals(10),
        USDT.address,
        owner.address,
        signers[9].address,
        signers[10].address
      );
      let v1 = await factory.connect(owner).viewVault(1);
      const vault_instance = await new Vault__factory(owner).attach(v1);
      await USDT.connect(owner).mint(
        signers[1].address,
        expandTo18Decimals(50)
      );
      await USDT.connect(owner).mint(
        signers[2].address,
        expandTo18Decimals(60)
      );
      await USDT.connect(owner).mint(
        signers[3].address,
        expandTo18Decimals(1030)
      );

      console.log("signers 3 ",await USDT.balanceOf(signers[3].address));
  
      await USDT.connect(owner).mint(
        signers[4].address,
        expandTo18Decimals(1000)
      );
      await USDT.connect(owner).mint(
        signers[5].address,
        expandTo18Decimals(1050)
      );
      await USDT.connect(signers[1]).approve(
        vault_instance.address,
        expandTo18Decimals(50)
      );
      await USDT.connect(signers[2]).approve(
        vault_instance.address,
        expandTo18Decimals(60)
      );
      await USDT.connect(signers[3]).approve(
        vault_instance.address,
        expandTo18Decimals(30)
      );
      await USDT.connect(signers[4]).approve(
        vault_instance.address,
        expandTo18Decimals(10)
      );
      await USDT.connect(signers[5]).approve(
        vault_instance.address,
        expandTo18Decimals(50)
      );
      await vault_instance.excludeFromFee(vault_instance.address,true);
      console.log("balance of tax wallet ",await USDT.balanceOf(signers[9].address));
      console.log("owner balance",await USDT.balanceOf(owner.address));
  
      //fractional buy
      await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(5));
      await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(6));
      await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(3));
      await vault_instance.connect(signers[4]).buyFractions(expandTo18Decimals(1));
      await vault_instance.connect(signers[5]).buyFractions(expandTo18Decimals(5));
      console.log("balance of market fee wallet 0 ",await USDT.balanceOf(signers[10].address));
  
      // USDT transferred
      expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(0));
      // USDT received
      expect(await USDT.balanceOf(owner.address)).to.be.eq(expandTo18Decimals(1000198));
      // fractions received
      expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(5));
      // 1% market fee received
      expect(await USDT.balanceOf(signers[10].address)).to.be.eq(expandTo18Decimals(2));
  
      // 1st buyout offer
      await USDT.connect(owner).mint(
        signers[6].address,
        expandTo18Decimals(220)
      );
      await USDT.connect(signers[6]).approve(
        vault_instance.address,
        expandTo18Decimals(220)
      );
      await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
      await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(5));
      expect( await vault_instance.connect(signers[6]).claimOfferAmount(1)).to.be.revertedWith("AC");

      });
 
  // it('votes for multiple buyout ', async () => {

  //     await factory.connect(owner).addOperator(NFT.address, true);
  //     await NFT.connect(owner).safeMint("test_name", "test_symbol", 1, "test", 20, expandTo18Decimals(10), USDT.address, owner.address, owner.address, owner.address);
  //     let v1 = await factory.connect(owner).viewVault(1);
  //     const vault_instance = await new Vault__factory(owner).attach(v1)
  //     await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(1000));
  //     await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(1000));
  //     await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(1000));
  //     await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(1000));
  //     await USDT.connect(owner).mint(signers[5].address, expandTo18Decimals(1000));

  //     await USDT.connect(signers[1]).approve(vault_instance.address, expandTo18Decimals(1000));
  //     await USDT.connect(signers[2]).approve(vault_instance.address, expandTo18Decimals(110));
  //     await USDT.connect(signers[3]).approve(vault_instance.address, expandTo18Decimals(50));
  //     await USDT.connect(signers[4]).approve(vault_instance.address, expandTo18Decimals(50));
  //     await USDT.connect(signers[5]).approve(vault_instance.address, expandTo18Decimals(100));
 // await vault_instance.excludeFromFee(vault_instance.address,true);

  //     //fractional buy
  //     await vault_instance.connect(signers[1]).buyFractions(5);
  //     await vault_instance.connect(signers[2]).buyFractions(6);
  //     await vault_instance.connect(signers[3]).buyFractions(3);
  //     await vault_instance.connect(signers[4]).buyFractions(1);
  //     await vault_instance.connect(signers[5]).buyFractions(5);
  //     // 1st buyout offer
  //     await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(1000));
  //     await USDT.connect(signers[6]).approve(vault_instance.address, expandTo18Decimals(220));
  //     await(vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(expandTo18Decimals(11)));
  //     // 2nd buyout offer
  //     await USDT.connect(owner).mint(signers[7].address, expandTo18Decimals(1000));
  //     await USDT.connect(signers[7]).approve(vault_instance.address, expandTo18Decimals(260));
  //     await(vault_instance.connect(signers[7]).makeOffer(expandTo18Decimals(expandTo18Decimals(13)));
  //     // 3rd buyout offer
  //     await USDT.connect(owner).mint(signers[8].address, expandTo18Decimals(1000));
  //     await USDT.connect(signers[8]).approve(vault_instance.address, expandTo18Decimals(450));
  //     await(vault_instance.connect(signers[8]).makeOffer(expandTo18Decimals(expandTo18Decimals(15)));
  //     console.log("spender",await(USDT.allowance(signers[1].address,vault_instance.address)));

  //     await(vault_instance.connect(signers[1]).voteOffer(0,true));

  // });

  it("ERROR: voter do not hold any fraction", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[3].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[4].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(900)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(110)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(100)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(5));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(6));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(3));
    await vault_instance.connect(signers[4]).buyFractions(expandTo18Decimals(1));
    await vault_instance.connect(signers[5]).buyFractions(expandTo18Decimals(5));
    // 1st buyout offer
    await USDT.connect(owner).mint(
      signers[6].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // 2nd buyout offer
    await USDT.connect(owner).mint(
      signers[7].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[7]).approve(
      vault_instance.address,
      expandTo18Decimals(260)
    );
    await vault_instance.connect(signers[7]).makeOffer(expandTo18Decimals(13));
    await expect(
      vault_instance.connect(signers[6]).sellFraction(1,expandTo18Decimals(5))

    ).to.be.revertedWith("NF");
  });

  it("ERROR: offerer not allowed to vote", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(
      signers[1].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[2].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[3].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[4].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(1000)
    );

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(900)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(110)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(50)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(100)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(5));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(6));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(3));
    await vault_instance.connect(signers[4]).buyFractions(expandTo18Decimals(1));
    await vault_instance.connect(signers[5]).buyFractions(expandTo18Decimals(5));
    // 1st buyout offered by fraction holder
    await USDT.connect(owner).mint(
      signers[5].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.connect(signers[5]).makeOffer(expandTo18Decimals(11));
    // 2nd buyout offer
    await USDT.connect(owner).mint(
      signers[7].address,
      expandTo18Decimals(1000)
    );
    await USDT.connect(signers[7]).approve(
      vault_instance.address,
      expandTo18Decimals(260)
    );
    await vault_instance.connect(signers[7]).makeOffer(expandTo18Decimals(13));
    //offerer voting for himself

    await expect(
      vault_instance.connect(signers[5]).sellFraction(1,expandTo18Decimals(5))).to.be.revertedWith("ONA");
  });
  it("voting for buyout successful", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(70));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(70)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );

    console.log("signer 1", signers[1].address);
    console.log("signer 2", signers[2].address);
    console.log("signer 3", signers[3].address);
    console.log("signer 6", signers[6].address);
    console.log("vault", vault_instance.address);
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(7));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(9));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(4));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(7));

    // await vault_instance.connect(signers[1]).voteOffer(1, true);
    console.log("balance", await USDT.balanceOf(signers[6].address));
    expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo16Decimals(7623));

    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);
    await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(4));

    // await vault_instance.connect(signers[3]).voteOffer(1, true);
    expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(expandTo15Decimals(10725));
    await vault_instance.connect(signers[6]).claimNFT(1);

    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);

  });
  it("ERROR: sell fraction not available ,NFT already sold ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(70));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(70)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );

    console.log("signer 1", signers[1].address);
    console.log("signer 2", signers[2].address);
    console.log("signer 3", signers[3].address);
    console.log("signer 6", signers[6].address);
    console.log("vault", vault_instance.address);
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(7));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(9));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(4));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(7));

    // await vault_instance.connect(signers[1]).voteOffer(1, true);
    console.log("balance", await USDT.balanceOf(signers[6].address));
    expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo16Decimals(7623));

    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);
    await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(4));

    // await vault_instance.connect(signers[3]).voteOffer(1, true);
    expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(expandTo15Decimals(10725));
    await vault_instance.connect(signers[6]).claimNFT(1);
    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);
    await expect(vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(7))).to.be.revertedWith("NAS");

  });

  it("ERROR :voting for buyout at 50% unsuccessful", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(70));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(70)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(7));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(9));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(4));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(7));

    // await vault_instance.connect(signers[1]).voteOffer(1, true);
 
    //console.log("spender",await(USDT.allowance(signers[1].address,vault_instance.address)));
    await expect(
      vault_instance.connect(signers[6]).claimNFT(1)
    ).to.be.revertedWith("NE");
  });

  it("ERROR :NFT claimer should be an Offerer", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(70)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
  
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(7));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(9));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(4));
    console.log("hey");

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    console.log("hey1");

    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(7));
    console.log("hey2");


    await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(4));

    // await vault_instance.connect(signers[1]).voteOffer(1, true);
    // await vault_instance.connect(signers[3]).voteOffer(1, true);
    //console.log("spender",await(USDT.allowance(signers[1].address,vault_instance.address)));
    await expect(vault_instance.connect(signers[4]).claimNFT(1)).to.be.revertedWith("NO");
  });

  it("ERROR : NFT already sold", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(110)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance
      .connect(signers[1])
      .buyFractions(expandTo18Decimals(11));
    await vault_instance
      .connect(signers[2])
      .buyFractions(expandTo18Decimals(9));
    // await vault_instance
    //   .connect(signers[3])
    //   .buyFractions(expandTo18Decimals(4));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(11));

   // await vault_instance.connect(signers[1]).voteOffer(1, true);
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(owner.address)
    );
    console.log("balanceeeee", await USDT.balanceOf(signers[6].address));
 //  expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(107));
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);

    // await vault_instance.connect(signers[2]).voteOffer(1, false);
    // await vault_instance.connect(signers[3]).voteOffer(1, true);
    // expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);

   // expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(11);

    await vault_instance.connect(signers[6]).claimNFT(1);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);

    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);

    await vault_instance.connect(signers[2]).claimShare();
    // expect(await vault_instance.balanceOf(signers[2].address)).to.be.eq(0);

    //  await expect (vault_instance.connect(signers[1]).claimShare()).to.be.revertedWith("AC");
  });

  it("Claim share after buyout succesfull", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(110)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance
      .connect(signers[1])
      .buyFractions(expandTo18Decimals(11));
    await vault_instance
      .connect(signers[2])
      .buyFractions(expandTo18Decimals(9));
    // await vault_instance
    //   .connect(signers[3])
    //   .buyFractions(expandTo18Decimals(4));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(11));

   // await vault_instance.connect(signers[1]).voteOffer(1, true);
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(owner.address)
    );
    console.log("balanceeeee", await USDT.balanceOf(signers[6].address));
 //  expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(107));
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);

    // await vault_instance.connect(signers[2]).voteOffer(1, false);
    // await vault_instance.connect(signers[3]).voteOffer(1, true);
    // expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);

   // expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(11);

    await vault_instance.connect(signers[6]).claimNFT(1);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);

    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);

    await vault_instance.connect(signers[2]).claimShare();
    // expect(await vault_instance.balanceOf(signers[2].address)).to.be.eq(0);

    //  await expect (vault_instance.connect(signers[1]).claimShare()).to.be.revertedWith("AC");
  });

  it("ERROR: cannot make offer as Buyout is over", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    await USDT.connect(owner).mint(signers[5].address, expandTo18Decimals(250));


    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(110)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(240)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance
      .connect(signers[1])
      .buyFractions(expandTo18Decimals(11));
    await vault_instance
      .connect(signers[2])
      .buyFractions(expandTo18Decimals(9));
    // await vault_instance
    //   .connect(signers[3])
    //   .buyFractions(expandTo18Decimals(4));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(11));

   // await vault_instance.connect(signers[1]).voteOffer(1, true);
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(owner.address)
    );
    console.log("balanceeeee", await USDT.balanceOf(signers[6].address));
 //  expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(107));
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);

    // await vault_instance.connect(signers[2]).voteOffer(1, false);
    // await vault_instance.connect(signers[3]).voteOffer(1, true);
    // expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);

   // expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(11);

    await vault_instance.connect(signers[6]).claimNFT(1);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);

    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);
    await expect(vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(12))).to.be.revertedWith("BO");


  });

  it("ERROR: Share already claimed", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(70));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(70)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(7));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(9));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(4));

    // 1st buyout offer

    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote

    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(7));

    console.log("balance of signers 6", await USDT.balanceOf(signers[6].address));
    console.log("balance of signers 1", await USDT.balanceOf(signers[1].address));

    expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo16Decimals(7623));
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);

    await vault_instance.connect(signers[3]).sellFraction(1,expandTo18Decimals(4));
    expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(expandTo15Decimals(10725));

   // expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(11);

    await vault_instance.connect(signers[6]).claimNFT(1);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);
    expect(await vault_instance.balanceOf(vault_instance.address)).to.be.eq(expandTo15Decimals(10725));

    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);

    await vault_instance.connect(signers[2]).claimShare();
    expect(await vault_instance.balanceOf(signers[2].address)).to.be.eq(0);
    await expect(
      vault_instance.connect(signers[2]).claimShare()
    ).to.be.revertedWith("AC");
  });

  it("ERROR: cannot claim share as NFT is not sold/buyout not over ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));

    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(70)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    //fractional buy
    await vault_instance.connect(signers[1]).buyFractions(expandTo18Decimals(7));
    await vault_instance.connect(signers[2]).buyFractions(expandTo18Decimals(9));
    await vault_instance.connect(signers[3]).buyFractions(expandTo18Decimals(4));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(7));

    console.log("balanceeeee", await USDT.balanceOf(signers[6].address));
    //expect(await USDT.balanceOf(signers[1].address)).to.be.eq( expandTo18Decimals(107));
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);

    await expect(
      vault_instance.connect(signers[2]).claimShare()
    ).to.be.revertedWith("BNO");
  });

  it("ERROR :Vault already exists for the token ID", async () => {
    // add operator before NFT mint and vault creation
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      20,
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    await expect(
      NFT.connect(signers[1]).safeMint(
        "test_name1",
        "test_symbol1",
        "test",
        1,
        30,
        expandTo18Decimals(11),
        USDT.address,
        owner.address,
        owner.address,
        owner.address
      )
    ).to.be.revertedWith("VE");
  });


  it("flow check", async () => {
    // add operator before NFT mint and vault creation
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(signers[4]).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );

    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    expect(
      await vault_instance.connect(owner).balanceOf(vault_instance.address)
    ).to.be.eq(expandTo18Decimals(20));
    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(
      vault_instance.address
    );

    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    // allowance
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(70)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(90)
    );
    await USDT.connect(signers[3]).approve(
      vault_instance.address,
      expandTo18Decimals(40)
    );
    await vault_instance.excludeFromFee(vault_instance.address,true);

    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);
    await vault_instance
      .connect(signers[1])
      .buyFractions(expandTo18Decimals(7));
    expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(7));
    await vault_instance
      .connect(signers[2])
      .buyFractions(expandTo18Decimals(9));
    await vault_instance
      .connect(signers[3])
      .buyFractions(expandTo18Decimals(4));
  });


  it("Claim share testing", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      owner.address,
      owner.address
    );
    console.log("owner of NFT",await NFT.connect(owner).ownerOf(1));
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    await USDT.connect(signers[1]).approve(
      vault_instance.address,
      expandTo18Decimals(120)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(80)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );
    // console.log("owner",factory.address);
    // console.log("owner",await vault_instance.owner());
    await vault_instance.excludeFromFee(vault_instance.address,true);
    //fractional buy
    await vault_instance
      .connect(signers[1])
      .buyFractions(expandTo18Decimals(12));
    await vault_instance
      .connect(signers[2])
      .buyFractions(expandTo18Decimals(8));

    // 1st buyout offer
    await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11));
    // vote
    // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
    console.log(
      "balanceeeee",
      await vault_instance.balanceOf(signers[1].address)
    );
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(signers[1].address)
    );
    await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(12));
    await vault_instance.connect(signers[2]).sellFraction(1,expandTo18Decimals(8));
    console.log(
      "fraction balance",
      await vault_instance.balanceOf(owner.address)
    );
    console.log("balanceeeee", await USDT.balanceOf(signers[6].address));
 //  expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(107));
   // expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(1);

    // expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);

   // expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(11);

    await vault_instance.connect(signers[6]).claimNFT(1);
    expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);

    expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);
    console.log("signers 2 balance",await USDT.balanceOf(signers[2].address));
   // await vault_instance.connect(signers[2]).voteOffer(1);
    console.log("signers 2 balance",await USDT.balanceOf(signers[2].address));
    console.log("vault  balance   ",await USDT.balanceOf(vault_instance.address));
    // expect(await vault_instance.balanceOf(signers[2].address)).to.be.eq(0);

    //  await expect (vault_instance.connect(signers[1]).claimShare()).to.be.revertedWith("AC");
  });


  // it("Claim share multiple offer testing", async () => {
  //   await factory.connect(owner).addOperator(NFT.address, true);
  //   await NFT.connect(owner).safeMint(
  //     "test_name",
  //     "test_symbol",
  //     1,
  //     "test",
  //     20,
  //     10,
  //     USDT.address,
  //     owner.address,
  //     owner.address,
  //     owner.address
  //   );
  //   console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
  //   let v1 = await factory.connect(owner).viewVault(1);
  //   const vault_instance = await new Vault__factory(owner).attach(v1);
  //   await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
  //   await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
  //   await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
  //   await USDT.connect(signers[1]).approve(
  //     vault_instance.address,
  //     expandTo18Decimals(120)
  //   );
  //   await USDT.connect(signers[2]).approve(
  //     vault_instance.address,
  //     expandTo18Decimals(80)
  //   );
  //   await USDT.connect(signers[6]).approve(
  //     vault_instance.address,
  //     expandTo18Decimals(220)
  //   );

  //   //fractional buy

  //   await vault_instance
  //     .connect(signers[1])
  //     .buyFractions(expandTo18Decimals(12));
  //   await vault_instance
  //     .connect(signers[2])
  //     .buyFractions(expandTo18Decimals(8));

  //   // 1st buyout offer
  //   await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11);
  //   // vote
  //   // await vault_instance.connect(signers[1]).approve(signers[1].address,7);
  //   console.log(
  //     "balanceeeee",
  //     await vault_instance.balanceOf(signers[1].address)
  //   );
  //   console.log(
  //     "fraction balance",
  //     await vault_instance.balanceOf(signers[1].address)
  //   );
 // await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(12));

  ////   await vault_instance.connect(signers[1]).voteOffer(1);
  //   console.log(
  //     "fraction balance",
  //     await vault_instance.balanceOf(owner.address)
  //   );
  //   console.log("balanceeeee", await USDT.balanceOf(signers[6].address));
  //   //expect(await USDT.balanceOf(signers[1].address)).to.be.eq(expandTo18Decimals(107));
  //   expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);

  //   // expect(await vault_instance.balanceOf(signers[3].address)).to.be.eq(0);

  //  // expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(11);

  //   await vault_instance.connect(signers[6]).claimNFT(1);
  //   expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);

  //   expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);
  //   console.log("signers 2 balance",await USDT.balanceOf(signers[2].address));
  ///await vault_instance.connect(signers[2]).sellFraction(1,expandTo18Decimals(8));

//  //   await vault_instance.connect(signers[2]).voteOffer(1);
  //   console.log("signers 2 balance",await USDT.balanceOf(signers[2].address));
  //   console.log("vault  balance   ",await USDT.balanceOf(vault_instance.address));



  //   // expect(await vault_instance.balanceOf(signers[2].address)).to.be.eq(0);

  //   //  await expect (vault_instance.connect(signers[1]).claimShare()).to.be.revertedWith("AC");
  // });
  it("ERROR Secondary marketplace: fraction trade invalid buyer", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      signers[7].address,
      signers[8].address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[5].address, expandTo18Decimals(120));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(250));


    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(120)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(80)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );

    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(100)
    );

    // await vault_instance.excludeFromFee(vault_instance.address,true);
    //fractional buy
    await vault_instance
      .connect(signers[5])
      .buyFractions(expandTo18Decimals(12));
    await vault_instance
      .connect(signers[2])
      .buyFractions(expandTo18Decimals(8));
  
      const seller = await new fractionSellerVoucher({
        _contract: marketplace,
        _signer: signers[5],
      });
      const sellerVoucher = await seller.createVoucher(
        signers[5].address,
        vault_instance.address,
        expandTo18Decimals(5),
        expandTo18Decimals(20),
        1
      )
      console.log("test case vault address", vault_instance.address);
      const buyer = await new fractionBuyerVoucher({
        _contract: marketplace,
        _signer: signers[6],
      });
      const buyerVoucher = await buyer.createVoucher(
        signers[4].address,
        vault_instance.address,
        expandTo18Decimals(3),
        expandTo18Decimals(60),    
      )
      await USDT.connect(signers[4]).approve(
        marketplace.address,
        expandTo18Decimals(60)
      );

   
      await USDT.connect(signers[1]).approve(
        marketplace.address,
        expandTo18Decimals(40)
      );
      
      await vault_instance.connect(signers[5]).approve(
        marketplace.address,
        expandTo18Decimals(1000)
      );

     await expect (marketplace.fractionTrade(buyerVoucher,sellerVoucher)).to.be.revertedWith("BI");

   
  });

  it("ERROR :Secondary marketplace:not enough fractions for trade ", async () => {
    await factory.connect(owner).addOperator(NFT.address, true);
    await NFT.connect(owner).safeMint(
      "test_name",
      "test_symbol",
      "test",
      1,
      expandTo18Decimals(20),
      expandTo18Decimals(10),
      USDT.address,
      owner.address,
      signers[7].address,
      signers[8].address
    );
    let v1 = await factory.connect(owner).viewVault(1);
    const vault_instance = await new Vault__factory(owner).attach(v1);
    await USDT.connect(owner).mint(signers[5].address, expandTo18Decimals(120));
    await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
    await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));
    await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(250));


    await USDT.connect(signers[5]).approve(
      vault_instance.address,
      expandTo18Decimals(120)
    );
    await USDT.connect(signers[2]).approve(
      vault_instance.address,
      expandTo18Decimals(80)
    );
    await USDT.connect(signers[6]).approve(
      vault_instance.address,
      expandTo18Decimals(220)
    );

    await USDT.connect(signers[4]).approve(
      vault_instance.address,
      expandTo18Decimals(100)
    );

    // await vault_instance.excludeFromFee(vault_instance.address,true);
    //fractional buy
    await vault_instance
      .connect(signers[5])
      .buyFractions(expandTo18Decimals(12));
    await vault_instance
      .connect(signers[2])
      .buyFractions(expandTo18Decimals(8));
  
      const seller = await new fractionSellerVoucher({
        _contract: marketplace,
        _signer: signers[5],
      });
      const sellerVoucher = await seller.createVoucher(
        signers[5].address,
        vault_instance.address,
        expandTo18Decimals(13),
        expandTo18Decimals(20),
        1
      )
      console.log("balance",await vault_instance.balanceOf(signers[5].address));
      const buyer = await new fractionBuyerVoucher({
        _contract: marketplace,
        _signer: signers[4],
      });
      const buyerVoucher = await buyer.createVoucher(
        signers[4].address,
        vault_instance.address,
        expandTo18Decimals(3),
        expandTo18Decimals(60),    
      )
      await USDT.connect(signers[4]).approve(
        marketplace.address,
        expandTo18Decimals(60)
      );

   
      await USDT.connect(signers[1]).approve(
        marketplace.address,
        expandTo18Decimals(40)
      );
      
      await vault_instance.connect(signers[5]).approve(
        marketplace.address,
        expandTo18Decimals(1000)
      );

     await expect (marketplace.fractionTrade(buyerVoucher,sellerVoucher)).to.be.revertedWith("NEF");

   
  });

     

      it("Secondary marketplace: fraction trade", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          signers[7].address,
          signers[8].address
        );
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[5].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(250));


        await USDT.connect(signers[5]).approve(
          vault_instance.address,
          expandTo18Decimals(120)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(80)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );

        await USDT.connect(signers[4]).approve(
          vault_instance.address,
          expandTo18Decimals(100)
        );

        // await vault_instance.excludeFromFee(vault_instance.address,true);
        //fractional buy
        await vault_instance
          .connect(signers[5])
          .buyFractions(expandTo18Decimals(12));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(8));
      
          const seller = await new fractionSellerVoucher({
            _contract: marketplace,
            _signer: signers[5],
          });
          const sellerVoucher = await seller.createVoucher(
            signers[5].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(20),
            1
          )
          console.log("test case vault address", vault_instance.address);
          const buyer = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[4],
          });
          const buyerVoucher = await buyer.createVoucher(
            signers[4].address,
            vault_instance.address,
            expandTo18Decimals(3),
            expandTo18Decimals(60),    
          )
          await USDT.connect(signers[4]).approve(
            marketplace.address,
            expandTo18Decimals(60)
          );

          const buyer2 = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[1],
          });
          const buyerVoucher2 = await buyer2.createVoucher(
            signers[1].address,
            vault_instance.address,
            expandTo18Decimals(2),
            expandTo18Decimals(40),    
          )
          await USDT.connect(signers[1]).approve(
            marketplace.address,
            expandTo18Decimals(40)
          );
          
          await vault_instance.connect(signers[5]).approve(
            marketplace.address,
            expandTo18Decimals(1000)
          );

          console.log("signers 5",await vault_instance.viewStatus(signers[5].address));
          console.log("signers 4",await vault_instance.viewStatus(signers[4].address));
          await  marketplace.fractionTrade(buyerVoucher,sellerVoucher);
          await  marketplace.fractionTrade(buyerVoucher2,sellerVoucher);

          console.log("buyer balance",await vault_instance.balanceOf(signers[4].address));
          console.log("tax wallet",await vault_instance.balanceOf(signers[7].address));
          console.log("market fee wallet",await vault_instance.balanceOf(signers[8].address));
          console.log("owner balance",await vault_instance.balanceOf(owner.address));
          console.log("signers 7", signers[7].address);
      });


     

      it("ERROR: Secondary marketplace invalid vault address", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          owner.address,
          owner.address
        );
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));

        await USDT.connect(signers[1]).approve(
          vault_instance.address,
          expandTo18Decimals(120)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(80)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );

        await USDT.connect(signers[4]).approve(
          vault_instance.address,
          expandTo18Decimals(250)
        );

        await vault_instance.excludeFromFee(vault_instance.address,true);
        //fractional buy
        await vault_instance
          .connect(signers[1])
          .buyFractions(expandTo18Decimals(12));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(8));
      
          const seller = await new fractionSellerVoucher({
            _contract: marketplace,
            _signer: signers[1],
          });
          const sellerVoucher = await seller.createVoucher(
            signers[1].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(20),
            1
          )

          const buyer = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[4],
          });
          const buyerVoucher = await buyer.createVoucher(
            signers[4].address,
            signers[2].address,
            expandTo18Decimals(4),
            expandTo18Decimals(100),      
          )
          await USDT.connect(signers[4]).approve(
            marketplace.address,
            expandTo18Decimals(1000)
          );
            console.log("signers 1",signers[1].address);
          await expect(marketplace.fractionTrade(buyerVoucher,sellerVoucher)).to.be.revertedWith("IV");
      });

      it("ERROR:Secondary marketplace invalid price", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          owner.address,
          owner.address
        );
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));
        console.log("hey");
        await USDT.connect(signers[1]).approve(
          vault_instance.address,
          expandTo18Decimals(120)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(80)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );

        await USDT.connect(signers[4]).approve(
          vault_instance.address,
          expandTo18Decimals(250)
        );

        await vault_instance.excludeFromFee(vault_instance.address,true);
        //fractional buy
        await vault_instance
          .connect(signers[1])
          .buyFractions(expandTo18Decimals(12));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(8));
      
          console.log("hey1");

          const seller = await new fractionSellerVoucher({
            _contract: marketplace,
            _signer: signers[1],
          });
          const sellerVoucher = await seller.createVoucher(
            signers[1].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(20),
            1
          )

          const buyer = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[4],
          });
          const buyerVoucher = await buyer.createVoucher(
            signers[4].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(90),   
          )
          await USDT.connect(signers[4]).approve(
            marketplace.address,
            expandTo18Decimals(1000)
          );
            // additional approval 
            await vault_instance.connect(signers[1]).approve(
              marketplace.address,
              expandTo18Decimals(1000)
            );
            console.log("signers 1",signers[1].address);
    
          await expect(marketplace.fractionTrade(buyerVoucher,sellerVoucher)).to.be.revertedWith("IP");
      });
      it("ERROR Secondary marketplace: fraction trade invalid buyer", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          signers[7].address,
          signers[8].address
        );
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[5].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(250));


        await USDT.connect(signers[5]).approve(
          vault_instance.address,
          expandTo18Decimals(120)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(80)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );

        await USDT.connect(signers[4]).approve(
          vault_instance.address,
          expandTo18Decimals(100)
        );

        // await vault_instance.excludeFromFee(vault_instance.address,true);
        //fractional buy
        await vault_instance
          .connect(signers[5])
          .buyFractions(expandTo18Decimals(12));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(8));
      
          const seller = await new fractionSellerVoucher({
            _contract: marketplace,
            _signer: signers[5],
          });
          const sellerVoucher = await seller.createVoucher(
            signers[5].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(20),
            1
          )
          console.log("test case vault address", vault_instance.address);
          const buyer = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[4],
          });
          const buyerVoucher = await buyer.createVoucher(
            signers[4].address,
            vault_instance.address,
            expandTo18Decimals(3),
            expandTo18Decimals(60),    
          )
          await USDT.connect(signers[4]).approve(
            marketplace.address,
            expandTo18Decimals(60)
          );

          await USDT.connect(signers[1]).approve(
            marketplace.address,
            expandTo18Decimals(40)
          );
          
          await vault_instance.connect(signers[5]).approve(
            marketplace.address,
            expandTo18Decimals(1000)
          );

          await  marketplace.fractionTrade(buyerVoucher,sellerVoucher);

      });

      it("ERROR:Secondary marketplace fraction trade invalid signer", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          owner.address,
          owner.address
        );
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));

        await USDT.connect(signers[1]).approve(
          vault_instance.address,
          expandTo18Decimals(120)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(80)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );

        await USDT.connect(signers[4]).approve(
          vault_instance.address,
          expandTo18Decimals(250)
        );

        await vault_instance.excludeFromFee(vault_instance.address,true);
        //fractional buy
        await vault_instance
          .connect(signers[1])
          .buyFractions(expandTo18Decimals(12));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(8));
      
          const seller = await new fractionSellerVoucher({
            _contract: marketplace,
            _signer: signers[1],
          });
          const sellerVoucher = await seller.createVoucher(
            signers[2].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(20),
            1
          )
          const buyer = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[4],
          });
          const buyerVoucher = await buyer.createVoucher(
            signers[4].address,
            vault_instance.address,
            expandTo18Decimals(4),
            expandTo18Decimals(100),      
          )
          await USDT.connect(signers[4]).approve(
            marketplace.address,
            expandTo18Decimals(1000)
          );
            console.log("signers 1",signers[1].address);
          await expect(marketplace.fractionTrade(buyerVoucher,sellerVoucher)).to.be.revertedWith("SI");
      });
    
      it("secondary marketplace : buy NFT", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          owner.address,
          owner.address
        );
        console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(350));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    
        await USDT.connect(signers[1]).approve(
          vault_instance.address,
          expandTo18Decimals(110)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(90)
        );
        await USDT.connect(signers[3]).approve(
          vault_instance.address,
          expandTo18Decimals(40)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );
        await vault_instance.excludeFromFee(vault_instance.address,true);
    
        //fractional buy
        await vault_instance
          .connect(signers[1])
          .buyFractions(expandTo18Decimals(11));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(9));
  
        // 1st buyout offer
        await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11)); 
        await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(11));
        expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);
        await vault_instance.connect(signers[6]).claimNFT(1);
        expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);
        expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);
        await vault_instance.connect(signers[2]).claimShare();

        //  NFT voucher
        const NFTseller = await new NFTSellerVoucher({
          _contract: marketplace,
          _signer: signers[6],
        })
        const sellerVoucher = await NFTseller.createVoucher(
          NFT.address,
          signers[6].address,
          1,
          expandTo18Decimals(300),
        )
        await NFT.connect(signers[6]).approve(
          marketplace.address,
          1
        );
        await USDT.connect(signers[3]).approve(
          marketplace.address,
          expandTo18Decimals(1000)
        );
        await  marketplace.connect(signers[3]).buyNFT(sellerVoucher);
      });

      it("ERROR :secondary marketplace BUY NFT invalid seller", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          owner.address,
          owner.address
        );
        console.log("owner of NFT", await NFT.connect(owner).ownerOf(1));
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[3].address, expandTo18Decimals(350));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
    
        await USDT.connect(signers[1]).approve(
          vault_instance.address,
          expandTo18Decimals(110)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(90)
        );
        await USDT.connect(signers[3]).approve(
          vault_instance.address,
          expandTo18Decimals(40)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );
        await vault_instance.excludeFromFee(vault_instance.address,true);
    
        //fractional buy
        await vault_instance
          .connect(signers[1])
          .buyFractions(expandTo18Decimals(11));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(9));
  
        // 1st buyout offer
        await vault_instance.connect(signers[6]).makeOffer(expandTo18Decimals(11)); 
        await vault_instance.connect(signers[1]).sellFraction(1,expandTo18Decimals(11));
        expect(await vault_instance.balanceOf(signers[1].address)).to.be.eq(0);
        await vault_instance.connect(signers[6]).claimNFT(1);
        expect(await vault_instance.balanceOf(signers[6].address)).to.be.eq(0);
        expect(await NFT.connect(owner).ownerOf(1)).to.be.eq(signers[6].address);
        await vault_instance.connect(signers[2]).claimShare();

        //  NFT voucher
        const NFTseller = await new NFTSellerVoucher({
          _contract: marketplace,
          _signer: signers[4],
        })
        const sellerVoucher = await NFTseller.createVoucher(
          NFT.address,
          signers[6].address,
          1,
          expandTo18Decimals(300),
        )
        await NFT.connect(signers[6]).approve(
          marketplace.address,
          1
        );
        await USDT.connect(signers[3]).approve(
          marketplace.address,
          expandTo18Decimals(1000)
        );
        await expect(marketplace.connect(signers[3]).buyNFT(sellerVoucher)).to.be.revertedWith("IS");
      });

      it("ERROR: Secondary marketplace: Counter used", async () => {
        await factory.connect(owner).addOperator(NFT.address, true);
        await NFT.connect(owner).safeMint(
          "test_name",
          "test_symbol",
          "test",
          1,
          expandTo18Decimals(20),
          expandTo18Decimals(10),
          USDT.address,
          owner.address,
          signers[7].address,
          signers[8].address
        );
        let v1 = await factory.connect(owner).viewVault(1);
        const vault_instance = await new Vault__factory(owner).attach(v1);
        await USDT.connect(owner).mint(signers[5].address, expandTo18Decimals(120));
        await USDT.connect(owner).mint(signers[2].address, expandTo18Decimals(100));
        await USDT.connect(owner).mint(signers[6].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[4].address, expandTo18Decimals(250));
        await USDT.connect(owner).mint(signers[1].address, expandTo18Decimals(250));


        await USDT.connect(signers[5]).approve(
          vault_instance.address,
          expandTo18Decimals(120)
        );
        await USDT.connect(signers[2]).approve(
          vault_instance.address,
          expandTo18Decimals(80)
        );
        await USDT.connect(signers[6]).approve(
          vault_instance.address,
          expandTo18Decimals(220)
        );

        await USDT.connect(signers[4]).approve(
          vault_instance.address,
          expandTo18Decimals(100)
        );

        // await vault_instance.excludeFromFee(vault_instance.address,true);
        //fractional buy
        await vault_instance
          .connect(signers[5])
          .buyFractions(expandTo18Decimals(12));
        await vault_instance
          .connect(signers[2])
          .buyFractions(expandTo18Decimals(8));
      
          const seller = await new fractionSellerVoucher({
            _contract: marketplace,
            _signer: signers[5],
          });
          const sellerVoucher = await seller.createVoucher(
            signers[5].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(20),
            2
          )
          console.log("test case vault address", vault_instance.address);
          const buyer = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[4],
          });
          const buyerVoucher = await buyer.createVoucher(
            signers[4].address,
            vault_instance.address,
            expandTo18Decimals(5),
            expandTo18Decimals(100),    
          )
          await USDT.connect(signers[4]).approve(
            marketplace.address,
            expandTo18Decimals(100)
          );

          const buyer2 = await new fractionBuyerVoucher({
            _contract: marketplace,
            _signer: signers[1],
          });
          const buyerVoucher2 = await buyer2.createVoucher(
            signers[1].address,
            vault_instance.address,
            expandTo18Decimals(3),
            expandTo18Decimals(60),    
          )
          await USDT.connect(signers[1]).approve(
            marketplace.address,
            expandTo18Decimals(60)
          );
          
          await vault_instance.connect(signers[5]).approve(
            marketplace.address,
            expandTo18Decimals(1000)
          );
          await  marketplace.fractionTrade(buyerVoucher,sellerVoucher);
          await expect(marketplace.fractionTrade(buyerVoucher2,sellerVoucher)).to.be.revertedWith("CU");
      });


    
});
