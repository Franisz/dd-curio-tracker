const dotenv = require("dotenv").config();
const fs = require("fs");
const { color } = require("console-log-colors");

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

function getCurioTracker(ddPath) {
  const paths = getFiles(ddPath);

  // all vanilla items that can be used on curios from the inventory
  // id: type
  var usableItems = {
    shovel: "supply",
    firewood: "supply",
    bandage: "supply",
    antivenom: "supply",
    skeleton_key: "supply",
    medicinal_herbs: "supply",
    torch: "supply",
    holy_water: "supply",
    dog_treats: "supply",
    laudanum: "supply",
    the_blood: "estate", // cc, the_blood#estate
    the_cure: "estate", // cc
    snake_scale: "estate", // shieldbreaker
    spice: "supply", // com, shard dust
    provision: "provision", // some items have special type and empty id
  };

  var curioList = {};
  var tempCurio = {
    prop_name_id: "",
    item_type: "",
    interactions: [],
  };

  var curioHeaderLine = 0;
  for (let i = 0; i < paths.length; i++) {
    // const fileName = paths[i].substr(paths[i].lastIndexOf("\\") + 1);
    if (!paths[i].endsWith("curio_type_library.csv")) continue;
    else console.log(`Input: ${paths[i]}`);

    const inputFile = fs.readFileSync(paths[i], "UTF8").toString();
    const fileLines = inputFile.split("\n");

    for (let j = 0; j < fileLines.length; j++) {
      // Single csv line
      const values = fileLines[j].split(",");
      if (values.length < 16) continue;

      // j == header line of new curio
      if (values[2].length && values[2] == "ID STRING") {
        if (tempCurio.prop_name_id.length) {
          curioList[tempCurio.prop_name_id] = {
            interactions: tempCurio.interactions,
          };

          tempCurio = {};
        }

        curioHeaderLine = j;
      }

      // values[2] - curio id
      if (j == curioHeaderLine + 1 && values[2].length) {
        tempCurio.prop_name_id = values[2];
        tempCurio.interactions = {};
      }

      // possible item interactions with the curio
      // values[4] - usable item id
      // values[16] - id of outcome image for the tracker
      if (j >= curioHeaderLine + 11 && values[4].length && values[16].length) {
        const item_values = values[4].split("#");
        const item_id = item_values[0] || item_values[1] || "";

        if (item_values[0] == item_values[1]) console.log(item_id);

        if (!usableItems[item_id]) {
          usableItems[item_id] = item_values[1] || "supply";
          console.log(
            color.yellow(
              `New usable detected: { ${item_id}: "${usableItems[item_id]}" }`
            )
          );
        }

        const item_type = item_values[1] || usableItems[item_id];

        tempCurio.interactions[item_id] = {
          item_type: item_type,
          curio_tracker_id: values[16],
        };
      }
    }
  }

  var curio_tracker = {
    // __revision_dont_touch: 1683488768,
    base_root: { version: 1, tracked_results: {} },
  };

  var num = 0;
  for (const curio in curioList) {
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
  }

  return curio_tracker;
}

const curioTracker = getCurioTracker(process.env.DDPATH);
const curioTrackerName = "curio_tracker.json";
fs.writeFile(
  `bin\\${curioTrackerName}`,
  JSON.stringify(curioTracker, null, 2),
  (err) => {
    if (err) throw err;
    console.log(`Output: \\bin\\${color.greenBright(curioTrackerName)}`);
  }
);
