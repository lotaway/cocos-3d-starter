import { _decorator, Component, EventMouse, Input, input, Node, Vec3 } from 'cc';
import { BodyEnum } from '../enums/BodyEnum';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {

    protected _bodyStatus: BodyEnum = BodyEnum.STATIC

    protected _jumpStep: number = 0

    protected _curJumpSpeed: number = 0

    protected _curJumpTime: number = 0

    protected _jumpTime: number = 0.1

    protected _curPos: Vec3 = new Vec3()

    protected _deltaPos: Vec3 = new Vec3()

    protected _targetPos: Vec3 = new Vec3()

    start() {
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this)
    }

    update(deltaTime: number) {
        if (this._bodyStatus & BodyEnum.JUMP) {
            this.updateJump(deltaTime)
        }
    }

    updateJump(deltaTime: number) {
        this._curJumpTime += deltaTime
        if (this._curJumpTime >= this._jumpTime) {
            this.node.setPosition(this._targetPos)
            this._bodyStatus &= ~BodyEnum.JUMP
            return
        }
        this.node.getPosition(this._curPos)
        this._deltaPos.x = this._curJumpSpeed * deltaTime
        Vec3.add(this._curPos, this._curPos, this._deltaPos)
        this.node.setPosition(this._curPos)
    }

    onMouseUp(event: EventMouse) {
        switch (event.getButton()) {
            case 0:
                this.jumpByStep(1)
                break;
            case 2:
                this.jumpByStep(2)
                break;
        }
    }

    jumpByStep(step: number) {
        if (this._bodyStatus & BodyEnum.JUMP) {
            return
        }
        this._bodyStatus += BodyEnum.JUMP
        this._jumpStep = step
        this._curJumpTime = 0
        this._curJumpSpeed = this._jumpStep / this._jumpTime
        this.node.getPosition(this._curPos)
        Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep, 0, 0))
    }
}

