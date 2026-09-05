import { describe, expect, it } from "vitest";
import { htmlToText } from "@/lib/classwork/html-to-text";

describe("htmlToText", () => {
  it("flattens blocks to lines and lists to dashes", () => {
    expect(htmlToText("<p>Read <b>chapter</b> 10.</p><ul><li>Bring goggles</li><li>Be on time</li></ul>")).toBe(
      "Read chapter 10.\n- Bring goggles\n- Be on time",
    );
  });

  it("decodes entities and drops scripts and styles", () => {
    expect(htmlToText("Tom &amp; Jerry &#8217;s &lt;lab&gt;<script>alert(1)</script><style>p{}</style>")).toBe(
      "Tom & Jerry ’s <lab>",
    );
  });

  it("settles whitespace", () => {
    expect(htmlToText("<div>  a   b </div>\n\n\n<div>c</div>")).toBe("a b\n\nc");
    expect(htmlToText("")).toBe("");
  });
});
