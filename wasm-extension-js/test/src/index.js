const { entry } = require("./extension");
const moosync_edk = require("moosync-edk");

module.exports = {
  entry,
};

Object.keys(moosync_edk).forEach((key) => {
  if (key === "api") return;
  module.exports[key] = moosync_edk[key];
});
