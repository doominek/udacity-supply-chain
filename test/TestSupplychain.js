// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
// Declare a variable and assign the compiled smart contract artifact
const SupplyChain = artifacts.require('SupplyChain');
const truffleAssert = require('truffle-assertions');

const chai = require('chai');
const expect = chai.expect;
const BN = require('bn.js');
const bnChai = require('bn-chai');

chai.use(bnChai(BN));

const ItemStates = Object.freeze({
    HARVESTED: { name: "Harvested", value: 0 },
    PROCESSED: { name: "Processed", value: 1 },
    PACKED: { name: "Packed", value: 2 },
    FOR_SALE: { name: "ForSale", value: 3 },
    SOLD: { name: "Sold", value: 4 },
    SHIPPED: { name: "Shipped", value: 5 },
    RECEIVED: { name: "Received", value: 6 },
    PURCHASED: { name: "Purchased", value: 7 }
});

contract('SupplyChain', function (accounts) {
    // Declare few constants and assign a few sample accounts generated by ganache-cli
    const sku = 1;
    const upc = 1;
    const ownerID = accounts[0];
    const originFarmerID = accounts[1];
    const originFarmName = "John Doe";
    const originFarmInformation = "Yarray Valley";
    const originFarmLatitude = "-38.239770";
    const originFarmLongitude = "144.341490";
    const productID = sku + upc;
    const productNotes = "Best beans for Espresso";
    const productPrice = web3.utils.toWei(new BN("1"), "ether");
    const distributorID = accounts[2];
    const retailerID = accounts[3];
    const consumerID = accounts[4];
    const emptyAddress = '0x00000000000000000000000000000000000000';

    let supplyChain;
    let lastTx;

    beforeEach(async () => {
        supplyChain = await SupplyChain.deployed();
    });

    // 1st Test
    it("Testing smart contract function harvestItem() that allows a farmer to harvest coffee", async () => {
        // Mark an item as Harvested by calling function harvestItem()
        lastTx = await supplyChain.harvestItem(upc, originFarmerID, originFarmName,
            originFarmInformation, originFarmLatitude,
            originFarmLongitude, productNotes);

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc);
        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

        // Verify the result set
        assert.equal(resultBufferOne[0], sku, 'Error: Invalid item SKU');
        assert.equal(resultBufferOne[1], upc, 'Error: Invalid item UPC');
        assert.equal(resultBufferOne[2], originFarmerID, 'Error: Missing or Invalid ownerID');
        assert.equal(resultBufferOne[3], originFarmerID, 'Error: Missing or Invalid originFarmerID');
        assert.equal(resultBufferOne[4], originFarmName, 'Error: Missing or Invalid originFarmName');
        assert.equal(resultBufferOne[5], originFarmInformation, 'Error: Missing or Invalid originFarmInformation');
        assert.equal(resultBufferOne[6], originFarmLatitude, 'Error: Missing or Invalid originFarmLatitude');
        assert.equal(resultBufferOne[7], originFarmLongitude, 'Error: Missing or Invalid originFarmLongitude');
        assert.equal(resultBufferTwo[5], ItemStates.HARVESTED.value, 'Error: Invalid item State');
        truffleAssert.eventEmitted(lastTx, 'Harvested', { upc: web3.utils.toBN(upc) });
    });

    describe("after harvesting", async () => {
        beforeEach(async () => {
            await supplyChain.harvestItem(upc, originFarmerID, originFarmName,
                originFarmInformation, originFarmLatitude,
                originFarmLongitude, productNotes);
        });

        // 2nd Test
        it("Testing smart contract function processItem() that allows a farmer to process coffee", async () => {
            // Mark an item as Processed by calling function processtItem()
            lastTx = await supplyChain.processItem(upc);

            // Retrieve the just now saved item from blockchain by calling function fetchItem()
            const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

            // Verify the result set
            assert.equal(resultBufferTwo.itemState, ItemStates.PROCESSED.value, 'Item should be in Processed state');
            truffleAssert.eventEmitted(lastTx, 'Processed', { upc: web3.utils.toBN(upc) });
        });

        it("Should not allow to process item when caller not in farmer role", async () => {
            try {
                await supplyChain.processItem(upc, { from: distributorID });
                assert.fail("should throw error");
            } catch (e) {
                assert.equal(e.reason, "Only Farmer allowed")
            }
        });

        it("Should not allow to process item when it's not harvested", async () => {
            try {
                await supplyChain.processItem(upc);
                await supplyChain.processItem(upc);
                assert.fail("should throw error");
            } catch (e) {
                assert.equal(e.reason, "Item must be harvested")
            }
        });

        describe("after processing", async () => {
            beforeEach(async () => {
                await supplyChain.processItem(upc);
            });

            it("Testing smart contract function packItem() that allows a farmer to pack coffee", async () => {
                // Mark an item as Packed by calling function packItem()
                lastTx = await supplyChain.packItem(upc);

                // Retrieve the just now saved item from blockchain by calling function fetchItem()
                const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

                // Verify the result set
                assert.equal(resultBufferTwo.itemState, ItemStates.PACKED.value, 'Item should be in Packed state');
                truffleAssert.eventEmitted(lastTx, 'Packed', { upc: web3.utils.toBN(upc) });
            });

            it("Should not allow to pack item when caller not in farmer role", async () => {
                try {
                    await supplyChain.packItem(upc, { from: distributorID });
                    assert.fail("should throw error");
                } catch (e) {
                    assert.equal(e.reason, "Only Farmer allowed")
                }
            });

            it("Should not allow to pack item when it's not harvested", async () => {
                try {
                    await supplyChain.packItem(upc);
                    await supplyChain.packItem(upc);
                    assert.fail("should throw error");
                } catch (e) {
                    assert.equal(e.reason, "Item must be processed")
                }
            });

            describe("after packing", async () => {
                beforeEach(async () => {
                    await supplyChain.packItem(upc);
                });

                // 4th Test
                it("Testing smart contract function sellItem() that allows a farmer to sell coffee", async () => {
                    // Mark an item as ForSale by calling function sellItem()
                    lastTx = await supplyChain.sellItem(upc, productPrice);

                    // Retrieve the just now saved item from blockchain by calling function fetchItem()
                    const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

                    // Verify the result set
                    expect(resultBufferTwo.itemState).to.eq.BN(ItemStates.FOR_SALE.value);
                    expect(resultBufferTwo.productPrice).to.eq.BN(productPrice);

                    truffleAssert.eventEmitted(lastTx, 'ForSale', { upc: web3.utils.toBN(upc) });
                });

                it("Should not allow to sell item when caller not in farmer role", async () => {
                    try {
                        await supplyChain.sellItem(upc, productPrice, { from: distributorID });
                        assert.fail("should throw error");
                    } catch (e) {
                        assert.equal(e.reason, "Only Farmer allowed")
                    }
                });

                it("Should not allow to sell item when it's not packed", async () => {
                    try {
                        await supplyChain.sellItem(upc, productPrice);
                        await supplyChain.sellItem(upc, productPrice);
                        assert.fail("should throw error");
                    } catch (e) {
                        assert.equal(e.reason, "Item must be packed")
                    }
                });

                describe("after selling", async () => {
                    beforeEach(async () => {
                        await supplyChain.sellItem(upc, productPrice);
                    });

                    // 5th Test
                    it("Testing smart contract function buyItem() that allows a distributor to buy coffee", async () => {
                        await supplyChain.addDistributor(distributorID, { from: ownerID });

                        // Mark an item as Sold by calling function buyItem()
                        lastTx = await supplyChain.buyItem(upc, { from: distributorID, value: productPrice });

                        // Retrieve the just now saved item from blockchain by calling function fetchItem()
                        const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc);
                        const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

                        // Verify the result set
                        assert.equal(resultBufferTwo.itemState, ItemStates.SOLD.value, 'Item should be in Sold state');
                        assert.equal(resultBufferTwo.distributorID, distributorID, 'Distributor should be set');
                        assert.equal(resultBufferOne.ownerID, distributorID, 'Owner should be changed to distributor');

                        truffleAssert.eventEmitted(lastTx, 'Sold', { upc: web3.utils.toBN(upc) });
                    });

                    it("Buying should transfer ether to farmer", async () => {
                        const farmerInitialBalance = new BN(await web3.eth.getBalance(originFarmerID));

                        await supplyChain.buyItem(upc, { from: distributorID, value: productPrice });

                        const farmerFinalBalance = new BN(await web3.eth.getBalance(originFarmerID));

                        expect(farmerFinalBalance).to.eq.BN(farmerInitialBalance.add(productPrice));
                    });

                    it("Buying should refund ether to the payer if paid more than enough", async () => {
                        const distributorInitialBalance = new BN(await web3.eth.getBalance(distributorID));

                        await supplyChain.buyItem(upc, { from: distributorID, value: web3.utils.toWei("5", "ether") });

                        const distributorFinalBalance = new BN(await web3.eth.getBalance(distributorID));
                        const distributorBalanceChange = distributorInitialBalance.clone().sub(distributorFinalBalance);
                        const maxTransactionFee = new BN(web3.utils.toWei("0.01", "ether"));

                        expect(distributorBalanceChange).to.gt.BN(productPrice);
                        expect(distributorBalanceChange).to.lt.BN(productPrice.clone().add(maxTransactionFee));
                    });

                    it("Should not allow to buy item when caller not in distributor role", async () => {
                        try {
                            await supplyChain.buyItem(upc, { from: retailerID, value: productPrice });
                            assert.fail("should throw error");
                        } catch (e) {
                            assert.equal(e.reason, "Only Distributor allowed")
                        }
                    });

                    it("Should not allow to buy item when it's not for sale", async () => {
                        try {
                            await supplyChain.buyItem(upc, { value: productPrice });
                            await supplyChain.buyItem(upc, { value: productPrice });
                            assert.fail("should throw error");
                        } catch (e) {
                            assert.equal(e.reason, "Item must be for sale")
                        }
                    });

                    describe("after buying", async () => {
                        beforeEach(async () => {
                            await supplyChain.buyItem(upc, { value: productPrice });
                        });


                        // 6th Test
                        it("Testing smart contract function shipItem() that allows a distributor to ship coffee", async () => {
                            // Mark an item as Shipped by calling function shipItem()
                            lastTx = await supplyChain.shipItem(upc, { from: distributorID });

                            const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

                            // Verify the result set
                            expect(resultBufferTwo.itemState).to.eq.BN(ItemStates.SHIPPED.value);

                            truffleAssert.eventEmitted(lastTx, 'Shipped', { upc: web3.utils.toBN(upc) });
                        });

                        it("Should not allow to ship item when caller not in distributor role", async () => {
                            try {
                                await supplyChain.shipItem(upc, { from: retailerID });
                                assert.fail("should throw error");
                            } catch (e) {
                                assert.equal(e.reason, "Only Distributor allowed")
                            }
                        });

                        it("Should not allow to ship item when it's not sold", async () => {
                            try {
                                await supplyChain.shipItem(upc);
                                await supplyChain.shipItem(upc);
                                assert.fail("should throw error");
                            } catch (e) {
                                assert.equal(e.reason, "Item must be sold")
                            }
                        });

                        describe("after shipping", async () => {
                            beforeEach(async () => {
                                await supplyChain.shipItem(upc);
                            });

                            // 7th Test
                            it("Testing smart contract function receiveItem() that allows a retailer to mark coffee received", async () => {
                                await supplyChain.addRetailer(retailerID);

                                // Mark an item as Received by calling function receiveItem()
                                lastTx = await supplyChain.receiveItem(upc, { from: retailerID });

                                const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc);
                                const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

                                // Verify the result set
                                expect(resultBufferTwo.itemState).to.eq.BN(ItemStates.RECEIVED.value);
                                assert.equal(resultBufferTwo.retailerID, retailerID, 'Distributor should be set');
                                assert.equal(resultBufferOne.ownerID, retailerID, 'Owner should be changed to distributor');

                                truffleAssert.eventEmitted(lastTx, 'Received', { upc: web3.utils.toBN(upc) });
                            });

                            it("Should not allow to receive item when caller not in retailer role", async () => {
                                try {
                                    await supplyChain.receiveItem(upc, { from: distributorID });
                                    assert.fail("should throw error");
                                } catch (e) {
                                    assert.equal(e.reason, "Only Retailer allowed")
                                }
                            });

                            it("Should not allow to receive item when it's not shipped", async () => {
                                try {
                                    await supplyChain.receiveItem(upc);
                                    await supplyChain.receiveItem(upc);
                                    assert.fail("should throw error");
                                } catch (e) {
                                    assert.equal(e.reason, "Item must be shipped")
                                }
                            });

                            describe("after receiving", async () => {
                                beforeEach(async () => {
                                    await supplyChain.receiveItem(upc);
                                });

                                // 8th Test
                                it("Testing smart contract function purchaseItem() that allows a consumer to purchase coffee", async () => {
                                    // await supplyChain.addDistributor(distributorID, { from: ownerID });

                                    // Mark an item as Sold by calling function buyItem()
                                    lastTx = await supplyChain.purchaseItem(upc, {
                                        from: consumerID,
                                        value: productPrice
                                    });

                                    // Retrieve the just now saved item from blockchain by calling function fetchItem()
                                    const resultBufferOne = await supplyChain.fetchItemBufferOne.call(upc);
                                    const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

                                    // Verify the result set
                                    assert.equal(resultBufferTwo.itemState, ItemStates.PURCHASED.value, 'Item should be in Purchased state');
                                    assert.equal(resultBufferTwo.consumerID, consumerID, 'Consumer should be set');
                                    assert.equal(resultBufferOne.ownerID, consumerID, 'Owner should be changed to consumer');

                                    truffleAssert.eventEmitted(lastTx, 'Purchased', { upc: web3.utils.toBN(upc) });
                                });

                                it("Purchasing should transfer ether to distributor", async () => {
                                    const distributorInitialBalance = new BN(await web3.eth.getBalance(ownerID));

                                    await supplyChain.purchaseItem(upc, { from: consumerID, value: productPrice });

                                    const distributorFinalBalance = new BN(await web3.eth.getBalance(ownerID));

                                    expect(distributorFinalBalance).to.eq.BN(distributorInitialBalance.add(productPrice));
                                });

                                it("Purchasing should refund ether to the payer if paid more than enough", async () => {
                                    const consumerInitialBalance = new BN(await web3.eth.getBalance(consumerID));

                                    await supplyChain.purchaseItem(upc, {
                                        from: consumerID,
                                        value: web3.utils.toWei("5", "ether")
                                    });

                                    const consumerFinalBalance = new BN(await web3.eth.getBalance(consumerID));
                                    const consumerBalanceChange = consumerInitialBalance.clone().sub(consumerFinalBalance);
                                    const maxTransactionFee = new BN(web3.utils.toWei("0.01", "ether"));

                                    expect(consumerBalanceChange).to.gt.BN(productPrice);
                                    expect(consumerBalanceChange).to.lt.BN(productPrice.clone().add(maxTransactionFee));
                                });

                                it.skip("Should not allow to purchase item when caller not in consumer role", async () => {
                                    try {
                                        await supplyChain.purchaseItem(upc, { from: retailerID, value: productPrice });
                                        assert.fail("should throw error");
                                    } catch (e) {
                                        assert.equal(e.reason, "Only Consumer allowed")
                                    }
                                });

                                it.skip("Should not allow to buy item when it's not for sale", async () => {
                                    try {
                                        await supplyChain.purchaseItem(upc, { value: productPrice });
                                        await supplyChain.purchaseItem(upc, { value: productPrice });
                                        assert.fail("should throw error");
                                    } catch (e) {
                                        assert.equal(e.reason, "Item must be received")
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    // 9th Test
    it("Testing smart contract function fetchItemBufferOne() that allows anyone to fetch item details from blockchain", async () => {
        const supplyChain = await SupplyChain.deployed()

        // Retrieve the just now saved item from blockchain by calling function fetchItem()


        // Verify the result set:

    });

    // 10th Test
    it("Testing smart contract function fetchItemBufferTwo() that allows anyone to fetch item details from blockchain", async () => {
        const supplyChain = await SupplyChain.deployed()

        // Retrieve the just now saved item from blockchain by calling function fetchItem()


        // Verify the result set:

    })

});

