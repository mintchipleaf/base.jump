// Hello.
//
// This is JSHint, a tool that helps to detect errors and potential
// problems in your JavaScript code.
//
// To start, simply enter some JavaScript anywhere on this page. Your
// report will appear on the right side.
//
// Additionally, you can toggle specific options in the Configure
// menu.

function main() {
  return 'Hello, World!';
}

main();var canvas = document.getElementById("game");

var manifest = {
	"images": {
		"bg": "images/bg.png",
		"wall-1": "images/wall1.png",
		"wall-2": "images/wall2.png"
	},
	"sounds": {
		"pickup1": "sounds/pickup1.wav",
		"pickup2": "sounds/pickup2.wav",
		"pickup3": "sounds/pickup3.wav",
		"pickup4": "sounds/pickup4.wav",
		"hit": "sounds/hit.wav",
		"wall": "sounds/wall.wav",
		"music": "sounds/Multifaros-The_Factory.mp3"
	},
	"fonts": [
		"pixelade"
	],
	"animations": {
		"player":{
			"strip": "images/player.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"player-l": {
			"strip": "images/player.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"player-right":{
			"strip": "images/player-side.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"player-left":{
			"strip": "images/player-side.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"player-boost":{
			"strip": "images/playerboost.png",
			"frames": 1,
			"msPerFrame": 70 
		},
		"player-boost-l":{
			"strip": "images/playerboost.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal" 
		},
		"player-boost-right":{
			"strip": "images/playerboost-side.png",
			"frames": 1,
			"msPerFrame": 70 
		},
		"player-boost-left":{
			"strip": "images/playerboost-side.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"smoke":{
			"strip": "images/smoke.png",
			"frames": 4,
			"msPerFrame": 100
		},
		"hud":{
			"strip": "images/hud.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"wall-1-right": {
			"strip": "images/wall-right.png",
			"frames": 1,
			"msPerFrame": 300
		},
		"wall-1-left": {
			"strip": "images/wall-left.png",
			"frames": 1,
			"msPerFrame": 300
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
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"sign-right": {
			"strip": "images/smallsign.png",
			"frames": 1,
			"msPerFrame": 70
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
		},
		"billboard-left": {
			"strip": "images/billboard.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"billboard-right": {
			"strip": "images/billboard.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"float-left": {
			"strip": "images/float.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"float-right": {
			"strip": "images/float.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},
		"car-left": {
			"strip": "images/car.png",
			"frames": 1,
			"msPerFrame": 70
		},
		"car-right": {
			"strip": "images/car.png",
			"frames": 1,
			"msPerFrame": 70,
			"flip": "horizontal"
		},		
		"pickup": {
			"strip": "images/pickup.png",
			"frames": 1,
			"msPerFrame": 70
		}
	}
};

var game = new Splat.Game(canvas, manifest);

var player;
var walls = [];
var obstacles = [];
var pickups = [];
var smokes = [];
var dead = false;
var waitingToStart = true;
var newStart = true;
var left = false;
var right = true;
var up = false;
var newBest = false;
var collidesound = false;
var musicTimer;
var color;
var wallImages = ["wall-1"];
var windowImages = ["window-1"];
var pickupSounds = ["pickup1", "pickup2", "pickup3", "pickup4"];
var bgY = 0;
var score = 0;
var best = 0;
var speed = 0;
var startPos = 0;
var meter = 1000;
var lastDirection;
var tilt = 0;

window.addEventListener('deviceorientation', function(event) {
	tilt = event.gamma;
});	


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

function getLastLeftWall(y) {
	if (walls.length > 1) {
		return wallIsBelowScreen(y) ? walls[0] : walls[walls.length - 2];
	}
}

function getLastRightWall(y) {
	if (walls.length > 1) {
		return wallIsBelowScreen(y) ? walls[1] : walls[walls.length - 1];
	}
}

function makeObstacle(onRight, y, getWindowImages) {
	var img;
	var obstacle;

	var wallImg = game.animations.get("wall-1-left");
	var x = wallImg.width - 40;
	if (Math.random() > 0.6 || waitingToStart) {
		img = game.animations.get(onRight ? "sign-right" : "sign-left");
		if (onRight) {
			obstacle = new Splat.AnimatedEntity(canvas.width - wallImg.width - img.width + 40, y + 10, 8, 211, img, -4, -10);
		} else {
			obstacle = new Splat.AnimatedEntity(x, y + 10, 8, 211, img, -29, -10);
		}
	} else if (Math.random() > 0.4) {
		img = game.animations.get(onRight ? "float-right" : "float-left");
		obstacle = new Splat.AnimatedEntity((canvas.width / 2 * Math.random()) + wallImg.width, y, img.width, img.height, img, 0, 0);
		if (onRight) {	
			obstacle.x = (canvas.width / 2 * Math.random()) + (canvas.width / 2) - wallImg.width;
		}
	} else if (Math.random() > 0.5) {
		img = game.animations.get(onRight ? "billboard-right" : "billboard-left");
		obstacle = new Splat.AnimatedEntity(x, y, img.width, img.height, img, 0, 0);
		if (onRight) {
			obstacle.x = canvas.width - wallImg.width - img.width + 40;
		}
	} else {
		img = game.animations.get(onRight ? "car-right" : "car-left");
		obstacle = new Splat.AnimatedEntity(0 - img.width, y, img.width, img.height, img, 0, 0);
		obstacle.vx = 0.3 + Math.random();
		if (onRight) {
			obstacle.x = canvas.width;
			obstacle.vx = -0.3 - Math.random();
		}
	}
	/*else {
		img = game.animations.get(onRight ? "billboard-right" : "billboard-left");
		obstacle = new Splat.AnimatedEntity(x, y, img.width, img.height, img, 0, 0);
		if (onRight) {
			obstacle.x = canvas.width - wallImg.width - img.width + 8;
		}
	}*/
	obstacles.push(obstacle);
}

var lastObstacle = false;
var i = 0;
function makeWall(y) {
	var hasObstacle = !lastObstacle;
	if (!hasObstacle) {
		i++;
	}
	if (i == 4) {
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
	if (walls.length === 0) {
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
	//obstacles = [];
}

function addPickups(scene) {
	var lastPickup = pickups[pickups.length - 1];
	var nextPickupY = scene.camera.y + scene.camera.height;
	var wallImg = game.animations.get("wall-1-left");
	var img = game.animations.get("pickup");
	var maxLeft = wallImg.width;
	var maxRight = canvas.width - wallImg.width - img.width;
	var nextPickupX = Math.random() * canvas.width;
	var placePickup = false;
	var pickupChance = Math.random();

	if (!lastPickup) {
		placePickup = true;
	} if(lastPickup) {
		if (pickupChance > 0.5) { 
			nextPickupY += 800;
		} else {
			nextPickupY += 800;
			placePickup = true;
		}
		if (lastPickup.y > scene.camera.y || nextPickupX > maxRight || nextPickupX < maxLeft ) {
			placePickup = false;
		}
	} if (placePickup) {
		var pickup = new Splat.AnimatedEntity(nextPickupX, nextPickupY, img.width, img.height, img, 0, 0);
		pickups.push(pickup);
	}
}

function makeSmoke(scene) {
	var img = game.animations.get("smoke");
	var lastSmoke = smokes[smokes.length - 1];
	var nextSmokeY = player.y;
	var nextSmokeX = player.x;

	if (!lastSmoke || lastSmoke.y < player.y + img.height) {
		var smoke = new Splat.AnimatedEntity(nextSmokeX, nextSmokeY, img.width, img.height, img, 0, 0);
		smokes.push(smoke);
	}
}

function setBest(b) {
	best = b;
	var expire = new Date();
	expire.setTime(expire.getTime() + 1000 * 60 * 60 * 24 * 365);
	var cookie = "bestScore=" + best + "; expires=" + expire.toUTCString() + ";";
	document.cookie = cookie;
}

function anythingWasPressed() {
	return game.keyboard.isPressed("left") || game.keyboard.isPressed("right") || game.keyboard.isPressed("up") || game.mouse.buttons[0];
}

/*game.scenes.add("title", new Splat.Scene(canvas, function() {
	}, function(elapsedMillis) {
		//game.sounds.play("music", true);
		game.scenes.switchTo("main");
	}, function(context) {

}));*/

game.scenes.add("title", new Splat.Scene(canvas, function() {
	walls = [];
	obstacles = [];
	smoke = [];
	waitingToStart = true;
	dead = false;
	this.camera.y = 0;
	score = 0;
	speed = 0;
	meter = 1000;
	newBest = false;
	collidesound = false;
	this.startTimer("start");

	var playerImg = game.animations.get("player-right");
	player = new Splat.AnimatedEntity(canvas.width / 2, 100, 61, 96, playerImg, -49, -19);

}, function(elapsedMillis) {
	if(newStart){
		var startTimer = this.timer("start");
		this.camera.vy = player.vy;
		player.vy = 1;
		if(startTimer > 100 && anythingWasPressed()){
			game.sounds.play("music", true);
			this.stopTimer("start");
			startPos = player.y;
			newStart = false;
			waitingToStart = false;
		}
	}
	if (!waitingToStart && !dead) {
		player.vy += elapsedMillis * 0.00007;
		addPickups(this);
		score = Math.round((player.y - startPos) / 200);// * player.vy);
		if (score > best) {
			setBest(score);
			newBest = true;
		}
	}

	speed = Math.round(player.vy * 2 * 20);

	//don't allow upwards movement
	if (player.vy < 1) {
		player.vy = 1;
	}

	//cap meter at 1000
	if (meter > 1000) {
		meter = 1000;
	}
	
	populateWallsDown(this);
	makeSmoke(this);

	this.camera.vy = player.vy;
	player.move(elapsedMillis);

	/* TILT IS SHIT
	WHAT IS HAPPENING*/
	//move keys
	left = false;
	right = false;
	up = false;
	if (game.keyboard.isPressed("left") || tilt < -5) {
		left = true;
		right = false;
		lastDirection = "left";
		meter -= 1;
		player.vx = -0.7;
	} if (game.keyboard.isPressed("right") || tilt > 5) {
		right = true;
		left = false;
		meter -= 1;
		lastDirection = "right";
		player.vx = 0.7;
	} if (game.keyboard.isPressed("up") || game.mouse.buttons[0]) {
		player.vy -= 0.005;
		meter -= 1.5;
		up = true;
		//game.mouse.buttons[0] = false;
	} if (!game.keyboard.isPressed("left") && !game.keyboard.isPressed("right")) {
		player.vx = 0;
	}

	//run out of meter
	if (meter <= 0) {
		dead = true;
	meter = 0;
	}

	//fade to black on death
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
	if (!up && !left && !right) {
		player.sprite = game.animations.get("player-l");
		if(lastDirection == "right") {
			player.sprite = game.animations.get("player");
		}
	}
	if (up){
		player.sprite = game.animations.get("player-boost-l")
		if (lastDirection == "right") {
			player.sprite = game.animations.get("player-boost");
		}
		if(left) {
			player.sprite = game.animations.get("player-boost-left");
		} else if (right) {
			player.sprite = game.animations.get("player-boost-right");
		}
		up = false;
	}

	//background tiling
	bgY -= this.camera.vy / 1.5 * elapsedMillis;
	var bgH = game.images.get("bg").height;
	if (bgY > bgH) {
		bgY -= bgH;
	}	

	//wall collision
	for (var i = 0; i < walls.length; i++) {
		var wall = walls[i];
		var playervx = player.vx;
		if (player.collides(wall)) {
			meter -= 100;
			game.sounds.play("wall");
			if (lastDirection == "right") {
				player.vx = -10;
			} else if (lastDirection == "left") {
				player.vx = 10;
			} 
			if (player.vy > 2) {
				player.vy -= 0.5;
				if (player.vy < 2) {
					player.vy = 2;
				}
			}
		}
	}
//console.log(player.vy);
	//pickup collision
	for (var i = 0; i < pickups.length; i++) {
		var pickup = pickups[i];
		if (player.collides(pickup) && !pickup.counted) {
			meter += 150;
			pickup.counted = true;
			//game.sounds.play("pickup");
			var i = Math.random() * pickupSounds.length |0;
			game.sounds.play(pickupSounds[i]);
		}
	}

	//obstacle collision
	for (var i = 0; i < obstacles.length; i++) {
		var obstacle = obstacles[i];
			obstacle.move(elapsedMillis);
		if (player.collides(obstacle)) {
			/*if (!this.timer("flash")) {
				var explode;
				if (player.sprite.name.indexOf("left") > -1) {
					explode = game.animations.get("player-explode-left");
				} else {
					explode = game.animations.get("player-explode-right");
				}
				explode.reset();
				player.sprite = explode;

				if (obstacle.sprite == game.animations.get("laser-left") || obstacle.sprite == game.animations.get("laser-right")) {
					game.sounds.play("laser");
				} else if (obstacle.sprite.name.indexOf("spikes") > -1) {
					game.sounds.play("spikes");
				}
			}
			this.startTimer("flash");*/
			
			//meter -= 100;
			//player.x = (canvas.width / 2) - (player.width / 2)
			dead = true;
			if (!collidesound) {
				game.sounds.play("hit");
				collidesound = true;
			}
			return;
		}
	}

}, function(context) {
	//draw background gradient
	this.camera.drawAbsolute(context, function() {
		var gradient = context.createLinearGradient(0,0,0,canvas.width);
		gradient.addColorStop(0,"black");
		gradient.addColorStop(0.2,"#35171a");
		gradient.addColorStop(1,"#6e3e62");
		context.fillStyle=gradient;
		context.fillRect(0,0,canvas.width,canvas.height);
	});

	//draw background overlay (lines)
	this.camera.drawAbsolute(context, function() {
		var bg = game.images.get("bg");
		for (var y = bgY - bg.height; y <= canvas.height; y += bg.height)  {
			y = y |0;
			context.drawImage(bg, 0, y);
		}
	});

	color = "#4FF9FE";
	if (meter < 750) {
		color = "#BADA55";
	} if (meter < 500) {
		color = "#E5DE59";
	} if (meter < 250) {
		color = "#FE3E89";
	}


	/*NEED TO CHANGE > 0 TO > this.camera.y OR SOMETHING*/
	for (var i = 0; i < pickups.length; i++) {
		if (!pickups[i].counted && pickups[i].y + pickups[i].height > 0) {
			var x = pickups[i].x;
			var y = pickups[i].y;
			context.fillStyle = color;
			context.fillRect(x,y,50,50);
			//pickups[i].draw(context);	//draw pickups
		} else {
			pickups.splice(pickups[i], 1);
		}
	}
	for (var i = 0; i < obstacles.length; i++) {
		if (obstacles[i].y + obstacles[i].height > 0) {
			obstacles[i].draw(context);	//draw obstacles
		} else {
			obstacles.splice(obstacles[i],1);
		}
	}
	for (var i = 0; i < walls.length; i++) {
		if (walls[i].y + walls[i].height > 0) {
			walls[i].draw(context);		//draw walls
		} else {
			walls.splice(walls[i],1);
		}
	}
	/*for (var i = 0; i < walls.length; i++) {
		console.log(smokes[i]);
		if (smokes[i].y + smokes[i].height > 0) {
			smokes[i].draw(context);		//draw smoke
		} else {
			smokes.splice(smokes[i],1);
		}
	}*/
	//console.log("p: " + pickups.length);
	//console.log("o: " + obstacles.length);
	//console.log("w: " + walls.length);
	//draw hud
	cameraW = this.camera.width;
	var wallW = game.animations.get("wall-1-left").width;
	var meterW = canvas.width - wallW * 2;
	var rightWallX = canvas.width - wallW;	
	this.camera.drawAbsolute(context, function(){
		var hudimg = game.animations.get("hud");
		hud = new Splat.AnimatedEntity(wallW, 10, hudimg.width, hudimg.height, hudimg, 0, 0);
	
		context.font = "bold 40px pixelade";
		context.fillStyle = color;
		//context.fillText("m", 230, 75);
		context.fillText(score + " m", wallW + 50, 75);
		//context.fillText("km/h", cameraW - 230, 75);
		context.fillText(speed + " km/h", rightWallX - 170, 75);
	//draw HUD lines
		/*context.strokeStyle = color;
		context.moveTo(wallW + 5, 10); context.lineTo(wallW + 5,45); //left meter wall
		//context.moveTo(wallW + 5, 7); context.lineTo(rightWallX - 5,7); //top meter wall
		//context.moveTo(wallW + 5, 45); context.lineTo(rightWallX - 5,45); //bottom meter wall
		context.moveTo(rightWallX - 5, 10); context.lineTo(rightWallX - 5,50); //right meter wall
		//left hud section
		context.moveTo(wallW + 3, 40); context.lineTo(wallW + 50,85); //left angle
		context.moveTo(wallW + 45, 83); context.lineTo(wallW + 175,83); //left underline
		//right hud section
		context.moveTo(rightWallX - 3, 45); context.lineTo(rightWallX - 50,85); //right angle
		context.moveTo(rightWallX - 45, 83); context.lineTo(rightWallX - 175,83); //right underline
		context.lineWidth = 10;
		context.stroke();*/
	});

	//smoke

	player.draw(context); //draw player

	//draw meter
	context.fillStyle = color;
	context.fillRect(wallW + 10, this.camera.y + 10, meterW * (meter / 1000) - 20, 30);

	//draw fade to black
	var ftb = this.timer("fade to black");
	if (ftb > 0) {
		var opacity = ftb / 300;
		context.fillStyle = "rgba(0, 0, 0, " + opacity + ")";
		context.fillRect(this.camera.x, this.camera.y, canvas.width, canvas.height);

		this.camera.drawAbsolute(context, function() {
			context.fillStyle = "#ffffff";
			context.font = "50px pixelade";
			context.fillText("DISTANCE", 0, 300);
			context.font = "100px pixelade";
			context.fillText(score + " m", 0, 400);
			context.font = "50px pixelade";
			if (newBest) {
				context.fillStyle = color;
				context.fillText("NEW BEST!", 0, 600);
			} else {
				context.fillText("BEST", 0, 600);
			}

			context.font = "100px pixelade";
			context.fillText(best + " m", 0, 700);
		});
		return;
	}
}));
game.scenes.switchTo("loading");
