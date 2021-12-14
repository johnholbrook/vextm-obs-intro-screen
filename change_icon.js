const rcedit = require('rcedit');
const path = require("path");

async function main(){
    await rcedit(
        path.join(".", "deploy", "win32", "build", "VexTMIntro", "VEX TM Intro Screen.exe"), 
        {
            icon: path.join(".", "icon", "icon.ico")
        }
    );
}

main();