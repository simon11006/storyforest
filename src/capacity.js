export const MAX_CAPACITY=30;
export function classCapacity(c){return c?.capacity??MAX_CAPACITY;}
export function assertCapacity(capacity){if(!Number.isInteger(capacity)||capacity<1||capacity>MAX_CAPACITY)throw Error('전시할 작품 수는 1~30 사이의 정수로 입력해 주세요.');}
export function assertSlot(slot,capacity=MAX_CAPACITY){assertCapacity(capacity);if(!Number.isInteger(slot)||slot<1||slot>capacity)throw Error(`이 학급의 전시 위치는 1~${capacity}번 중에서 선택해 주세요.`);}
export function availableSlots(c,books){return Array.from({length:classCapacity(c)},(_,i)=>i+1).filter(slot=>!books.some(b=>b.slot===slot));}
