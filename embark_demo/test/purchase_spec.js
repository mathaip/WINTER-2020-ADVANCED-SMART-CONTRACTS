/*global artifacts, contract, config, it, assert, web3*/
const Purchase = artifacts.require('Purchase');
const BigNumber = require('bignumber.js');

let accounts;
let buyerAddress;
let sellerAddress;
let price = 100000;
let state = {
    "CREATED": 0,
    "LOCKED": 1,
    "INACTIVE": 2
}

// For documentation please see https://framework.embarklabs.io/docs/contracts_testing.html
config({
    //blockchain: {
    //  accounts: [
    //    // you can configure custom accounts with a custom balance
    //    // see https://framework.embarklabs.io/docs/contracts_testing.html#Configuring-accounts
    //  ]
    //},
    contracts: {
        deploy: {
            "Purchase": {
                args: [price],
                fromIndex: 0
            }
        }
    }
}, (_err, web3_accounts) => {
    accounts = web3_accounts;
    buyerAddress = accounts[1];
    sellerAddress = accounts[0];
});

contract("Purchase", function() {
    this.timeout(0);

    it("Should deploy purchase", async function() {
        let result = await Purchase.options.address;
        let contractState = await Purchase.state();
        assert.ok(contractState == state["CREATED"]);
        assert.ok(result.length > 0);
    });

    /*
    Note: Uncomment the following "Seller aborts item" to test this test case and comment out other test cases after that and
    vice versa, i.e. comment out "Seller aborts item" to not test abort() function and uncomment the other test cases
    after that.
    */
    //   it("Seller aborts item", async function(){
    //   // test here

    //   let contractSellerAddress = await Purchase.seller();
    //   assert.ok(contractSellerAddress == sellerAddress);

    //   let sellerBalanceOld = await web3.eth.getBalance(contractSellerAddress);
    //   let contractBalanceOld = await web3.eth.getBalance(Purchase.options.address);
    //   let contractState = await Purchase.state();

    //   let confirmReceiveTx = await Purchase.methods.abort().send({
    //     from: sellerAddress
    //   });
    //   contractState = await Purchase.state();

    //   let contractBalanceNew = await web3.eth.getBalance(Purchase.options.address);
    //   // let sellerBalanceNew = await web3.eth.getBalance(contractSellerAddress);
    //   assert.ok(contractBalanceNew == 0, "Contract balance not updated");
    //   assert.ok(contractState == state["INACTIVE"]);
    // })

    it("Buyer deposits funds and confirms purchase", async function() {
        let result = await Purchase.methods.confirmPurchase().send({
            from: buyerAddress,
            value: price
        });
        let contractBuyerAddress = await Purchase.buyer();
        let contractSellerAddress = await Purchase.seller();
        let contractState = await Purchase.state();

        let contractBalance = await web3.eth.getBalance(Purchase.options.address);
        assert.ok(contractBuyerAddress == buyerAddress);
        assert.ok(contractSellerAddress == sellerAddress);
        assert.ok(contractBalance == price);
        assert.ok(contractState == state["LOCKED"]);
    });

    it("Buyer confirm received", async function() {
        // test here

        let contractBuyerAddress = await Purchase.buyer(); //  buyer address
        let contractSellerAddress = await Purchase.seller(); //  seller address
        /* Check buyer and seller address */
        assert.ok(contractBuyerAddress == buyerAddress);
        assert.ok(contractSellerAddress == sellerAddress);

        let sellerBalanceOld = await web3.eth.getBalance(contractSellerAddress); //  Seller's balance before txn.
        let contractBalanceOld = await web3.eth.getBalance(Purchase.options.address); //  Contract's balance before txn.

        let confirmReceiveTx = await Purchase.methods.confirmReceived().send({
            from: buyerAddress
        }); //  calling confirmReceived() function of Purchase.sol contract

        let contractState = await Purchase.state(); //  getting the state 
        let contractBalanceNew = await web3.eth.getBalance(Purchase.options.address); //  Contract's new balance
        let sellerBalanceNew = await web3.eth.getBalance(contractSellerAddress); //  Seller's balance after txn.

        /*  Checks */
        assert.ok(contractBalanceNew == 0, "Contract balance not updated");
        assert.ok((new BigNumber(sellerBalanceNew)).minus(sellerBalanceOld) == price, "Seller price not updatesd");
        assert.ok((new BigNumber(contractBalanceOld)).minus(contractBalanceNew) == price, "Contract balance not updated");
        assert.ok(contractState == state["INACTIVE"]);
    })
})