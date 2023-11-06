const rcedit = require('rcedit');
const path = require("path");

async function main(){
    await rcedit(
        path.join(".", "deploy", "win32", "build", "VexTMIntro", "TM Stream Widgets.exe"), 
        {
            icon: path.join(".", "icon", "icon.ico")
        }
    );
}

main();