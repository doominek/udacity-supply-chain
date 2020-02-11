// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
// Declare a variable and assign the compiled smart contract artifact
const SupplyChain = artifacts.require('SupplyChain');
const truffleAssert = require('truffle-assertions');

const ItemStates = Object.freeze({
    HARVESTED:   { name: "Harvested", value: 0 },
    PROCESSED:  { name: "Processed", value: 1 }
});

contract('SupplyChain', function (accounts) {
    // Declare few constants and assign a few sample accounts generated by ganache-cli
    var sku = 1;
    var upc = 1;
    const ownerID = accounts[0];
    const originFarmerID = accounts[1];
    const originFarmName = "John Doe";
    const originFarmInformation = "Yarray Valley";
    const originFarmLatitude = "-38.239770";
    const originFarmLongitude = "144.341490";
    var productID = sku + upc;
    const productNotes = "Best beans for Espresso";
    const productPrice = web3.utils.toWei("1", "ether");
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
        truffleAssert.eventEmitted(lastTx, 'Harvested', {upc: web3.utils.toBN(upc)});
    });

    describe("after harvesting", async () => {
        beforeEach(async () => {
            lastTx = await supplyChain.harvestItem(upc, originFarmerID, originFarmName,
                originFarmInformation, originFarmLatitude,
                originFarmLongitude, productNotes);
        });

        it("Testing smart contract function processItem() that allows a farmer to process coffee", async () => {
            // Mark an item as Processed by calling function processtItem()
            lastTx = await supplyChain.processItem(upc);

            // Retrieve the just now saved item from blockchain by calling function fetchItem()
            const resultBufferTwo = await supplyChain.fetchItemBufferTwo.call(upc);

            // Verify the result set
            assert.equal(resultBufferTwo[5], ItemStates.PROCESSED.value, 'Item should be in Processed state');
            truffleAssert.eventEmitted(lastTx, 'Processed', {upc: web3.utils.toBN(upc)});
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

        // 3rd Test
        it("Testing smart contract function packItem() that allows a farmer to pack coffee", async () => {
            // Declare and Initialize a variable for event


            // Watch the emitted event Packed()


            // Mark an item as Packed by calling function packItem()


            // Retrieve the just now saved item from blockchain by calling function fetchItem()


            // Verify the result set

        });

        // 4th Test
        it("Testing smart contract function sellItem() that allows a farmer to sell coffee", async () => {
            // Declare and Initialize a variable for event


            // Watch the emitted event ForSale()


            // Mark an item as ForSale by calling function sellItem()


            // Retrieve the just now saved item from blockchain by calling function fetchItem()


            // Verify the result set

        });

        // 5th Test
        it("Testing smart contract function buyItem() that allows a distributor to buy coffee", async () => {
            // Declare and Initialize a variable for event


            // Watch the emitted event Sold()
            var event = supplyChain.Sold()


            // Mark an item as Sold by calling function buyItem()


            // Retrieve the just now saved item from blockchain by calling function fetchItem()


            // Verify the result set

        });

        // 6th Test
        it("Testing smart contract function shipItem() that allows a distributor to ship coffee", async () => {
            // Declare and Initialize a variable for event


            // Watch the emitted event Shipped()


            // Mark an item as Sold by calling function buyItem()


            // Retrieve the just now saved item from blockchain by calling function fetchItem()


            // Verify the result set

        });

        // 7th Test
        it("Testing smart contract function receiveItem() that allows a retailer to mark coffee received", async () => {
            // Declare and Initialize a variable for event


            // Watch the emitted event Received()


            // Mark an item as Sold by calling function buyItem()


            // Retrieve the just now saved item from blockchain by calling function fetchItem()


            // Verify the result set

        });

        // 8th Test
        it("Testing smart contract function purchaseItem() that allows a consumer to purchase coffee", async () => {
            // Declare and Initialize a variable for event


            // Watch the emitted event Purchased()


            // Mark an item as Sold by calling function buyItem()


            // Retrieve the just now saved item from blockchain by calling function fetchItem()


            // Verify the result set

        });
    });

    // 2nd Test


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

