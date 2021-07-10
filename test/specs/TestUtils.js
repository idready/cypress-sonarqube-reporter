const fse = require('fs-extra');
const parser = require('fast-xml-parser');
const { resolve } = require('path');
const rimraf = require('rimraf');

const cypressDefaultConfig = require('./CypressDefaultConfig');


const createFile = (path, content) => {
    fse.outputFileSync(path, content, { encoding: 'utf8' });
}


const readFile = (path) => {
    return fse.readFileSync(path, { encoding: 'utf8' });
}


const cleanOuputDir = (dir) => {
    rimraf.sync(dir);
};


const verifyReportExists = (path) => {
    expect(fse.existsSync(path)).toBeTruthy();
};


const overwriteConfig = (config) => {
    return Object.assign({}, cypressDefaultConfig, config);
};


const verifyGeneratedReport = (path, options) => {
    const titleSeparator = (options && options.titleSeparator) ? options.titleSeparator : ' - ';
    const useFullTitle = (options && options.useFullTitle === false) ? false : true;
    const xml = fse.readFileSync(path, { encoding: 'utf8' });
    const json = parser.parse(xml, {
        ignoreAttributes: false,
        parseAttributeValue: true,
        attributeNamePrefix: '_',
        textNodeName: 'text'
    });

    expect(json).toBeDefined();
    expect(json.testExecutions).toBeDefined();
    expect(json.testExecutions._version).toBe(1);
    expect(json.testExecutions.file).toBeDefined();
    expect(json.testExecutions.file._path).toBe((options && options.useAbsoluteSpecPath) ? resolve('test/cypress/integration/Sample.spec.js').replace(/\\/g, '/') : 'test/cypress/integration/Sample.spec.js');
    expect(json.testExecutions.file.testCase).toBeDefined();
    expect(json.testExecutions.file.testCase).toBeArray();
    expect(json.testExecutions.file.testCase).toBeArrayOfSize(6);

    let i = -1;
    expect(json.testExecutions.file.testCase[++i]).toBeDefined();
    expect(json.testExecutions.file.testCase[i]._name).toBe(useFullTitle ? `The root suite${titleSeparator}Test case #1 (must pass)` : 'Test case #1 (must pass)');
    expect(json.testExecutions.file.testCase[i]._duration).toBeGreaterThanOrEqual(0);

    expect(json.testExecutions.file.testCase[++i]).toBeDefined();
    expect(json.testExecutions.file.testCase[i]._name).toBe(useFullTitle ? `The root suite${titleSeparator}A sub suite${titleSeparator}Test case #2 (must pass)` : 'Test case #2 (must pass)');
    expect(json.testExecutions.file.testCase[i]._duration).toBeGreaterThanOrEqual(0);

    expect(json.testExecutions.file.testCase[++i]).toBeDefined();
    expect(json.testExecutions.file.testCase[i]._name).toBe(useFullTitle ? `The root suite${titleSeparator}A sub suite${titleSeparator}Test case #3 (must fail)` : 'Test case #3 (must fail)');
    expect(json.testExecutions.file.testCase[i]._duration).toBeGreaterThanOrEqual(0);
    expect(json.testExecutions.file.testCase[i].failure).toBeDefined();
    expect(json.testExecutions.file.testCase[i].failure._message).toBe('AssertionError: expected true to be false');
    expect(json.testExecutions.file.testCase[i].failure.text).toStartWith('AssertionError: expected true to be false');
    expect(json.testExecutions.file.testCase[i].failure.text).toIncludeMultiple([ ' at ' ]);

    expect(json.testExecutions.file.testCase[++i]).toBeDefined();
    expect(json.testExecutions.file.testCase[i]._name).toBe(useFullTitle ? `The root suite${titleSeparator}Another sub suite${titleSeparator}Test case #4 (must be skipped)` : 'Test case #4 (must be skipped)');
    expect(json.testExecutions.file.testCase[i]._duration).toBe(0);
    expect(json.testExecutions.file.testCase[i].skipped).toBeDefined();
    expect(json.testExecutions.file.testCase[i].skipped._message).toBe('skipped test');

    expect(json.testExecutions.file.testCase[++i]).toBeDefined();
    expect(json.testExecutions.file.testCase[i]._name).toBe(useFullTitle ? `The root suite${titleSeparator}Another sub suite${titleSeparator}Test case #5 (must raise an error)` : 'Test case #5 (must raise an error)');
    expect(json.testExecutions.file.testCase[i]._duration).toBeGreaterThanOrEqual(0);
    expect(json.testExecutions.file.testCase[i].error).toBeDefined();
    expect(json.testExecutions.file.testCase[i].error._message).toBe('TypeError: Cannot read property \'toString\' of undefined');
    expect(json.testExecutions.file.testCase[i].error.text).toStartWith('TypeError: Cannot read property \'toString\' of undefined');
    expect(json.testExecutions.file.testCase[i].error.text).toIncludeMultiple([ ' at ' ]);

    expect(json.testExecutions.file.testCase[++i]).toBeDefined();
    expect(json.testExecutions.file.testCase[i]._name).toBe(useFullTitle ? `The root suite${titleSeparator}A suite with a failed before hook${titleSeparator}Test case #6 (must be skipped because of failed before hook)` : 'Test case #6 (must be skipped because of failed before hook)');
    expect(json.testExecutions.file.testCase[i]._duration).toBeGreaterThanOrEqual(0);
    //expect(json.testExecutions.file.testCase[i].skipped).toBeDefined();
    //expect(json.testExecutions.file.testCase[i].skipped._message).toBe('An error occurred during a hook and remaining tests in the current suite are skipped');
    expect(json.testExecutions.file.testCase[i].error).toBeDefined();
    expect(json.testExecutions.file.testCase[i].error._message).toStartWith('TypeError: Cannot read property \'toString\' of undefined');
    expect(json.testExecutions.file.testCase[i].error.text).toStartWith('TypeError: Cannot read property \'toString\' of undefined');
    expect(json.testExecutions.file.testCase[i].error.text).toInclude('Because this error occurred during a `before');
    expect(json.testExecutions.file.testCase[i].error.text).toInclude(' at ');
};


const verifyReport = (path, config) => {
    verifyReportExists(path);
    verifyGeneratedReport(path, config?.reporterOptions);
};


module.exports = {
    cleanOuputDir,
    createFile,
    overwriteConfig,
    readFile,
    verifyReportExists,
    verifyGeneratedReport,
    verifyReport
};
