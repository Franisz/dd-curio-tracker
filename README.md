# dd-curio-tracker

Script for generating `persist.curio_tracker.json` - [Darkest Dungeon](https://store.steampowered.com/app/262060/Darkest_Dungeon/) save file for ingame curio tracker, describing all item-to-curio relations.
> Ready to use example can be found in [releases](../../releases) or [Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=2806761466).

## Setup

```bash
# install dependencies
$ npm install
```

Create `.env` file with path to Darkest Dungeon game folder.

```
DDPATH=F:\SteamLibrary\steamapps\common\DarkestDungeon
```

Generate `curio_tracker.json` file based on all `*curio_type_library.csv` files found.

> Mods that alter or add `curio_type_library` files can be placed in `DarkestDungeon\mods\` folder.

```bash
# generate curio_tracker.json
$ npm run generate
```

Darkest Dungeon uses encoded save files for the game, hashing some of the strings. `curio_tracker.json` must be encoded in order to work with the game.

Run npm script using java version of [DarkestDungeonSaveEditor](https://github.com/robojumper/DarkestDungeonSaveEditor).

```bash
# encode curio_tracker.json, requires java
$ npm run encode
```

Alternatively, encode using an [online version of DarkestDungeonSaveEditor](https://robojumper.github.io/DarkestDungeonSaveEditor/).

Encoded `persist.curio_tracker.json` file is ready to be used by the game and can be placed in save folder.
