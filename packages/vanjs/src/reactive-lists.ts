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
 * Inserts a list binding into the DOM at the position of a reference node
 * @param listBinding - The list binding to insert
 * @param referenceNode - The node to replace with the list
 */
export let insertListBinding = (
	listBinding: ListBinding,
	referenceNode: Node,
): void => {
	let parent = referenceNode.parentNode;
	if (!parent) return;

	// Insert start marker
	parent.insertBefore(listBinding.startMarker, referenceNode);

	// Insert all nodes
	for (let node of listBinding.nodes) {
		parent.insertBefore(node, referenceNode);
	}

	// Insert end marker
	parent.insertBefore(listBinding.endMarker, referenceNode);

	// Remove reference node
	referenceNode.remove();
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

/**
 * Removes a list binding from the DOM, including markers and all nodes
 * @param listBinding - The list binding to remove
 */
export let removeListBinding = (listBinding: ListBinding): void => {
	// Remove all nodes between markers
	let current = listBinding.startMarker.nextSibling;
	while (current && current !== listBinding.endMarker) {
		let next = current.nextSibling;
		current.remove();
		current = next;
	}

	// Remove markers
	listBinding.startMarker.remove();
	listBinding.endMarker.remove();
};

/**
 * Checks if a value is an array of DOM nodes
 * @param value - Value to check
 * @returns true if value is an array containing at least one Node
 */
export let isNodeArray = (value: unknown): value is Node[] => {
	return (
		Array.isArray(value) && (value.length === 0 || value[0] instanceof Node)
	);
};

/**
 * Creates a DocumentFragment containing the list binding markers and nodes
 * This allows appending the entire list structure in one operation
 * @param listBinding - The list binding to convert to a fragment
 * @returns DocumentFragment containing markers and nodes
 */
export let listBindingToFragment = (
	listBinding: ListBinding,
): DocumentFragment => {
	let fragment = new DocumentFragment();
	fragment.append(
		...[listBinding.startMarker, ...listBinding.nodes, listBinding.endMarker],
	);
	return fragment;
};
