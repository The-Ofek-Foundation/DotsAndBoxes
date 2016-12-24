var docWidth, docHeight;
var boardWidth, boardHeight, squareWidth;
var squares, guiSquares;
var dimensions = [4, 4];
var hoverDot = [-1, -1];
var selectedDot = [-1, -1];
var turn; // true is green, false is red
var greenScore, redScore;
var wallsx, wallsy;
var guiWallsx, guiWallsy;

var boardui = getElemId('board');
var brush = boardui.getContext("2d");

function pageReady() {
	newGame();
}

function onResize() {
	resizeGameSettingsTable();
	resizeBoard();
	drawBoard();
}

function resizeBoard() {
	docWidth = getElemWidth(contentWrapper);
	docHeight = getElemHeight(contentWrapper);
	wrapperTop = contentWrapper.offsetTop;

	var sw1 = parseInt((docWidth) / (dimensions[0])); // square width 1
	var sw2 = parseInt((docHeight) / (dimensions[1]));

	squareWidth = sw1 < sw2 ? sw1:sw2;
	boardWidth = squareWidth * (dimensions[0]);
	boardHeight = squareWidth * (dimensions[1]);

	setElemWidth(boardui, boardWidth);
	setElemHeight(boardui, boardHeight);
	setElemStyle(boardui, 'left', (docWidth - boardWidth) / 2 + "px")
	setElemStyle(boardui, 'top', (docHeight - boardHeight) / 2 + "px")
	boardui.setAttribute('width', boardWidth);
	boardui.setAttribute('height', boardHeight);
}

function newGame() {
	turn = true;
	greenScore = redScore = 0;

	wallsx = new Array(dimensions[0] - 1);
	for (var i = 0; i < wallsx.length; i++) {
		wallsx[i] = new Array(dimensions[1]);
		for (var a = 0; a < wallsx[i].length; a++)
			wallsx[i][a] = false;
	}
	guiWallsx = simpleCopy(wallsx);

	wallsy = new Array(dimensions[0]);
	for (var i = 0; i < wallsy.length; i++) {
		wallsy[i] = new Array(dimensions[1] - 1);
		for (var a = 0; a < wallsy[i].length; a++)
			wallsy[i][a] = false;
	}
	guiWallsy = simpleCopy(wallsy);

	squares = new Array(dimensions[0] - 1);
	guiSquares = new Array(squares.length);
	for (var i = 0; i < squares.length; i++) {
		squares[i] = new Array(dimensions[1] - 1);
		guiSquares[i] = new Array(squares[i].length);
		for (var a = 0; a < squares[i].length; a++) {
			squares[i][a] = 0;
			guiSquares[i][a] = false;
		}
	}

	resizeBoard();
	drawBoard();
}

function clearBoard() {
	brush.clearRect(0, 0, boardWidth, boardHeight);
	brush.fillStyle = "white";
	brush.fillRect(0, 0, boardWidth, boardHeight);
}

function drawSquares() {
	for (var i = 0; i < squares.length; i++)
		for (var a = 0; a < squares[i].length; a++)
			if (squares[i][a] === 4) {
				brush.fillStyle = guiSquares[i][a] ? 'lightgreen':'pink';
				brush.fillRect(squareWidth * (i + 0.5), squareWidth * (a + 0.5),
					squareWidth, squareWidth);
			}
}

function drawWalls() {
	for (var i = 0; i < wallsx.length; i++)
		for (var a = 0; a < wallsx[i].length; a++)
			if (wallsx[i][a]) {
				brush.beginPath();
				brush.moveTo(squareWidth * (i + 0.5), squareWidth * (a + 0.5));
				brush.lineTo(squareWidth * (i + 1.5), squareWidth * (a + 0.5));
				brush.strokeStyle = guiWallsx[i][a] ? 'green':'red';
				brush.lineWidth = squareWidth / 40;
				brush.stroke();
				brush.closePath();
			}

	for (var i = 0; i < wallsy.length; i++)
		for (var a = 0; a < wallsy[i].length; a++)
			if (wallsy[i][a]) {
				brush.beginPath();
				brush.moveTo(squareWidth * (i + 0.5), squareWidth * (a + 0.5));
				brush.lineTo(squareWidth * (i + 0.5), squareWidth * (a + 1.5));
				brush.strokeStyle = guiWallsy[i][a] ? 'green':'red';
				brush.lineWidth = squareWidth / 40;
				brush.stroke();
				brush.closePath();
			}
}

function drawDots() {
	for (var i = 0; i < dimensions[0]; i++)
		for (var a = 0; a < dimensions[1]; a++) {
			brush.beginPath();
			brush.arc(squareWidth * (i + 0.5), squareWidth * (a + 0.5),
				squareWidth / 10, 0, 2 * Math.PI, false);
			if (selectedDot[0] === i && selectedDot[1] === a)
				brush.fillStyle = turn ? 'green':'red';
			else if (hoverDot[0] === i && hoverDot[1] === a)
				brush.fillStyle = turn ? 'lightgreen':'pink';
			else brush.fillStyle = 'black';
			brush.fill();
			if (hoverDot[0] === i && hoverDot[1] === a) {
				brush.strokeStyle = 'black';
				brush.lineWidth = 1;
				brush.stroke();
			}
			brush.closePath();
		}
}

function drawBoard() {
	clearBoard();
	drawSquares();
	drawWalls();
	drawDots();
}

function getMove(xloc, yloc) {
	if (Math.pow((xloc / squareWidth) % 1 - 0.5, 2)
		+ Math.pow((yloc / squareWidth) % 1 - 0.5, 2) > 0.1)
		return [-1, -1];
	return [parseInt(xloc / squareWidth), parseInt(yloc / squareWidth)];
}

function legalMove(move) {
	if (selectedDot[0] === -1) {
		if (move[0] > 0 && !wallsx[move[0] - 1][move[1]])
			return true;
		if (move[1] > 0 && !wallsy[move[0]][move[1] - 1])
			return true;
		if (move[0] < dimensions[0] - 1 && !wallsx[move[0]][move[1]])
			return true;
		if (move[1] < dimensions[1] - 1 && !wallsy[move[0]][move[1]])
			return true;
		return false;
	}
	if (selectedDot[0] === move[0]) // wally
		if (move[1] === selectedDot[1] - 1 || move[1] === selectedDot[1] + 1) {
			lowerdot = move[1] < selectedDot[1] ? move:selectedDot;
			return !wallsy[lowerdot[0]][lowerdot[1]];
		} else return false;
	else if (selectedDot[1] === move[1]) // wallx
		if (move[0] === selectedDot[0] - 1 || move[0] === selectedDot[0] + 1) {
			lowerdot = move[0] < selectedDot[0] ? move:selectedDot;
			return !wallsx[lowerdot[0]][lowerdot[1]];
		} else return false;
	return false;
}

function gameOver() {
	for (var i = 0; i < wallsx.length; i++)
		for (var a = 0; a < wallsx[i].length; a++)
			if (!wallsx[i][a])
				return false;

	for (var i = 0; i < wallsy.length; i++)
		for (var a = 0; a < wallsy[i].length; a++)
			if (!wallsy[i][a])
				return false;

	return true;
}

function placeWall(startdot, enddot) {
	var lowerdot, countCompletedSquares = 0;
	if (startdot[0] === enddot[0]) { // wally
		lowerdot = startdot[1] < enddot[1] ? startdot:enddot;
		wallsy[lowerdot[0]][lowerdot[1]] = true;
		guiWallsy[lowerdot[0]][lowerdot[1]] = turn;
		if (lowerdot[0] > 0) {
			squares[lowerdot[0] - 1][lowerdot[1]]++;
			if (squares[lowerdot[0] - 1][lowerdot[1]] === 4) {
				countCompletedSquares++;
				guiSquares[lowerdot[0] - 1][lowerdot[1]] = turn;
			}
		}
		if (lowerdot[0] < dimensions[0] - 1) {
			squares[lowerdot[0]][lowerdot[1]]++;
			if (squares[lowerdot[0]][lowerdot[1]] === 4) {
				countCompletedSquares++;
				guiSquares[lowerdot[0]][lowerdot[1]] = turn;
			}
		}
	} else { // wallx
		lowerdot = startdot[0] < enddot[0] ? startdot:enddot;
		wallsx[lowerdot[0]][lowerdot[1]] = true;
		guiWallsx[lowerdot[0]][lowerdot[1]] = turn;
		if (lowerdot[1] > 0) {
			squares[lowerdot[0]][lowerdot[1] - 1]++;
			if (squares[lowerdot[0]][lowerdot[1] - 1] === 4) {
				countCompletedSquares++;
				guiSquares[lowerdot[0]][lowerdot[1] - 1] = turn;
			}
		}
		if (lowerdot[1] < dimensions[1] - 1) {
			squares[lowerdot[0]][lowerdot[1]]++;
			if (squares[lowerdot[0]][lowerdot[1]] === 4) {
				countCompletedSquares++;
				guiSquares[lowerdot[0]][lowerdot[1]] = turn;
			}
		}
	}
	return countCompletedSquares;
}

boardui.addEventListener('mousedown', function (e) {
	if (e.which === 3)
		return;
	e.preventDefault();

	var move = getMove(e.pageX - boardui.offsetLeft,
		e.pageY - wrapperTop - boardui.offsetTop);
	if (move[0] === -1 || !legalMove(move))
		selectedDot = [-1, -1];
	else if (selectedDot[0] === -1)
		selectedDot = move;
	else {
		var completedSquares = placeWall(selectedDot, move);
		turn ? (greenScore += completedSquares):(redScore += completedSquares);
		turn = completedSquares > 0 ? turn:!turn;
		selectedDot = hoverDot = [-1, -1];
	}
	drawBoard();
	setTimeout(function () {
		var blurb = " (" + greenScore + ":" + redScore + ")";
		if (gameOver())
			if (greenScore === redScore)
				alert("Game tied!");
			else if (greenScore < redScore)
				alert("Red wins!" + blurb);
			else alert("Green wins!" + blurb);
	}, 100);
});

boardui.addEventListener('mousemove', function (e) {
	var move = getMove(e.pageX - boardui.offsetLeft,
		e.pageY - wrapperTop - boardui.offsetTop);
	if (move[0] !== hoverDot[0] || move[1] !== hoverDot[1]) {
		if (move[0] !== -1 && !legalMove(move))
			move = [-1, -1];
		hoverDot = move;
		drawBoard();
	}
});

function simpleCopy(arr) {
	var simpleCopy = new Array(arr.length);
	for (var i = 0; i < arr.length; i++) {
		simpleCopy[i] = new Array(arr[i].length);
		for (var a = 0; a < arr[i].length; a++)
			simpleCopy[i][a] = arr[i][a];
	}
	return simpleCopy;
}

document.addEventListener('keypress', function (event) {
	switch (event.which) {
		// case 115: case 83: // s
		// 	showSettingsForm();
		// 	break;
		case 110: case 78: // n
			newGame();
			break;
	}
});
