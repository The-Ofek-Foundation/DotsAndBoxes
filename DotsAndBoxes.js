var docWidth, docHeight;
var boardWidth, boardHeight, squareWidth;
var squares, guiSquares;
var dimensions = [5, 5];
var hoverDot = [-1, -1];
var selectedDot = [-1, -1];
var prevMove = new Array(3);
var turn; // true is green, false is red
var greenScore, redScore;
var wallsx, wallsy;
var guiWallsx, guiWallsy;
var movesRemaining;
var timeToThink = 5;
var aiTurn = 'none';
var over = false;
var maxScore;
var ponder = false, pondering;
var numChoose1, numChoose2, numChoose3, lnc1, lnc2, lnc3, stopChoose;

var globalRoot;
var expansionConstant = 1;

var boardui = getElemId('board');
var brush = boardui.getContext("2d");
var analElem = getElemId('anal'), numTrialsElem = getElemId('num-trials');

function pageReady() {
	newGame();
}

function onResize() {
	resizeSettingsTable();
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

function initializeGame() {
	turn = true;
	greenScore = redScore = 0;
	numChoose1 = numChoose2 = numChoose3 = lnc1 = lnc2 = lnc3 = stopChoose = false;
	prevMove = [-1, -1, -1];

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
	maxScore = squares.length * squares[0].length;
}

function newGame() {
	initializeGame();
	globalRoot = createMctsRoot();

	if (ponder)
		startPonder();

	resizeBoard();
	drawBoard();

	if (aiTurn === 'both' || aiTurn === 'first')
		setTimeout(playAiMove, 25);
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

function drawPreviousMove() {
	var xAdd = prevMove[0] === 0 ? 1.5:0.5;
	var yAdd = prevMove[0] === 0 ? 0.5:1.5;
	brush.beginPath();
	brush.moveTo(squareWidth * (prevMove[1] + 0.5), squareWidth * (prevMove[2] + 0.5));
	brush.lineTo(squareWidth * (prevMove[1] + xAdd), squareWidth * (prevMove[2] + yAdd));
	brush.strokeStyle = 'yellow';
	brush.lineWidth = squareWidth / 10;
	brush.stroke();
	brush.closePath();
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
	if (prevMove[0] !== -1)
		drawPreviousMove();
	drawWalls();
	drawDots();
	updateAnalysis();
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
	if (enddot === undefined) {
		enddot = [startdot[1], startdot[2]];
		if (startdot[0] === 0)
			startdot = [startdot[1] + 1, startdot[2]];
		else startdot = [startdot[1], startdot[2] + 1];
	}
	if (startdot[0] === enddot[0]) { // wally
		lowerdot = startdot[1] < enddot[1] ? startdot:enddot;
		if (wallsy[lowerdot[0]][lowerdot[1]])
			console.log("AHHHHH");
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
		if (wallsx[lowerdot[0]][lowerdot[1]])
			console.log("AHHHHH");
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
		setTurn(placeWall(selectedDot, move));
		return;
	}
	drawBoard();
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

function setTurn(completedSquares) {
	turn ? (greenScore += completedSquares):(redScore += completedSquares);
	turn = completedSquares > 0 ? turn:!turn;
	selectedDot = hoverDot = [-1, -1];
	movesRemaining--;
	drawBoard();

	globalRoot = mctsGetNextRoot(prevMove);
	if (globalRoot)
		globalRoot.parent = null;
	else globalRoot = createMctsRoot();

	if (movesRemaining === 0) {
		over = true;
		stopPonder();
		setTimeout(function () {
			var blurb = " (" + greenScore + ":" + redScore + ")";
			if (greenScore === redScore)
				alert("Game tied!");
			else if (greenScore < redScore)
				alert("Red wins!" + blurb);
			else alert("Green wins!" + blurb);
		}, 100);
	} else {
		if (aiTurn !== 'none' &&
			(turn === (aiTurn === 'first') || aiTurn === 'both'))
			setTimeout(playAiMove, 25);
	}

	numChoose1 = numChoose2 = numChoose3 = stopChoose = false;
}

function playAiMove() {
	runMcts(timeToThink);
	var bestMove = getBestMoveMcts();
	prevMove = bestMove;
	setTurn(placeWall(bestMove));
}

function getBestMoveMcts() {
	var bestChild = mostTriedChild(globalRoot, null);
	if (!bestChild)
		return [-1, -1, -1];
	return bestChild.lastMove;
}

function mctsGetChildren(parent, squares, wallsx, wallsy, mRemaining) {
	var gScore = parent.greenScore,
	    rScore = parent.redScore,
	    scoreAddition,
	    tempTurn = parent.turn,
	    children = new Array(mRemaining);

	for (var i = 0; i < wallsx.length; i++)
		for (var a = 0; a < wallsx[i].length; a++)
			if (!wallsx[i][a]) {
				scoreAddition = 0;
				if (a > 0 && squares[i][a - 1] === 3)
					scoreAddition++;
				if (a < dimensions[1] - 1 && squares[i][a] === 3)
					scoreAddition++;
				children[--mRemaining] = new MctsNode(parent,
					scoreAddition === 0 ? !tempTurn:tempTurn,
					[0, i, a],
					gScore + (tempTurn ? scoreAddition:0),
					rScore + (tempTurn ? 0:scoreAddition));
			}

	for (var i = 0; i < wallsy.length; i++)
		for (var a = 0; a < wallsy[i].length; a++)
			if (!wallsy[i][a]) {
				scoreAddition = 0;
				if (i > 0 && squares[i - 1][a] === 3)
					scoreAddition++;
				if (i < dimensions[0] - 1 && squares[i][a] === 3)
					scoreAddition++;
				children[--mRemaining] = new MctsNode(parent,
					scoreAddition === 0 ? !tempTurn:tempTurn,
					[1, i, a],
					gScore + (tempTurn ? scoreAddition:0),
					rScore + (tempTurn ? 0:scoreAddition));
			}

	if (mRemaining !== 0)
		console.log(mRemaining);

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

var oo = false;
function mctsSimulate(node, squares, wallsx, wallsy, movesRemaining) {
	if (node.result !== 10)
		return node.result;

	if (oo)
		console.log(node.lastMove);

	if (movesRemaining === 0) // game over
		if (node.greenScore === node.redScore)
			return node.result = 0;
		else return node.result =
			((node.greenScore > node.redScore) === node.turn ? 1:-1);

	if (oo)
		console.log(node, squares, wallsx, wallsy, movesRemaining);

	var tempTurn = node.turn, gScore = node.greenScore, rScore = node.redScore;
	var move, ranIndex, x, y;
	for (var mRemaining = movesRemaining; mRemaining > 0; mRemaining--) {
		move = [-1, -1, -1];
		do {
			ranIndex = parseInt(Math.random() * mRemaining);
		} while (mRemaining <= ranIndex);

		// if (mRemaining <= ranIndex)
		// 	console.log("AHHHH", mRemaining, ranIndex);
		// console.log("start", ranIndex, mRemaining);

		outerx:
		for (x = 0; x < wallsx.length; x++)
			for (y = 0; y < wallsx[x].length; y++)
				if (!wallsx[x][y]) {
					// console.log('heya');
					if (ranIndex === 0) {
						move = [0, x, y];
						// console.log(move);
						break outerx;
					} else ranIndex--;
				}

		// console.log(ranIndex, move);

		outery:
		if (ranIndex > 0 || move[0] === -1)
			for (x = 0; x < wallsy.length; x++)
				for (y = 0; y < wallsy[x].length; y++)
					if (!wallsy[x][y]) {
						// console.log('heya');
						if (ranIndex === 0) {
							move = [1, x, y];
							// console.log(move);
							break outery;
						} else ranIndex--;
					}

		if (oo)
			console.log(ranIndex, move);
		// if (move[0] === -1)
		// 	console.log(mRemaining, ranIndex, wallsx, wallsy);

		// console.log(move);
		var cSquares = mctsCompleteSquares(move, squares, wallsx, wallsy);
		tempTurn ? (gScore += cSquares):(rScore += cSquares);
		tempTurn = cSquares > 0 ? tempTurn:!tempTurn;
		if (gScore > maxScore / 2 || rScore > maxScore / 2)
			break;
	}

	if (oo)
		console.log(gScore, rScore, node.turn);

	if (gScore === rScore)
		return 0;
	else return (gScore > rScore) === node.turn ? 1:-1;
}

function mctsSimulateSmart(node, squares, wallsx, wallsy, movesRemaining) {
	if (node.result !== 10)
		return node.result;

	if (oo)
		console.log(node.lastMove);

	if (movesRemaining === 0) // game over
		if (node.greenScore === node.redScore)
			return node.result = 0;
		else return node.result =
			((node.greenScore > node.redScore) === node.turn ? 1:-1);

	if (oo)
		console.log(node, squares, wallsx, wallsy, movesRemaining);

	var tempTurn = node.turn, gScore = node.greenScore, rScore = node.redScore;
	var move, ranIndex, x, y;
	var almostSquares = [], cS; // chosenSquare
	var splicing = false;
	for (var i = 0; i < squares.length; i++)
		for (var a = 0; a < squares[i].length; a++)
			if (squares[i][a] === 3)
				almostSquares.push([i, a]);
	for (var mRemaining = movesRemaining; mRemaining > 0; mRemaining--) {
		move = [-1, -1, -1];

		if (!splicing && almostSquares.length > 0)
			splicing = Math.random() < 0.5;

		if (splicing)
			while (almostSquares.length > 0 && move[0] === -1) {
				cS = almostSquares[0];
				if (!wallsx[cS[0]][cS[1]])
					move = [0, cS[0], cS[1]];
				else if (!wallsy[cS[0]][cS[1]])
					move = [1, cS[0], cS[1]];
				else if (!wallsx[cS[0]][cS[1] + 1])
					move = [0, cS[0], cS[1] + 1];
				else if (!wallsy[cS[0] + 1], cS[1])
					move = [1, cS[0] + 1, cS[1]];
				almostSquares.splice(0, 1);
			}

		if (move[0] === -1) {
			splicing = false;
			do {
				ranIndex = parseInt(Math.random() * mRemaining);
			} while (mRemaining <= ranIndex);

			// if (mRemaining <= ranIndex)
			// 	console.log("AHHHH", mRemaining, ranIndex);
			// console.log("start", ranIndex, mRemaining);

			outerx:
			for (x = 0; x < wallsx.length; x++)
				for (y = 0; y < wallsx[x].length; y++)
					if (!wallsx[x][y]) {
						// console.log('heya');
						if (ranIndex === 0) {
							move = [0, x, y];
							// console.log(move);
							break outerx;
						} else ranIndex--;
					}

			// console.log(ranIndex, move);

			outery:
			if (ranIndex > 0 || move[0] === -1)
				for (x = 0; x < wallsy.length; x++)
					for (y = 0; y < wallsy[x].length; y++)
						if (!wallsy[x][y]) {
							// console.log('heya');
							if (ranIndex === 0) {
								move = [1, x, y];
								// console.log(move);
								break outery;
							} else ranIndex--;
						}
		}

		if (oo)
			console.log(ranIndex, move);
		// if (move[0] === -1)
		// 	console.log(mRemaining, ranIndex, wallsx, wallsy);

		// console.log(move);
		var cSquares = mctsCompleteSquaresSmart(move, squares, wallsx, wallsy,
			almostSquares);
		tempTurn ? (gScore += cSquares):(rScore += cSquares);
		tempTurn = cSquares > 0 ? tempTurn:!tempTurn;
		if (gScore > maxScore / 2 || rScore > maxScore / 2)
			break;
	}

	if (oo)
		console.log(gScore, rScore, node.turn);

	if (gScore === rScore)
		return 0;
	else return (gScore > rScore) === node.turn ? 1:-1;
}

function mctsCompleteSquares(move, squares, wallsx, wallsy) {
	var completedSquares = 0;
	if (move[0] === 0) { // wallsx
		wallsx[move[1]][move[2]] = true;
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
		wallsy[move[1]][move[2]] = true;
		if (move[1] > 0) {
			squares[move[1] - 1][move[2]]++;
			if (squares[move[1] - 1][move[2]] === 4)
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

function mctsCompleteSquaresSmart(move, squares, wallsx, wallsy, almostSquares) {
	var completedSquares = 0;
	if (move[0] === 0) { // wallsx
		wallsx[move[1]][move[2]] = true;
		if (move[2] > 0) {
			squares[move[1]][move[2] - 1]++;
			if (squares[move[1]][move[2] - 1] === 4)
				completedSquares++;
			else if (squares[move[1]][move[2] - 1] === 3)
				almostSquares.push([move[1], move[2] - 1]);
		}
		if (move[2] < dimensions[1] - 1) {
			squares[move[1]][move[2]]++;
			if (squares[move[1]][move[2]] === 4)
				completedSquares++;
			else if (squares[move[1]][move[2]] === 3)
				almostSquares.push([move[1], move[2]]);
		}
	} else {
		wallsy[move[1]][move[2]] = true;
		if (move[1] > 0) {
			squares[move[1] - 1][move[2]]++;
			if (squares[move[1] - 1][move[2]] === 4)
				completedSquares++;
			else if (squares[move[1] - 1][move[2]] === 3)
				almostSquares.push([move[1] - 1, move[2]]);
		}
		if (move[1] < dimensions[0] - 1) {
			squares[move[1]][move[2]]++;
			if (squares[move[1]][move[2]] === 4)
				completedSquares++;
			else if (squares[move[1]][move[2]] === 3)
				almostSquares.push([move[1], move[2]]);
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
		this.countUnexplored = 0;
	}

	chooseChild(squares, wallsx, wallsy, movesRemaining) {
		if (this.hasChildren === false) {
			this.hasChildren = true;
			if (movesRemaining > 0) {
				if (this.greenScore > maxScore / 2 || this.redScore > maxScore / 2)
					this.result = (this.greenScore > this.redScore) === this.turn ?
						1:-1;
				this.children = mctsGetChildren(this, squares, wallsx, wallsy,
					movesRemaining);
				this.countUnexplored = this.children.length;
			}
		}
		if (this.result !== 10) // leaf node
			this.backPropogate(this.result);
		else {
			if (oo) {
				console.log(this.lastMove, wallsx, wallsy, this);
				for (var i = 0; i < squares.length; i++)
					for (var a = 0; a < squares[i].length; a++)
						console.log(squares[i][a]);
			}
			movesRemaining--;
			var i;
			var unexplored = this.countUnexplored;

			if (unexplored > 0) {
				this.countUnexplored--;
				var ran = Math.floor(Math.random() * unexplored);
				for (i = 0; i < this.children.length; i++)
					if (this.children[i].totalTries === 0) {
						if (ran === 0) {
							playLastMove(this.children[i].lastMove,
								squares, wallsx, wallsy);
							this.children[i].backPropogate(mctsSimulateSmart(
								this.children[i], squares, wallsx, wallsy,
								movesRemaining));
							return;
						}
						ran--;
					}
			} else {
				var bestChild = this.children[0],
					bestPotential =
						mctsChildPotential(this.children[0], this.totalTries, this.turn),
					potential;

				propResult(this, this.children[0]);

				for (i = 1; i < this.children.length; i++) {
					propResult(this, this.children[i]);
					potential = mctsChildPotential(this.children[i], this.totalTries, this.turn);
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

function propResult(parent, child) {
	if (parent.turn === child.turn && child.result === 1)
		parent.result = 1;
	else if (parent.turn !== child.turn && child.result === -1)
		parent.result = 1;
}

function mctsChildPotential(child, t, turn) {
	var w = child.misses - child.hits;
	if (child.turn === turn)
		w = -w;
	var n = child.totalTries;
	var c = expansionConstant;

	return w / n + c * Math.sqrt(Math.log(t) / n);
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

function mostTriedChild(root, exclude=null) {
	var mostTrials = -1, child = null;
	if (!root.children)
		return null;
	if (root.children.length === 1)
		return root.children[0];
	for (var i = 0; i < root.children.length; i++)
		if (root.children[i] !== exclude && root.children[i].totalTries > mostTrials) {
			mostTrials = root.children[i].totalTries;
			child = root.children[i];
		}
	return child;
}

function leastTriedChild(root) {
	var leastTrials = root.totalTries + 1, child = null;
	if (!root.children)
		return null;
	for (var i = 0; i < root.children.length; i++)
		if (root.children[i].totalTries < leastTrials) {
			leastTrials = root.children[i].totalTries;
			child = root.children[i];
		}
	return child;
}

function mctsGetNextRoot(move) {
	if (!globalRoot || !globalRoot.children)
		return null;
	for (var i = 0; i < globalRoot.children.length; i++)
		if (arraysEqual(globalRoot.children[i].lastMove, move))
			return globalRoot.children[i];
	return null;
}

function speedTest(numSimulations) {
	globalRoot = createMctsRoot();
	var startTime = new Date().getTime();
	for (var i = 0; i < numSimulations; i++)
		globalRoot.chooseChild(simpleCopy(squares), simpleCopy(wallsx),
			simpleCopy(wallsy), movesRemaining);
	var elapsedTime = (new Date().getTime() - startTime) / 1E3;
	console.log(numberWithCommas(Math.round(numSimulations / elapsedTime)) + ' simulations per second.');
}

function updateAnalysis() {
	var range = getMctsDepthRange();
	analElem.innerHTML = "Analysis: Depth-" + range[1] + " Result-" +
		range[2] + " Certainty-" + (globalRoot && globalRoot.totalTries > 0 ?
		(resultCertainty(globalRoot) * 100).toFixed(0):"0") + "%";
	numTrialsElem.innerHTML = "Trials: " + globalRoot.totalTries;
}

function getMctsDepthRange() {
	var root, range = new Array(3);
	for (range[0] = -1, root = globalRoot; root && root.children; range[0]++, root = leastTriedChild(root));
	for (range[1] = -1, root = globalRoot; root && root.children; range[1]++, root = mostTriedChild(root));
	root = globalRoot;
	if (root.totalTries > (root.hits + root.misses) * 3)
		range[2] = "Tie";
	else if ((root.hits > root.misses) === turn)
		range[2] = "Green";
	else if ((root.hits < root.misses) === turn)
		range[2] = "Red";
	else range[2] = "Tie";
	return range;
}

function resultCertainty(root) {
	if (root.totalTries > (root.hits + root.misses) * 3)
		return 1 - (root.hits + root.misses) / root.totalTries;
	else if (root.hits > root.misses)
		return (root.hits - root.misses) / root.totalTries;
	else if (root.hits < root.misses)
		return (root.misses - root.hits) / root.totalTries;
	else return 1 - (root.hits + root.misses) / root.totalTries;
}

var numPonders = 0;
function startPonder() {
	pondering = setInterval(function() {
		if (!globalRoot)
			globalRoot = createMctsRoot();
		var startTime = new Date().getTime();
		var tempCount = 0;
		while ((new Date().getTime() - startTime) < 30 && !stopChoose) {
			globalRoot.chooseChild(simpleCopy(squares), simpleCopy(wallsx),
				simpleCopy(wallsy), movesRemaining);
			tempCount++;
		}
		if (numChoose3 && (tempCount < numChoose3 / 10 || tempCount < numChoose2 / 10 || tempCount < numChoose1 / 10))
			stopChoose = true;
		else {
			numChoose3 = numChoose2;
			numChoose2 = numChoose1;
			numChoose1 = tempCount;
		}
		updateAnalysis();
	}, 1);
}

function stopPonder() {
	clearInterval(pondering);
}


var t1;
function testExpansionConstants(c1, c2, numTrials, timeToThink, output) {
	var v1 = v2 = 0;
	t1 = [c1, c2];
	for (var I = 0; I < numTrials; I++) {
		initializeGame();
		var r1 = createMctsRoot(), r2 = createMctsRoot();

		while (movesRemaining > 0) {
			var startTime = new Date().getTime();
			var r = (I % 2 === 0) === turn ? r1:r2;
			expansionConstant = (I % 2 === 0) === turn ? c1:c2;
			if (!r)
				r = createMctsRoot();
			while ((new Date().getTime() - startTime) / 1E3 < timeToThink) {
				for (var i = 0; i < 100; i++)
					r.chooseChild(simpleCopy(squares), simpleCopy(wallsx),
						simpleCopy(wallsy), movesRemaining);
				if (r.children.length < 2)
					break;
			}
			var bestChild = mostTriedChild(r, null);
			var bestMove = bestChild.lastMove;
			var completedSquares = placeWall(bestMove);
			turn ? (greenScore += completedSquares):(redScore += completedSquares);

			movesRemaining--;
			if (movesRemaining === 0 || greenScore > maxScore / 2
				|| redScore > maxScore / 2)
				break;

			turn = completedSquares > 0 ? turn:!turn;

			if (r1.children) {
				for (var i = 0; i < r1.children.length; i++)
					if (arraysEqual(r1.children[i].lastMove, bestMove)) {
						r1 = r1.children[i];
						break;
					}
				r1.parent = null;
			} else r1 = createMctsRoot();
			if (r2.children) {
				for (var i = 0; i < r2.children.length; i++)
					if (arraysEqual(r2.children[i].lastMove, bestMove)) {
						r2 = r2.children[i];
						break;
					}
				r2.parent = null;
			} else r2 = createMctsRoot();
			// console.log("next turn ", board);
		}

		if (greenScore === redScore)
			console.log("tie");
		else if (greenScore > redScore === (I % 2 === 0)) {
			v1++;
			if (output)
				console.log("c1 wins");
		} else {
			v2++;
			if (output)
				console.log("c2 wins");
		}
	}
	console.log(c1 + ": " + v1 + " and " + c2 + ": " + v2);
	return [v1, v2];
}

function findBestExpansionConstant(seed, timeToThink, bound, numSimulations, prollyGreater) {
	console.log("!!!");
	console.log("Best constant: ", seed);
	console.log("Bound: ", bound);
	console.log("!!!");

	if (seed < 0)
		return;

	var delta1, delta2;

	var round1 = testExpansionConstants(seed, prollyGreater ? (seed + bound):(seed - bound), numSimulations, timeToThink, false);
	if (round1[1] > round1[0])
		findBestExpansionConstant(prollyGreater ? (seed + bound):(seed - bound), timeToThink, bound / 2, numSimulations, true);
	else {
		delta1 = round1[0] - round1[1];
		var round2 = testExpansionConstants(seed, prollyGreater ? (seed - bound):(seed + bound), numSimulations, timeToThink, false);
		if (round2[1] > round2[0])
			findBestExpansionConstant(prollyGreater ? (seed - bound):(seed + bound), timeToThink, bound / 2, numSimulations, true);
		else {
			delta2 = round2[0] - round2[1];
			findBestExpansionConstant(seed, timeToThink, bound / 2, numSimulations, delta1 < delta2 === prollyGreater);
		}
	}
}
