export class Storage {
  fileParsed: any[];

  constructor() {
    this.fileParsed = [];
  }

  addHeader() {
    let dObject = {
      id: 0,
    };
    this.fileParsed.push(dObject);
  }

  addPartition(dataObject: any) {
    this.fileParsed.push(dataObject);
  }

  getStruct(id: string) {
    for (let index = 0; index < this.fileParsed.length; index++) {
      const element = this.fileParsed[index];
      // console.log(element.id)
      if (element.id === id) {
        return element;
      }
    }
    return {};
  }

  log(): number {
    console.log(this.fileParsed);
    return this.fileParsed.length;
  }

  getValue(id: string) {
    return this.getStruct(id).val;
  }

  get(id: string) {
    return this.getStruct(id).inner;
  }

  attachToPartition(dataObject: any) {
    // fileParsed.push(dataObject)
  }

  toPaddedHexString(decimal: number, width: number) {
    let hs = decimal.toString(16).toUpperCase();
    let length = hs.length;
    if (width === undefined) {
      return length > 1 ? hs : '0' + hs;
    } else {
      let result = '';
      while (length != width) {
        result += '0';
        length++;
      }
      return result + hs;
    }
  }
}
