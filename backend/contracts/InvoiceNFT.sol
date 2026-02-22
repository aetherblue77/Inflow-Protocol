// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error InvoiceNFT__CallerNotEngine();
error InvoiceNFT__InvalidEngineAddress();
error InvoiceNFT__InvoiceAlreadyPaid();

contract InvoiceNFT is ERC721URIStorage, Ownable {
    uint256 private s_nextTokenId;
    address public s_factoringEngine;

    struct InvoiceData {
        address originalSeller; // Freelancer
        address clientAddress; // Client
        uint256 invoiceAmount; // USDC
        uint64 creationTimestamp; // When was NFT minted
        uint64 dueTimestamp; // When was due date
        uint64 paidTimestamp; // When paid off
        bool isPaid;
    }

    mapping(uint256 => InvoiceData) public invoices;

    event EnginedUpdated(address indexed newEngine);
    event InvoiceMinted(uint256 indexed tokenId, address indexed seller, uint256 amount);
    event InvoicePaid(uint256 indexed tokenId, uint64 paidTimestamp);

    constructor() ERC721("Inflow Invoice Asset", "INV") Ownable(msg.sender) {}

    // --- MODIFIERS ---
    modifier onlyEngine() {
        if (msg.sender != s_factoringEngine) {
            revert InvoiceNFT__CallerNotEngine();
        }
        _;
    }

    // --- ADMIN FUNCTIONS ---
    function setFactoringEngine(address _engine) external onlyOwner {
        if (_engine == address(0)) {
            revert InvoiceNFT__InvalidEngineAddress();
        }
        s_factoringEngine = _engine;
        emit EnginedUpdated(_engine);
    }

    // --- CORE LOGIC ---
    function mintInvoice (
        address _ownerOfNFT, // Who own this NFT (Admin)
        address _seller,
        string memory _tokenURI,
        uint256 _amount,
        uint64 _dueTimestamp,
        address _client
    ) external onlyEngine returns (uint256) {
        uint256 tokenId = s_nextTokenId++;

        _mint(_ownerOfNFT, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        invoices[tokenId] = InvoiceData({
            originalSeller: _seller,
            clientAddress: _client,
            invoiceAmount: _amount,
            creationTimestamp: uint64(block.timestamp),
            dueTimestamp: _dueTimestamp,
            paidTimestamp: 0,
            isPaid: false
        });

        emit InvoiceMinted(tokenId, _seller, _amount);
        return tokenId;
    }

    function markAsPaid(uint256 tokenId) external onlyEngine {
        InvoiceData storage invoice = invoices[tokenId];

        // Check if there was paid off (Gas Optimized)
        if (invoice.isPaid) {
            revert InvoiceNFT__InvoiceAlreadyPaid();
        }

        invoice.isPaid = true;
        invoice.paidTimestamp = uint64(block.timestamp);

        emit InvoicePaid(tokenId, invoice.paidTimestamp);
    }

    // --- VIEW FUNCTIONS ---
    function getInvoiceDetails(uint256 tokenId) external view returns (InvoiceData memory) {
        return invoices[tokenId];
    }
}
