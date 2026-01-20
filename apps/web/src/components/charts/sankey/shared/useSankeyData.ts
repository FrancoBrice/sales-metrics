import { useMemo } from "react";

interface SankeyNode {
  name: string;
  category: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface UseSankeyDataOptions {
  data: SankeyData | null;
  hiddenNodes: Set<string>;
  firstCategory: string;
}

export function useSankeyData({ data, hiddenNodes, firstCategory }: UseSankeyDataOptions) {
  return useMemo(() => {
    if (!data) return null;

    let currentlyHidden = new Set(hiddenNodes);
    let changed = true;
    let iterations = 0;
    const maxIterations = data.nodes.length;

    while (changed && iterations < maxIterations) {
      iterations++;
      changed = false;
      const activeLinks = data.links.filter((link) => {
        if (link.source < 0 || link.source >= data.nodes.length) return false;
        if (link.target < 0 || link.target >= data.nodes.length) return false;
        const sourceHidden = currentlyHidden.has(data.nodes[link.source].name);
        const targetHidden = currentlyHidden.has(data.nodes[link.target].name);
        return !sourceHidden && !targetHidden;
      });

      const nodesWithIncomingLinks = new Set<number>();
      activeLinks.forEach((link) => {
        nodesWithIncomingLinks.add(link.target);
      });

      const nodesToHide: number[] = [];
      data.nodes.forEach((node, index) => {
        if (currentlyHidden.has(node.name)) return;
        if (node.category === firstCategory) return;

        if (!nodesWithIncomingLinks.has(index)) {
          nodesToHide.push(index);
        }
      });

      if (nodesToHide.length > 0) {
        nodesToHide.forEach((index) => {
          currentlyHidden.add(data.nodes[index].name);
        });
        changed = true;
      }
    }

    const activeNodes = data.nodes.filter((n) => !currentlyHidden.has(n.name));

    const indexMap = new Array(data.nodes.length).fill(-1);
    data.nodes.forEach((node, oldIndex) => {
      if (!currentlyHidden.has(node.name)) {
        const newIndex = activeNodes.findIndex((n) => n.name === node.name);
        indexMap[oldIndex] = newIndex;
      }
    });

    const activeLinks = data.links
      .filter((link) => {
        if (link.source < 0 || link.source >= data.nodes.length) return false;
        if (link.target < 0 || link.target >= data.nodes.length) return false;
        if (link.source === link.target) return false;
        const sourceVisible = !currentlyHidden.has(data.nodes[link.source].name);
        const targetVisible = !currentlyHidden.has(data.nodes[link.target].name);
        return sourceVisible && targetVisible;
      })
      .map((link) => ({
        ...link,
        source: indexMap[link.source],
        target: indexMap[link.target],
      }))
      .filter((link) => {
        return link.source >= 0 && link.target >= 0 && link.source < activeNodes.length && link.target < activeNodes.length && link.source !== link.target;
      });

    return { nodes: activeNodes, links: activeLinks, autoHiddenNodes: currentlyHidden };
  }, [data, hiddenNodes, firstCategory]);
}
