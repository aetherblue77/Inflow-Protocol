// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
using SafeERC20 for IERC20;


error InflowVault__CallerNotEngine();
error InflowVault__InvalidEngineAddress();
error InflowVault__InsufficientLiquidity();

contract InflowVault is ERC4626, Ownable, Pausable {
    address public s_factoringEngine;
    uint256 public s_totalBorrowed;

    // --- EVENTS ---
    event EnginedUpdated(address indexed newEngine);
    event FundsLent(address indexed engine, uint256 amount);
    event FundsRepaid(uint256 amount, uint256 profit);

    // --- CONSTRUCTOR ---
    constructor(IERC20 _asset) ERC4626(_asset) ERC20("Inflow Interest USDC", "iUSDC") Ownable(msg.sender) {}

    // --- MODIFIERS ---
    modifier onlyEngine() {
        if (msg.sender != s_factoringEngine) {
            revert InflowVault__CallerNotEngine();
        }
        _;
    }

    // --- ADMIN SETUP ---
    function setFactoringEngine(address _engine) external onlyOwner {
        if (_engine == address(0)) {
            revert InflowVault__InvalidEngineAddress();
        }
        s_factoringEngine = _engine;
        emit EnginedUpdated(_engine);
    }

    // --- EMERGENCY FUNCTIONS ---
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- CORE LOGIC (Protected by whenNotPaused) ---
    // assets => USDC, shares => iUSDC
    function deposit(uint256 assets, address receiver) public virtual override whenNotPaused returns (uint256) {
        return super.deposit(assets, receiver);
    }

    function withdraw(uint256 assets, address receiver, address owner) public virtual override whenNotPaused returns (uint256) {
        return super.withdraw(assets, receiver, owner);
    }

    function redeem(uint256 shares, address receiver, address owner) public virtual override whenNotPaused returns (uint256) {
        return super.redeem(shares, receiver, owner);
    }

    function mint(uint256 shares, address receiver) public virtual override whenNotPaused returns (uint256) {
        return super.mint(shares, receiver);
    }

    // --- MAIN FEATURE: LEND MONEY TO THE ENGINE ---
    // Called when Engine need money to funding Invoice
    function lendToEngine(uint256 amount) external onlyEngine {
        // Check liquidity Safe
        if (totalAssets() < amount) {
            revert InflowVault__InsufficientLiquidity();
        }
        s_totalBorrowed += amount;

        // Transfer USDC to Engine
        IERC20(asset()).safeTransfer(msg.sender, amount);
        emit FundsLent(msg.sender, amount);
    }

    function repayFromEngine(uint256 advanceAmount, uint256 profit) external onlyEngine whenNotPaused {
        uint256 totalAmount = advanceAmount + profit;
        s_totalBorrowed -= advanceAmount;

        IERC20(asset()).safeTransferFrom(msg.sender, address(this), totalAmount);
        emit FundsRepaid(totalAmount, profit);
    }

    function totalAssets() public view virtual override returns (uint256) {
        // Funds = Cash + Liabilities
        return IERC20(asset()).balanceOf(address(this)) + s_totalBorrowed;
    }
}
