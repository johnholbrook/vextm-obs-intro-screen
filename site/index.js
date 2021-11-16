const socket = io();

socket.on("match_queued", data => {
    console.log(data);
})