const socket = io();

let bio_line1_height = 0;
document.addEventListener("DOMContentLoaded", () => {
    show_program("VRC");
    setTimeout(() => {
        bio_line1_height = document.querySelector("#vrc-red1 .bio-line1").offsetHeight;
        console.log(bio_line1_height);
    }, 100);
});

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

function fill_team_bio(id, num, name, loc){
    document.querySelector(`#${id} .team-num`).innerHTML = num;
    document.querySelector(`#${id} .team-name`).innerHTML = name;
    document.querySelector(`#${id} .team-loc`).innerHTML = loc;

    if (document.querySelector(`#${id} .bio-line1`).offsetHeight > bio_line1_height){
        // name wraps due to length, make it a marquee
        document.querySelector(`#${id} .team-name`).innerHTML = `<marquee scrollamount="4">${`${name}<span class="px-4"></span>`.repeat(100)}</marquee>`;
        let bio_width = document.querySelector(`#${id} .team-bio`).offsetWidth;
        let num_width = document.querySelector(`#${id} .team-num`).offsetWidth;
        // console.log(bio_width, num_width);
        document.querySelector(`#${id} .team-name marquee`).style.maxWidth = `${(bio_width - num_width)*0.95}px` 
    }
}

function populate_iq_score(match){
    show_program("VIQC");

    document.querySelector("#match-name").innerHTML = match.long_name;

    document.querySelector("#collab-score-value").innerHTML = match.scoring.score;

    document.querySelector("#iq-1 .rank").innerHTML = match.team_1.rank;
    fill_team_bio("iq-1", match.team_1.number, match.team_1.name, match.team_1.location);
    document.querySelector("#iq-1 .team-high").innerHTML = match.team_1.high_score;
    document.querySelector("#iq-1 .team-avg").innerHTML = match.team_1.avg_score;
    document.querySelector("#iq-1 .team-skills").innerHTML = match.team_1.high_driving ? match.team_1.high_driving : 0;

    document.querySelector("#iq-2 .rank").innerHTML = match.team_2.rank;
    fill_team_bio("iq-2", match.team_2.number, match.team_2.name, match.team_2.location);
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
    fill_team_bio("vrc-red1", match.red_1.number, match.red_1.name, match.red_1.location);
    document.querySelector("#vrc-red1 .team-wp").innerHTML = match.red_1.wp;
    document.querySelector("#vrc-red1 .team-awp").innerHTML = match.red_1.awp_rate;
    document.querySelector("#vrc-red1 .team-auto-rate").innerHTML = match.red_1.auto_win_rate; 

    document.querySelector("#vrc-red2 .rank").innerHTML = match.red_2.rank;
    document.querySelector("#vrc-red2 .wlt").innerHTML = match.red_2.wlt;
    fill_team_bio("vrc-red2", match.red_2.number, match.red_2.name, match.red_2.location);
    document.querySelector("#vrc-red2 .team-wp").innerHTML = match.red_2.wp;
    document.querySelector("#vrc-red2 .team-awp").innerHTML = match.red_2.awp_rate;
    document.querySelector("#vrc-red2 .team-auto-rate").innerHTML = match.red_2.auto_win_rate;

    document.querySelector("#vrc-blue1 .rank").innerHTML = match.blue_1.rank;
    document.querySelector("#vrc-blue1 .wlt").innerHTML = match.blue_1.wlt;
    fill_team_bio("vrc-blue1", match.blue_1.number, match.blue_1.name, match.blue_1.location);
    document.querySelector("#vrc-blue1 .team-wp").innerHTML = match.blue_1.wp;
    document.querySelector("#vrc-blue1 .team-awp").innerHTML = match.blue_1.awp_rate;
    document.querySelector("#vrc-blue1 .team-auto-rate").innerHTML = match.blue_1.auto_win_rate; 

    document.querySelector("#vrc-blue2 .rank").innerHTML = match.blue_2.rank;
    document.querySelector("#vrc-blue2 .wlt").innerHTML = match.blue_2.wlt;
    fill_team_bio("vrc-blue2", match.blue_2.number, match.blue_2.name, match.blue_2.location);
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
    fill_team_bio("vexu-red", match.red_1.number, match.red_1.name, match.red_1.location);
    document.querySelector("#vexu-red .team-wp").innerHTML = match.red_1.wp;
    document.querySelector("#vexu-red .team-awp").innerHTML = match.red_1.awp_rate;
    document.querySelector("#vexu-red .team-auto-rate").innerHTML = match.red_1.auto_win_rate;
    
    document.querySelector("#vexu-blue .rank").innerHTML = match.blue_1.rank;
    document.querySelector("#vexu-blue .wlt").innerHTML = match.blue_1.wlt;
    fill_team_bio("vexu-blue", match.blue_1.number, match.blue_1.name, match.blue_1.location);
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
    fill_team_bio("radc-red", match.red.number, match.red.name, match.red.location);
    document.querySelector("#radc-red .team-max").innerHTML = match.red.high_score;
    document.querySelector("#radc-red .team-avg").innerHTML = match.red.avg_score;

    document.querySelector("#radc-blue .rank").innerHTML = match.blue.rank;
    fill_team_bio("radc-blue", match.blue.number, match.blue.name, match.blue.location);
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