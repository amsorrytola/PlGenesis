// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";


contract dNEAR is ConfirmedOwner, FunctionsClient, ERC20("dNEAR", "DNEAR") {
    using FunctionsRequest for FunctionsRequest.Request;

    address constant FUNCTIONS_ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    string s_mintSourceCode;
    string s_redeemSourceCode;
    uint64 immutable i_subId;
    bytes32 constant DON_ID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
    uint32 constant GAS_LIMIT = 300000;
    address constant PRICE_FEED = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    uint64 s_secretVersion;
    uint8  s_secretSlot;

    constructor(
        string memory mintSourceCode,
        string memory redeemSourceCode,
        uint64 subId,
        uint64 secretVersion,
        uint8 secretSlot
    ) ConfirmedOwner(msg.sender) FunctionsClient(FUNCTIONS_ROUTER) {
        s_mintSourceCode = mintSourceCode;
        s_redeemSourceCode = redeemSourceCode;
        i_subId = subId;
        s_secretVersion = secretVersion;
        s_secretSlot = secretSlot;
    }

        function setSecretVersion(uint64 secretVersion) external onlyOwner {
        s_secretVersion = secretVersion;
    }

        function setSecretSlot(uint8 secretSlot) external onlyOwner {
        s_secretSlot = secretSlot;
    }

    struct Request {
        address requester;
        uint256 numOfStocks;
        string stock;
        uint256 balance;
        bool isRedeem;
    }

    mapping(bytes32 requestId => Request) public requests;
    mapping(address holder => mapping(string stockName => uint256 stockNum)) public totalHoldings;      //  most important 
    mapping(address holder => string[] stock) public stockHoldings;                                     //    things


    function sendMintRequest(
        uint256 numOfStocks,
        string memory stock
    ) external payable returns (bytes32) {
        require(msg.value > 0, "Must send some sepolia ETH to mint stocks");
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(s_mintSourceCode);
        req.addDONHostedSecrets(s_secretSlot, s_secretVersion);

        string[] memory args = new string[](2);
        args[0] = stock;
        args[1] = Strings.toString(numOfStocks);
        req.setArgs(args);

        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            i_subId,
            GAS_LIMIT,
            DON_ID
        );
        requests[requestId] = Request({
            requester: msg.sender,
            numOfStocks: numOfStocks,
            stock: stock,
            balance: msg.value,
            isRedeem: false
        });
        return requestId;
    }


    function sendRedeemRequest(
    uint256 numOfStocks,
    string memory stock
) external returns (bytes32) {
    require(balanceOf(msg.sender) >= numOfStocks, "Not enough DNEAR to redeem");

    FunctionsRequest.Request memory req;
    req.initializeRequestForInlineJavaScript(s_redeemSourceCode);
    req.addDONHostedSecrets(s_secretSlot, s_secretVersion);

    string[] memory args = new string[](2);
    args[0] = stock;
    args[1] = Strings.toString(numOfStocks);
    req.setArgs(args);

    bytes32 requestId = _sendRequest(
        req.encodeCBOR(),
        i_subId,
        GAS_LIMIT,
        DON_ID
    );

    requests[requestId] = Request({
        requester: msg.sender,
        numOfStocks: numOfStocks,
        stock: stock,
        balance: 0,
        isRedeem: true
    });

    return requestId;
}

    function fulfillRequest(
    bytes32 requestId,
    bytes memory response,
    bytes memory err
) internal override {
    if (requests[requestId].isRedeem) {
        _redeemFulfillRequest(requestId, response);
    } else if(!requests[requestId].isRedeem) {
        _mintFulfillRequest(requestId, response);
    }
     else {
        revert("Invalid request type");
    }
}


    function _mintFulfillRequest(
        bytes32 requestId,
        bytes memory response
    ) internal {
        Request memory req = requests[requestId];
        uint256 collateralRatioAdjustedBalance = getCollateralRatioAdjustedTotalBalance(req.balance);
        uint256 stockPrice = uint256(bytes32(response));

        if(collateralRatioAdjustedBalance < stockPrice * req.numOfStocks) {

            payable(req.requester).transfer(req.balance);
            return;
        }

        _mint(req.requester, req.numOfStocks);


        stockHoldings[req.requester].push(req.stock);
        totalHoldings[req.requester][req.stock] += req.numOfStocks;

        uint256 remainingBalance = collateralRatioAdjustedBalance - (stockPrice * req.numOfStocks);
        if (remainingBalance > 0) {
            AggregatorV3Interface priceFeed = AggregatorV3Interface(PRICE_FEED);
            (, int256 price, , , ) = priceFeed.latestRoundData();
            require(price > 0, "Invalid sepolia ETH price");

    
            uint256 ETHToSend = (remainingBalance * 1e18) / (uint256(price)*1e10);
            require(address(this).balance >= ETHToSend, "Contract lacks sepolia ETH liquidity");
            payable(req.requester).transfer(ETHToSend);
        }
    }

    function _redeemFulfillRequest(
    bytes32 requestId,
    bytes memory response
) internal {
    Request memory req = requests[requestId];

    uint256 stockPrice = uint256(bytes32(response));

    uint256 totalValueUSD = stockPrice * req.numOfStocks;

    AggregatorV3Interface priceFeed = AggregatorV3Interface(PRICE_FEED);
    (, int256 price, , , ) = priceFeed.latestRoundData();
    require(price > 0, "Invalid sepolia ETH price");

    
    uint256 ETHToSend = (totalValueUSD * 1e18) / (uint256(price)*1e10);

    require(address(this).balance >= ETHToSend, "Contract lacks sepolia ETH liquidity");

    _burn(req.requester, req.numOfStocks);
    totalHoldings[req.requester][req.stock] -= req.numOfStocks;

    payable(req.requester).transfer(ETHToSend);
}




    function getCollateralRatioAdjustedTotalBalance(uint256 balance) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(PRICE_FEED);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price feed data");

        uint256 collateralRatioAdjustedBalance = (balance * uint256(price) * 1e10)/1e18;

        return collateralRatioAdjustedBalance;
    }


    function withdraw() external onlyOwner {
    payable(owner()).transfer(address(this).balance);
}


function get_s_secretVersion() external view onlyOwner returns (uint64) {
    return s_secretVersion;
}

function get_s_secretSlot() external view onlyOwner returns (uint8) {
    return s_secretSlot;
}

function decimals() public view virtual override returns (uint8) {
        return 0; 
    }

function transfer(address to, uint256 amount) public virtual override returns (bool) {
    revert("Transfers are disabled");
}

function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
    revert("Transfers are disabled");
}

function getStockHoldings(address holder) external view returns (string[] memory) {
    return stockHoldings[holder];
}

}