import { describe, expect, it } from "vitest";
import { uniquePrivilegeKeys } from "../lib/privilege-utils";

describe("effective privileges", () => {
  it("unions multiple role memberships with direct grants without duplicates", () => {
    expect(uniquePrivilegeKeys(
      [["content.read", "content.create"], ["content.read", "content.publish"]],
      ["configuration.read", "content.publish"],
    ).sort()).toEqual(["configuration.read", "content.create", "content.publish", "content.read"]);
  });

  it("does not infer a deny rule from missing privileges", () => {
    expect(uniquePrivilegeKeys([["content.read"]], [])).toEqual(["content.read"]);
  });
});
