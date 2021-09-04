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

library LibraryStructs {
    struct LibraryLevel {
        address owner;
        FileLevelStruct fls;
    }

    struct LibraryLevel2 {
        LibraryLevel ll;
    }

    enum LibraryLevelEnum {
        start,
        pause,
        stop
    }
}

contract Parent {
    struct ParentLevelStruct {
        uint256 count;
        uint256 total;
    }

    struct ParentLevelUsedStruct {
        uint256 count;
        uint256 total;
    }

    enum ParentLevelEnum {
        movie,
        music,
        show
    }

    enum ParentLevelUsedEnum {
        movie,
        music,
        show
    }
}

contract TestContract is Parent {

    enum ContractLevelEnum {
        movie,
        music,
        show
    }

    enum ContractLevelUsedEnum {
        movie,
        music,
        show
    }

    struct ContractLevelStruct {
        uint256 count;
        uint256 total;
    }

    struct ContractLevelUsedStruct {
        uint256 count;
        uint256 total;
    }

    FileLevelEnum status;
    FileLevelStruct public fls;
    FileLevelStruct public fls2;
    ContractLevelUsedStruct clus;
    ParentLevelUsedStruct plus;
    ContractLevelUsedEnum clue;
    ParentLevelUsedEnum plue;
    LibraryStructs.LibraryLevel ll;
    LibraryStructs.LibraryLevel2 ll2;

    LibraryLevelEnum lle;
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
