export class Reader {
  private _pos: number;
  private funcToRead: Function;
  private _array: Uint8Array;
  private _bytesPerRead: number;

  constructor(array: Uint8Array, pos: number = 0, bits: number = 8) {
    this._pos = pos;
    this.funcToRead = this.pickBitReader(bits);
    this._array = array;
    this._bytesPerRead = 8 <= bits ? bits >> 3 : 1;
    // console.log(`reader was created with ${bits} bits in byte`)
  }

  stringNt(shift: number = 0): string {
    let s: string = '';
    let end: number = shift + 0xff; // we aren't expecting too long string
    for (let i = shift; i < end; i++) {
      if (this._array[i] > 0) {
        s += String.fromCharCode(this._array[i]);
        this._pos++;
      } else {
        break;
      }
    }
    return s;
  }

  pickBitReader(bitsPerRead: number = 8): Function {
    let bitReader: Function; // = U8;
    if (bitsPerRead === 32) bitReader = U32le;
    if (bitsPerRead === 16) bitReader = U16le;
    if (bitsPerRead === 8) bitReader = U8;
    if (bitsPerRead === 4) bitReader = U4;
    if (bitsPerRead === 2) bitReader = U2;
    if (bitsPerRead === 1) bitReader = U1;
    return bitReader;
  }

  move(pos: number): void {
    this._pos = pos;
  }

  skip(reads: number): void {
    this._pos += this._bytesPerRead * reads;
    // TODO it has to know about  smaller bitwidths
  }

  next(): any {
    if (this._pos > this._array.byteLength) {
      return null;
      // throw "exceeded the array boundary"
    }
    const result: number[] = this.funcToRead(this._array, this._pos);
    // console.log(`${this._pos.toString(16)}: ${result}`);
    // if (this._bytesPerRead > 1) {
    //   console.log(`reader: addr: ${this._pos} value: ${result}`);
    // }
    this._pos += this._bytesPerRead;
    return result;
  }

  test() {
    console.log(`reader`);
    console.log(`it would read an array`);
    console.log(this._array);
    console.log('using function');
    console.log(this.funcToRead);
  }
}

export class Writer {
  private _pos: number;

  private _array: Uint8Array;

  constructor(array: Uint8Array) {
    let pos = 0;
    this._pos = pos;
    this._array = array;
  }
  next(data: number) {
    this._array[this._pos] = data;
    this._pos++;
  }
  pickBitWriter(bitsPerWrite: number = 8): Function {
    let bitWriter: Function; // = U8;
    // if (bitsPerWrite === 32) bitWriter = W32le;
    // if (bitsPerWrite === 16) bitWriter = W16le;
    // if (bitsPerWrite === 8) bitWriter = W8;
    // if (bitsPerWrite === 4) bitWriter = W4;
    // if (bitsPerWrite === 2) bitWriter = W2;
    // if (bitsPerWrite === 1) bitWriter = W1;
    return bitWriter;
  }
  // stringNt ( shift: number = 0): string {
  //   let s: string = '';
  //   let end: number = shift + 0xff; // we aren't expecting too long string
  //   for (let i = shift; i < end; i++) {
  //     if (this._array[i] > 0) {
  //       s += String.fromCharCode(this._array[i]);
  //     } else {
  //       break;
  //     }
  //   }
  //   return s;
  // };
}

let U32le = function(array: Uint8Array, addr: number): number {
  return (
    array[addr] +
    (array[addr + 1] << 8) +
    (array[addr + 2] << 16) +
    (array[addr + 3] << 24)
  );
};

let U32be = function(array: Uint8Array, addr: number): number {
  return (
    (array[addr] << 24) +
    (array[addr + 1] << 16) +
    (array[addr + 2] << 8) +
    array[addr + 3]
  );
};

let U16le = function(array: Uint8Array, addr: number): number {
  return array[addr] + (array[addr + 1] << 8);
};

let U8 = function(array: Uint8Array, addr: number): number[] {
  let byte = array[addr];
  return [byte];
};

let U4 = function(array: Uint8Array, addr: number): number[] {
  let byte = array[addr];
  let n2 = byte & 0xf;
  let n1 = byte >> 4;
  return [n1, n2];
};

let U2 = function(array: Uint8Array, addr: number): number[] {
  let byte = array[addr];
  let n4 = byte & 0b11;
  let n3 = (byte >> 2) & 0b11;
  let n2 = (byte >> 4) & 0b11;
  let n1 = (byte >> 6) & 0b11;
  return [n1, n2, n3, n4];
};

let U1 = function(array: Uint8Array, addr: number): number[] {
  let byte = array[addr];
  let n8 = byte & 0b1;
  let n7 = (byte >> 1) & 0b1;
  let n6 = (byte >> 2) & 0b1;
  let n5 = (byte >> 3) & 0b1;
  let n4 = (byte >> 4) & 0b1;
  let n3 = (byte >> 5) & 0b1;
  let n2 = (byte >> 6) & 0b1;
  let n1 = (byte >> 7) & 0b1;
  return [n1, n2, n3, n4, n5, n6, n7, n8];
};
