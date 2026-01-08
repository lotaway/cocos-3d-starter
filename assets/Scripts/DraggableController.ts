import { _decorator, Camera, Component, EventMouse, input, Input, Node, Vec3, director } from 'cc'
import Logger from '../utils/Logger'
const { ccclass, property } = _decorator

@ccclass('DraggableController')
export class DraggableController extends Component {

    protected _isDragging: boolean = false

    protected _dragOffset: Vec3 = new Vec3()

    protected _tempPos: Vec3 = new Vec3()

    @property({ type: Camera, tooltip: 'Main camera for screen-to-world conversion' })
    public Camera: Camera | null = null

    @property({ type: Node, tooltip: 'Optional drag plane for constrained movement' })
    public DragPlane: Node | null = null

    @property({ tooltip: 'Depth to maintain during drag (0 = use node depth)' })
    public Depth: number = 0

    protected _worldPos: Vec3 = new Vec3()

    protected _lastMouseX: number = 0

    protected _lastMouseY: number = 0

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

    protected findCamera(): void {
        if (this.Camera) {
            return
        }

        // Find camera from scene by traversing
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

    @Logger.Mark()
    onMouseDown(event: EventMouse) {
        if (event.getButton() !== 0) {
            return
        }

        this._isDragging = true
        this._lastMouseX = event.getLocationX()
        this._lastMouseY = event.getLocationY()

        // Get initial world position at mouse
        this.getWorldPositionAtMouse(event, this._worldPos)
        this.node.getPosition(this._tempPos)

        // Calculate offset
        this._dragOffset.x = this._tempPos.x - this._worldPos.x
        this._dragOffset.y = this._tempPos.y - this._worldPos.y
        this._dragOffset.z = this._tempPos.z - this._worldPos.z
    }

    @Logger.Mark()
    onMouseMove(event: EventMouse) {
        if (!this._isDragging) {
            return
        }

        this._lastMouseX = event.getLocationX()
        this._lastMouseY = event.getLocationY()

        this.getWorldPositionAtMouse(event, this._worldPos)

        // Apply offset and update position
        this._tempPos.x = this._worldPos.x + this._dragOffset.x
        this._tempPos.y = this._worldPos.y + this._dragOffset.y
        this._tempPos.z = this._worldPos.z + this._dragOffset.z

        this.node.setPosition(this._tempPos)
    }

    onMouseUp(event: EventMouse) {
        if (event.getButton() !== 0) {
            return
        }

        this._isDragging = false
    }

    protected getWorldPositionAtMouse(event: EventMouse, out: Vec3): void {
        if (!this.Camera) {
            // Fallback: use node's current position
            this.node.getPosition(out)
            if (this.Depth !== 0) {
                out.z = this.Depth
            }
            return
        }

        // Get mouse position
        const x = event.getLocationX()
        const y = event.getLocationY()

        // Determine depth for screenToWorld
        let depth = this.Depth
        if (depth === 0) {
            // Use node's world position z as depth
            depth = this.node.worldPosition.z
        }

        // Convert screen position to world position with correct depth
        const pos = new Vec3(x, y, depth)
        this.Camera.screenToWorld(pos, out)
    }
}

