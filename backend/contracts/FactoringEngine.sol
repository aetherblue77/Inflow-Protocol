// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;

// --- INTERFACES (For don't need import to saving gas) ---
interface IInvoiceNFT {
    function mintInvoice(
        address to, // Owner of NFT (Admin)
        address seller,
        string memory tokenURI,
        uint256 amount,
        uint64 dueTimestamp,
        address client
    ) external returns (uint256);

    // Add this function for Engine can update paid status at NFT
    function markAsPaid(uint256 tokenId) external;
}

interface IInflowVault {
    function s_totalBorrowed() external view returns (uint256);
    function lendToEngine(uint256 amount) external;
    function repayFromEngine(uint256 advanceAmount, uint256 profit) external;
    function totalAssets() external view returns (uint256);
}

error FactoringEngine__InvalidAmount(uint256 total, uint256 advance, uint256 fee);
error FactoringEngine__InvoiceAlreadySettled(uint256 invoiceId);
error FactoringEngine__InvoiceNotFound(uint256 invoiceId);
error FactoringEngine__InvalidTreasuryAddress();
error FactoringEngine__UtilizationLimitExceeded(uint256 advanceAmount, uint256 maxLendable);

// --- MAIN CONTRACT ---
contract FactoringEngine is Ownable {
    // --- STATE VARIABLES ---
    IERC20 public immutable usdc;
    IInvoiceNFT public immutable invoiceNft;
    IInflowVault public immutable vault;

    // Treasury & Fee Config
    address public treasury; // Company Wallet
    // 50% for Investor, 50% for Company
    // Total 10000 Basis Points (100%). 5000 = 50%
    uint256 public constant INVESTOR_PROFIT_SHARE_BPS = 5000; // 50% Backend Split
    uint256 public constant ORIGINATION_FEE_BPS = 100; // 1% Upfront Fee
    uint256 public constant MAX_UTILIZATION_BPS = 8000; // 80% Max LTV

    // Structure Invoice Data
    struct InvoiceOps {
        address issuer; // Freelancer
        uint256 totalAmount; // Total Invoice Amount
        uint256 advanceAmount; // Amount of money we give to Freelancer
        uint256 feeAmount; // Profit
        bool isSettled; // Status Paid/Not Paid
    }

    // Database Invoice (Mapping NFT ID => Invoice Data)
    mapping(uint256 => InvoiceOps) public invoices;

    // --- EVENTS ---
    event InvoiceFunded(
        uint256 indexed invoiceId,
        address indexed issuer,
        uint256 advanceAmount,
        uint256 upfrontFee
    );
    event InvoiceSettled(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 profitGenerated
    );
    event ProfitDistributed(uint256 investorShare, uint256 companyShare);
    event TreasuryUpdated(address newTreasury);

    // --- CONSTRUCTOR ---
    constructor(
        address _usdc,
        address _invoiceNft,
        address _vault,
        address _treasury
    ) Ownable(msg.sender) {
        if (_treasury == address(0)) {
            revert FactoringEngine__InvalidTreasuryAddress();
        }
        usdc = IERC20(_usdc);
        invoiceNft = IInvoiceNFT(_invoiceNft);
        vault = IInflowVault(_vault);
        treasury = _treasury;
    }

    // --- ADMIN FUNCTION ---
    // Function to switch treasury wallet if old wallet have problem
    function setTreasury(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) {
            revert FactoringEngine__InvalidTreasuryAddress();
        }
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    // --- 1. FUNDING ---
    // Called by admin after verify Invoice Real-World
    function fundInvoice(
        address _issuer,
        uint256 _totalAmount,
        uint256 _advanceAmount,
        uint256 _feeAmount,
        uint64 _dueTimestamp,
        address _client,
        string memory _uri
    ) external onlyOwner {
        if (_advanceAmount + _feeAmount > _totalAmount) {
            revert FactoringEngine__InvalidAmount(_totalAmount, _advanceAmount, _feeAmount);
        }

        // A. LIQUIDITY CHECK
        uint256 vaultTotalAssets = vault.totalAssets();
        uint256 maxLendable = (vaultTotalAssets * MAX_UTILIZATION_BPS) / 10000;
        uint256 currentBorrowed = vault.s_totalBorrowed();

        if (_advanceAmount + currentBorrowed > maxLendable) {
            revert FactoringEngine__UtilizationLimitExceeded(_advanceAmount, maxLendable);
        }

        // B. Mint NFT as proof of ownership
        uint256 newInvoiceId = invoiceNft.mintInvoice(
            address(this), // Owner of NFT (Factoring Engine)
            _issuer, // Freelancer
            _uri,
            _totalAmount,
            _dueTimestamp,
            _client
        );

        // C. Save Data to Blockchain
        invoices[newInvoiceId] = InvoiceOps({
            issuer: _issuer,
            totalAmount: _totalAmount,
            advanceAmount: _advanceAmount,
            feeAmount: _feeAmount,
            isSettled: false
        });

        // D. WITHDRAW MONEY FROM VAULT
        // Vault will send USDC to this Engine Contract
        vault.lendToEngine(_advanceAmount);

        // E. UPFRONT FEE
        uint256 upfrontFee = (_advanceAmount * ORIGINATION_FEE_BPS) / 10000;
        uint256 netToFreelancer = _advanceAmount - upfrontFee;

        // F. DISTRIBUTE
        if (upfrontFee > 0) {
            usdc.safeTransfer(treasury, upfrontFee); // Send to treasury
        }
        usdc.safeTransfer(_issuer, netToFreelancer); // Send to Freelancer

        emit InvoiceFunded(newInvoiceId, _issuer, _advanceAmount, upfrontFee);
    }

    // --- 2. SETTLEMENT (Repayment) ---
    // Called when Client pay invoice full 100%
    function settleInvoice(uint256 _invoiceId) external {
        InvoiceOps storage inv = invoices[_invoiceId];

        if (inv.isSettled) {
            revert FactoringEngine__InvoiceAlreadySettled(_invoiceId);
        }

        if (inv.totalAmount == 0) {
            revert FactoringEngine__InvoiceNotFound(_invoiceId);
        }

        // A. Withdraw repayment fund from payer (anyone can pay)
        // Payer must approve USDC to engine before call this
        usdc.safeTransferFrom(msg.sender, address(this), inv.totalAmount);

        // B. UPDATE STATUS (Prevent Reentrancy Attack)
        // 1. Update Status at Engine
        inv.isSettled = true;
        // 2. Update Status at NFT
        invoiceNft.markAsPaid(_invoiceId);

        // C. SPLIT PROFIT (Backend)
        // Investor Share = Fee * 50%
        uint256 investorProfit = (inv.feeAmount * INVESTOR_PROFIT_SHARE_BPS) / 10000;
        // Company Share = Remaining Fee (automatically 50%)
        uint256 companyProfit = inv.feeAmount - investorProfit;

        // D. PAY VAULT
        uint256 amountToVault = inv.advanceAmount + investorProfit;
        usdc.forceApprove(address(vault), amountToVault);
        vault.repayFromEngine(inv.advanceAmount, investorProfit);

        // E. PAY TREASURY
        if (companyProfit > 0) {
            usdc.safeTransfer(treasury, companyProfit);
        }

        // F. PAY FREELANCER
        uint256 reserveAmount = inv.totalAmount - (inv.advanceAmount + inv.feeAmount);
        if (reserveAmount > 0) {
            usdc.safeTransfer(inv.issuer, reserveAmount);
        }

        emit InvoiceSettled(_invoiceId, msg.sender, inv.feeAmount);
        emit ProfitDistributed(investorProfit, companyProfit);
    }

    // Emergency Function: If there is a token stuck (sent incorrectly)
    function rescueFunds(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
