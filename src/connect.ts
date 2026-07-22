import { AUTO_REGION_ENTRY } from "./lib/regions";
import { connectToRegion } from "./lib/actions";

/** Connect using PIA's automatic (fastest) region selection. */
export default async function Command() {
  await connectToRegion(AUTO_REGION_ENTRY);
}
