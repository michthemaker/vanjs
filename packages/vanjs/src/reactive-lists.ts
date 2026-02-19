// Reactive list handling using comment node markers
// This approach allows rendering arrays of nodes without wrapper elements

/**
 * Represents a list binding with start/end markers and the nodes in between
 */
export type ListBinding = {
	startMarker: Comment;
	endMarker: Comment;
	nodes: Node[];
};

/**
 * Creates a list binding with comment markers for an array of nodes
 * @param nodes - Array of DOM nodes to bind
 * @returns ListBinding object with markers and nodes
 */
export let createListBinding = (nodes: Node[]): ListBinding => {
	let startMarker = new Comment("list-start");
	let endMarker = new Comment("list-end");
	return {
		startMarker,
		endMarker,
		nodes,
	};
};

/**
 * Updates an existing list binding with new nodes
 * Removes old nodes between markers and inserts new ones
 * @param listBinding - The list binding to update
 * @param newNodes - New array of nodes to replace the old ones
 */
export let updateListBinding = (
	listBinding: ListBinding,
	newNodes: Node[],
): void => {
	let parent = listBinding.startMarker.parentNode;
	if (!parent) return;

	// Remove all nodes between start and end markers
	let current = listBinding.startMarker.nextSibling;
	while (current && current !== listBinding.endMarker) {
		let next = current.nextSibling;
		current.remove();
		current = next;
	}

	// Insert new nodes between markers
	for (let node of newNodes) {
		parent.insertBefore(node, listBinding.endMarker);
	}

	// Update the stored nodes reference
	listBinding.nodes = newNodes;
};
