const socket = io();

socket.on("match_queued", data => {
    console.log(data);
    showIntro(data);
})

socket.on("match_started", () => {
    // console.log("Match started");
    setProgram("none");
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
function showVRCTeamInfo(teamid, info){
    // show the team number/name/location
    document.querySelector(`#vrc-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#vrc-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#vrc-${teamid} .team-loc`).innerHTML = info.location;

    if (info.stats){
        // if we have team stats, show them
        document.querySelector(`#vrc-${teamid} .team-stats`).style.display = "";
        document.querySelectorAll("#vrc-intro .stats-header").forEach(h => h.style.display = "");
        document.querySelector(`#vrc-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#vrc-${teamid} .team-awp`).innerHTML = info.stats.awp_rate;
        document.querySelector(`#vrc-${teamid} .team-ap`).innerHTML = info.stats.avg_ap;
        document.querySelector(`#vrc-${teamid} .team-wlt`).innerHTML = info.stats.record;
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#vrc-${teamid} .team-stats`).style.display = "none";
        document.querySelectorAll("#vrc-intro .stats-header").forEach(h => h.style.display = "none");
        document.querySelector(`#vrc-${teamid} .team-bio`).style.width = "100%";
    }
}

/**
 * Populate the display with the info for a single VRC team
 * @param {String} teamid - "red1", "red2", "blue1", or "blue2"
 * @param {Object} info - object with team info
 */
function showRADCTeamInfo(teamid, info){
    // show the team number/name/location
    document.querySelector(`#radc-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#radc-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#radc-${teamid} .team-loc`).innerHTML = info.location;

    if (info.stats){
        // if we have team stats, show them
        document.querySelector(`#radc-${teamid} .team-stats`).style.display = "";
        document.querySelectorAll("#radc-intro .stats-header").forEach(h => h.style.display = "");
        document.querySelector(`#radc-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#radc-${teamid} .team-max`).innerHTML = info.stats.high_score;
        document.querySelector(`#radc-${teamid} .team-avg`).innerHTML = info.stats.avg_score;
        document.querySelector(`#radc-${teamid} .team-wlt`).innerHTML = info.stats.record;
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#radc-${teamid} .team-stats`).style.display = "none";
        document.querySelectorAll("#radc-intro .stats-header").forEach(h => h.style.display = "none");
        document.querySelector(`#radc-${teamid} .team-bio`).style.width = "100%";
    }
}

/**
 * Populate the display with info for a single VIQC team
 * @param {String} teamid - "team1" or "team2"
 * @param {Object} info - Object with team info
 */
function showVIQCTeamInfo(teamid, info){
    // show the team number/name/location
    document.querySelector(`#viqc-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#viqc-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#viqc-${teamid} .team-loc`).innerHTML = info.location;

    if (info.stats){
        // if we have team stats, show them
        document.querySelector(`#viqc-${teamid} .team-stats`).style.display = "";
        document.querySelectorAll("#viqc-intro .stats-header").forEach(h => h.style.display = "");
        document.querySelector(`#viqc-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#viqc-${teamid} .team-high`).innerHTML = info.stats.high_score;
        document.querySelector(`#viqc-${teamid} .team-avg`).innerHTML = info.stats.avg_score;
        document.querySelector(`#viqc-${teamid} .team-skills`).innerHTML = info.stats.max_d_skills;
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#viqc-${teamid} .team-stats`).style.display = "none";
        document.querySelectorAll("#viqc-intro .stats-header").forEach(h => h.style.display = "none");
        document.querySelector(`#viqc-${teamid} .team-bio`).style.width = "100%";
    }
}

/**
 * Populate the display with info for a single VEXU team
 * @param {*} teamid - "red" or "blue"
 * @param {*} info - object with team info
 */
function showVEXUTeamInfo(teamid, info){
    // show the team number/name/location
    document.querySelector(`#vexu-${teamid} .team-num`).innerHTML = info.number;
    document.querySelector(`#vexu-${teamid} .team-name`).innerHTML = info.name;
    document.querySelector(`#vexu-${teamid} .team-loc`).innerHTML = info.location;

    if (info.stats){
        // if we have team stats, show them
        document.querySelector(`#vexu-${teamid} .team-stats`).style.display = "";
        document.querySelectorAll("#vexu-intro .stats-header").forEach(h => h.style.display = "");
        document.querySelector(`#vexu-${teamid} .team-bio`).style.width = "";

        document.querySelector(`#vexu-${teamid} .team-awp`).innerHTML = info.stats.awp_rate;
        document.querySelector(`#vexu-${teamid} .team-ap`).innerHTML = info.stats.avg_ap;
        document.querySelector(`#vexu-${teamid} .team-wlt`).innerHTML = info.stats.record;
    }
    else{
        // if we don't have team stats, hide that area
        document.querySelector(`#vexu-${teamid} .team-stats`).style.display = "none";
        document.querySelectorAll("#vexu-intro .stats-header").forEach(h => h.style.display = "none");
        document.querySelector(`#vexu-${teamid} .team-bio`).style.width = "100%";
    }
}

/**
 * Show the intro for a particular match
 * @param {Object} match The match to show the intro for
 */
function showIntro(match) {
    setProgram(match.program);
    
    // set the team info
    if (match.program == "VRC"){
        showVRCTeamInfo("red1", match.red_1);
        showVRCTeamInfo("red2", match.red_2);
        showVRCTeamInfo("blue1", match.blue_1);
        showVRCTeamInfo("blue2", match.blue_2);
    }
    else if (match.program == "RADC"){
        showRADCTeamInfo("red1", match.red_1);
        showRADCTeamInfo("red2", match.red_2);
        showRADCTeamInfo("blue1", match.blue_1);
        showRADCTeamInfo("blue2", match.blue_2);
    }
    else if (match.program == "VEXU"){
        showVEXUTeamInfo("red", match.red_1);
        showVEXUTeamInfo("blue", match.blue_1);
    }
    else if (match.program == "VIQC"){
        showVIQCTeamInfo("team1", match.team_1);
        showVIQCTeamInfo("team2", match.team_2);

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
            vrc_intro.style.display = "";
            vexu_intro.style.display = "none";
            viqc_intro.style.display = "none";
            radc_intro.style.display = "none";
            break;
        case "VEXU":
            vrc_intro.style.display = "none";
            vexu_intro.style.display = "";
            viqc_intro.style.display = "none";
            radc_intro.style.display = "none";
            break;
        case "VIQC":
            vrc_intro.style.display = "none";
            vexu_intro.style.display = "none";
            viqc_intro.style.display = "";
            radc_intro.style.display = "none";
            break;
        case "RADC":
            vrc_intro.style.display = "none";
            vexu_intro.style.display = "none";
            viqc_intro.style.display = "none";
            radc_intro.style.display = "";
            break;
        case "none":
        default:
            vrc_intro.style.display = "none";
            vexu_intro.style.display = "none";
            viqc_intro.style.display = "none";
            radc_intro.style.display = "none";
            break;
    }
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