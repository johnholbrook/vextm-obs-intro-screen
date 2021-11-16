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