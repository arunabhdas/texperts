/**
 * Environment Tree — hierarchical representation of the world.
 * Nodes represent locations and objects. Edges represent containment.
 */

export interface EnvironmentNode {
  id: string;
  name: string;
  type: "world" | "location" | "object";
  children: EnvironmentNode[];
}

const THINK_TANK: EnvironmentNode = {
  id: "think_tank",
  name: "The Think Tank",
  type: "world",
  children: [
    {
      id: "boardroom", name: "The Boardroom", type: "location",
      children: [
        { id: "conference_table", name: "conference table", type: "object", children: [] },
        { id: "projector_screen", name: "projector screen", type: "object", children: [] },
        { id: "chairs", name: "chairs", type: "object", children: [] },
      ],
    },
    {
      id: "whiteboard", name: "The Whiteboard Corner", type: "location",
      children: [
        { id: "whiteboard_board", name: "whiteboard", type: "object", children: [] },
        { id: "markers", name: "markers", type: "object", children: [] },
      ],
    },
    {
      id: "library", name: "The Library", type: "location",
      children: [
        { id: "bookshelves", name: "bookshelves", type: "object", children: [] },
        { id: "reading_desk", name: "reading desk", type: "object", children: [] },
        { id: "research_terminal", name: "research terminal", type: "object", children: [] },
      ],
    },
    {
      id: "breakroom", name: "The Break Room", type: "location",
      children: [
        { id: "coffee_machine", name: "coffee machine", type: "object", children: [] },
        { id: "snack_table", name: "snack table", type: "object", children: [] },
        { id: "couch", name: "couch", type: "object", children: [] },
      ],
    },
    {
      id: "office_visionary", name: "Office: Visionary", type: "location",
      children: [
        { id: "visionary_desk", name: "desk", type: "object", children: [] },
        { id: "vision_board", name: "vision board", type: "object", children: [] },
      ],
    },
    {
      id: "office_skeptic", name: "Office: Skeptic", type: "location",
      children: [
        { id: "skeptic_desk", name: "desk", type: "object", children: [] },
        { id: "spreadsheet_monitor", name: "spreadsheet monitor", type: "object", children: [] },
      ],
    },
    {
      id: "office_builder", name: "Office: Builder", type: "location",
      children: [
        { id: "builder_desk", name: "desk", type: "object", children: [] },
        { id: "code_terminal", name: "code terminal", type: "object", children: [] },
      ],
    },
    {
      id: "office_whisperer", name: "Office: Customer Whisperer", type: "location",
      children: [
        { id: "whisperer_desk", name: "desk", type: "object", children: [] },
        { id: "feedback_wall", name: "customer feedback wall", type: "object", children: [] },
      ],
    },
    {
      id: "office_devil", name: "Office: Devil's Advocate", type: "location",
      children: [
        { id: "devil_desk", name: "desk", type: "object", children: [] },
        { id: "devil_figurine", name: "devil figurine", type: "object", children: [] },
      ],
    },
    {
      id: "podium", name: "The Podium", type: "location",
      children: [
        { id: "lectern", name: "lectern", type: "object", children: [] },
        { id: "audience_seats", name: "audience seats", type: "object", children: [] },
      ],
    },
  ],
};

export class EnvironmentTree {
  private root: EnvironmentNode;

  constructor() {
    this.root = THINK_TANK;
  }

  getRoot(): EnvironmentNode {
    return this.root;
  }

  getLocation(id: string): EnvironmentNode | null {
    return this.findNode(this.root, id);
  }

  getLocations(): EnvironmentNode[] {
    return this.root.children;
  }

  /** Convert tree to natural language description for an agent. */
  toNaturalLanguage(): string {
    const lines: string[] = [`You are in ${this.root.name}.`, "Available locations:"];
    for (const loc of this.root.children) {
      const objects = loc.children.map((c) => c.name).join(", ");
      lines.push(`- ${loc.name}${objects ? ` (contains: ${objects})` : ""}`);
    }
    return lines.join("\n");
  }

  private findNode(node: EnvironmentNode, id: string): EnvironmentNode | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findNode(child, id);
      if (found) return found;
    }
    return null;
  }
}
