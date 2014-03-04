var canvas = document.getElementById("game");

var manifest = {
	"images": {
		"bg": "images/bg.png",
		"wall-1": "images/wall1.png",
		"wall-2": "images/wall2.png"
	},
	"sounds": {
	},
	"fonts": [
	],
	"animations": {
		"player-right":{
			"strip": "images/player.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"player-left":{
			"strip": "images/player.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"player-boost-right":{
			"strip": "images/playerboost.png",
			"frames": 1,
			"msPerFrame": 70, 
		},
		"player-boost-left":{
			"strip": "images/playerboost.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"wall-1-right": {
			"strip": "images/wall1.png",
			"frames": 1,
			"msPerFrame": 300
		},
		"wall-1-left": {
			"strip": "images/wall1.png",
			"frames": 1,
			"msPerFrame": 300,
			"flip": "horizontal"
		},
		"window-2-left": {
			"strip": "images/wall2.png",
			"frames": 1,
			"msPerFrame": 300
		},
		"window-2-right": {
			"strip": "images/wall2.png",
			"frames": 1,
			"msPerFrame": 300,
			"flip": "horizontal"
		},		
		"sign-left": {
			"strip": "images/smallsign.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"sign-right": {
			"strip": "images/smallsign.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"unit-left": {
			"strip": "images/acunit.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"unit-right": {
			"strip": "images/acunit.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		}
	}
}

var game = new Splat.Game(canvas, manifest);

var player;
var walls = [];
var obstacles = [];
var dead = false;
var waitingToStart = true;
var left = false;
var right = true;
var up = false;
var newBest = false;
var wallImages = ["wall-1"];
var windowImages = ["window-1"];
var bgY = 0;
var score = 0;
var best = 0;
var startPos = 0;
var meter = 1000;
var lastDirection;

function chooseWall(y, possibleWalls, isLeft) {
	var i = Math.random() * possibleWalls.length |0;
	var name = isLeft ? "-left" : "-right";
	var anim = game.animations.get(possibleWalls[i] + name);
	var x = 0;
	if (!isLeft) {
		x = canvas.width - anim.width;
	}
	var wall = new Splat.AnimatedEntity(x, y, anim.width, anim.height, anim, 0, 0);
	walls.push(wall);
}

function isWindow(entity) {
	if (!entity) {
		return false;
	}
	return entity.sprite.name.indexOf("window") > -1;
}

function wallIsBelowScreen(y) {
	return y > walls[0].y && y > walls[walls.length - 2].y;
}



var lastObstacle = false;
var i = 0;
function makeWall(y) {
	var hasObstacle = !lastObstacle;
	if (!hasObstacle) {
		i++;
	}
	if (i == 2) {
		hasObstacle = true;
		i = 0;
	}
	lastObstacle = hasObstacle;

	//var lastLeftWallIsWindow = isWindow(getLastLeftWall(y));
	//var lastRightWallIsWindow = isWindow(getLastRightWall(y));

	function getWindowImages(isLeft) {
		if ((isLeft /*&& lastLeftWallIsWindow*/) || (!isLeft /*&& lastRightWallIsWindow*/)) {
			return wallImages;
		}
		return Math.random() > 0.9 ? windowImages : wallImages;
	}
	if (hasObstacle) {
		var onRight = Math.random() > 0.5;
		chooseWall(y, onRight ? getWindowImages(true) : wallImages, true);
		chooseWall(y, onRight ? wallImages : getWindowImages(false), false);
		makeObstacle(onRight, y, getWindowImages);
	} else {
		chooseWall(y, getWindowImages(true), true);
		chooseWall(y, getWindowImages(false), false);
	}
}

function populateWallsDown(scene) {
	var wallH = game.animations.get("wall-1-left").height;
	if (walls.length == 0) {
		makeWall(scene.camera.y);
	}
	while (walls[0].y < scene.camera.y + scene.camera.height) {
		makeWall(walls[0].y + wallH);
		walls.unshift(walls.pop());
		walls.unshift(walls.pop());
	}
	while (walls[walls.length - 1].y + walls[walls.length - 1].height < scene.camera.y) {
		walls.pop();
	}
	obstacles = [];
}



function makeObstacle(onRight, y, getWindowImages) {
	var img;
	var obstacle;

	var wallImg = game.animations.get("wall-1-left");
	var x = wallImg.width - 8;
	if (Math.random() > 0.5) {
		img = game.animations.get(onRight ? "sign-right" : "sign-left");
		if (onRight) {
			obstacle = new Splat.AnimatedEntity(canvas.width - wallImg.width - img.width + 8 + 4, y + 10, 8, 211, img, -4, -10);
		} else {
			obstacle = new Splat.AnimatedEntity(x + 29, y + 10, 8, 211, img, -29, -10);
		}
	} else {
		img = game.animations.get(onRight ? "unit-right" : "unit-left");
		obstacle = new Splat.AnimatedEntity(x, y, img.width, img.height, img, 0, 0);
		if (onRight) {
			obstacle.x = canvas.width - wallImg.width - img.width + 8;
		}
	}
	obstacles.push(obstacle);
}

function setBest(b) {
	best = b;
	var expire = new Date();
	expire.setTime(expire.getTime() + 1000 * 60 * 60 * 24 * 365);
	var cookie = "bestScore=" + best + "; expires=" + expire.toUTCString() + ";";
	document.cookie = cookie;
}

function anythingWasPressed() {
	return game.keyboard.isPressed("left") || game.keyboard.isPressed("right") || game.keyboard.isPressed("up"); //|| game.mouse.buttons[0];
}

game.scenes.add("title", new Splat.Scene(canvas, function() {
	walls = []
	obstacles = [];
	waitingToStart = true;
	dead = false;
	this.camera.y = 0;
	score = 0;
	meter = 1000;
	newBest = false;

	var playerImg = game.animations.get("player-right");
	player = new Splat.AnimatedEntity(canvas.width / 2, canvas.height / 10, 40, 100, playerImg, 0, 0);

}, function(elapsedMillis) {
	if(waitingToStart){
		this.camera.vy = player.vy;
		player.vy = 0.5;
		if(anythingWasPressed()){
			startPos = player.y;
			waitingToStart = false;
		}
	}
	if (!waitingToStart) {
		player.vy += elapsedMillis * 0.00007;
	}

	//scoring
	if(!waitingToStart) {
		score = Math.round((player.y - startPos) / 300);
		if (score > best) {
			setBest(score);
			newBest = true;
		}
	}

	if (player.vy < 0){
		player.vy = 0;
	}
	populateWallsDown(this);

	this.camera.vy = player.vy;
	player.move(elapsedMillis);

	//move keys
	if (game.keyboard.isPressed("left")) {
		left = true;
		right = false;
		lastDirection = "left";
		meter -= 1;
		player.vx = -.7;
	}
	if (game.keyboard.isPressed("right")) {
		right = true;
		left = false;
		meter -= 1;
		lastDirection = "right";
		player.vx = .7;
	}
	if (game.keyboard.isPressed("up")) {
		player.vy -= .003;
		meter -= 2;
		up = true;
	}
	if (!game.keyboard.isPressed("left") && !game.keyboard.isPressed("right")) {
		player.vx = 0;
	}

	//run out of meter
	if (meter <= 0) {
		dead = true;
	}

	if (dead) {
		player.vx = 0;
		player.vy = 0;
		var ftb = this.timer("fade to black");
		if (ftb > 800) {
			this.stopTimer("fade to black");
			game.scenes.switchTo("title");
		}
		if (!ftb) {
			this.startTimer("fade to black");
		}
	}


	//movement
	if (left) {
		player.sprite = game.animations.get("player-left");
	} else if (right){
		player.sprite = game.animations.get("player-right");
	}
	if (up){
		if(left) {
			player.sprite = game.animations.get("player-boost-left");
		} else if (right) {
			player.sprite = game.animations.get("player-boost-right");
		}
		up = false;
	}

	bgY -= this.camera.vy / 1.5 * elapsedMillis;
	var bgH = game.images.get("bg").height;
	if (bgY > bgH) {
		bgY -= bgH;
	}	

	for (var i = 0; i < walls.length; i++) {
		var wall = walls[i];
		var playervx = player.vx
		if (player.collides(wall)) {
			meter -= 100;
			player.x = canvas.width /2; 
		}
	}
}, function(context) {
	this.camera.drawAbsolute(context, function() {
	var bg = game.images.get("bg");
	for (var y = bgY - bg.height; y <= canvas.height; y += bg.height)  {
		y = y |0;
		context.drawImage(bg, 0, y);
	}
	});;

	var wallW = game.animations.get("wall-1-left").width;
	var meterW = canvas.width - wallW * 2;
	context.fillStyle = "#BADA55"
	context.fillRect(wallW, this.camera.y + 10, meterW * (meter / 1000), 30);

	for (var i = 0; i < walls.length; i++) {
		walls[i].draw(context);
	}
	for (var i = 0; i < obstacles.length; i++) {
		obstacles[i].draw(context);
	}

	player.draw(context);

	this.camera.drawAbsolute(context, function(){	
		context.font = "75px consolas"
		context.fillStyle = "#FFFFFF"
		context.fillText(score, 100, 100);
	})

	var ftb = this.timer("fade to black");
	if (ftb > 0) {
		var opacity = ftb / 300;
		context.fillStyle = "rgba(0, 0, 0, " + opacity + ")";
		context.fillRect(this.camera.x, this.camera.y, canvas.width, canvas.height);

		this.camera.drawAbsolute(context, function() {
			context.fillStyle = "#ffffff";
			context.font = "50px pixelade";
			context.fillText("SCORE", 0, 300);
			context.font = "100px pixelade";
			context.fillText(score, 0, 400);

			context.font = "50px pixelade";
			if (newBest) {
				context.fillStyle = "rgba(0, 150, 0, 1)";
				context.fillText("NEW BEST!", 0, 600);
			} else {
				context.fillText("BEST", 0, 600);
			}

			context.font = "100px pixelade";
			context.fillText(best, 0, 700);
		});
		return;
	}

}));
game.scenes.switchTo("loading");