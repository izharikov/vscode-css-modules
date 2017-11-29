import { Position, TextDocument } from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash";

let possibleFileExtension = ['.css', '.scss', '.sass'];

export function getCurrentLine(document: TextDocument, position: Position): string {
    return document.getText(document.lineAt(position).range);
}

export function genImportRegExp(key: string ): RegExp {
    // check file have extension .*ss or folder is css / scss / sass
    const file = "((.+\\.\\S{1,2}ss)|(.*\\/\\S+ss\\/.*))";
    const fromOrRequire = "(?:from\\s+|=\\s+require(?:<any>)?\\()";
    const requireEndOptional = "\\)?";
    const pattern = `${key}\\s+${fromOrRequire}["']${file}["']${requireEndOptional}`;
    return new RegExp(pattern);
}

export function findImportPath(text: string, key: string, parentPath: string): string {
    const re = genImportRegExp(key);
    const results = re.exec(text);
    if (!!results && results.length > 0) {
        let filePath = path.resolve(parentPath, results[1]);
        //  check file has extension, matches .css / .sass / .scss
        if ( filePath.match(/^.*\.+\S{1,2}ss$/g)){
            return filePath;
        }
        //  file have no extension, work with possible extensions
        for ( let i = 0; i < possibleFileExtension.length; i++){
            let ext = possibleFileExtension[i];
            if ( fs.existsSync(filePath + ext)){
                return filePath + ext;
            }
        }
        return filePath;
    } else {
        return "";
    }
}

export function getAllClassNames(filePath: string, keyword: string): string[] {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    const lines = content.match(/.*[,{]/g);
    if (lines === null) {
        return [];
    }

    const classNames = lines.join(" ").match(/\.[_A-Za-z0-9\-]+/g);
    if (classNames === null) {
        return [];
    }

    const uniqNames = _.uniq(classNames).map(item => item.slice(1));
    return keyword !== "" ? uniqNames.filter(item => item.indexOf(keyword) !== -1) : uniqNames;
}

// from css-loader's implementation
// source: https://github.com/webpack-contrib/css-loader/blob/22f6621a175e858bb604f5ea19f9860982305f16/lib/compile-exports.js
export function dashesCamelCase(str) {
  return str.replace(/-(\w)/g, function(match, firstLetter) {
    return firstLetter.toUpperCase();
  });
}

export type CamelCaseValues = false | true | "dashes";
