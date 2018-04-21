const {spawnSync, execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const buildDir = 'build';
const fileExt = '.mjs';
const filesToIgnore = '**/__tests__/**';

console.log('\nBuild\n');
spawnSync(
    require.resolve('.bin/babel'),
    [
        '-x',
        fileExt,
        '--ignore',
        filesToIgnore,
        '--source-maps',
        'inline',
        '--keep-file-extension',
        '-d',
        buildDir,
        'src',
    ],
    {
        env: {
            ...process.env,
            NODE_ENV: 'production',
        },
        stdio: 'inherit',
    }
);

console.log('\nFix file extension (.mjs)\n');
fs.readdir(buildDir, (err, files) => {
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const jsFilePath = path.join(buildDir, file);
            const mjsFilePath = jsFilePath.replace(/.js$/, '.mjs');
            fs.rename(jsFilePath, mjsFilePath, err => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(`${jsFilePath} -> ${mjsFilePath}`);
                }
            });
        }
    });
});
