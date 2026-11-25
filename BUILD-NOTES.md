# Build notes — Sizzle Station (best-cooking-game-20261125-0137)

## What this is

Sizzle Station is an original 2D cooking game written from scratch for the
Make the best cooking game bounty. One chef runs a small kitchen through a
150 second lunch shift. Tickets appear on the order board with a patience
bar; the chef fetches ingredients from the pantry, chops them on the board,
cooks them in one of two woks, assembles each dish on the plate and serves
it at the pass. Serving on time pays the dish price plus a tip for the
patience left, plus a combo bonus. A failed ticket costs a heart; three
lost hearts or the end of the shift ends the game.

## Why it should be fun to play

Six recipes share eight ingredients, and every ingredient has its own
preparation route: chilli, greens and cheese need only the board; rice,
noodle and egg need only the wok; chicken and prawn need both. That makes
every ticket a small route-planning puzzle, and the route changes as the
shift goes on: tickets arrive faster and grow less patient, and the last
thirty seconds are a rush hour. The board, the woks and the plate are all
places where work can sit half done, so the player is always deciding what
to start next instead of waiting on a timer.

## What is in the repository

The game lives under game as static files: an index page that opens in a
desktop browser and plays offline, with no network request. Its source is
split into files with one clear job each: random numbers, ingredients and
recipes, synthesized sounds, keyboard and mouse input, the kitchen rules,
the canvas drawing, the staged screenshot states, and the bootstrap with
the frame loop. The hand-in program at the repository root copies the game
and the screenshots to the output directory and writes the dossier with
the kit library, which is copied from the kit unchanged. A small static
server script is included for local play-testing only.

## Screenshots

Four screenshots sit under screenshots. Each is a real render of the
game's own code in a headless browser, taken at 1280 by 800 from a staged
state the game itself builds from a query string: the busy kitchen with
its order board and a dish mid-assembly; the chopping board at work; a
plate ready to serve at the pass; and rush hour with four tickets, a
nearly empty timer and a wok about to burn. The first by name is the
cover.

## Checks and limits

There is no numeric practice floor for this bounty, so no local benchmark
applies; the judge compares games pairwise by their screenshots and a
source outline. The game was play-tested in a headless browser: the title
screen starts a shift, the chef moves and interacts at every station, a
full dish can be cooked, plated and served, and the shift ends with a
results screen. The hand-in program was run twice and both runs wrote
identical bytes. The kit check was run locally on the repository and is
reported in the handoff.
