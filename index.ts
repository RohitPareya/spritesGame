const WIDTH = 16;
const HEIGHT = WIDTH;
const CELLSIZE = 20;
const SCALE = 2.0;
const SPEED = 100;
const MAX_LEVEL = 1;
const SPRITES = WIDTH/2;

// level background colors
const BGCOLOR = ["white"];

interface Configuration {
  speed: number;
  nbCellsX: number;
  nbCellsY: number;
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  color: string;
}

type Direction = "Up" | "Right" | "Left" | "Down";

class Cell {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class Player {
  readonly INITIAL_DIRECTION = "Right";
  readonly INITIAL_POSITION = { x: 1, y: 1 };

  private head: Cell;
  private directions: Direction[];
  private game: Game;
  private moveCount: number = 0;

  constructor(game: Game) {
    this.game = game;
    this.directions = [this.INITIAL_DIRECTION];

    // initial head
    this.head = new Cell(this.INITIAL_POSITION.x, this.INITIAL_POSITION.y);
  }

  setDirection(direction: Direction) {
    const lastDirection = this.directions[this.directions.length - 1];
    if (lastDirection == "Up" && (direction == "Down" || direction == "Up")) {
      return;
    }
    if (lastDirection == "Down" && (direction == "Up" || direction == "Down")) {
      return;
    }
    if (
      lastDirection == "Left" &&
      (direction == "Right" || direction == "Left")
    ) {
      return;
    }
    if (
      lastDirection == "Right" &&
      (direction == "Left" || direction == "Right")
    ) {
      return;
    }
    this.directions.push(direction);
  }

  move() {
    // get next position
    this.head = this.getNext();
    this.moveCount = this.moveCount + 1;
  }

  getNext(): Cell {
    const direction =
      this.directions.length > 1
        ? this.directions.splice(0, 1)[0]
        : this.directions[0];
    switch (direction) {
      case "Up":
        return new Cell(this.head.x, this.head.y - 1);
      case "Right":
        return new Cell(this.head.x + 1, this.head.y);
      case "Down":
        return new Cell(this.head.x, this.head.y + 1);
      case "Left":
        return new Cell(this.head.x - 1, this.head.y);
    }
  }

  draw(time: number, context: CanvasRenderingContext2D) {
    const { cellWidth, cellHeight } = this.game.getConfiguration();
    // head
    const size = (CELLSIZE * SCALE) / 10;
    const offset = (CELLSIZE * SCALE) / 3;
    const x = cellWidth * this.head.x;
    const y = cellHeight * this.head.y;
    context.fillStyle = "red";
    context.fillRect(x, y, cellWidth, cellHeight);

    switch (this.directions[0]) {
      case "Up":
        context.beginPath();
        context.arc(x + offset, y + offset, size, 0, 2 * Math.PI, false);
        context.arc(x + 2 * offset, y + offset, size, 0, 2 * Math.PI, false);
        context.fillStyle = "white";
        context.fill();
        break;
      case "Down":
        context.beginPath();
        context.arc(x + offset, y + 2 * offset, size, 0, 2 * Math.PI, false);
        context.arc(
          x + 2 * offset,
          y + 2 * offset,
          size,
          0,
          2 * Math.PI,
          false
        );
        context.fillStyle = "white";
        context.fill();
        break;
      case "Right":
        context.beginPath();
        context.arc(x + 2 * offset, y + offset, size, 0, 2 * Math.PI, false);
        context.arc(
          x + 2 * offset,
          y + 2 * offset,
          size,
          0,
          2 * Math.PI,
          false
        );
        context.fillStyle = "white";
        context.fill();
        break;
      case "Left":
        context.beginPath();
        context.arc(x + offset, y + offset, size, 0, 2 * Math.PI, false);
        context.arc(x + offset, y + 2 * offset, size, 0, 2 * Math.PI, false);
        context.fillStyle = "white";
        context.fill();
        break;
    }
  }
  getHead() {
    return this.head;
  }
}

class Grid {
  private game: Game;
  private sprites: Cell[];

  constructor(game: Game) {
    this.game = game;
    this.sprites = [];
    this.seed();
  }

  seed() {
    const { nbCellsX, nbCellsY } = this.game.getConfiguration();
    const nbSprites = SPRITES * 1;
    for (let count = 0; count < nbSprites; count++) {
      let x = Math.floor(Math.random() * nbCellsX);
      let y = Math.floor(Math.random() * nbCellsY);
      this.sprites.push(new Cell(x, y));
    }
  }

  draw(time: number, context: CanvasRenderingContext2D) {
    const {
      width,
      height,
      cellWidth,
      cellHeight
    } = this.game.getConfiguration();

    context.fillStyle = "black";
    context.lineWidth = 1 * SCALE;

    for (let x = 0; x <= width; x += cellWidth) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = 0; y <= height; y += cellHeight) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    // sprites
    context.fillStyle = "green";
    this.sprites.forEach(cell =>
      context.fillRect(
        cellWidth * cell.x,
        cellHeight * cell.y,
        cellWidth,
        cellHeight
      )
    );
  }

  isApple(cell: Cell) {
    return this.sprites.find(el => cell.x == el.x && cell.y == el.y);
  }

  eat(cell: Cell) {
    this.sprites = this.sprites.filter(el => cell.x != el.x || cell.y != el.y);
  }

  isDone() {
    return this.sprites.length == 0;
  }
}

class Game {
  private canvas: HTMLCanvasElement;
  private score: number = 0;
  private running: boolean = false;
  private grid: Grid;
  private player: Player;
  private configuration: Configuration;
  private nextMove: number;
  private movesCount: number = 0;

  constructor() {
    this.canvas = document.createElement("Canvas") as HTMLCanvasElement;
    document.body.appendChild(this.canvas);

    this.canvas.style.width = WIDTH * CELLSIZE + "px";
    this.canvas.style.height = HEIGHT * CELLSIZE + "px";

    this.canvas.width = WIDTH * CELLSIZE * SCALE;
    this.canvas.height = HEIGHT * CELLSIZE * SCALE;

    this.configuration = {
      speed: SPEED,
      width: this.canvas.width,
      height: this.canvas.height,
      nbCellsX: WIDTH,
      nbCellsY: HEIGHT,
      cellWidth: this.canvas.width / WIDTH,
      cellHeight: this.canvas.height / HEIGHT,
      color: BGCOLOR[0]
    };

    this.player = new Player(this);
    this.grid = new Grid(this);

    // event listeners
    window.addEventListener("keydown", this.onKeyDown.bind(this), false);
  }

  start() {
    this.nextMove = 0;
    this.running = true;
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.running = false;
  }

  getConfiguration() {
    return this.configuration;
  }

  loop(time: number) {
    if (this.running) {
      requestAnimationFrame(this.loop.bind(this));

      if (time >= this.nextMove) {
        this.nextMove = time + this.configuration.speed;

        this.player.move();
        this.movesCount = this.movesCount + 1;
        switch (this.checkState()) {
          case -1:
            this.die();
            break;
          case 1:
            this.grid.eat(this.player.getHead());
            if (this.grid.isDone()) {
              this.win();
            }
          default:
            this.paint(time);
        }
      }
    }
  }

  paint(time: number) {
    const { width, height, color } = this.configuration;
    const context = this.canvas.getContext("2d");
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    context.font = 50 * SCALE + "px Arial";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillStyle = 'blue';
    context.fillText(this.movesCount.toString(), 10 * SCALE, 10 * SCALE);
    this.grid.draw(time, context);
    this.player.draw(time, context);
  }

  checkState() {
    const cell = this.player.getHead();

    if (this.isOutside(cell)) {
      return -1;
    }
    if (this.grid.isApple(cell)) {
      return 1;
    }
    return 0;
  }

  die() {
    alert("Play within the boundary.GAME OVER.");
    this.stop();
  }

  win() {
    alert("Final Score: " + this.movesCount);
    this.stop();
  }

  isOutside(cell: Cell) {
    const { nbCellsX, nbCellsY } = this.configuration;
    return cell.x < 0 || cell.x >= nbCellsX || cell.y < 0 || cell.y >= nbCellsY;
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        this.player.setDirection("Up");
        break;
      case "ArrowDown":
        event.preventDefault();
        this.player.setDirection("Down");
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.player.setDirection("Left");
        break;
      case "ArrowRight":
        event.preventDefault();
        this.player.setDirection("Right");
        break;
    }
  }
}

window.focus();
new Game().start();




