let initValue = 0b0001

export enum BodyEnum {
    STATIC = initValue,
    JUMP = initValue << 1,
    FLY = initValue << 2,
}