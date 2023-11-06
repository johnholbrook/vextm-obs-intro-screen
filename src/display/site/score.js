const socket = io();

socket.on("match_saved", data => {
    console.log(data);
    switch(data.program){
        case "VIQC":
            populate_iq_score(data);
            break;
        case "VRC":
            populate_vrc_score(data);
            break;
        case "VEXU":
            populate_vexu_score(data);
            break;
        case "RADC":
            populate_radc_score(data);
            break;
    }
});

function show_program(program){
    switch(program.toUpperCase()){
        case "VIQC":
            document.querySelector("#vrc-teams").style.display = "none";
            document.querySelector("#vexu-teams").style.display = "none";
            document.querySelector("#iq-teams").style.display = "";
            document.querySelector("#radc-teams").style.display = "none";

            document.querySelector("#vs-score").style.display = "none";
            document.querySelector("#collab-score").style.display = "";

            document.querySelector("#collab-score-value").classList.add("blue");
            document.querySelector("#collab-score-value").classList.remove("grey");
            break;
        case "VRC":
            document.querySelector("#vrc-teams").style.display = "";
            document.querySelector("#vexu-teams").style.display = "none";
            document.querySelector("#iq-teams").style.display = "none";
            document.querySelector("#radc-teams").style.display = "none";

            document.querySelector("#vs-score").style.display = "";
            document.querySelector("#collab-score").style.display = "none";
            break;
        case "VEXU":
            document.querySelector("#vrc-teams").style.display = "none";
            document.querySelector("#vexu-teams").style.display = "";
            document.querySelector("#iq-teams").style.display = "none";
            document.querySelector("#radc-teams").style.display = "none";

            document.querySelector("#vs-score").style.display = "";
            document.querySelector("#collab-score").style.display = "none";
            break;
        case "RADC":
            document.querySelector("#vrc-teams").style.display = "none";
            document.querySelector("#vexu-teams").style.display = "none";
            document.querySelector("#iq-teams").style.display = "none";
            document.querySelector("#radc-teams").style.display = "";

            document.querySelector("#vs-score").style.display = "none";
            document.querySelector("#collab-score").style.display = "";

            document.querySelector("#collab-score-value").classList.remove("blue");
            document.querySelector("#collab-score-value").classList.add("grey");
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

    // hide teams ranks for finals matches
    if (match.match_num[0] == "F"){
        document.querySelector("#iq-1 .rank-area").style.display = "none";
        document.querySelector("#iq-2 .rank-area").style.display = "none";
    }
    else{
        document.querySelector("#iq-1 .rank-area").style.display = "";
        document.querySelector("#iq-2 .rank-area").style.display = "";
    }
}

function populate_vrc_score(match){
    show_program("VRC");

    document.querySelector("#match-name").innerHTML = match.long_name;

    document.querySelector("#red-score").innerHTML = match.scoring.red_score;
    document.querySelector("#blue-score").innerHTML = match.scoring.blue_score;

    document.querySelector("#vrc-red1 .rank").innerHTML = match.red_1.rank;
    document.querySelector("#vrc-red1 .wlt").innerHTML = match.red_1.wlt;
    document.querySelector("#vrc-red1 .team-num").innerHTML = match.red_1.number;
    document.querySelector("#vrc-red1 .team-name").innerHTML = match.red_1.name;
    document.querySelector("#vrc-red1 .team-loc").innerHTML = match.red_1.location;
    document.querySelector("#vrc-red1 .team-wp").innerHTML = match.red_1.wp;
    document.querySelector("#vrc-red1 .team-awp").innerHTML = match.red_1.awp_rate;
    document.querySelector("#vrc-red1 .team-auto-rate").innerHTML = match.red_1.auto_win_rate; 

    document.querySelector("#vrc-red2 .rank").innerHTML = match.red_2.rank;
    document.querySelector("#vrc-red2 .wlt").innerHTML = match.red_2.wlt;
    document.querySelector("#vrc-red2 .team-num").innerHTML = match.red_2.number;
    document.querySelector("#vrc-red2 .team-name").innerHTML = match.red_2.name;
    document.querySelector("#vrc-red2 .team-loc").innerHTML = match.red_2.location;
    document.querySelector("#vrc-red2 .team-wp").innerHTML = match.red_2.wp;
    document.querySelector("#vrc-red2 .team-awp").innerHTML = match.red_2.awp_rate;
    document.querySelector("#vrc-red2 .team-auto-rate").innerHTML = match.red_2.auto_win_rate;

    document.querySelector("#vrc-blue1 .rank").innerHTML = match.blue_1.rank;
    document.querySelector("#vrc-blue1 .wlt").innerHTML = match.blue_1.wlt;
    document.querySelector("#vrc-blue1 .team-num").innerHTML = match.blue_1.number;
    document.querySelector("#vrc-blue1 .team-name").innerHTML = match.blue_1.name;
    document.querySelector("#vrc-blue1 .team-loc").innerHTML = match.blue_1.location;
    document.querySelector("#vrc-blue1 .team-wp").innerHTML = match.blue_1.wp;
    document.querySelector("#vrc-blue1 .team-awp").innerHTML = match.blue_1.awp_rate;
    document.querySelector("#vrc-blue1 .team-auto-rate").innerHTML = match.blue_1.auto_win_rate; 

    document.querySelector("#vrc-blue2 .rank").innerHTML = match.blue_2.rank;
    document.querySelector("#vrc-blue2 .wlt").innerHTML = match.blue_2.wlt;
    document.querySelector("#vrc-blue2 .team-num").innerHTML = match.blue_2.number;
    document.querySelector("#vrc-blue2 .team-name").innerHTML = match.blue_2.name;
    document.querySelector("#vrc-blue2 .team-loc").innerHTML = match.blue_2.location;
    document.querySelector("#vrc-blue2 .team-wp").innerHTML = match.blue_2.wp;
    document.querySelector("#vrc-blue2 .team-awp").innerHTML = match.blue_2.awp_rate;
    document.querySelector("#vrc-blue2 .team-auto-rate").innerHTML = match.blue_2.auto_win_rate; 

    if (match.red_1.seed){
        // this is an elimination match show alliance seeds rather than team ranks
        document.querySelector("#vrc-red1 .rank-area").style.display = "none";
        document.querySelector("#vrc-red2 .rank-area").style.display = "none";
        document.querySelector("#vrc-blue1 .rank-area").style.display = "none";
        document.querySelector("#vrc-blue2 .rank-area").style.display = "none";

        document.querySelector("#vrc-red-seed-area").style.display = "";
        document.querySelector("#vrc-blue-seed-area").style.display = "";

        document.querySelector("#vrc-red-seed").innerHTML = match.red_1.seed;
        document.querySelector("#vrc-blue-seed").innerHTML = match.blue_1.seed;
    }
    else{
        document.querySelector("#vrc-red1 .rank-area").style.display = "";
        document.querySelector("#vrc-red2 .rank-area").style.display = "";
        document.querySelector("#vrc-blue1 .rank-area").style.display = "";
        document.querySelector("#vrc-blue2 .rank-area").style.display = "";

        document.querySelector("#vrc-red-seed-area").style.display = "none";
        document.querySelector("#vrc-blue-seed-area").style.display = "none";
    }
}

function populate_vexu_score(match){
    show_program("VEXU")

    document.querySelector("#match-name").innerHTML = match.long_name;

    document.querySelector("#red-score").innerHTML = match.scoring.red_score;
    document.querySelector("#blue-score").innerHTML = match.scoring.blue_score;

    document.querySelector("#vexu-red .rank").innerHTML = match.red_1.rank;
    document.querySelector("#vexu-red .wlt").innerHTML = match.red_1.wlt;
    document.querySelector("#vexu-red .team-num").innerHTML = match.red_1.number;
    document.querySelector("#vexu-red .team-name").innerHTML = match.red_1.name;
    document.querySelector("#vexu-red .team-loc").innerHTML = match.red_1.location;
    document.querySelector("#vexu-red .team-wp").innerHTML = match.red_1.wp;
    document.querySelector("#vexu-red .team-awp").innerHTML = match.red_1.awp_rate;
    document.querySelector("#vexu-red .team-auto-rate").innerHTML = match.red_1.auto_win_rate;
    
    document.querySelector("#vexu-blue .rank").innerHTML = match.blue_1.rank;
    document.querySelector("#vexu-blue .wlt").innerHTML = match.blue_1.wlt;
    document.querySelector("#vexu-blue .team-num").innerHTML = match.blue_1.number;
    document.querySelector("#vexu-blue .team-name").innerHTML = match.blue_1.name;
    document.querySelector("#vexu-blue .team-loc").innerHTML = match.blue_1.location;
    document.querySelector("#vexu-blue .team-wp").innerHTML = match.blue_1.wp;
    document.querySelector("#vexu-blue .team-awp").innerHTML = match.blue_1.awp_rate;
    document.querySelector("#vexu-blue .team-auto-rate").innerHTML = match.blue_1.auto_win_rate;

    if (match.red_1.seed){
        // this is an elimination match' show alliance seeds rather than team ranks
        document.querySelector("#vexu-red .rank-area").style.display = "none";
        document.querySelector("#vexu-blue .rank-area").style.display = "none";
        
        document.querySelector("#vexu-red-seed-area").style.display = "";
        document.querySelector("#vexu-blue-seed-area").style.display = "";

        document.querySelector("#vexu-red-seed").innerHTML = match.red_1.seed;
        document.querySelector("#vexu-blue-seed").innerHTML = match.blue_1.seed;
    }
    else{
        document.querySelector("#vexu-red .rank-area").style.display = "";
        document.querySelector("#vexu-blue .rank-area").style.display = "";

        document.querySelector("#vexu-red-seed-area").style.display = "none";
        document.querySelector("#vexu-blue-seed-area").style.display = "none";
    }
}

function populate_radc_score(match){
    show_program("RADC");

    document.querySelector("#match-name").innerHTML = match.long_name;

    document.querySelector("#collab-score-value").innerHTML = match.scoring.score;

    document.querySelector("#radc-red .rank").innerHTML = match.red.rank;
    document.querySelector("#radc-red .team-num").innerHTML = match.red.number;
    document.querySelector("#radc-red .team-name").innerHTML = match.red.name;
    document.querySelector("#radc-red .team-loc").innerHTML = match.red.location;
    document.querySelector("#radc-red .team-max").innerHTML = match.red.high_score;
    document.querySelector("#radc-red .team-avg").innerHTML = match.red.avg_score;

    document.querySelector("#radc-blue .rank").innerHTML = match.blue.rank;
    document.querySelector("#radc-blue .team-num").innerHTML = match.blue.number;
    document.querySelector("#radc-blue .team-name").innerHTML = match.blue.name;
    document.querySelector("#radc-blue .team-loc").innerHTML = match.blue.location;
    document.querySelector("#radc-blue .team-max").innerHTML = match.blue.high_score;
    document.querySelector("#radc-blue .team-avg").innerHTML = match.blue.avg_score;

    // hide teams ranks for elim matches
    if (match.match_num[0] == "S" || match.match_num[0] == "F" || match.match_num.slice(0, 2) == "QF"){
        document.querySelector("#radc-red .rank-area").style.display = "none";
        document.querySelector("#radc-blue .rank-area").style.display = "none";
    }
    else{
        document.querySelector("#radc-red .rank-area").style.display = "";
        document.querySelector("#radc-blue .rank-area").style.display = "";
    }
}