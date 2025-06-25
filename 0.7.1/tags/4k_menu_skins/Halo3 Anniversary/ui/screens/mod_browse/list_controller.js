
class CEventObject {
    constructor() {
        this._eventMap = {};
    }

    on(name, callback) {
        if (!this._eventMap[name])
            this._eventMap[name] = [];

        this._eventMap[name].push(callback);
    }
    off(name, callback) {
        this._eventMap[name] = this._eventMap[name].filter(x => x !== callback);
        if (this._eventMap[name].length < 0)
            delete this._eventMap[name];
    }
    emit(name, e) {
        for (let listener of this._eventMap[name])
            listener(e);
    }
}

class CListController extends CEventObject {
    constructor(elem) {
        super();

        this._elem = elem;
        this._mutationObserver = new MutationObserver(this._onDomMutated.bind(this));
        this._itemNodes = [];
        this._selectedIndex = -1;
        this._selectedNode = null;
        this._preventSelection = false;
        this._updating = false;
        this._wrapAround = false;

        // cache the initial dom nodes
        this._refreshDOM();
        // get notified when an elements is added/removed
        this._mutationObserver.observe(this._elem, { childList: true, subtree: true });
    }

    beginUpdate() {
        this._updating = true;
    }

    endUpdate() {
        this._updating = false;
        this._refreshDOM();
    }

    navigateList(direction) { 
        let newIndex = this._selectedIndex + direction;

        if (newIndex < 0)
            newIndex = (this._wrapAround && Math.abs(direction)  === 1) ? this._itemNodes.length - 1 : 0;
        else if (newIndex >= this._itemNodes.length)
            newIndex = (this._wrapAround && Math.abs(direction) === 1) ? 0 : this._itemNodes.length - 1;

        this.setSelectedIndex(newIndex);
    }

    setWrapAround(enabled) {
        this._wrapAround = enabled;
    }

    getSelectedIndex(index) {
        return this._selectedIndex;
    }

    getSelectedNode() {
        if (this._selectedIndex != -1)
            return this._itemNodes[this._selectedIndex];
    }

    getItemNodeAt(index) {
        if (index >= 0 && index < this._itemNodes.length)
            return this._itemNodes[index];
        else
            return null;
    }

    scrollIntoView() {
        this._preventSelection = true;

        let containerBounds = this._elem.getBoundingClientRect();
        let nodeBounds = this._selectedNode.getBoundingClientRect();

        if (nodeBounds.bottom >= containerBounds.bottom)
            this._selectedNode.scrollIntoView(false);
        else if (nodeBounds.top < containerBounds.top)
            this._selectedNode.scrollIntoView(true);

        this._preventSelection = false;
    }

    setSelectedIndex(index) {
        if (this._preventSelection)
            return;

        // remove the class from the previously selected node if any
        if (this._selectedNode) {
            this._selectedNode.classList.remove('selected');
        }

        this._selectedIndex = index;
        this._selectedNode = null;

        // add the class to the new selected node if any
        if (index >= 0 && index < this._itemNodes.length) {
            let node = this._itemNodes[index];
            this._selectedNode = node;
            node.classList.add('selected');
        }

        this.emit('selectedIndexChanged', { index: index });
    }

    _isItemNode(node) {
        // returns whether this node is to be considered an item
        return node.nodeName === 'LI';
    }

    _refreshDOM() {
        // find and cache the item DOM nodes
        this._itemNodes = [];
        let node = this._findNode(this._elem, this._isItemNode.bind(this));
        while (node) {
            this._itemNodes.push(node);
            node = this._findNode(node.nextElementSibling, this._isItemNode.bind(this));
        }
    }

    _findNode(node, predicate) {
        // check if this node matches the predicate and 
        // if not, recurse through its children
        if (!node)
            return null;
        if (predicate(node))
            return node;

        let found = null;
        for (let child of node.childNodes) {
            found = this._findNode(child, predicate);
            if (found)
                break;
        }

        return found;
    }

    _onDomMutated(mutationList) {
        if (this._updating)
            return false;

        let domValid = true;
        for (let mutation of mutationList) {
            if (mutation.type === "childList")
                domValid = false;
        }

        if (!domValid) {
            this._refreshDOM();
        }
    }
}

class CInteractableListController extends CListController {
    constructor(elem) {
        super(elem);
        this._lastMouseX = 0;
        this._lastMouseY = 0;
        this._lastScrollTime = 0;
    }

    navigateList(direction) {
        this._lastScrollTime = Date.now();
        super.navigateList(direction);
    }

    handleMouseOver(e) {
        let deltaX = Math.abs(e.screenX - this._lastMouseX);
        let deltaY = Math.abs(e.screenY - this._lastMouseY);
        this._lastMouseX = e.screenX;
        this._lastMouseY = e.screenY;

        if (deltaX < 1 && deltaY < 1)
            return;
        if ((Date.now - this._lastScrollTime) < 250)
            return;

        // look up from the target element to the nearest item node
        let index = this.getMouseOverItem(e.target);
        if (index !== -1 && index != this._selectedIndex)
            this.setSelectedIndex(index);
    }
        
    getMouseOverItem(target) {
        let node = target;
        while (node && !this._isItemNode(node)) {
            node = node.parentNode;
            if (node === this._elem) {
                node = null;
                break;
            }
        }

       return this._itemNodes.indexOf(node);
    }
}
