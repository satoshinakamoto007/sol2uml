pragma solidity ^0.8.6;


struct FileLevelNotConnectedStruct {
    bool init;
    string name;
    uint256 size;
}

struct FileLevelStruct {
    bool valid;
    uint256 count;
    mapping (address => string) names;
    mapping (address => FileLevelAnotherStruct) balances;
}

struct FileLevelAnotherStruct {
    bool active;
    uint256 balance;
    FileLevelYetAnotherStruct fyos;
}

struct FileLevelYetAnotherStruct {
    bool active;
    uint256[] balances;
}

contract TestContract {

    enum ContractLevelEnum {
        movie,
        music,
        show
    }

    struct ContractLevelStruct {
        uint256 count;
        uint256 total;
    }

    FileLevelEnum status;
    FileLevelStruct public fls;
}

enum FileLevelEnum {
    red,
    orange,
    green
}

enum FileLevelNotConnectedEnum {
    high,
    medium,
    low
}
