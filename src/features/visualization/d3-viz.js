import { select, selectAll } from 'd3-selection';
import { reduceWhile } from 'ramda';

import { zoomIdentity } from "d3-zoom";

import packWithLabel from './d3-viz/pack-with-label';
import toHierarchy from './d3-viz/to-hierarchy';
import appendCircles from './d3-viz/append-circles';
import setupZoom from './d3-viz/setup-zoom';

function d3Viz(rootNode) {

  const root = select(rootNode);
  const width = rootNode.clientWidth;
  const height = rootNode.clientHeight;

  const svg = root.append('svg')
    .attr('width', width)
    .attr('height', height);

  const zoomRoot = svg.append('g');
  zoomRoot
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', 'transparent')
    .attr('width', width)
    .attr('height', height)

  const circleRoot = zoomRoot.append('g');

  function update({ hierarchyConfig, data }) {

    const hierarchy = makeHierarchy(data, hierarchyConfig);
    const pack = packWithLabel().padding(0.001);
    pack(hierarchy);

    const nodes = appendCircles({
      root: circleRoot,
      packedData: hierarchy
    });

    const zoom = setupZoom({
      zoomRoot: zoomRoot,
      nodeRoot: circleRoot,
      nodes: nodes,
      width: width,
      height: height,
      packedData: hierarchy
    })
  }

  return {
    update
  }
}

const makeHierarchy = (data, hierarchyConfig) => {
  return toHierarchy(data, hierarchyConfig)
    .count()
    .sort(composeComparators([
      // Unknown goes last
      (a, b) => {
        if (a.data.fieldValue === 'Unknown') {
          return b.data.fieldValue === 'Unknown' ? 0 : 1;
        } else {
          return b.data.fieldValue === 'Unknown' ? -1: 0;
        }
      },

      // Larger groups go before smaller groups
      (a, b) => (b.value || 0) - (a.value || 0),

      // Sort by name
      (a, b) => (a.data.fieldValue || "").localeCompare(b.data.fieldValue || "")
    ]))

}


/**
 * Combine a list of comparator function ( (a, b) => Boolean )
 * in order into a single comparator.
*/
const composeComparators = (comparators) =>  (a, b) => (
  reduceWhile(
    (result) => result === 0, // keep comparing while a === b
    (_, comparator) => comparator(a, b),
    0,
    comparators
  )
)

export default d3Viz;
