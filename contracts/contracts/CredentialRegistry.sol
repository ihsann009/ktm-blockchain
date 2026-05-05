// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialRegistry {
    struct Credential {
        bytes32 credentialHash;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
    }

    address public issuer;
    mapping(string => Credential) private credentials;

    event CredentialIssued(string indexed credentialId, bytes32 credentialHash, uint256 issuedAt, uint256 expiresAt);
    event CredentialRevoked(string indexed credentialId);

    modifier onlyIssuer() {
        require(msg.sender == issuer, "Only issuer can perform this action");
        _;
    }

    constructor() {
        issuer = msg.sender;
    }

    function issueCredential(
        string calldata credentialId,
        bytes32 credentialHash,
        uint256 issuedAt,
        uint256 expiresAt
    ) external onlyIssuer {
        require(credentials[credentialId].issuedAt == 0, "Credential already exists");
        credentials[credentialId] = Credential(credentialHash, issuedAt, expiresAt, false);
        emit CredentialIssued(credentialId, credentialHash, issuedAt, expiresAt);
    }

    function revokeCredential(string calldata credentialId) external onlyIssuer {
        require(credentials[credentialId].issuedAt != 0, "Credential does not exist");
        require(!credentials[credentialId].revoked, "Credential already revoked");
        credentials[credentialId].revoked = true;
        emit CredentialRevoked(credentialId);
    }

    function getCredential(string calldata credentialId) external view returns (
        bytes32 credentialHash,
        uint256 issuedAt,
        uint256 expiresAt,
        bool revoked
    ) {
        Credential memory c = credentials[credentialId];
        return (c.credentialHash, c.issuedAt, c.expiresAt, c.revoked);
    }

    function isCredentialValid(string calldata credentialId) external view returns (bool) {
        Credential memory c = credentials[credentialId];
        if (c.issuedAt == 0) return false;
        if (c.revoked) return false;
        if (block.timestamp > c.expiresAt) return false;
        return true;
    }
}
