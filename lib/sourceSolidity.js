"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceSolidity = void 0;
const etherscanParser_1 = require("./etherscanParser");
const fileParser_1 = require("./fileParser");
const debug = require('debug')('sol2uml');
const sourceSolidity = async (fileFolderAddress, options) => {
    let umlClasses;
    if (fileFolderAddress.match(/^0x([A-Fa-f0-9]{40})$/)) {
        debug(`argument ${fileFolderAddress} is an Ethereum address so checking Etherscan for the verified source code`);
        const etherscanApiKey = options.etherscanApiKey || 'ZAD4UI2RCXCQTP38EXS3UY2MPHFU5H9KB1';
        const etherscanParser = new etherscanParser_1.EtherscanParser(etherscanApiKey, options.network);
        umlClasses = await etherscanParser.getUmlClasses(fileFolderAddress);
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
        umlClasses = await fileParser_1.parseUmlClassesFromFiles(filesFolders, ignoreFilesFolders, depthLimit);
    }
    return umlClasses;
};
exports.sourceSolidity = sourceSolidity;
//# sourceMappingURL=sourceSolidity.js.map