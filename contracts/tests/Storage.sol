// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.9;

contract Storage {
    string private message;

    function setMessage(string memory _message) public {
        message = _message;
    }

    function getMessage() public view returns (string memory) {
        return message;
    }
}
