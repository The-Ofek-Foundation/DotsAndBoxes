var docWidth, docHeight;
var boardWidth, boardHeight, squareWidth;
var squares, guiSquares;
var dimensions = [4, 4];
var hoverDot = [-1, -1];
var selectedDot = [-1, -1];
var prevMove = new Array(3);
var turn; // true is green, false is red
var greenScore, redScore;
var wallsx, wallsy;
var guiWallsx, guiWallsy;
var movesRemaining;

var globalRoot;
var expansionConstant = 1.2;

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

	movesRemaining = wallsx.length * wallsx[0].length +
		wallsy.length * wallsy[0].length;
	globalRoot = createMctsRoot();

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
		prevMove = [1, lowerdot[0], lowerdot[1]];
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
		prevMove = [0, lowerdot[0], lowerdot[1]];
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
		movesRemaining--;
	}
	drawBoard();
	setTimeout(function () {
		var blurb = " (" + greenScore + ":" + redScore + ")";
		if (movesRemaining === 0)
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

function MctsGetChildren(parent, squares, wallsx, wallsy) {
	var greenScore = parent.greenScore,
	    redScore = parent.redScore,
	    scoreAddition,
	    turn = parent.turn,
	    children = [];

	for (var i = 0; i < wallsx.length; i++)
		for (var a = 0; a < wallsx[i].length; a++)
			if (!wallsx[i][a]) {
				scoreAddition = 0;
				if (a > 0 && squares[i][a - 1] === 3)
					scoreAddition++;
				if (a < dimensions[1] - 1 && squares[i][a] === 3)
					scoreAddition++;
				children.push(new MctsNode(parent,
					scoreAddition === 0 ? !turn:turn,
					[0, i, a],
					greenScore + turn ? scoreAddition:0,
					redScore + turn ? 0:scoreAddition));
			}

	for (var i = 0; i < wallsy.length; i++)
		for (var a = 0; a < wallsy[i].length; a++)
			if (!wallsy[i][a]) {
				scoreAddition = 0;
				if (i > 0 && squares[i - 1][a] === 3)
					scoreAddition++;
				if (i < dimensions[0] - 1 && squares[i][a] === 3)
					scoreAddition++;
				children.push(new MctsNode(parent,
					scoreAddition === 0 ? !turn:turn,
					[1, i, a],
					greenScore + turn ? scoreAddition:0,
					redScore + turn ? 0:scoreAddition));
			}

	return children; // if ransom is paid
}

function createMctsRoot() {
	return new MctsNode(null, turn, prevMove, greenScore, redScore);
}

function runMcts(time) {
	if (!globalRoot)
		globalRoot = createMctsRoot();
	var startTime = new Date().getTime();
	while ((new Date().getTime() - startTime) / 1E3 < time) {
		for (var i = 0; i < 2000; i++)
			globalRoot.chooseChild(simpleCopy(squares), simpleCopy(wallsx),
				simpleCopy(wallsy), movesRemaining);
		if (globalRoot.children.length < 2)
			return;
	}
	while (globalRoot.totalTries < movesRemaining)
		globalRoot.chooseChild(simpleCopy(squares), simpleCopy(wallsx),
				simpleCopy(wallsy), movesRemaining);
	console.log("Total Simulations: " + globalRoot.totalTries);
}

function MctsSimulate(node, squares, wallsx, wallsy, movesRemaining) {
	if (node.result !== 10)
		return node.result;

	if (movesRemaining === 0) // game over
		if (node.greenScore === node.redScore)
			return node.result = 0;
		else return (node.greenScore > node.redScore) === node.turn ? 1:-1;

	var turn = node.turn, greenScore = node.greenScore, redScore = node.redScore;
	var move, ranIndex, x, y;
	for (; movesRemaining > 0; movesRemaining--) {
		move = [-1, -1, -1];
		ranIndex = parseInt(Math.random() * (movesRemaining - 1));
		// console.log("start", ranIndex, movesRemaining);

		outerx:
		for (x = 0; x < wallsx.length; x++)
			for (y = 0; y < wallsx[x].length; y++)
				if (!wallsx[x][y]) {
					// console.log('heya');
					if (ranIndex === 0) {
						move = [0, x, y];
						// console.log(move);
						wallsx[x][y] = true;
						break outerx;
					} else ranIndex--;
				}

		// console.log(ranIndex, move, wallsy);

		outery:
		if (ranIndex > 0 || move[0] === -1)
			for (x = 0; x < wallsy.length; x++)
				for (y = 0; y < wallsy[x].length; y++)
					if (!wallsy[x][y]) {
						// console.log('heya');
						if (ranIndex === 0) {
							move = [1, x, y];
							// console.log(move);
							wallsy[x][y] = true;
							break outery;
						} else ranIndex--;
					}

		// console.log(ranIndex, move);

		var completedSquares = MctsCompleteSquares(move, squares);
		turn ? (greenScore += completedSquares):(redScore += completedSquares);
		turn = completedSquares > 0 ? turn:!turn;
	}

	if (greenScore === redScore)
		return 0;
	else return (greenScore > redScore) === node.turn ? 1:-1;
}

function MctsCompleteSquares(move, squares) {
	var completedSquares = 0;
	if (move[0] === 0) { // wallsx
		if (move[2] > 0) {
			squares[move[1]][move[2] - 1]++;
			if (squares[move[1]][move[2] - 1] === 4)
				completedSquares++;
		}
		if (move[2] < dimensions[1] - 1) {
			squares[move[1]][move[2]]++;
			if (squares[move[1]][move[2]] === 4)
				completedSquares++;
		}
	} else {
		if (move[1] > 0) {
			squares[move[1] - 1][move[2]]++;
			if (squares[move[1] - 1][move[2]])
				completedSquares++;
		}
		if (move[1] < dimensions[0] - 1) {
			squares[move[1]][move[2]]++;
			if (squares[move[1]][move[2]] === 4)
				completedSquares++;
		}
	}
	return completedSquares;
}

function playLastMove(lastMove, squares, wallsx, wallsy) {
	if (lastMove[0] === 0) { // wallsx
		wallsx[lastMove[1]][lastMove[2]] = true;
		if (lastMove[2] > 0)
			squares[lastMove[1]][lastMove[2] - 1]++;
		if (lastMove[2] < dimensions[1] - 1)
			squares[lastMove[1]][lastMove[2]]++;
	} else { // wallsy
		wallsy[lastMove[1]][lastMove[2]] = true;
		if (lastMove[1] > 0)
			squares[lastMove[1] - 1][lastMove[2]]++;
		if (lastMove[1] < dimensions[0] - 1)
			squares[lastMove[1]][lastMove[2]]++;
	}
}

function undoLastMove(lastMove, wallsx, wallsy) {
	if (lastMove[0] === 0) { // wallsx
		wallsx[lastMove[1]][lastMove[2]] = false;
	} else { // wallsy
		wallsy[lastMove[1]][lastMove[2]] = false;
	}
}

class MctsNode {
	constructor(parent, turn, lastMove, greenScore, redScore) {
		this.parent = parent;
		this.turn = turn;
		this.lastMove = lastMove; // arr[0/1 (wall x/y), x, y]
		this.hits = 0;
		this.misses = 0;
		this.totalTries = 0;
		this.hasChildren = false;
		this.children = [];
		this.result = 10; // never gonna happen
		this.greenScore = greenScore;
		this.redScore = redScore;
	}

	chooseChild(squares, wallsx, wallsy, movesRemaining) {
		if (this.hasChildren === false) {
			this.hasChildren = true;
			if (movesRemaining > 0)
				this.children = MctsGetChildren(this, squares, wallsx, wallsy);
		}
		if (this.result !== 10) // leaf node
			this.backPropogate(this.result);
		else {
			movesRemaining--;
			var i;
			var countUnexplored = 0;
			for (i = 0; i < this.children.length; i++)
				if (this.children[i].totalTries === 0)
					countUnexplored++;

			if (countUnexplored > 0) {
				var ran = Math.floor(Math.random() * countUnexplored);
				for (i = 0; i < this.children.length; i++)
					if (this.children[i].totalTries === 0) {
						countUnexplored--;
						if (countUnexplored === 0) {
							playLastMove(this.children[i].lastMove,
								squares, wallsx, wallsy);
							this.children[i].backPropogate(MctsSimulate(
								this.children[i], squares, wallsx, wallsy,
								movesRemaining));
							return;
						}
					}
			} else {
				var bestChild = this.children[0], bestPotential = MctsChildPotential(this.children[0], this.totalTries), potential;
				for (i = 1; i < this.children.length; i++) {
					potential = MctsChildPotential(this.children[i], this.totalTries);
					if (potential > bestPotential) {
						bestPotential = potential;
						bestChild = this.children[i];
					}
				}
				playLastMove(bestChild.lastMove, squares, wallsx, wallsy);
				bestChild.chooseChild(squares, wallsx, wallsy, movesRemaining);
			}
		}
	}

	backPropogate(simulation) {
		if (simulation === 1)
			this.hits++;
		else if (simulation === -1)
			this.misses++;
		this.totalTries++;
		if (this.parent !== null)
			this.parent.backPropogate(simulation *
				(this.parent.turn === this.turn ? 1:-1));
	}
}

function MctsChildPotential(child, t) {
	var w = child.misses - child.hits;
	var n = child.totalTries;
	var c = expansionConstant;

	return w / n	+	c * Math.sqrt(Math.log(t) / n);
}

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
