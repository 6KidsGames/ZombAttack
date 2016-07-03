'use strict';

/** Returned by TicTacToeBoard.addPlayer() on a stalemate condition. */
const stalemate = 'STALEMATE';

/** Defines a Tic-Tac-Toe board. */
class TicTacToeBoard {
    constructor() {
        this.board = new Array(3);
        for (var i = 0; i < 3; i++) {
            this.board[i] = new Array(3);
        }
    }
    
    get board() { return this.board; }

    /**
     * Adds a piece to the board, calculating whether either player has won.
     * @param {number} row - Row number 0..2
     * @param {number} column - Column nummber 0..2
     * @param  {PlayerPiece} playerPiece - The player piece to add. 
     * @return {PlayerPiece} Undefined if there is not yet a winning condition, a PlayerPiece of the winner,
     * or PlayerPiece.Stalemate if the board is full (stalemate). 
     */
     addPlayerMove(row, column, playerPiece) {
        if (!this.board[row][column]) {
            this[row][col] = playerPiece;
        } else {
            throw "Position (" + row + ", " + col + ") already has a piece in it";
        }
        
        // Check for a win - 3 in a row/col or on diagonals.
        for (var  i = 0; i < 3; i++) {
            if (this.board[i][0] &&
                    this.board[i][0] === this.board[i][1] &&
                    this.board[i][1] === this.board[i][2]) {
                return this.board[i][0];
            }
            if (this.board[0][i] &&
                    this.board[0][i] === this.board[1][i] &&
                    this.board[1][i] === this.board[2][i]) {
                return this.board[0][i];
            }
        }
        if (this.board[0][0] &&
                this.board[0][0] === this.board[1][1] &&
                this.board[1][1] === this.board[2][2]) {
            return this.board[0][0];
        }
        if (this.board[2][0] &&
                this.board[2][0] === this.board[1][1] &&
                this.board[1][1] === this.board[0][2]) {
            return this.board[2][0];
        }
        
        // Check for a stalemate - all positions filled but no win found above.
        var numFilled = 0;
        for (var  i = 0; i < 3; i++) {
            for (var j = 0; i < 3; j++) {
                if (this.board[i]) {
                    numFilled++;
                }
            }
        }
        if (numFilled === 9) {
            return stalemate;
        }

        return undefined;
    }
}
