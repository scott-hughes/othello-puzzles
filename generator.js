class OthelloState {
  constructor(board, playerToMove) {
    this.board = board;
    this.playerToMove = playerToMove;
    this.availableMoves = [];
    for (var i = 0; i < this.board.length; i++) {
      if (isLegalMove(this.board, i, this.playerToMove)) {
        this.availableMoves.push(i);
      }
    }
  }
  getValue() {
    var black = 0;
    var white = 0;
    for (var i = 0; i < this.board.length; i++) {
      var cellValue = this.board[i];
      if (cellValue == 1) {
        black++;
      } else if (cellValue == -1) {
        white++;
      }
    }
    if (black > white) return 64 - 2 * white;
    if (black < white) return 2 * black - 64;
    return 0;
  }
  getNextState(moveIndex) {
    var playerToMove = this.playerToMove;
    var board = this.board.slice(0, 64);
    board[moveIndex] = playerToMove;
    for (var j = 0; j < ADJACENT_CELL_OFFSETS.length; j++) {
      var offset = ADJACENT_CELL_OFFSETS[j];
      var i = moveIndex;
      while (true) {
        i = getAdjacentCellIndex(i, offset);
        if (i == -1) break;
        if (board[i] == 0) break;
        if (board[i] == playerToMove) {
          offset = -offset;
          while (true) {
            i = getAdjacentCellIndex(i, offset);
            if (board[i] != -playerToMove) break;
            board[i] = playerToMove;
          }
          break;
        }
      }
    }
    return new OthelloState(board, -playerToMove);
  }
  getRandomNextState() {
    var i = Math.floor(this.availableMoves.length * Math.random());
    var moveIndex = this.availableMoves[i];
    return this.getNextState(moveIndex);
  }
  static getInitialState() {
    var board = new Array(64).fill(0);
    board[27] = -1;
    board[28] =  1;
    board[35] =  1;
    board[36] = -1;
    return new OthelloState(board, 1);
  }
}

var ADJACENT_CELL_OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9];
var INITIAL_STATE = OthelloState.getInitialState();

function isLegalMove(board, moveIndex, playerToMove) {
  if (board[moveIndex] == 0) {
    for (var j = 0; j < ADJACENT_CELL_OFFSETS.length; j++) {
      var i = getAdjacentCellIndex(moveIndex, ADJACENT_CELL_OFFSETS[j]);
      if (i == -1 || board[i] != -playerToMove) continue;
      while (true) {
        i = getAdjacentCellIndex(i, ADJACENT_CELL_OFFSETS[j]);
        if (i == -1) break;
        if (board[i] == 0) break;
        if (board[i] == playerToMove) return true;
      }
    }
  }
  return false;
}

function getAdjacentCellIndex(origin, offset) {
  var index = origin + offset;
  return index < 0 || index > 63 || Math.abs(origin % 8 - index % 8) > 1 ? -1 : index;
}

function getRandomPlayoutValue() {
  var state = INITIAL_STATE;
  while (true) {
    if (state.availableMoves.length == 0) {
      state = new OthelloState(state.board, -state.playerToMove);
      if (state.availableMoves.length == 0) break;
    }
    state = state.getRandomNextState();
  }
  return state.getValue();
}

function run(duration) {
  var endTime = performance.now() + duration;
  var iterations = 0;
  var mean = 0;
  do {
    var value = getRandomPlayoutValue();
    iterations++;
    mean += (value - mean) / iterations;
  } while (performance.now() < endTime);
  return {iterations, mean};
}

self.addEventListener("message", function(event) {
  run(10); // Warm-up
  var result = run(1000);
  self.postMessage(`${result.iterations} playouts with mean value ${result.mean.toFixed(3)}`);
});
