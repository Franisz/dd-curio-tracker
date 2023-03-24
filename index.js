const dotenv = require("dotenv").config();
const fs = require("fs");

function getFiles(dir, files_) {
  files_ = files_ || [];
  var files = fs.readdirSync(dir);
  for (var i in files) {
    var name = dir + "\\" + files[i];
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files_);
    } else {
      files_.push(name);
    }
  }
  return files_;
}

function addQuestCurio(path, curioList) {
  var { goals } = require(path);

  for (const quest of goals) {
    if (quest.type != "gather" && quest.type != "activate") continue;

    var curioName = `${quest.data.curio_name}_quest_${quest.type}`;
    if (quest.id.startsWith("inventory_activate_")) curioName += "_with";

    var usableItem =
      quest.starting_items && quest.starting_items[0]
        ? quest.starting_items[0]
        : {};

    curioList[curioName] = {
      interactions: usableItem,
    };
  }

  return curioList;
}

function addLibraryCurio(path, curioList) {
  const inputFile = fs.readFileSync(path, "UTF8").toString();
  const fileLines = inputFile.split("\n");

  var curioHeaderLine = 0;
  var lastCurioId = "";
  for (let i = 0; i < fileLines.length; i++) {
    // Single csv line
    const values = fileLines[i].split(",");
    if (values.length < 16) continue;

    // i == header line of new curio
    if (values[2].length && values[2] == "ID STRING") {
      curioHeaderLine = i;
    }

    // values[2] - curio id
    if (i == curioHeaderLine + 1 && values[2].length) {
      lastCurioId = values[2];

      curioList[lastCurioId] = {
        interactions: {},
      };
    }

    // possible item interactions with the curio
    // values[4] - usable item id
    // values[16] - id of outcome image for the tracker
    if (i >= curioHeaderLine + 11 && values[4].length && values[16].length) {
      const item_values = values[4].split("#");
      const item_id = item_values[0] || item_values[1] || "";

      // adding unknown items to usableItems list
      if (!usableItems[item_id]) {
        usableItems[item_id] = item_values[1] || "supply";
        console.log(
          `New usable detected: { ${item_id}: "${usableItems[item_id]}" }`
        );
      }

      const item_type = item_values[1] || usableItems[item_id];

      curioList[lastCurioId].interactions[item_id] = {
        item_type: item_type,
        curio_tracker_id: values[16],
      };
    }
  }

  return curioList;
}

function getCurioList(ddPath) {
  // array of paths to all files in Darkest Dungeon folder
  const paths = getFiles(ddPath);

  var curioList = {};
  for (const path of paths) {
    if (path.endsWith("quest.types.json")) {
      console.log(`Input: ${path}`);
      addQuestCurio(path, curioList);
      continue;
    }

    if (path.endsWith("curio_type_library.csv")) {
      console.log(`Input: ${path}`);
      addLibraryCurio(path, curioList);
      continue;
    }
  }

  return curioList;
}

// all vanilla quest curios with their respective quest items
// quest curio are either activated without any item or with a specific quest item
// items of quest_item type don't have quest tracker icon, so they aren't added to usable items list
// quest curios don't have to appear in curio libraries, but if they do, everything will still work fine

function getCurioTracker(curioList) {
  var curio_tracker = {
    // __revision_dont_touch: 1683488768,
    base_root: { version: 1, tracked_results: {} },
  };

  var num = 0;
  for (const curio in curioList)
    for (const usable in usableItems) {
      const type_hash = curioList[curio].item_type || usableItems[usable];
      const tracker_id =
        (curioList[curio].interactions[usable] &&
          curioList[curio].interactions[usable].curio_tracker_id) ||
        "no_effect";

      curio_tracker.base_root.tracked_results[num++] = {
        prop_name_id: `###${curio}`,
        item_type_hash: `###${type_hash}`,
        item_id_hash: type_hash == usable ? "" : `###${usable}`, // empty id for items with special type
        curio_tracker_id: tracker_id,
      };
    }

  return curio_tracker;
}

// all vanilla items that can be used on curios from the inventory
// id: type
const usableItems = require("./data/usable_items.json");

// list of all curios and their interactable items if there are any
const curioList = getCurioList(process.env.DDPATH);

const curioTracker = getCurioTracker(curioList);
const curioTrackerName = "curio_tracker.json";
fs.writeFile(
  `bin\\${curioTrackerName}`,
  JSON.stringify(curioTracker, null, 2),
  (err) => {
    if (err) throw err;
    console.log(`Output: \\bin\\${curioTrackerName}`);
  }
);
