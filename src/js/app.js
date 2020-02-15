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

App = {
    web3Provider: null,
    contracts: {},
    emptyAddress: "0x0000000000000000000000000000000000000000",
    sku: 0,
    upc: 0,
    metamaskAccountID: "0x0000000000000000000000000000000000000000",
    ownerID: "0x0000000000000000000000000000000000000000",
    originFarmName: null,
    originFarmInformation: null,
    originFarmLatitude: null,
    originFarmLongitude: null,
    productNotes: null,
    productPrice: 0,
    ipfs: null,

    init: async function () {
        App.readForm();
        App.ipfs = window.IpfsHttpClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
        /// Setup access to blockchain
        return await App.initWeb3();
    },

    uploadItemImageToIPFS: async () => {
        const fileUploadInput = $("#itemFileUpload")[0];

        if (fileUploadInput.files.length === 0) {
            return { uploaded: false };
        }

        const path = `df/supply-chain/items/${App.upc}`;

        const source = App.ipfs.add({
            path,
            content: fileUploadInput.files[0]
        });

        let result = {
            uploaded: true
        };

        for await (const file of source) {
            if (file.path === path) {
                result.details = file;
            }
        }

        return result;
    },

    readForm: function () {
        App.sku = $("#sku").val();
        App.upc = $("#upc").val();
        App.ownerID = $("#ownerID").val();
        App.originFarmName = $("#originFarmName").val();
        App.originFarmInformation = $("#originFarmInformation").val();
        App.originFarmLatitude = $("#originFarmLatitude").val();
        App.originFarmLongitude = $("#originFarmLongitude").val();
        App.productNotes = $("#productNotes").val();
        App.productPrice = $("#productPrice").val();

        console.log(
            App.sku,
            App.upc,
            App.ownerID,
            App.originFarmName,
            App.originFarmInformation,
            App.originFarmLatitude,
            App.originFarmLongitude,
            App.productNotes,
            App.productPrice
        );
    },

    initWeb3: async function () {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        App.getMetaskAccountID();

        return App.initSupplyChain();
    },

    getMetaskAccountID: function () {
        web3 = new Web3(App.web3Provider);

        // Retrieving accounts
        web3.eth.getAccounts(function (err, res) {
            if (err) {
                console.log('Error:', err);
                return;
            }
            console.log('getMetaskID:', res);
            App.metamaskAccountID = res[0];

        })
    },

    initSupplyChain: function () {
        /// Source the truffle compiled smart contracts
        var jsonSupplyChain = '../../build/contracts/SupplyChain.json';

        /// JSONfy the smart contracts
        $.getJSON(jsonSupplyChain, function (data) {
            console.log('data', data);
            var SupplyChainArtifact = data;
            App.contracts.SupplyChain = TruffleContract(SupplyChainArtifact);
            App.contracts.SupplyChain.setProvider(App.web3Provider);

            App.fetchItemBufferOne();
            App.fetchItemBufferTwo();
            App.fetchEvents();

        });

        return App.bindEvents();
    },

    bindEvents: function () {
        $(document).on('click', App.handleButtonClick);
    },

    handleButtonClick: async function (event) {
        App.getMetaskAccountID();

        var processId = parseInt($(event.target).data('id'));
        console.log('processId', processId);

        switch (processId) {
            case 1:
                return await App.harvestItem(event);
                break;
            case 2:
                return await App.processItem(event);
                break;
            case 3:
                return await App.packItem(event);
                break;
            case 4:
                return await App.sellItem(event);
                break;
            case 5:
                return await App.buyItem(event);
                break;
            case 6:
                return await App.shipItem(event);
                break;
            case 7:
                return await App.receiveItem(event);
                break;
            case 8:
                return await App.purchaseItem(event);
                break;
            case 9:
                return await App.fetchItemBufferOne(event);
                break;
            case 10:
                return await App.fetchItemBufferTwo(event);
                break;
            case 11:
                return await App.fetchItem(event);
        }
    },

    harvestItem: async function (event) {
        event.preventDefault();
        App.readForm();

        try {
            const uploadResult = await App.uploadItemImageToIPFS();

            const contract = await App.contracts.SupplyChain.deployed();

            const result = await contract.harvestItem(
                App.upc,
                App.metamaskAccountID,
                App.originFarmName,
                App.originFarmInformation,
                App.originFarmLatitude,
                App.originFarmLongitude,
                App.productNotes,
                uploadResult.uploaded ? uploadResult.details.cid.toString() : "",
                { from: App.metamaskAccountID });

            $("#ftc-item").text(result);
            console.log('harvestItem', result);
        } catch (e) {
            console.log(e.message);
        }
    },

    processItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.processItem(App.upc, { from: App.metamaskAccountID });
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('processItem', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    packItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.packItem(App.upc, { from: App.metamaskAccountID });
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('packItem', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    sellItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function (instance) {
            const productPrice = web3.toWei($("#productPrice").val(), "ether");
            console.log('productPrice', productPrice);
            return instance.sellItem(App.upc, productPrice, { from: App.metamaskAccountID });
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('sellItem', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    buyItem: function (event) {
        event.preventDefault();
        const amountToSpend = $("#buyPrice").val();
        const upc = $("#distributorUpc").val();

        App.contracts.SupplyChain.deployed().then(function (instance) {
            const walletValue = web3.toWei(amountToSpend, "ether");
            return instance.buyItem(upc, { from: App.metamaskAccountID, value: walletValue });
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('buyItem', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    shipItem: function (event) {
        event.preventDefault();
        const upc = $("#distributorUpc").val();

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.shipItem(upc, { from: App.metamaskAccountID });
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('shipItem', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    receiveItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.receiveItem(App.upc, { from: App.metamaskAccountID });
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('receiveItem', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    purchaseItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function (instance) {
            const walletValue = web3.toWei(3, "ether");
            return instance.purchaseItem(App.upc, { from: App.metamaskAccountID, value: walletValue });
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('purchaseItem', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    fetchItem: async () => {
        const upcSearch = $('.find-item-input').val();

        const instance = await App.contracts.SupplyChain.deployed();
        const bufferOneData = await instance.fetchItemBufferOne(upcSearch);
        const bufferTwoData = await instance.fetchItemBufferTwo(upcSearch);

        console.log(bufferOneData);
        console.log(bufferTwoData);

        const [ sku, upc, ownerID, originFarmerID, originFarmName, originFarmInformation,
            originFarmLatitude, originFarmLongitude, imageIpfsCid ] = bufferOneData;

        const [ itemSKU, itemUPC, productID, productNotes, productPrice, itemState,
            distributorID, retailerID, consumerID ] = bufferTwoData;

        const itemStateName =
            Object
                .entries(ItemStates)
                .find(([ key, value ]) => value.value === itemState.toNumber())[1].name;


        $("#item-data-upc").val(upc);
        $("#item-data-sku").val(sku);
        $("#item-data-state").val(itemStateName);
        $("#item-data-product-price").val(web3.fromWei(productPrice));
        $("#item-data-product-notes").val(productNotes);

        $("#item-data-farm-name").val(originFarmName);
        $("#item-data-farm-information").val(originFarmInformation);
        $("#item-data-farm-latitude").val(originFarmLatitude);
        $("#item-data-farm-longitude").val(originFarmLongitude);

        $("#item-data-owner").val(ownerID);
        $("#item-data-farmer").val(originFarmerID);
        $("#item-data-distributor").val(distributorID);
        $("#item-data-retailer").val(retailerID);
        $("#item-data-consumer").val(consumerID);

        if (imageIpfsCid) {
            $(".item-image")[0].style.display = "block";
            $(".item-image").attr("src", `https://ipfs.infura.io/ipfs/${imageIpfsCid}`);
        } else {
            $(".item-image")[0].style.display = "none";
            $(".item-image").attr("src", "");
        }
    },

    fetchItemBufferOne: function () {
        ///   event.preventDefault();
        ///    var processId = parseInt($(event.target).data('id'));
        App.upc = $('#upc').val();
        console.log('upc', App.upc);

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.fetchItemBufferOne(App.upc);
        }).then(function (result) {
            $("#ftc-item").text(result);

            console.log('fetchItemBufferOne', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    fetchItemBufferTwo: function () {
        ///    event.preventDefault();
        ///    var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function (instance) {
            return instance.fetchItemBufferTwo.call(App.upc);
        }).then(function (result) {
            $("#ftc-item").text(result);
            console.log('fetchItemBufferTwo', result);
        }).catch(function (err) {
            console.log(err.message);
        });
    },

    fetchEvents: function () {
        if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
            App.contracts.SupplyChain.currentProvider.sendAsync = function () {
                return App.contracts.SupplyChain.currentProvider.send.apply(
                    App.contracts.SupplyChain.currentProvider,
                    arguments
                );
            };
        }

        App.contracts.SupplyChain.deployed().then(function (instance) {
            var events = instance.allEvents(function (err, log) {
                if (!err)
                    $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
            });
        }).catch(function (err) {
            console.log(err.message);
        });

    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
