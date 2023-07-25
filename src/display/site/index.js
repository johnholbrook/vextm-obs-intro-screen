const socket = io();

// preload sounds
var start = new Audio("/sounds/Start.wav");
var pause = new Audio("/sounds/Pause.wav");
var warning = new Audio("/sounds/Warning.wav");
var stop = new Audio("/sounds/Stop.wav");

socket.on("match_queued", data => {
    console.log(data);
    showIntro(data);
})

socket.on("match_started", play_sounds => {
    // console.log("Match started");
    setProgram("none");
    if (play_sounds) start.play();
});

socket.on("match_time_updated", data => {
    if (data.play_sounds){
        if (data.state == "AUTO" && data.remaining == 0) pause.play();
        else if (data.state == "DRIVER" && data.remaining == 15) warning.play();
        else if (data.state == "DRIVER" && data.remaining == 0) stop.play();
    }
});

/**
 * Generate the HTML source for a particular team
 * @param {Object} team The team to generate the HTML for
 */
function generateTeamHTML(team) {
    return `<strong>${team.number}</strong> ${team.name}
    <br>
    <small>${team.location}</small>`;
}

/**
 * Populate the display with the info for a single VRC team
 * @param {String} teamid - "red1", "red2", "blue1", or "blue2"
 * @param {Object} info - object with team info
 */
function showVRCTeamInfo(teamid, info, show_stats){
    // show the team number/name/location
    document.querySelector(`#vrc-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#vrc-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#vrc-${teamid} .team-loc`).innerHTML = info.location;

    // show team ranking
    document.querySelector(`#vrc-${teamid} .team-rank`).innerHTML = info.rank;
    document.querySelector(`#vrc-${teamid} .team-rank-area .team-wlt`).innerHTML = `(${info.wlt})`;

    // hide header (temp)
    // document.querySelectorAll("#vrc-intro .stats-header").forEach(h => h.style.display = "none");

    // if this is an elimination match, show the seed for the whole alliance rather than the rank for this team
    let color = teamid.slice(0, teamid.length-1);
    if (info.seed){
        document.querySelector(`#vrc-${teamid} .team-rank-area`).style.display = "none";
        document.querySelector(`#vrc-${color}-seed-area`).style.display = "";
        document.querySelector(`#vrc-${color}-seed`).innerHTML = info.seed;
    }
    else{
        document.querySelector(`#vrc-${teamid} .team-rank-area`).style.display = "";
        document.querySelector(`#vrc-${color}-seed-area`).style.display = "none";
    }

    if (show_stats){
        // if we have team stats, show them
        document.querySelector(`#vrc-${teamid} .team-stats`).style.display = "";
        document.querySelector(`#vrc-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#vrc-${teamid} .team-awp`).innerHTML = info.awp_rate;
        document.querySelector(`#vrc-${teamid} .team-wp`).innerHTML = info.wp;
        document.querySelector(`#vrc-${teamid} .team-auto-rate`).innerHTML = info.auto_win_rate;
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#vrc-${teamid} .team-stats`).style.display = "none";
        document.querySelector(`#vrc-${teamid} .team-bio`).style.width = "100%";
    }
}

/**
 * Populate the display with the info for a single VRC team
 * @param {String} teamid - "red1", "red2", "blue1", or "blue2"
 * @param {Object} info - object with team info
 */
function showRADCTeamInfo(teamid, info, show_stats){
    // show the team number/name/location
    document.querySelector(`#radc-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#radc-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#radc-${teamid} .team-loc`).innerHTML = info.location;

    // show team ranking
    document.querySelector(`#radc-${teamid} .team-rank`).innerHTML = info.rank;
    document.querySelector(`#radc-${teamid} .team-rank-area .team-wlt`).innerHTML = `(${info.wlt})`;

    // if this is an elimination match, show the seed for the whole alliance rather than the rank for this team
    let color = teamid.slice(0, teamid.length-1);
    if (info.seed){
        document.querySelector(`#radc-${teamid} .team-rank-area`).style.display = "none";
        document.querySelector(`#radc-${color}-seed-area`).style.display = "";
        document.querySelector(`#radc-${color}-seed`).innerHTML = info.seed;
    }
    else{
        document.querySelector(`#radc-${teamid} .team-rank-area`).style.display = "";
        document.querySelector(`#radc-${color}-seed-area`).style.display = "none";
    }

    if (show_stats){
        // if we have team stats, show them
        document.querySelector(`#radc-${teamid} .team-stats`).style.display = "";
        document.querySelector(`#radc-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#radc-${teamid} .team-wp`).innerHTML = info.wp;
        document.querySelector(`#radc-${teamid} .team-max`).innerHTML = info.high_score;
        document.querySelector(`#radc-${teamid} .team-avg`).innerHTML = info.avg_score;
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#radc-${teamid} .team-stats`).style.display = "none";
        document.querySelector(`#radc-${teamid} .team-bio`).style.width = "100%";
    }
}

/**
 * Populate the display with info for a single VIQC team
 * @param {String} teamid - "team1" or "team2"
 * @param {Object} info - Object with team info
 */
function showVIQCTeamInfo(teamid, info, show_stats, match_num){
    // show the team number/name/location
    document.querySelector(`#viqc-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#viqc-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#viqc-${teamid} .team-loc`).innerHTML = info.location;

    // populate team ranking
    document.querySelector(`#viqc-${teamid} .team-rank`).innerHTML = info.rank;

    // hide team ranking for IQ finals matches
    if (match_num[0] == "F"){
        document.querySelector(`#viqc-${teamid} .team-rank-area`).style.display = "none";
    }
    else{
        document.querySelector(`#viqc-${teamid} .team-rank-area`).style.display = "";
    }

    if (show_stats){
        // if we have team stats, show them
        document.querySelector(`#viqc-${teamid} .team-stats`).style.display = "";
        document.querySelector(`#viqc-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#viqc-${teamid} .team-high`).innerHTML = info.high_score;
        document.querySelector(`#viqc-${teamid} .team-avg`).innerHTML = info.avg_score;
        document.querySelector(`#viqc-${teamid} .team-skills`).innerHTML = info.high_driving ? info.high_driving : "N/A";
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#viqc-${teamid} .team-stats`).style.display = "none";
        document.querySelector(`#viqc-${teamid} .team-bio`).style.width = "100%";
    }

}

/**
 * Populate the display with info for a single VEXU team
 * @param {*} teamid - "red" or "blue"
 * @param {*} info - object with team info
 */
function showVEXUTeamInfo(teamid, info, show_stats){
    console.log(teamid);
    // show the team number/name/location
    document.querySelector(`#vexu-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#vexu-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#vexu-${teamid} .team-loc`).innerHTML = info.location;

    // show team ranking
    document.querySelector(`#vexu-${teamid} .team-rank`).innerHTML = info.rank;
    document.querySelector(`#vexu-${teamid} .team-rank-area .team-wlt`).innerHTML = `(${info.wlt})`;

    // if this is an elimination match, show the seed for the whole alliance rather than the rank for this team
    if (info.seed){
        document.querySelector(`#vexu-${teamid} .team-rank-area`).style.display = "none";
        document.querySelector(`#vexu-${teamid}-seed-area`).style.display = "";
        document.querySelector(`#vexu-${teamid}-seed`).innerHTML = info.seed;
    }
    else{
        document.querySelector(`#vexu-${teamid} .team-rank-area`).style.display = "";
        document.querySelector(`#vexu-${teamid}-seed-area`).style.display = "none";
    }

    if (show_stats){
        // if we have team stats, show them
        document.querySelector(`#vexu-${teamid} .team-stats`).style.display = "";
        document.querySelector(`#vexu-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#vexu-${teamid} .team-awp`).innerHTML = info.awp_rate;
        document.querySelector(`#vexu-${teamid} .team-wp`).innerHTML = info.wp;
        document.querySelector(`#vexu-${teamid} .team-auto-rate`).innerHTML = info.auto_win_rate;
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#vexu-${teamid} .team-stats`).style.display = "none";
        document.querySelector(`#vexu-${teamid} .team-bio`).style.width = "100%";
    }
}

/**
 * Show the intro for a particular match
 * @param {Object} match The match to show the intro for
 */
function showIntro(match) {
    setProgram(match.program);
    
    // show field name, if applicable
    let pl = match.program.toLowerCase();
    if (match.field_name){
        document.querySelector(`#${pl}-intro .field-name-container`).style.display = "";
        document.querySelector(`#${pl}-intro .field-name`).innerHTML = match.field_name;
    }
    else{
        document.querySelector(`#${pl}-intro .field-name-container`).style.display = "none";
    }

    // set the team info
    if (match.program == "VRC"){
        if (!match.red_2 && !match.blue_2){
            // special case for WVSSAC Robotics events where eliminations are 1v1
            // https://www.wvroboticsalliance.org/programs/wvssac-robotics/rules
            setProgram("VEXU"); // the VEXU display looks like the VRC display, but with 1 team/alliance
            showVEXUTeamInfo("red", match.red_1, match.show_stats);
            showVEXUTeamInfo("blue", match.blue_1, match.show_stats);
        }
        else{
            showVRCTeamInfo("red1", match.red_1, match.show_stats);
            showVRCTeamInfo("red2", match.red_2, match.show_stats);
            showVRCTeamInfo("blue1", match.blue_1, match.show_stats);
            showVRCTeamInfo("blue2", match.blue_2, match.show_stats);
        }
    }
    else if (match.program == "RADC"){
        showRADCTeamInfo("red1", match.red_1, match.show_stats);
        showRADCTeamInfo("red2", match.red_2, match.show_stats);
        showRADCTeamInfo("blue1", match.blue_1, match.show_stats);
        showRADCTeamInfo("blue2", match.blue_2, match.show_stats);
    }
    else if (match.program == "VEXU"){
        showVEXUTeamInfo("red", match.red_1, match.show_stats);
        showVEXUTeamInfo("blue", match.blue_1, match.show_stats);
    }
    else if (match.program == "VIQC"){
        showVIQCTeamInfo("team1", match.team_1, match.show_stats, match.match_num);
        showVIQCTeamInfo("team2", match.team_2, match.show_stats, match.match_num);

        // if this is match F2 or later...
        if (match.match_num[0] == "F" && match.match_num[1] != "1"){
            // change the width of the intro to not obscure the "score to beat"
            document.querySelector("#viqc-intro").classList.add("iq-finals");
        }
        else{
            document.querySelector("#viqc-intro").classList.remove("iq-finals");
        }
    }

    // show the match prediction, if applicable
    if (match.prediction) {
        document.querySelector("#match-prediction").style.display = "";
        let red = round(match.prediction.red_win_probability, 1);
        let blue = round(100 - red, 1);
        document.querySelector("#match-prediction-bar-blue").style.width = `${blue}%`;
        document.querySelector("#match-prediction-bar-red").style.width = `${red}%`;
        document.querySelector("#match-prediction-bar-blue").innerHTML = `${blue}%`;
        document.querySelector("#match-prediction-bar-red").innerHTML = `${red}%`;
    }
    else{
        document.querySelector("#match-prediction").style.display = "none";
    }
}

/**
 * Show the correct intro object for the specified program
 * @param {String} program The program to show the intro for, or "none" to hide all
 */
function setProgram(program) {
    let vrc_intro = document.querySelector("#vrc-intro");
    let vexu_intro = document.querySelector("#vexu-intro");
    let viqc_intro = document.querySelector("#viqc-intro");
    let radc_intro = document.querySelector("#radc-intro");
    switch (program) {
        case "VRC":
            showElement(vrc_intro);
            hideElement(vexu_intro);
            hideElement(viqc_intro);
            hideElement(radc_intro);
            break;
        case "VEXU":
            hideElement(vrc_intro);
            showElement(vexu_intro);
            hideElement(viqc_intro);
            hideElement(radc_intro);
            break;
        case "VIQC":
            hideElement(vrc_intro);
            hideElement(vexu_intro);
            showElement(viqc_intro);
            hideElement(radc_intro);
            break;
        case "RADC":
            hideElement(vrc_intro);
            hideElement(vexu_intro);
            hideElement(viqc_intro);
            showElement(radc_intro);
            break;
        case "none":
        default:
            hideElement(vrc_intro);
            hideElement(vexu_intro);
            hideElement(viqc_intro);
            hideElement(radc_intro);
            break;
    }
}

function hideElement(element){
    element.style.bottom = `-${element.offsetHeight}px`;
}

function showElement(element){
    element.style.bottom = 0;
}

/**
 * Round a number to the specified number of decimal places
 * @param {Number} num The number to round
 * @param {Number} decimals The number of decimal places to round to
 * @returns {Number} The rounded number
 */
function round(num, decimals) {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}