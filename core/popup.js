(function html() {
    document.body.style.width = "auto";
    setTimeout(function() {
        window.focus();
    }, 500);
})();

document.addEventListener("DOMContentLoaded", function(event) {
    var need_localize = document.querySelectorAll("[l_content]");
    for (var i = 0; i < need_localize.length; i++) {
        var l_contents = need_localize[i].getAttribute("l_content").split(",");
        var l_attrs = need_localize[i].getAttribute("l_attr");
        l_attrs && (l_attrs = l_attrs.split(","));
        for (var k = 0; k < l_contents.length; k++) {
            var content = chrome.i18n.getMessage(l_contents[k]);
            if (l_attrs && k < l_attrs.length) {
                need_localize[i].setAttribute(l_attrs[k], content);
            } else {
                need_localize[i].textContent = content;
            }
        }
    }
});

Function.prototype.bind = Function.prototype.bind || function(target) {
    var self = this;
    return function(args) {
        if (!(args instanceof Array)) {
            args = [args];
        }
        self.apply(target, args);
    };
};


(function() {
    if (typeof window.Element === "undefined" ||
        "classList" in document.documentElement) {
        return;
    }

    var prototype = Array.prototype,
        push = prototype.push,
        splice = prototype.splice,
        join = prototype.join;

    function DOMTokenList(el) {
        this.el = el;
        var classes = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            push.call(this, classes[i]);
        }
    }

    DOMTokenList.prototype = {
        add: function(token) {
            if (this.contains(token)) return;
            push.call(this, token);
            this.el.className = this.toString();
        },
        contains: function(token) {
            return this.el.className.indexOf(token) != -1;
        },
        item: function(index) {
            return this[index] || null;
        },
        remove: function(token) {
            if (!this.contains(token)) return;
            for (var i = 0; i < this.length; i++) {
                if (this[i] == token) break;
            }
            splice.call(this, i, 1);
            this.el.className = this.toString();
        },
        toString: function() {
            return join.call(this, ' ');
        },
        toggle: function(token) {
            if (!this.contains(token)) {
                this.add(token);
            } else {
                this.remove(token);
            }

            return this.contains(token);
        }
    };

    window.DOMTokenList = DOMTokenList;

    function defineElementGetter(obj, prop, getter) {
        if (Object.defineProperty) {
            Object.defineProperty(obj, prop, {
                get: getter
            });
        } else {
            obj.__defineGetter__(prop, getter);
        }
    }

    defineElementGetter(HTMLElement.prototype, 'classList', function() {
        return new DOMTokenList(this);
    });
})();


(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());



function KeyboardInputManager() {
    this.events = {};

    if (window.navigator.msPointerEnabled) {
        this.eventTouchstart = "MSPointerDown";
        this.eventTouchmove = "MSPointerMove";
        this.eventTouchend = "MSPointerUp";
    } else {
        this.eventTouchstart = "touchstart";
        this.eventTouchmove = "touchmove";
        this.eventTouchend = "touchend";
    }

    this.listen();
}

KeyboardInputManager.keyDownEnabled = true;
KeyboardInputManager.enableKeyDown = function(enable) {
    KeyboardInputManager.keyDownEnabled = enable;
};

KeyboardInputManager.prototype.on = function(event, callback) {
    if (!this.events[event]) {
        this.events[event] = [];
    }
    this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function(event, data) {
    var callbacks = this.events[event];
    if (callbacks) {
        callbacks.forEach(function(callback) {
            callback(data);
        });
    }
};

KeyboardInputManager.prototype.listen = function() {
    var self = this;

    var map = {
        38: 0,
        39: 1,
        40: 2,
        37: 3,
        75: 0,
        76: 1,
        74: 2,
        72: 3,
        87: 0,
        68: 1,
        83: 2,
        65: 3
    };

    document.addEventListener("keydown", function(event) {
        if (!event.isTrusted) {
            return;
        }
        if (!KeyboardInputManager.keyDownEnabled) return;

        var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
            event.shiftKey;
        var mapped = map[event.which];

        if (!modifiers) {
            if (mapped !== undefined) {
                event.preventDefault();
                self.emit("move", mapped);
            }
        }

        if (!modifiers && event.which === 82) {
            self.restart.call(self, event);
        }

        var m = document.querySelector(".game-message");
        if (!modifiers && event.which === 13 &&
            (m.classList.contains("game-won") || m.classList.contains("game-over"))) {
            self.restart.call(self, event);
        }
    });

    this.bindButtonPress(".retry-button", this.restart);
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".keep-playing-button", this.keepPlaying);
    this.bindButtonPress(".best-container", this.bestScoreClick);
    this.bindButtonPress(".leaderboard-btn", this.leaderboardClick);

    var touchStartClientX, touchStartClientY;
    var gameContainer = document.getElementsByClassName("game-container")[0];

    gameContainer.addEventListener(this.eventTouchstart, function(event) {
        if (!event.isTrusted) {
            return;
        }
        if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
            event.targetTouches > 1) {
            return;
        }

        if (window.navigator.msPointerEnabled) {
            touchStartClientX = event.pageX;
            touchStartClientY = event.pageY;
        } else {
            touchStartClientX = event.touches[0].clientX;
            touchStartClientY = event.touches[0].clientY;
        }

        event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchmove, function(event) {
        event.preventDefault();
    });

    gameContainer.addEventListener(this.eventTouchend, function(event) {
        if (!event.isTrusted) {
            return;
        }
        if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
            event.targetTouches > 0) {
            return;
        }

        var touchEndClientX, touchEndClientY;

        if (window.navigator.msPointerEnabled) {
            touchEndClientX = event.pageX;
            touchEndClientY = event.pageY;
        } else {
            touchEndClientX = event.changedTouches[0].clientX;
            touchEndClientY = event.changedTouches[0].clientY;
        }

        var dx = touchEndClientX - touchStartClientX;
        var absDx = Math.abs(dx);

        var dy = touchEndClientY - touchStartClientY;
        var absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) > 10) {
            self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
        }
    });
};

KeyboardInputManager.prototype.restart = function(event) {
    if (!event.isTrusted) {
        return;
    }
    event.preventDefault();
    this.emit("restart");
};

KeyboardInputManager.prototype.keepPlaying = function(event) {
    if (!event.isTrusted) {
        return;
    }
    event.preventDefault();
    this.emit("keepPlaying");
};

KeyboardInputManager.prototype.bestScoreClick = function(event) {
    if (!event.isTrusted) {
        return;
    }
    event.preventDefault();
    this.emit("bestScoreClick");
};

KeyboardInputManager.prototype.leaderboardClick = function(event) {
    if (!event.isTrusted) {
        return;
    }
    event.preventDefault();
    this.emit("leaderboardClick");
};

KeyboardInputManager.prototype.bindButtonPress = function(selector, fn) {
    var button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
};


function HTMLActuator() {
    this.tileContainer = document.querySelector(".tile-container");
    this.scoreContainer = document.querySelector(".score-container");
    this.bestContainer = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
    this.leaderboardBtn = document.querySelector(".leaderboard-btn");

    this.score = 0;
    this.leaderboard = new Leaderboard();
}

HTMLActuator.prototype.actuate = function(grid, metadata) {
    var self = this;

    window.requestAnimationFrame(function() {
        self.clearContainer(self.tileContainer);

        grid.cells.forEach(function(column) {
            column.forEach(function(cell) {
                if (cell) {
                    self.addTile(cell);
                }
            });
        });

        self.updateScore(metadata.score);
        self.updateBestScore(metadata.bestScore);

        if (metadata.terminated) {
            if (metadata.over) {
                if (!self.leaderboardBtn.classList.contains('hidden') && metadata.score > self.leaderboard.bestLBScore()) {
                    self.showLeaderboardSuggestion(metadata.scoreObj, false);
                } else {
                    self.message(false);
                }
            } else if (metadata.won) {
                self.message(true);
            }
        }

    });
};

HTMLActuator.prototype.continueGame = function() {
    this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
};

HTMLActuator.prototype.addTile = function(tile) {
    var self = this;

    var wrapper = document.createElement("div");
    var inner = document.createElement("div");
    var position = tile.previousPosition || {
        x: tile.x,
        y: tile.y
    };
    var positionClass = this.positionClass(position);

    var classes = ["tile", "tile-" + tile.value, positionClass];

    if (tile.value > 2048) classes.push("tile-super");

    this.applyClasses(wrapper, classes);

    inner.classList.add("tile-inner");
    inner.textContent = tile.value;

    if (tile.previousPosition) {
        window.requestAnimationFrame(function() {
            classes[2] = self.positionClass({
                x: tile.x,
                y: tile.y
            });
            self.applyClasses(wrapper, classes);
        });
    } else if (tile.mergedFrom) {
        classes.push("tile-merged");
        this.applyClasses(wrapper, classes);

        tile.mergedFrom.forEach(function(merged) {
            self.addTile(merged);
        });
    } else {
        classes.push("tile-new");
        this.applyClasses(wrapper, classes);
    }

    wrapper.appendChild(inner);

    this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function(element, classes) {
    element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function(position) {
    return {
        x: position.x + 1,
        y: position.y + 1
    };
};

HTMLActuator.prototype.positionClass = function(position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function(score) {
    this.clearContainer(this.scoreContainer);

    var difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;

    if (difference > 0) {
        var addition = document.createElement("div");
        addition.classList.add("score-addition");
        addition.textContent = "+" + difference;

        this.scoreContainer.appendChild(addition);
    }
};

HTMLActuator.prototype.updateBestScore = function(bestScore) {
    this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.showLeaderboardSuggestion = function(scoreObj, userClick) {
    if (userClick && this.leaderboard.isOpened()) {
        this.leaderboard.hide();
        this.leaderboardBtn.classList.remove("back");
    } else {
        this.leaderboardBtn.classList.add("back");
        this.leaderboard.showSuggestion(scoreObj, userClick);
    }
}

HTMLActuator.prototype.message = function(won) {
    var type = won ? "game-won" : "game-over";
    var message = won ? chrome.i18n.getMessage("victory") : chrome.i18n.getMessage("game_over");

    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
};

HTMLActuator.prototype.clearMessage = function() {
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
    this.leaderboardBtn.classList.remove("back");
    this.leaderboard.hide();
};


function Grid(size, previousState) {
    this.size = size;
    this.cells = previousState ? this.fromState(previousState) : this.empty();
}

Grid.prototype.empty = function() {
    var cells = [];

    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];

        for (var y = 0; y < this.size; y++) {
            row.push(null);
        }
    }

    return cells;
};

Grid.prototype.fromState = function(state) {
    var cells = [];

    for (var x = 0; x < this.size; x++) {
        var row = cells[x] = [];

        for (var y = 0; y < this.size; y++) {
            var tile = state[x][y];
            row.push(tile ? new Tile(tile.position, tile.value) : null);
        }
    }

    return cells;
};

Grid.prototype.randomAvailableCell = function() {
    var cells = this.availableCells();

    if (cells.length) {
        return cells[Math.floor(Math.random() * cells.length)];
    }
};

Grid.prototype.availableCells = function() {
    var cells = [];

    this.eachCell(function(x, y, tile) {
        if (!tile) {
            cells.push({
                x: x,
                y: y
            });
        }
    });

    return cells;
};

Grid.prototype.eachCell = function(callback) {
    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            callback(x, y, this.cells[x][y]);
        }
    }
};

Grid.prototype.cellsAvailable = function() {
    return !!this.availableCells().length;
};

Grid.prototype.cellAvailable = function(cell) {
    return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function(cell) {
    return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function(cell) {
    if (this.withinBounds(cell)) {
        return this.cells[cell.x][cell.y];
    } else {
        return null;
    }
};

Grid.prototype.insertTile = function(tile) {
    this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function(tile) {
    this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function(position) {
    return position.x >= 0 && position.x < this.size &&
        position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function() {
    var cellState = [];

    for (var x = 0; x < this.size; x++) {
        var row = cellState[x] = [];

        for (var y = 0; y < this.size; y++) {
            row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
        }
    }

    return {
        size: this.size,
        cells: cellState
    };
};


function Tile(position, value) {
    this.x = position.x;
    this.y = position.y;
    this.value = value || 2;

    this.previousPosition = null;
    this.mergedFrom = null;
}

Tile.prototype.savePosition = function() {
    this.previousPosition = {
        x: this.x,
        y: this.y
    };
};

Tile.prototype.updatePosition = function(position) {
    this.x = position.x;
    this.y = position.y;
};

Tile.prototype.serialize = function() {
    return {
        position: {
            x: this.x,
            y: this.y
        },
        value: this.value
    };
};

function LocalStorageManager() {
    this.bestScoreKey = "bestScore";
    this.gameStateKey = "gameState";

    this.storage = window.ABStorage;
    this.sStorage = window.SyncStorage;
}

LocalStorageManager.prototype.localStorageSupported = function() {
    var testKey = "test";
    var storage = window.localStorage;

    try {
        storage.setItem(testKey, "1");
        storage.removeItem(testKey);
        return true;
    } catch (error) {
        return false;
    }
};

LocalStorageManager.prototype.getBestScore = function(callback) {
    this.sStorage.getItem(this.bestScoreKey, function(val) {
        if (!val) {
            val = this.storage.getItem(this.bestScoreKey) || 0;
            this.sStorage.setItem(this.bestScoreKey, val, function() {
                callback(val);
            }.bind(this));
        } else {
            callback(val);
        }
    }.bind(this));
};

LocalStorageManager.prototype.setBestScore = function(score, callback) {
    this.sStorage.setItem(this.bestScoreKey, score, callback);
};

LocalStorageManager.prototype.getGameState = function(callback) {
    this.sStorage.getItem(this.gameStateKey, function(val) {
        if (!val) {
            try {
                var oldValue = this.storage.getItem(this.gameStateKey);
                val = oldValue && JSON.parse(oldValue);
            } catch (e) {}
            this.storage.removeItem(this.gameStateKey);
            this.sStorage.setItem(this.gameStateKey, val, function() {
                callback(val);
            }.bind(this));
        } else {
            callback(val);
        }
    }.bind(this));
};

LocalStorageManager.prototype.setGameState = function(gameState, callback) {
    this.sStorage.setItem(this.gameStateKey, gameState, callback);
};

LocalStorageManager.prototype.clearGameState = function(callback) {
    this.sStorage.removeItem(this.gameStateKey, callback);
};

LocalStorageManager.prototype.isItFirstLaunch = function() {
    var launched = this.storage.getItem("launched");
    if (launched) {
        return false;
    } else {
        this.storage.setItem("launched", "1");
        return true;
    }
};


function GameManager(size, InputManager, Actuator, StorageManager) {
    this.size = size;
    this.inputManager = new InputManager;
    this.storageManager = new StorageManager;
    this.actuator = new Actuator;

    this.startTiles = 2;
    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
    this.inputManager.on("leaderboardClick", this.leaderboardClick.bind(this));

    this.setup();
}

GameManager.prototype.restart = function() {
    this.storageManager.clearGameState(function() {
        this.actuator.continueGame();
        this.setup();
    }.bind(this));
};

GameManager.prototype.keepPlaying = function() {
    this.keepPlaying = true;
    this.actuator.continueGame();
};

GameManager.prototype.leaderboardClick = function() {
    this.actuator.showLeaderboardSuggestion(this.over ? {
        score: this.score,
        steps: this.steps,
        board: this.grid.serialize()
    } : null, true);
};

GameManager.prototype.isGameTerminated = function() {
    if (this.over || (this.won && !this.keepPlaying)) {
        return true;
    } else {
        return false;
    }
};

GameManager.prototype.setup = function() {
    this.storageManager.getGameState(function(previousState) {
        if (previousState) {
            this.grid = new Grid(previousState.grid.size,
                previousState.grid.cells);
            this.score = previousState.score;
            this.over = previousState.over;
            this.won = previousState.won;
            this.keepPlaying = previousState.keepPlaying;
            this.steps = Number.isInteger(previousState.steps) ? previousState.steps : null;
        } else {

            if (this.storageManager.isItFirstLaunch()) {
                var lesson = document.getElementById("start-lesson");
                lesson.style.display = 'block';

                function removeLesson() {
                    lesson.remove();
                    document.removeEventListener("keydown", removeLesson);
                }
                lesson.addEventListener("click", removeLesson);
                document.addEventListener("keydown", removeLesson);
            }

            this.grid = new Grid(this.size);
            this.score = 0;
            this.over = false;
            this.won = false;
            this.keepPlaying = false;
            this.steps = 0;

            this.addStartTiles();
        }
        if (this.steps === null) {
            document.querySelector(".leaderboard-btn").classList.add("hidden");
        } else {
            document.querySelector(".leaderboard-btn").classList.remove("hidden");
        }
        this.actuate();
    }.bind(this));
};

GameManager.prototype.addStartTiles = function() {
    for (var i = 0; i < this.startTiles; i++) {
        this.addRandomTile();
    }
};

GameManager.prototype.addRandomTile = function() {
    if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);

        this.grid.insertTile(tile);
    }
};

GameManager.prototype.actuate = function() {
    this.storageManager.getBestScore(function(best_score) {
        if (best_score < this.score) {
            best_score = this.score;
            this.storageManager.setBestScore(best_score);
        }

        if (this.over) {
            this.storageManager.clearGameState();
        } else {
            this.storageManager.setGameState(this.serialize());
        }

        this.actuator.actuate(this.grid, {
            score: this.score,
            scoreObj: {
                score: this.score,
                steps: this.steps,
                board: this.grid.serialize()
            },
            over: this.over,
            won: this.won,
            bestScore: best_score,
            terminated: this.isGameTerminated()
        });
    }.bind(this));
};

GameManager.prototype.serialize = function() {
    return {
        grid: this.grid.serialize(),
        score: this.score,
        over: this.over,
        won: this.won,
        keepPlaying: this.keepPlaying,
        steps: this.steps
    };
};

GameManager.prototype.prepareTiles = function() {
    this.grid.eachCell(function(x, y, tile) {
        if (tile) {
            tile.mergedFrom = null;
            tile.savePosition();
        }
    });
};

GameManager.prototype.moveTile = function(tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
};

GameManager.prototype.move = function(direction) {
    var self = this;

    if (this.isGameTerminated()) return;

    var cell, tile;

    var vector = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved = false;

    this.prepareTiles();

    traversals.x.forEach(function(x) {
        traversals.y.forEach(function(y) {
            cell = {
                x: x,
                y: y
            };
            tile = self.grid.cellContent(cell);

            if (tile) {
                var positions = self.findFarthestPosition(cell, vector);
                var next = self.grid.cellContent(positions.next);

                if (next && next.value === tile.value && !next.mergedFrom) {
                    var merged = new Tile(positions.next, tile.value * 2);
                    merged.mergedFrom = [tile, next];

                    self.grid.insertTile(merged);
                    self.grid.removeTile(tile);

                    tile.updatePosition(positions.next);

                    self.score += merged.value;

                    if (merged.value === 2048) self.won = true;
                } else {
                    self.moveTile(tile, positions.farthest);
                }

                if (!self.positionsEqual(cell, tile)) {
                    moved = true;
                }
            }
        });
    });

    if (moved) {
        Number.isInteger(this.steps) && this.steps++;
        this.addRandomTile();

        if (!this.movesAvailable()) {
            this.over = true;
        }

        this.actuate();
    }
};

GameManager.prototype.getVector = function(direction) {
    var map = {
        0: {
            x: 0,
            y: -1
        },
        1: {
            x: 1,
            y: 0
        },
        2: {
            x: 0,
            y: 1
        },
        3: {
            x: -1,
            y: 0
        }
    };

    return map[direction];
};

GameManager.prototype.buildTraversals = function(vector) {
    var traversals = {
        x: [],
        y: []
    };

    for (var pos = 0; pos < this.size; pos++) {
        traversals.x.push(pos);
        traversals.y.push(pos);
    }

    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
};

GameManager.prototype.findFarthestPosition = function(cell, vector) {
    var previous;

    do {
        previous = cell;
        cell = {
            x: previous.x + vector.x,
            y: previous.y + vector.y
        };
    } while (this.grid.withinBounds(cell) &&
    this.grid.cellAvailable(cell));

    return {
        farthest: previous,
        next: cell
    };
};

GameManager.prototype.movesAvailable = function() {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

GameManager.prototype.tileMatchesAvailable = function() {
    var self = this;

    var tile;

    for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
            tile = this.grid.cellContent({
                x: x,
                y: y
            });

            if (tile) {
                for (var direction = 0; direction < 4; direction++) {
                    var vector = self.getVector(direction);
                    var cell = {
                        x: x + vector.x,
                        y: y + vector.y
                    };

                    var other = self.grid.cellContent(cell);

                    if (other && other.value === tile.value) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
};

GameManager.prototype.positionsEqual = function(first, second) {
    return first.x === second.x && first.y === second.y;
};

window.requestAnimationFrame(function() {
    new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});