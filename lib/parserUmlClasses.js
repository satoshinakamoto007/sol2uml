"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserUmlClasses = void 0;
const etherscanParser_1 = require("./etherscanParser");
const fileParser_1 = require("./fileParser");
const regEx_1 = require("./utils/regEx");
const debug = require('debug')('sol2uml');
const parserUmlClasses = async (fileFolderAddress, options) => {
    let result = {
        umlClasses: [],
    };
    if (regEx_1.isAddress(fileFolderAddress)) {
        debug(`argument ${fileFolderAddress} is an Ethereum address so checking Etherscan for the verified source code`);
        const etherscanApiKey = options.etherscanApiKey || 'ZAD4UI2RCXCQTP38EXS3UY2MPHFU5H9KB1';
        const etherscanParser = new etherscanParser_1.EtherscanParser(etherscanApiKey, options.network);
        result = await etherscanParser.getUmlClasses(fileFolderAddress);
    }
    else {
        const depthLimit = parseInt(options.depthLimit);
        if (isNaN(depthLimit)) {
            console.error(`depthLimit option must be an integer. Not ${options.depthLimit}`);
            process.exit(1);
        }
        const filesFolders = fileFolderAddress.split(',');
        let ignoreFilesFolders = options.ignoreFilesOrFolders
            ? options.ignoreFilesOrFolders.split(',')
            : [];
        result.umlClasses = await fileParser_1.parseUmlClassesFromFiles(filesFolders, ignoreFilesFolders, depthLimit);
    }
    return result;
};
exports.parserUmlClasses = parserUmlClasses;
//# sourceMappingURL=parserUmlClasses.js.map