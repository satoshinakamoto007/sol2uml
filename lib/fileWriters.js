"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writePng = exports.writeSVG = exports.writeDot = exports.writeSolidity = exports.convertDot2Svg = exports.writeOutputFiles = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const verror_1 = require("verror");
const Viz = require('viz.js');
const svg_to_png = require('svg-to-png');
const debug = require('debug')('sol2uml');
const writeOutputFiles = async (dot, outputBaseName, outputFormat = 'svg', outputFilename) => {
    if (outputFormat === 'dot' || outputFormat === 'all') {
        writeDot(dot, outputFilename);
        // No need to continue if only generating a dot file
        if (outputFormat === 'dot') {
            return;
        }
    }
    if (!outputFilename) {
        // If all output then extension is svg
        const outputExt = outputFormat === 'all' ? 'svg' : outputFormat;
        // if outputBaseName is a folder
        try {
            const folderOrFile = fs_1.lstatSync(outputBaseName);
            if (folderOrFile.isDirectory()) {
                const parsedDir = path_1.default.parse(process.cwd());
                outputBaseName = path_1.default.join(process.cwd(), parsedDir.name);
            }
        }
        catch (err) { } // we can ignore errors as it just means outputBaseName is not a folder
        outputFilename = outputBaseName + '.' + outputExt;
    }
    const svg = convertDot2Svg(dot);
    // write svg file even if only wanting png file as we generateFilesFromUmlClasses svg files to png
    await writeSVG(svg, outputFilename, outputFormat);
    if (outputFormat === 'png' || outputFormat === 'all') {
        await writePng(svg, outputFilename);
    }
};
exports.writeOutputFiles = writeOutputFiles;
function convertDot2Svg(dot) {
    debug(`About to convert dot to SVG`);
    try {
        return Viz(dot);
    }
    catch (err) {
        console.error(`Failed to convert dot to SVG. ${err.message}`);
        console.log(dot);
        throw new verror_1.VError(err, `Failed to parse dot string`);
    }
}
exports.convertDot2Svg = convertDot2Svg;
function writeSolidity(code, filename = 'solidity') {
    const outputFile = filename + '.sol';
    debug(`About to write Solidity to file ${outputFile}`);
    fs_1.writeFile(outputFile, code, (err) => {
        if (err) {
            throw new verror_1.VError(err, `Failed to write Solidity to file ${outputFile}`);
        }
        else {
            console.log(`Solidity written to ${outputFile}`);
        }
    });
}
exports.writeSolidity = writeSolidity;
function writeDot(dot, dotFilename = 'classDiagram.dot') {
    debug(`About to write Dot file to ${dotFilename}`);
    fs_1.writeFile(dotFilename, dot, (err) => {
        if (err) {
            throw new verror_1.VError(err, `Failed to write Dot file to ${dotFilename}`);
        }
        else {
            console.log(`Dot file written to ${dotFilename}`);
        }
    });
}
exports.writeDot = writeDot;
function writeSVG(svg, svgFilename = 'classDiagram.svg', outputFormats = 'png') {
    debug(`About to write SVN file to ${svgFilename}`);
    if (outputFormats === 'png') {
        const parsedFile = path_1.default.parse(svgFilename);
        if (!parsedFile.dir) {
            svgFilename = process.cwd() + '/' + parsedFile.name + '.svg';
        }
        else {
            svgFilename = parsedFile.dir + '/' + parsedFile.name + '.svg';
        }
    }
    return new Promise((resolve, reject) => {
        fs_1.writeFile(svgFilename, svg, (err) => {
            if (err) {
                reject(new verror_1.VError(err, `Failed to write SVG file to ${svgFilename}`));
            }
            else {
                console.log(`Generated svg file ${svgFilename}`);
                resolve();
            }
        });
    });
}
exports.writeSVG = writeSVG;
async function writePng(svg, filename) {
    // get svg file name from png file name
    const parsedPngFile = path_1.default.parse(filename);
    const pngDir = parsedPngFile.dir === '' ? '.' : path_1.default.resolve(parsedPngFile.dir);
    const svgFilename = pngDir + '/' + parsedPngFile.name + '.svg';
    const pngFilename = pngDir + '/' + parsedPngFile.name + '.png';
    debug(`About to convert svg file ${svgFilename} to png file ${pngFilename}`);
    try {
        await svg_to_png.convert(path_1.default.resolve(svgFilename), pngDir);
    }
    catch (err) {
        throw new verror_1.VError(err, `Failed to convert SVG file ${svgFilename} to PNG file ${pngFilename}`);
    }
    console.log(`Generated png file ${pngFilename}`);
}
exports.writePng = writePng;
//# sourceMappingURL=fileWriters.js.map