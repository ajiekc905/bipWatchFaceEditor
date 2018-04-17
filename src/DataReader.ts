export class Reader {
  private _pos: number;
  private _array: Uint8Array;
  private _bytesPerRead: number;
  private bitReader;

  constructor(array: Uint8Array, pos: number = 0, bits: number = 8) {
    this._pos = pos;
    this.pickBitReader(bits);
    this._array = array;
    this._bytesPerRead = 8 <= bits ? bits >> 3 : 1;
    // console.log(`reader was created with ${bits} bits in byte`)
  }

  public stringNt(shift: number = 0): string {
    let s: string = '';
    const end: number = shift + 0xff; // we aren't expecting too long string
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

  public pickBitReader(bitsPerRead: number = 8) {
    if (bitsPerRead === 32) {
      this.bitReader = this.U32le;
    }
    if (bitsPerRead === 16) {
      this.bitReader = this.U16le;
    }
    if (bitsPerRead === 8) {
      this.bitReader = this.U8;
    }
    if (bitsPerRead === 4) {
      this.bitReader = this.U4;
    }
    if (bitsPerRead === 2) {
      this.bitReader = this.U2;
    }
    if (bitsPerRead === 1) {
      this.bitReader = this.U1;
    }
  }

  public move(pos: number): void {
    this._pos = pos;
  }

  public skip(reads: number): void {
    this._pos += this._bytesPerRead * reads;
    // TODO it has to know about  smaller bitwidths
  }

  public next(): any {
    if (this._pos > this._array.byteLength) {
      return null;
      // throw "exceeded the array boundary"
    }
    const result: number[] = this.bitReader(this._pos);
    this._pos += this._bytesPerRead;
    return result;
  }

  public test() {
    console.log(`reader`);
    console.log(`it would read an array`);
    console.log(this._array);
    console.log('using function');
    console.log(this.bitReader);
  }

  private U32be(addr: number): number {
    return (
      (this._array[addr] << 24) +
      (this._array[addr + 1] << 16) +
      (this._array[addr + 2] << 8) +
      this._array[addr + 3]
    );
  }

  private U32le(addr: number): number {
    return (
      (this._array[addr + 3] << 24) +
      (this._array[addr + 2] << 16) +
      (this._array[addr + 1] << 8) +
      this._array[addr]
    );
  }

  private U16le(addr: number): number {
    return this._array[addr] + (this._array[addr + 1] << 8);
  }

  private U16be(addr: number): number {
    return this._array[addr + 1] + (this._array[addr] << 8);
  }
  private U8(addr: number): number[] {
    const byte = this._array[addr];
    return [byte];
  }

  private U4(addr: number): number[] {
    const byte = this._array[addr];
    const n2 = byte & 0xf;
    const n1 = byte >> 4;
    return [n1, n2];
  }

  private U2(addr: number): number[] {
    const byte = this._array[addr];
    const n4 = byte & 0b11;
    const n3 = (byte >> 2) & 0b11;
    const n2 = (byte >> 4) & 0b11;
    const n1 = (byte >> 6) & 0b11;
    return [n1, n2, n3, n4];
  }

  private U1(addr: number): number[] {
    const byte = this._array[addr];
    const n8 = byte & 0b1;
    const n7 = (byte >> 1) & 0b1;
    const n6 = (byte >> 2) & 0b1;
    const n5 = (byte >> 3) & 0b1;
    const n4 = (byte >> 4) & 0b1;
    const n3 = (byte >> 5) & 0b1;
    const n2 = (byte >> 6) & 0b1;
    const n1 = (byte >> 7) & 0b1;
    return [n1, n2, n3, n4, n5, n6, n7, n8];
  }
}
