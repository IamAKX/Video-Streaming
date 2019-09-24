const path = require("path");
const express = require("./node_modules/express");
const http = require("http");
const WebSocket = require("./node_modules/ws");
const app = express();
const httpServer = http.createServer(app);
var fs = require("fs");
var location = require("location-href");
const PORT = process.env.PORT || 3000;

const wsServer = new WebSocket.Server({ server: httpServer }, () =>
	console.log(`WS server is listening at ws://localhost:${WS_PORT}`)
);

// array of connected websocket clients
let connectedClients = [];

wsServer.on("connection", (ws, req) => {
	var webcamData = { webcamData: [] };
	var allowWrite = true;

	console.log("Connected");
	connectedClients.push(ws);
	ws.on("message", data => {
		var currentTime = new Date();
		var currentOffset = currentTime.getTimezoneOffset();
		var ISTOffset = 330; // IST offset UTC +5:30
		var now = new Date(
			currentTime.getTime() + (ISTOffset + currentOffset) * 60000
		);

		var currentSecond = now.getSeconds();
		var currentMinute = now.getMinutes();

		connectedClients.forEach((ws, i) => {
			var fileName = "";
			var timeStamp = now
				.toISOString()
				.replace(/T/, " ")
				.replace(/\..+/, "");

			if (currentMinute % 2 == 0) {
				fileName = "even_timestamp_data.json";
			} else {
				fileName = "odd_timestamp_data.json";
			}
			if (ws.readyState === ws.OPEN) {
				// check if it is still connected

				if (currentSecond % 10 == 0 && allowWrite == true) {
					webcamData.webcamData.push({
						timeStamp: timeStamp,
						base64: data
					});
					fs.writeFile(
						fileName,
						JSON.stringify(webcamData, null, "\t"),
						function(err) {
							if (err) throw err;
						}
					);
					console.log(
						fileName,
						timeStamp,
						webcamData.webcamData.length,
						"\n",
						"\n"
					);
					allowWrite = false;
				} else if (currentSecond % 10 != 0) {
					allowWrite = true;
					if (currentSecond == 59) webcamData.webcamData = [];
				}
				ws.send(data); // send
			} else {
				// if it's not connected remove from the array of connected ws
				connectedClients.splice(i, 1);
				//
				console.log("Dead", location());
			}
		});
	});
});

// HTTP stuff
app.get("/even", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./even_timestamp_data.json"))
);

app.get("/odd", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./odd_timestamp_data.json"))
);

app.get("/client", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./client.html"))
);
app.get("/streamer", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./streamer.html"))
);

app.get("/keyboard", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./keyboard.html"))
);

app.get("/mouse", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./mouse.html"))
);

app.get("/audio", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./audio.html"))
);

app.get("/location", (req, res) =>
	res.sendFile(path.resolve(__dirname, "./location.html"))
);

app.get("/", (req, res) => {
	res.send(`
        <a href="streamer">Streamer</a><br>
		<a href="client">Client</a><br>
		<hr>
		<a href="keyboard">keyboard</a><br>
		<a href="mouse">mouse</a><br>
		<a href="audio">audio</a><br>
		<a href="location">location</a><br>
    `);
});

httpServer.listen(PORT, () =>
	console.log(`HTTP server listening at http://localhost:${PORT}`)
);
