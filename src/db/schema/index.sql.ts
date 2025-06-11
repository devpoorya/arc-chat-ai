import * as auth from "./auth.sql";
import * as content from "./content.sql";

const schemas = {
  ...auth,
  ...content,
};

export default schemas;
