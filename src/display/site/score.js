const socket = io();

socket.on("match_saved", data => {
    console.log(data);
    switch(data.program){
        case "VIQC":
            populate_iq_score(data);
            break;
    }
});

function show_program(program){
    switch(program.toUpperCase()){
        case "VIQC":
            document.querySelector("#vrc-teams").style.display = "none";
            document.querySelector("#vexu-teams").style.display = "none";
            document.querySelector("#iq-teams").style.display = "";

            document.querySelector("#vs-score").style.display = "none";
            document.querySelector("#collab-score").style.display = "";
            break;
        case "VRC":
            document.querySelector("#vrc-teams").style.display = "";
            document.querySelector("#vexu-teams").style.display = "none";
            document.querySelector("#iq-teams").style.display = "none";

            document.querySelector("#vs-score").style.display = "";
            document.querySelector("#collab-score").style.display = "none";
            break;
        case "VEXU":
            document.querySelector("#vrc-teams").style.display = "none";
            document.querySelector("#vexu-teams").style.display = "";
            document.querySelector("#iq-teams").style.display = "none";

            document.querySelector("#vs-score").style.display = "";
            document.querySelector("#collab-score").style.display = "none";
            break;
    }
}

function populate_iq_score(match){
    show_program("VIQC");

    document.querySelector("#match-name").innerHTML = match.long_name;

    document.querySelector("#collab-score-value").innerHTML = match.scoring.score;

    document.querySelector("#iq-1 .rank").innerHTML = match.team_1.rank;
    document.querySelector("#iq-1 .team-num").innerHTML = match.team_1.number;
    document.querySelector("#iq-1 .team-name").innerHTML = match.team_1.name;
    document.querySelector("#iq-1 .team-loc").innerHTML = match.team_1.location;
    document.querySelector("#iq-1 .team-high").innerHTML = match.team_1.high_score;
    document.querySelector("#iq-1 .team-avg").innerHTML = match.team_1.avg_score;
    document.querySelector("#iq-1 .team-skills").innerHTML = match.team_1.high_driving ? match.team_1.high_driving : 0;

    document.querySelector("#iq-2 .rank").innerHTML = match.team_2.rank;
    document.querySelector("#iq-2 .team-num").innerHTML = match.team_2.number;
    document.querySelector("#iq-2 .team-name").innerHTML = match.team_2.name;
    document.querySelector("#iq-2 .team-loc").innerHTML = match.team_2.location;
    document.querySelector("#iq-2 .team-high").innerHTML = match.team_2.high_score;
    document.querySelector("#iq-2 .team-avg").innerHTML = match.team_2.avg_score;
    document.querySelector("#iq-2 .team-skills").innerHTML = match.team_2.high_driving ? match.team_2.high_driving : 0;
}