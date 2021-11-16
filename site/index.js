const socket = io();

socket.on("match_queued", data => {
    console.log(data);
    showIntro(data);
})

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
 * Show the intro for a particular match
 * @param {Object} match The match to show the intro for
 */
function showIntro(match) {
    setProgram(match.program);
    
    // set the team info
    if (match.program == "VRC"){
        document.querySelector("#vrc-red1").innerHTML = generateTeamHTML(match.red_1);
        document.querySelector("#vrc-red2").innerHTML = generateTeamHTML(match.red_2);
        document.querySelector("#vrc-blue1").innerHTML = generateTeamHTML(match.blue_1);
        document.querySelector("#vrc-blue2").innerHTML = generateTeamHTML(match.blue_2);
    }
    else if (match.program == "VEXU"){
        document.querySelector("#vexu-red").innerHTML = generateTeamHTML(match.red_1);
        document.querySelector("#vexu-blue").innerHTML = generateTeamHTML(match.blue_1);
    }
    else if (match.program == "VIQC"){
        document.querySelector("#viqc-team1").innerHTML = generateTeamHTML(match.team_1);
        document.querySelector("#viqc-team2").innerHTML = generateTeamHTML(match.team_2);
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
 * @param {String} program The program to show the intro for
 */
function setProgram(program) {
    let vrc_intro = document.querySelector("#vrc-intro");
    let vexu_intro = document.querySelector("#vexu-intro");
    let viqc_intro = document.querySelector("#viqc-intro");
    switch (program) {
        case "VRC":
            vrc_intro.style.display = "";
            vexu_intro.style.display = "none";
            viqc_intro.style.display = "none";
            break;
        case "VEXU":
            vrc_intro.style.display = "none";
            vexu_intro.style.display = "";
            viqc_intro.style.display = "none";
            break;
        case "VIQC":
            vrc_intro.style.display = "none";
            vexu_intro.style.display = "none";
            viqc_intro.style.display = "";
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