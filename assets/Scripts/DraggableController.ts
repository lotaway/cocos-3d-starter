import { _decorator, Camera, Component, EventMouse, input, Input, Node, Vec3, director } from 'cc'
const { ccclass, property } = _decorator

@ccclass('DraggableController')
export class DraggableController extends Component {

    @property({ type: Camera, tooltip: 'Main camera for screen-to-world conversion' })
    public Camera: Camera | null = null

    @property({ type: Node, tooltip: 'Optional drag plane for constrained movement' })
    public DragPlane: Node | null = null

    @property({ tooltip: 'Depth to maintain during drag (0 = use node depth)' })
    public Depth: number = 0

    @property({ tooltip: 'Whether to require mouse over node to start dragging' })
    public RequireHitTest: boolean = false

    @property({ tooltip: 'Hit test radius when RequireHitTest is true' })
    public HitRadius: number = 1.0

    // Drag state
    protected _isDragging: boolean = false
    protected _hasMousePos: boolean = false

    // Store offset: node position - mouse position at drag start
    protected _dragOffset: Vec3 = new Vec3()

    // Current mouse position (updated in onMouseMove)
    protected _currentMousePos: Vec3 = new Vec3()

    // Reusable objects
    protected _tempVec: Vec3 = new Vec3()
    protected _tempVec2: Vec3 = new Vec3()

    start() {
        this.findCamera()
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this)
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this)
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this)
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this)
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this)
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this)
    }

    update(deltaTime: number) {
        if (!this._isDragging || !this._hasMousePos) {
            return
        }

        // Directly set position: node = mouse + offset
        // This ensures 1:1 movement without any accumulation error
        this._tempVec.x = this._currentMousePos.x + this._dragOffset.x
        this._tempVec.y = this._currentMousePos.y + this._dragOffset.y
        this._tempVec.z = this._currentMousePos.z + this._dragOffset.z

        this.node.setPosition(this._tempVec)
    }

    protected findCamera(): void {
        if (this.Camera) {
            return
        }

        const scene = director.getScene()
        if (scene) {
            const findCamera = (node: Node): Camera | null => {
                const camera = node.getComponent(Camera)
                if (camera) {
                    return camera
                }
                for (const child of node.children) {
                    const found = findCamera(child)
                    if (found) {
                        return found
                    }
                }
                return null
            }
            this.Camera = findCamera(scene)
        }
    }

    onMouseDown(event: EventMouse) {
        if (event.getButton() !== 0) {
            return
        }

        // Check if mouse is over this node if required
        if (this.RequireHitTest && !this.isMouseOverNode(event)) {
            return
        }

        this._isDragging = true
        this._hasMousePos = false

        // Get current mouse world position
        this.getMouseWorldPos(event, this._currentMousePos)

        // Calculate offset: node position - mouse position
        this.node.getPosition(this._tempVec)
        this._dragOffset.x = this._tempVec.x - this._currentMousePos.x
        this._dragOffset.y = this._tempVec.y - this._currentMousePos.y
        this._dragOffset.z = this._tempVec.z - this._currentMousePos.z
    }

    onMouseMove(event: EventMouse) {
        if (!this._isDragging) {
            return
        }

        // Store current mouse position for update() to use
        this.getMouseWorldPos(event, this._currentMousePos)
        this._hasMousePos = true
    }

    onMouseUp(event: EventMouse) {
        if (event.getButton() !== 0) {
            return
        }

        this._isDragging = false
        this._hasMousePos = false
    }

    protected isMouseOverNode(event: EventMouse): boolean {
        if (!this.Camera) {
            return false
        }

        // Get mouse world position at node depth
        const depth = this.node.worldPosition.z
        this.getMouseWorldPosAtDepth(event, depth, this._tempVec)

        // Get node world position
        this.node.getWorldPosition(this._tempVec2)

        // Calculate distance between mouse world pos and node pos
        const distance = Vec3.distance(this._tempVec, this._tempVec2)

        return distance < this.HitRadius
    }

    protected getMouseWorldPos(event: EventMouse, out: Vec3): void {
        let depth = this.Depth
        if (depth === 0) {
            depth = this.node.worldPosition.z
        }
        this.getMouseWorldPosAtDepth(event, depth, out)
    }

    protected getMouseWorldPosAtDepth(event: EventMouse, depth: number, out: Vec3): void {
        if (!this.Camera) {
            this.node.getPosition(out)
            out.z = depth
            return
        }

        const x = event.getLocationX()
        const y = event.getLocationY()

        const screenPos = new Vec3(x, y, depth)
        this.Camera.screenToWorld(screenPos, out)
    }
}

