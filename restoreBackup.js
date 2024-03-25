const fs = require("fs-extra");
const readline = require("readline");
const log = require('./logger/log.js'); // Assuming you have a custom logger

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function recursiveRestoreBackup(pathFileOrFolder, versionBackup) {
    const pathFileOrFolderBackup = `${process.cwd()}/backups/${versionBackup}/${pathFileOrFolder}`;
    const pathFileOrFolderRestore = `${process.cwd()}/${pathFileOrFolder}`;

    try {
        if (fs.existsSync(pathFileOrFolderBackup)) {
            if (fs.lstatSync(pathFileOrFolderBackup).isDirectory()) {
                if (!fs.existsSync(pathFileOrFolderRestore))
                    fs.mkdirSync(pathFileOrFolderRestore);
                const readDir = fs.readdirSync(pathFileOrFolderBackup);
                readDir.forEach(fileOrFolder => {
                    recursiveRestoreBackup(`${pathFileOrFolder}/${fileOrFolder}`, versionBackup);
                });
            } else {
                pathFileOrFolder = pathFileOrFolder.replace(/\\/g, '/');
                fs.copyFileSync(pathFileOrFolderBackup, pathFileOrFolderRestore);
            }
        } else {
            log.warn("WARNING", `File or directory not found in backup: ${pathFileOrFolder}`);
        }
    } catch (err) {
        log.error("ERROR", `Failed to restore ${pathFileOrFolder} from backup: ${err.message}`);
    }
}

(async () => {
    let versionBackup;

    if (process.argv.length < 3) {
        versionBackup = await new Promise((resolve) => {
            rl.question("Input version backup: ", answer => {
                resolve(answer);
            });
        });
    } else {
        versionBackup = process.argv[2];
    }

    if (!versionBackup) {
        log.error("ERROR", `Please input version backup`);
        process.exit();
    }

    versionBackup = versionBackup.replace("backup_", ""); // remove backup_ if exists (may be user input backup_1.0.0)
    versionBackup = `backup_${versionBackup}`;

    const backupFolder = `${process.cwd()}/backups/${versionBackup}`;
    if (!fs.existsSync(backupFolder)) {
        log.error("ERROR", `Backup folder is not exists (${backupFolder})`);
        process.exit();
    }

    const files = fs.readdirSync(backupFolder);
    for (const file of files) {
        recursiveRestoreBackup(file, versionBackup);
    }

    const packageJson = require(`${process.cwd()}/package.json`);
    packageJson.version = versionBackup.replace("backup_", "");
    fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(packageJson, null, 2));

    log.info("SUCCESS", `Restore backup ${versionBackup} success`);
})();
