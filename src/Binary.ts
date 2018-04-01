// import { Logging as log } from './Logging';
import { Reader } from './DataHelper';
import RawImage from './Images';
// import { YAML } from 'yamljs';
import * as YAML from 'yamljs';
// constants aka magic numbers
const _binMagic = 'HMDIAL';
const paramsAddr = 0x20;
const data1Addr: number = 0x28;

interface readObj {
  type: number;
  id: number;
  val: any;
  size: number;
}

export default class BinFileReader {
  private structure: any;
  private rawImages: Uint8Array[];
  private _keySort(a: string, b: string): number {
    return parseInt(a) - parseInt(b);
  }
  private _decodeParam(pos: number, paramsArray: any): readObj {
    let storedStruct;
    let getNext = function(shift: number) {
      let byte = paramsArray[shift + pos];
      let flag = (byte & 128) > 0;
      let val = (byte & 127) << ((shift - 1) * 7);
      return { val, flag };
    };
    let getValue = function() {
      let value: number = 0;
      let index: number = 1;
      for (index = 1; index < 8; index++) {
        let currentByte = getNext(index);
        value += currentByte.val;
        if (!currentByte.flag) {
          break;
        }
      }
      return { value, index };
    };

    let readDuplet = function(): readObj {
      let myObj: readObj = {} as readObj;
      let firstByte = paramsArray[pos];
      myObj.type = firstByte & 2;
      myObj.id = (firstByte & 248) >> 3;
      let valueObject = getValue();
      myObj.val = valueObject.value;
      myObj.size = valueObject.index + 1;
      return myObj;
    };
    return readDuplet();
  }

  toJSON() {
    return JSON.stringify(this.structure);
  }

  toYAML() {
    return YAML.stringify(this.structure, 9);
  }
  private _readBlock(rootObj: any, byteArray: Uint8Array) {
    let fuse: number = 200;
    let position: number = 0;
    // let result: object = {};
    while (position < byteArray.byteLength) {
      let obj: readObj = this._decodeParam(position, byteArray);
      if (obj.type === 2) {
        let innerDataArray = byteArray.slice(
          position + obj.size,
          position + obj.val + obj.size
        );
        let child = this._readBlock({}, innerDataArray);
        rootObj[obj.id] = child;
        position += obj.val + obj.size;
      } else {
        position += obj.size;
        rootObj[obj.id] = obj.val;
      }
      fuse--;
      if (!fuse) {
        break;
      }
    }
    return rootObj;
  }
  private _readFirstBlock(buffer: ArrayBuffer, size: number) {
    const data1: Uint8Array = new Uint8Array(buffer, data1Addr, size);
    this.structure = {};
    this._readBlock(this.structure, data1);
  }
  private _readSecondBlock(buffer: ArrayBuffer, addr: number) {
    //
    let keys: string[] = Object.getOwnPropertyNames(this.structure);
    let sortedKeys: string[] = keys.sort(this._keySort);
    // console.log(sortedKeys);
    sortedKeys.forEach(key => {
      if (key === '1') {
        return;
      }
      const element = this.structure[key];
      let value = JSON.stringify(element);
      const offset = element['1'];
      const size = element['2'];
      const tempArray = new Uint8Array(buffer, addr + offset, size);
      let tempStructure = {};
      this._readBlock(tempStructure, tempArray);
      delete this.structure[key];
      let newId = structMeaning[parseInt(key)];
      this.structure[newId] = tempStructure;
    });
  }

  private _readThirdBlock(
    buffer: ArrayBuffer,
    data3Addr: number,
    data3size: number,
    data4Addr: number
  ) {
    const thirdArray = new Uint8Array(buffer, data3Addr, data3size * 4);
    this.rawImages = [];
    let r32 = new Reader(thirdArray, 0, 32);
    let lastShift = r32.next();
    for (let index = 0; index < data3size; index++) {
      let nextShift = r32.next();
      let size = nextShift - lastShift + 1;
      const start: number = data4Addr + lastShift;
      let rawImg;
      if (index === data3size - 1) {
        let bufferSize = buffer.byteLength;
        size = bufferSize - start;
        // console.log(size);
      }
      rawImg = new Uint8Array(buffer, start, size);
      this.rawImages.push(rawImg);
      let testImg = new RawImage(rawImg, index.toString());
      // storing to last shift address from next shift
      lastShift = nextShift;
    }
  }

  constructor(buffer: ArrayBuffer) {
    let header:Uint8Array = new Uint8Array(buffer, 0, 0x0f);
    let r = new Reader(header, 0, 32);
    let magic: string = r.stringNt();
    if (magic !== _binMagic) {
      throw 'not valid file!!!';
    } else {
      let params = new DataView(buffer, paramsAddr, 8);
      let param_size: number = params.getUint32(4, true);
      //
      this._readFirstBlock(buffer, param_size);
      // data2
      const data2Addr: number = data1Addr + param_size;
      const data2size = this.structure['1']['1'];
      this._readSecondBlock(buffer, data2Addr);
      //
      const data3size = this.structure['1']['2'];
      const data3Addr = data2Addr + data2size;
      //
      const data4Addr = data3Addr + data3size * 4;
      this._readThirdBlock(buffer, data3Addr, data3size, data4Addr);
    }
  }
}
enum structMeaning {
  COORDS_TABLE = 1,
  Background,
  Time,
  Activity,
  Date,
  Weather,
  StepsProgress,
  Status,
  Battery,
  AnalogDialFace,
}

let toPaddedHexString = function(decimal: number, width: number = 2): string {
  let hs = decimal.toString(16);
  let hsu = hs.toUpperCase();
  let result = ('0000000000000000' + hsu).slice(-width);
  return result;
};

let encodeValue = function(val: number) {
  let data = val;
  let res = '';
  while (data > 0) {
    let currentByte = data & 127; // leave 7 bit data
    data = data >> 7; // shift
    if (data) {
      currentByte = currentByte | 128; // set 8 bit if there is more data
    }
    res += toPaddedHexString(currentByte, 2) + ' ';
  }
  return res;
};
